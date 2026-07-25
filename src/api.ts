/**
 * 本地存储方案 - 完全离线，不需要 Supabase
 * 每个学生在浏览器本地保存自己的进度
 * 单词列表内置在代码里
 */

import { handleCorrect, handleWrong, FORGETTING_CURVE_DATA, SPACED_REPETITION_EFFECT, BOX_DESCRIPTIONS, BOX_COLORS } from './lib/spaced-repetition';

// 内置 20 个示例单词
const BUILT_IN_WORDS = [
  { id: 'w1', word: 'abandon', phonetic: 'əˈbændən', definition: 'v. 放弃，抛弃', example: 'He abandoned his career.', example_translation: '他放弃了他的事业。', tags: '四级,高频' },
  { id: 'w2', word: 'benefit', phonetic: 'ˈbenɪfɪt', definition: 'n. 利益，好处 v. 获益', example: 'Exercise benefits your health.', example_translation: '锻炼有益于你的健康。', tags: '四级,高频' },
  { id: 'w3', word: 'curious', phonetic: 'ˈkjʊəriəs', definition: 'adj. 好奇的，奇特的', example: 'Children are naturally curious.', example_translation: '孩子们天生好奇。', tags: '四级,高频' },
  { id: 'w4', word: 'determine', phonetic: 'dɪˈtɜːmɪn', definition: 'v. 决定，决心', example: 'She determined to win.', example_translation: '她决心要赢。', tags: '四级,高频' },
  { id: 'w5', word: 'essential', phonetic: 'ɪˈsenʃl', definition: 'adj. 必要的，本质的', example: 'Water is essential for life.', example_translation: '水对生命是必不可少的。', tags: '四级,高频' },
  { id: 'w6', word: 'frequent', phonetic: 'ˈfriːkwənt', definition: 'adj. 频繁的，常见的', example: 'He is a frequent visitor.', example_translation: '他是常客。', tags: '四级,高频' },
  { id: 'w7', word: 'generate', phonetic: 'ˈdʒenəreɪt', definition: 'v. 产生，发生', example: 'Wind turbines generate electricity.', example_translation: '风力涡轮机发电。', tags: '四级,高频' },
  { id: 'w8', word: 'horizon', phonetic: 'həˈraɪzn', definition: 'n. 地平线，眼界', example: 'The sun set below the horizon.', example_translation: '太阳沉入地平线以下。', tags: '四级,高频' },
  { id: 'w9', word: 'imagine', phonetic: 'ɪˈmædʒɪn', definition: 'v. 想象，设想', example: 'Imagine living on Mars.', example_translation: '想象一下住在火星上。', tags: '四级,高频' },
  { id: 'w10', word: 'journey', phonetic: 'ˈdʒɜːni', definition: 'n. 旅程，旅行', example: 'Life is a journey.', example_translation: '生命是一场旅程。', tags: '四级,高频' },
  { id: 'w11', word: 'knowledge', phonetic: 'ˈnɒlɪdʒ', definition: 'n. 知识，学问', example: 'Knowledge is power.', example_translation: '知识就是力量。', tags: '四级,高频' },
  { id: 'w12', word: 'literature', phonetic: 'ˈlɪtərətʃə', definition: 'n. 文学，文献', example: 'She studies English literature.', example_translation: '她研究英国文学。', tags: '四级,高频' },
  { id: 'w13', word: 'maintain', phonetic: 'meɪnˈteɪn', definition: 'v. 维持，保养', example: 'Maintain a healthy diet.', example_translation: '保持健康的饮食。', tags: '四级,高频' },
  { id: 'w14', word: 'necessary', phonetic: 'ˈnesəsəri', definition: 'adj. 必要的，必需的', example: 'Sleep is necessary for health.', example_translation: '睡眠对健康是必要的。', tags: '四级,高频' },
  { id: 'w15', word: 'opportunity', phonetic: 'ˌɒpəˈtjuːnəti', definition: 'n. 机会，时机', example: 'Don\'t miss this opportunity.', example_translation: '不要错过这个机会。', tags: '四级,高频' },
  { id: 'w16', word: 'particular', phonetic: 'pəˈtɪkjələ', definition: 'adj. 特别的，特定的', example: 'Is there any particular color?', example_translation: '有什么特别的颜色吗？', tags: '四级,高频' },
  { id: 'w17', word: 'quality', phonetic: 'ˈkwɒləti', definition: 'n. 质量，品质', example: 'Quality matters more than quantity.', example_translation: '质量比数量更重要。', tags: '四级,高频' },
  { id: 'w18', word: 'recognize', phonetic: 'ˈrekəɡnaɪz', definition: 'v. 认出，识别', example: 'I didn\'t recognize you.', example_translation: '我没认出你。', tags: '四级,高频' },
  { id: 'w19', word: 'suggest', phonetic: 'səˈdʒest', definition: 'v. 建议，暗示', example: 'I suggest taking a break.', example_translation: '我建议休息一下。', tags: '四级,高频' },
  { id: 'w20', word: 'typical', phonetic: 'ˈtɪpɪkl', definition: 'adj. 典型的，特有的', example: 'It\'s a typical English breakfast.', example_translation: '这是典型的英式早餐。', tags: '四级,高频' },
];

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
