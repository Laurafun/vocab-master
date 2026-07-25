// 艾宾浩斯记忆曲线 - 间隔重复算法（前端版本）

export const REVIEW_INTERVALS_HOURS: number[] = [0, 24, 48, 96, 168, 360, 720];
export const MAX_BOX_LEVEL = 6;
export const MASTERED_BOX_LEVEL = 6;

export function calculateNextReview(boxLevel: number): string {
  const intervalHours = REVIEW_INTERVALS_HOURS[Math.min(boxLevel, MAX_BOX_LEVEL)];
  const now = new Date();
  if (intervalHours === 0) {
    now.setMinutes(now.getMinutes() + 20);
  } else {
    now.setHours(now.getHours() + intervalHours);
  }
  return now.toISOString();
}

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
  return { newLevel, nextReview: calculateNextReview(newLevel), status };
}

export function handleWrong(currentLevel: number): {
  newLevel: number;
  nextReview: string;
  status: 'learning';
} {
  let newLevel: number;
  if (currentLevel <= 1) newLevel = 0;
  else if (currentLevel <= 3) newLevel = 1;
  else newLevel = Math.max(1, currentLevel - 2);
  const now = new Date();
  now.setMinutes(now.getMinutes() + 20);
  return { newLevel, nextReview: now.toISOString(), status: 'learning' };
}

export const FORGETTING_CURVE_DATA = [
  { time: '20分钟', retention: 58.2 },
  { time: '1小时', retention: 44.2 },
  { time: '9小时', retention: 35.8 },
  { time: '1天', retention: 33.7 },
  { time: '2天', retention: 27.8 },
  { time: '6天', retention: 25.4 },
  { time: '31天', retention: 21.1 },
];

export const SPACED_REPETITION_EFFECT = [
  { review: 1, retention: 58.2, interval: '20分钟' },
  { review: 2, retention: 70.0, interval: '1天' },
  { review: 3, retention: 80.0, interval: '2天' },
  { review: 4, retention: 86.0, interval: '4天' },
  { review: 5, retention: 90.0, interval: '7天' },
  { review: 6, retention: 95.0, interval: '15天' },
  { review: 7, retention: 98.0, interval: '30天' },
];

export const BOX_DESCRIPTIONS = ['新单词', '1天后复习', '2天后复习', '4天后复习', '7天后复习', '15天后复习', '已掌握'];
export const BOX_COLORS = ['#e34c4c', '#e8810c', '#e8b50c', '#7bc043', '#3aa655', '#2196a8', '#4a90d9'];
