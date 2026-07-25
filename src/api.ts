/**
 * API 客户端 - Supabase 云数据库版本
 */
import { supabase } from './lib/supabase';
import { handleCorrect, handleWrong, FORGETTING_CURVE_DATA, SPACED_REPETITION_EFFECT, BOX_DESCRIPTIONS, BOX_COLORS } from './lib/spaced-repetition';
import type { Word, WordStats, CurveData, AppSettings, ReviewResult } from './types';

// ============= 单词 API（共享词库） =============

export const wordApi = {
  getAll: async (): Promise<Word[]> => {
    const { data, error } = await supabase.from('words').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapWord);
  },

  create: async (data: { word: string; phonetic?: string; definition: string; example?: string; example_translation?: string; tags?: string }): Promise<Word> => {
    const { data: row, error } = await supabase.from('words').insert({
      word: data.word, phonetic: data.phonetic || null, definition: data.definition,
      example: data.example || null, example_translation: data.example_translation || null, tags: data.tags || null,
    }).select('*').single();
    if (error) throw error;
    return mapWord(row);
  },

  batchCreate: async (words: Array<{ word: string; phonetic?: string; definition: string; example?: string; example_translation?: string; tags?: string }>): Promise<{ inserted: number; skipped: number; skippedWords: string[] }> => {
    let inserted = 0; let skipped = 0; const skippedWords: string[] = [];
    for (const w of words) {
      const { error } = await supabase.from('words').insert({
        word: w.word, phonetic: w.phonetic || null, definition: w.definition,
        example: w.example || null, example_translation: w.example_translation || null, tags: w.tags || null,
      });
      if (error) { skipped++; skippedWords.push(w.word); } else { inserted++; }
    }
    return { inserted, skipped, skippedWords };
  },

  update: async (id: string, data: Partial<{ word: string; phonetic: string; definition: string; example: string; example_translation: string; tags: string }>) => {
    const { error } = await supabase.from('words').update(data).eq('id', id);
    if (error) throw error;
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('words').delete().eq('id', id);
    if (error) throw error;
  },
};

// ============= 学习 API（需 studentId） =============

export const studyApi = {
  getToday: async (studentId: string): Promise<{ words: Word[]; dailyLimit: number; todayStats: { total: number; correct: number; wrong: number } }> => {
    const settings = await settingsApi.get(studentId);
    const dailyLimit = settings.daily_limit;

    // 获取到期或新的学生单词
    const now = new Date().toISOString();
    const { data: dueWords } = await supabase
      .from('student_words')
      .select('*, words(*)')
      .eq('student_id', studentId)
      .lte('next_review', now)
      .neq('status', 'mastered')
      .order('next_review', { ascending: true })
      .limit(dailyLimit);

    let result = (dueWords || []).map((sw: any) => mapStudentWord(sw));

    // 如果不够，补充新单词
    if (result.length < dailyLimit) {
      const existingIds = result.map((w: Word) => w.id);
      const { data: allWords } = await supabase.from('words').select('*');
      const { data: existingSW } = await supabase.from('student_words').select('word_id').eq('student_id', studentId);
      const swIds = new Set((existingSW || []).map((s: any) => s.word_id));

      for (const w of (allWords || [])) {
        if (result.length >= dailyLimit) break;
        if (existingIds.includes(w.id) || swIds.has(w.id)) continue;
        // 创建学生单词记录
        await supabase.from('student_words').insert({
          student_id: studentId, word_id: w.id, box_level: 0, next_review: now,
          status: 'learning',
        });
        result.push(mapWord(w));
      }
    }

    // 今日统计
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const { data: todayRecords } = await supabase
      .from('review_records')
      .select('result')
      .eq('student_id', studentId)
      .gte('reviewed_at', todayStart.toISOString());

    const records = todayRecords || [];
    return {
      words: result,
      dailyLimit,
      todayStats: {
        total: records.length,
        correct: records.filter((r: any) => r.result === 'correct').length,
        wrong: records.filter((r: any) => r.result === 'wrong').length,
      },
    };
  },

  review: async (studentId: string, wordId: string, result: 'correct' | 'wrong'): Promise<ReviewResult> => {
    // 获取当前进度
    const { data: sw } = await supabase
      .from('student_words')
      .select('*')
      .eq('student_id', studentId)
      .eq('word_id', wordId)
      .single();

    if (!sw) throw new Error('单词进度不存在');
    const levelBefore = sw.box_level;
    const handled = result === 'correct' ? handleCorrect(levelBefore) : handleWrong(levelBefore);

    // 更新进度
    await supabase.from('student_words').update({
      box_level: handled.newLevel,
      next_review: handled.nextReview,
      last_reviewed: new Date().toISOString(),
      review_count: sw.review_count + 1,
      correct_count: result === 'correct' ? sw.correct_count + 1 : sw.correct_count,
      wrong_count: result === 'wrong' ? sw.wrong_count + 1 : sw.wrong_count,
      status: handled.status,
    }).eq('id', sw.id);

    // 记录复习历史
    await supabase.from('review_records').insert({
      student_id: studentId, word_id: wordId, result,
      box_level_before: levelBefore, box_level_after: handled.newLevel,
    });

    return {
      success: true, wordId, result, levelBefore,
      levelAfter: handled.newLevel, nextReview: handled.nextReview,
      status: handled.status,
      boxDescription: BOX_DESCRIPTIONS[handled.newLevel],
      boxColor: BOX_COLORS[handled.newLevel],
    };
  },
};

// ============= 统计 API =============

export const statsApi = {
  get: async (studentId: string): Promise<WordStats> => {
    const { count: total } = await supabase.from('words').select('*', { count: 'exact', head: true });
    const { count: newCount } = await supabase.from('student_words').select('*', { count: 'exact', head: true }).eq('student_id', studentId).eq('status', 'new');
    const { count: learningCount } = await supabase.from('student_words').select('*', { count: 'exact', head: true }).eq('student_id', studentId).eq('status', 'learning');
    const { count: masteredCount } = await supabase.from('student_words').select('*', { count: 'exact', head: true }).eq('student_id', studentId).eq('status', 'mastered');

    const now = new Date().toISOString();
    const { count: dueToday } = await supabase.from('student_words').select('*', { count: 'exact', head: true }).eq('student_id', studentId).lte('next_review', now).neq('status', 'mastered');

    // 今日统计
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const { data: todayRecords } = await supabase.from('review_records').select('result').eq('student_id', studentId).gte('reviewed_at', todayStart.toISOString());
    const records = todayRecords || [];

    // 最近30天统计
    const recentStats: any[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const dayStart = new Date(today); dayStart.setDate(today.getDate() - i); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart); dayEnd.setHours(23, 59, 59, 999);
      const { data: dayRecords } = await supabase.from('review_records').select('result').eq('student_id', studentId).gte('reviewed_at', dayStart.toISOString()).lte('reviewed_at', dayEnd.toISOString());
      const dr = dayRecords || [];
      recentStats.push({
        date: dayStart.toISOString().split('T')[0],
        total: dr.length,
        correct: dr.filter((r: any) => r.result === 'correct').length,
        wrong: dr.filter((r: any) => r.result === 'wrong').length,
      });
    }

    let streak = 0;
    for (let i = recentStats.length - 1; i >= 0; i--) {
      if (recentStats[i].total > 0) streak++; else break;
    }

    return {
      total: total || 0,
      newWords: newCount || 0,
      learning: learningCount || 0,
      mastered: masteredCount || 0,
      dueToday: dueToday || 0,
      todayStats: { total: records.length, correct: records.filter((r: any) => r.result === 'correct').length, wrong: records.filter((r: any) => r.result === 'wrong').length },
      recentStats,
      streak,
    };
  },

  getCurve: async (studentId: string): Promise<CurveData> => {
    const { count: totalWords } = await supabase.from('words').select('*', { count: 'exact', head: true });
    const boxDistribution = [];
    for (let i = 0; i <= 6; i++) {
      const { count } = await supabase.from('student_words').select('*', { count: 'exact', head: true }).eq('student_id', studentId).eq('box_level', i);
      boxDistribution.push({ level: i, count: count || 0, description: BOX_DESCRIPTIONS[i], color: BOX_COLORS[i] });
    }
    return { forgettingCurve: FORGETTING_CURVE_DATA, spacedRepetitionEffect: SPACED_REPETITION_EFFECT, boxDistribution, totalWords: totalWords || 0 };
  },
};

// ============= 设置 API =============

export const settingsApi = {
  get: async (studentId: string): Promise<AppSettings> => {
    const { data } = await supabase.from('student_settings').select('*').eq('student_id', studentId).maybeSingle();
    if (!data) {
      // 创建默认设置
      await supabase.from('student_settings').insert({ student_id: studentId });
      return { daily_limit: 20, auto_play_audio: false, show_phonetic: true, show_example: true, theme: 'light' };
    }
    return {
      daily_limit: data.daily_limit,
      auto_play_audio: data.auto_play_audio,
      show_phonetic: data.show_phonetic,
      show_example: data.show_example,
      theme: data.theme || 'light',
    };
  },

  update: async (studentId: string, data: Partial<AppSettings>) => {
    const updateData: any = {};
    if (data.daily_limit !== undefined) updateData.daily_limit = data.daily_limit;
    if (data.auto_play_audio !== undefined) updateData.auto_play_audio = data.auto_play_audio;
    if (data.show_phonetic !== undefined) updateData.show_phonetic = data.show_phonetic;
    if (data.show_example !== undefined) updateData.show_example = data.show_example;
    if (data.theme !== undefined) updateData.theme = data.theme;

    const { error } = await supabase.from('student_settings').upsert({ student_id: studentId, ...updateData });
    if (error) throw error;
  },
};

// ============= 映射函数 =============

function mapWord(row: any): Word {
  return {
    id: row.id, word: row.word, phonetic: row.phonetic, definition: row.definition,
    example: row.example, example_translation: row.example_translation, tags: row.tags,
    box_level: 0, next_review: new Date().toISOString(), last_reviewed: null,
    review_count: 0, correct_count: 0, wrong_count: 0, status: 'new',
    created_at: row.created_at, updated_at: row.created_at,
  };
}

function mapStudentWord(sw: any): Word {
  const w = sw.words || sw;
  return {
    id: w.id, word: w.word, phonetic: w.phonetic, definition: w.definition,
    example: w.example, example_translation: w.example_translation, tags: w.tags,
    box_level: sw.box_level ?? 0, next_review: sw.next_review ?? new Date().toISOString(),
    last_reviewed: sw.last_reviewed, review_count: sw.review_count ?? 0,
    correct_count: sw.correct_count ?? 0, wrong_count: sw.wrong_count ?? 0,
    status: sw.status ?? 'new', created_at: w.created_at, updated_at: w.created_at,
  };
}
