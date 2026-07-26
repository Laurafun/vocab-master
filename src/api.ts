/**
 * 本地存储方案 + GitHub 数据上报
 * 学生数据存在本地，同时上报到老师后台
 */

import { handleCorrect, handleWrong, FORGETTING_CURVE_DATA, SPACED_REPETITION_EFFECT, BOX_DESCRIPTIONS, BOX_COLORS } from './lib/spaced-repetition';
import BUILT_IN_WORDS from './lib/built-in-words';
import { reportProgress } from './lib/data-reporter';

// localStorage 操作工具
const STORAGE_PREFIX = 'vocab_';

function getItem(key: string): any {
  try {
    const data = localStorage.getItem(STORAGE_PREFIX + key);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

function setItem(key: string, value: any): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) { console.error('Storage error:', e); }
}

// 学生登录
export const studentApi = {
  login: async (name: string): Promise<{ id: string; name: string }> => {
    // 用名字生成稳定 ID
    const id = 'student_' + name.trim().toLowerCase().replace(/\s+/g, '_');
    const student = { id, name: name.trim() };
    setItem('student', student);

    // 初始化学生进度（如果不存在）
    const progress = getItem('progress_' + id);
    if (!progress) {
      setItem('progress_' + id, {});
    }

    // 初始化设置
    const settings = getItem('settings_' + id);
    if (!settings) {
      setItem('settings_' + id, {
        daily_limit: 20, auto_play_audio: false, show_phonetic: true, show_example: true, theme: 'light',
      });
    }
    return student;
  },

  getCurrent: (): { id: string; name: string } | null => {
    return getItem('student');
  },

  logout: () => {
    localStorage.removeItem(STORAGE_PREFIX + 'student');
  },
};

// 单词 API
export const wordApi = {
  getAll: async () => {
    // 合并内置单词 + 自定义单词
    const custom = getItem('custom_words') || [];
    return [...custom, ...BUILT_IN_WORDS];
  },

  create: async (data: { word: string; phonetic?: string; definition: string; example?: string; example_translation?: string; tags?: string }) => {
    const custom = getItem('custom_words') || [];
    const newWord = { id: 'custom_' + Date.now(), ...data };
    custom.push(newWord);
    setItem('custom_words', custom);
    return newWord;
  },

  batchCreate: async (words: Array<{ word: string; phonetic?: string; definition: string; example?: string; example_translation?: string; tags?: string }>) => {
    const custom = getItem('custom_words') || [];
    let inserted = 0, skipped = 0;
    const skippedWords: string[] = [];
    const allWords = [...BUILT_IN_WORDS, ...custom];

    for (const w of words) {
      const exists = allWords.find(aw => aw.word.toLowerCase() === w.word.toLowerCase());
      if (exists) { skipped++; skippedWords.push(w.word); }
      else { custom.push({ id: 'custom_' + Date.now() + '_' + inserted, ...w }); inserted++; }
    }
    setItem('custom_words', custom);
    return { inserted, skipped, skippedWords };
  },

  update: async (id: string, data: any) => {
    const custom = getItem('custom_words') || [];
    const idx = custom.findIndex((w: any) => w.id === id);
    if (idx >= 0) { custom[idx] = { ...custom[idx], ...data }; setItem('custom_words', custom); }
  },

  delete: async (id: string) => {
    let custom = getItem('custom_words') || [];
    custom = custom.filter((w: any) => w.id !== id);
    setItem('custom_words', custom);
  },
};

// 学习 API
export const studyApi = {
  getToday: async (studentId: string) => {
    const settings = getItem('settings_' + studentId) || { daily_limit: 20 };
    const dailyLimit = settings.daily_limit;
    const progress = getItem('progress_' + studentId) || {};
    const allWords = [...(getItem('custom_words') || []), ...BUILT_IN_WORDS];
    const now = new Date().toISOString();

    // 获取到期需要复习的
    const dueWords = [];
    for (const w of allWords) {
      const p = progress[w.id];
      if (p && p.next_review <= now && p.status !== 'mastered') {
        dueWords.push({ ...w, box_level: p.box_level, next_review: p.next_review, last_reviewed: p.last_reviewed, review_count: p.review_count || 0, correct_count: p.correct_count || 0, wrong_count: p.wrong_count || 0, status: p.status });
      }
    }
    dueWords.sort((a, b) => a.next_review.localeCompare(b.next_review));

    let result = dueWords.slice(0, dailyLimit);

    // 补充新单词
    if (result.length < dailyLimit) {
      for (const w of allWords) {
        if (result.length >= dailyLimit) break;
        if (!progress[w.id]) {
          progress[w.id] = { box_level: 0, next_review: now, last_reviewed: null, review_count: 0, correct_count: 0, wrong_count: 0, status: 'learning' };
          result.push({ ...w, box_level: 0, next_review: now, last_reviewed: null, review_count: 0, correct_count: 0, wrong_count: 0, status: 'learning' });
        }
      }
      setItem('progress_' + studentId, progress);
    }

    // 今日统计
    const records = getItem('records_' + studentId) || [];
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayRecords = records.filter((r: any) => r.reviewed_at >= todayStart.toISOString());

    return {
      words: result,
      dailyLimit,
      todayStats: { total: todayRecords.length, correct: todayRecords.filter((r: any) => r.result === 'correct').length, wrong: todayRecords.filter((r: any) => r.result === 'wrong').length },
    };
  },

  review: async (studentId: string, wordId: string, result: 'correct' | 'wrong') => {
    const progress = getItem('progress_' + studentId) || {};
    const p = progress[wordId] || { box_level: 0, status: 'new' };
    const levelBefore = p.box_level || 0;
    const handled = result === 'correct' ? handleCorrect(levelBefore) : handleWrong(levelBefore);

    progress[wordId] = {
      ...p,
      box_level: handled.newLevel,
      next_review: handled.nextReview,
      last_reviewed: new Date().toISOString(),
      review_count: (p.review_count || 0) + 1,
      correct_count: result === 'correct' ? (p.correct_count || 0) + 1 : (p.correct_count || 0),
      wrong_count: result === 'wrong' ? (p.wrong_count || 0) + 1 : (p.wrong_count || 0),
      status: handled.status,
    };
    setItem('progress_' + studentId, progress);

    // 记录复习历史
    const records = getItem('records_' + studentId) || [];
    records.push({ word_id: wordId, result, box_level_before: levelBefore, box_level_after: handled.newLevel, reviewed_at: new Date().toISOString() });
    setItem('records_' + studentId, records);

    // 自动上报进度到老师后台（异步，不阻塞用户）
    const student = getItem('student');
    if (student) {
      const allWords = [...(getItem('custom_words') || []), ...BUILT_IN_WORDS];
      const stats = {
        total: allWords.length,
        newWords: Object.values(progress).filter((p: any) => !p || p.status === 'new').length,
        learning: Object.values(progress).filter((p: any) => p && p.status === 'learning').length,
        mastered: Object.values(progress).filter((p: any) => p && p.status === 'mastered').length,
        dueToday: 0,
        todayStats: { total: 0, correct: 0, wrong: 0 },
        streak: 0,
      };
      reportProgress(student.id, student.name, stats).catch(() => {});
    }

    return { success: true, wordId, result, levelBefore, levelAfter: handled.newLevel, nextReview: handled.nextReview, status: handled.status, boxDescription: BOX_DESCRIPTIONS[handled.newLevel], boxColor: BOX_COLORS[handled.newLevel] };
  },
};

// 统计 API
export const statsApi = {
  get: async (studentId: string) => {
    const progress = getItem('progress_' + studentId) || {};
    const allWords = [...(getItem('custom_words') || []), ...BUILT_IN_WORDS];
    const now = new Date().toISOString();

    let newCount = 0, learningCount = 0, masteredCount = 0, dueToday = 0;
    for (const w of allWords) {
      const p = progress[w.id];
      if (!p || p.status === 'new') newCount++;
      else if (p.status === 'learning') learningCount++;
      else if (p.status === 'mastered') masteredCount++;
      if (p && p.next_review <= now && p.status !== 'mastered') dueToday++;
    }

    // 今日统计
    const records = getItem('records_' + studentId) || [];
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayRecords = records.filter((r: any) => r.reviewed_at >= todayStart.toISOString());

    // 最近 30 天
    const recentStats = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const dayStart = new Date(today); dayStart.setDate(today.getDate() - i); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart); dayEnd.setHours(23, 59, 59, 999);
      const dr = records.filter((r: any) => r.reviewed_at >= dayStart.toISOString() && r.reviewed_at <= dayEnd.toISOString());
      recentStats.push({ date: dayStart.toISOString().split('T')[0], total: dr.length, correct: dr.filter((r: any) => r.result === 'correct').length, wrong: dr.filter((r: any) => r.result === 'wrong').length });
    }

    let streak = 0;
    for (let i = recentStats.length - 1; i >= 0; i--) { if (recentStats[i].total > 0) streak++; else break; }

    return { total: allWords.length, newWords: newCount, learning: learningCount, mastered: masteredCount, dueToday, todayStats: { total: todayRecords.length, correct: todayRecords.filter((r: any) => r.result === 'correct').length, wrong: todayRecords.filter((r: any) => r.result === 'wrong').length }, recentStats, streak };
  },

  getCurve: async (studentId: string) => {
    const progress = getItem('progress_' + studentId) || {};
    const boxDistribution = [];
    for (let i = 0; i <= 6; i++) {
      const count = Object.values(progress).filter((p: any) => p.box_level === i).length;
      boxDistribution.push({ level: i, count, description: BOX_DESCRIPTIONS[i], color: BOX_COLORS[i] });
    }
    const allWords = [...(getItem('custom_words') || []), ...BUILT_IN_WORDS];
    return { forgettingCurve: FORGETTING_CURVE_DATA, spacedRepetitionEffect: SPACED_REPETITION_EFFECT, boxDistribution, totalWords: allWords.length };
  },
};

// 设置 API
export const settingsApi = {
  get: async (studentId: string) => {
    return getItem('settings_' + studentId) || { daily_limit: 20, auto_play_audio: false, show_phonetic: true, show_example: true, theme: 'light' };
  },
  update: async (studentId: string, data: any) => {
    const current = getItem('settings_' + studentId) || {};
    setItem('settings_' + studentId, { ...current, ...data });
  },
};
