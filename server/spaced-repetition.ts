/**
 * 艾宾浩斯记忆曲线 - 间隔重复算法
 *
 * 基于 Leitner System 的改进版本，结合艾宾浩斯遗忘曲线。
 * 单词从 Box 0 开始，答对则升级到下一个 Box，答错则降级。
 * 每个 Box 对应不同的复习间隔。
 */

// 记忆盒子等级对应的复习间隔（单位：小时）
// Box 0: 新单词 - 同日复习（约 20 分钟后，这里用 0 表示立即放入今日队列）
// Box 1: 1 天后
// Box 2: 2 天后
// Box 3: 4 天后
// Box 4: 7 天后
// Box 5: 15 天后
// Box 6: 掌握（不再需要主动复习）
export const REVIEW_INTERVALS_HOURS: number[] = [
  0,     // Box 0: 新单词 / 刚学（同日复习）
  24,    // Box 1: 1 天后
  48,    // Box 2: 2 天后
  96,    // Box 3: 4 天后
  168,   // Box 4: 7 天后
  360,   // Box 5: 15 天后
  720,   // Box 6: 30 天后 → 掌握
];

export const MAX_BOX_LEVEL = 6;
export const MASTERED_BOX_LEVEL = 6;

/**
 * 计算下一次复习时间
 * @param boxLevel 当前盒子等级
 * @returns 下一次复习的 ISO 时间字符串
 */
export function calculateNextReview(boxLevel: number): string {
  const intervalHours = REVIEW_INTERVALS_HOURS[Math.min(boxLevel, MAX_BOX_LEVEL)];
  const now = new Date();
  if (intervalHours === 0) {
    // Box 0: 20 分钟后复习
    now.setMinutes(now.getMinutes() + 20);
  } else {
    now.setHours(now.getHours() + intervalHours);
  }
  return now.toISOString();
}

/**
 * 处理答对的情况：升级盒子等级，计算下次复习时间
 * @param currentLevel 当前盒子等级
 * @returns { newLevel, nextReview, status }
 */
export function handleCorrect(currentLevel: number): {
  newLevel: number;
  nextReview: string;
  status: 'learning' | 'mastered';
} {
  let newLevel = currentLevel + 1;
  let status: 'learning' | 'mastered' = 'learning';

  if (newLevel >= MASTERED_BOX_LEVEL) {
    newLevel = MASTERED_BOX_LEVEL;
    status = 'mastered';
  }

  return {
    newLevel,
    nextReview: calculateNextReview(newLevel),
    status,
  };
}

/**
 * 处理答错的情况：降级盒子等级，重新计算下次复习时间
 * 答错的单词会降回 Box 0，需要当天重新复习
 * @param currentLevel 当前盒子等级
 * @returns { newLevel, nextReview, status }
 */
export function handleWrong(currentLevel: number): {
  newLevel: number;
  nextReview: string;
  status: 'learning';
} {
  // 降级：如果是 Box 0 则保持 Box 0，否则降回 Box 0（当天重新复习）
  // 如果已经在 Box 3+，可以降两级而不是直接回 0，以避免过于打击
  let newLevel: number;
  if (currentLevel <= 1) {
    newLevel = 0;
  } else if (currentLevel <= 3) {
    newLevel = 1;
  } else {
    newLevel = Math.max(1, currentLevel - 2);
  }

  // 答错的单词立即重新进入复习队列（20 分钟后）
  const now = new Date();
  now.setMinutes(now.getMinutes() + 20);

  return {
    newLevel,
    nextReview: now.toISOString(),
    status: 'learning',
  };
}

/**
 * 艾宾浩斯遗忘曲线数据（用于前端可视化）
 * 标准遗忘曲线：记忆保持率随时间衰减
 */
export const FORGETTING_CURVE_DATA: Array<{ time: string; retention: number }> = [
  { time: '20分钟', retention: 58.2 },
  { time: '1小时', retention: 44.2 },
  { time: '9小时', retention: 35.8 },
  { time: '1天', retention: 33.7 },
  { time: '2天', retention: 27.8 },
  { time: '6天', retention: 25.4 },
  { time: '31天', retention: 21.1 },
];

/**
 * 间隔重复效果：每次复习后的记忆保持率提升
 */
export const SPACED_REPETITION_EFFECT: Array<{ review: number; retention: number; interval: string }> = [
  { review: 1, retention: 58.2, interval: '20分钟' },
  { review: 2, retention: 70.0, interval: '1天' },
  { review: 3, retention: 80.0, interval: '2天' },
  { review: 4, retention: 86.0, interval: '4天' },
  { review: 5, retention: 90.0, interval: '7天' },
  { review: 6, retention: 95.0, interval: '15天' },
  { review: 7, retention: 98.0, interval: '30天' },
];

/**
 * 获取盒子等级的中文描述
 */
export function getBoxDescription(level: number): string {
  const descriptions = [
    '新单词',
    '1天后复习',
    '2天后复习',
    '4天后复习',
    '7天后复习',
    '15天后复习',
    '已掌握',
  ];
  return descriptions[Math.min(level, MAX_BOX_LEVEL)];
}

/**
 * 获取盒子等级对应的颜色（用于前端显示）
 */
export function getBoxColor(level: number): string {
  const colors = [
    '#e34c4c', // Box 0: 红色 - 新单词
    '#e8810c', // Box 1: 橙色
    '#e8b50c', // Box 2: 黄色
    '#7bc043', // Box 3: 浅绿
    '#3aa655', // Box 4: 绿色
    '#2196a8', // Box 5: 青色
    '#4a90d9', // Box 6: 蓝色 - 掌握
  ];
  return colors[Math.min(level, MAX_BOX_LEVEL)];
}
