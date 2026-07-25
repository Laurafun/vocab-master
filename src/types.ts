/**
 * 类型定义
 */

export type PermissionMode = 'default' | 'acceptEdits' | 'plan' | 'bypassPermissions';

export interface Model {
  modelId: string;
  name: string;
  description?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  input?: Record<string, unknown>;
  status: 'running' | 'completed' | 'error';
  result?: string;
  isError?: boolean;
}

/**
 * 内容块类型 - 支持文字和工具调用按顺序排列
 */
export type ContentBlock = 
  | { type: 'text'; text: string }
  | { type: 'tool_use'; toolCall: ToolCall };

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;  // 保留用于兼容，存储纯文本摘要
  model?: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolCalls?: ToolCall[];  // 保留用于兼容
  contentBlocks?: ContentBlock[];  // 新增：按顺序排列的内容块
}

export interface Session {
  id: string;
  title: string;
  model: string;
  agentId?: string;
  cwd?: string;
  permissionMode?: PermissionMode;
  createdAt: Date;
  messages: Message[];
}

export interface CustomAgent {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  icon?: string;
  color?: string;
  permissionMode?: PermissionMode;
  createdAt: Date;
  updatedAt: Date;
}

// Agent 是 CustomAgent 的别名
export type Agent = CustomAgent;

export type Theme = 'light' | 'dark';

/**
 * 权限请求 - 用于工具调用确认
 */
export interface PermissionRequest {
  requestId: string;
  toolUseId: string;
  toolName: string;
  input: Record<string, unknown>;
  sessionId: string;
  timestamp: number;
}

/**
 * 权限响应
 */
export interface PermissionResponse {
  requestId: string;
  behavior: 'allow' | 'deny';
  message?: string;
}

// ============= 单词背诵相关类型 =============

export interface Word {
  id: string;
  word: string;
  phonetic: string | null;
  definition: string;
  example: string | null;
  example_translation: string | null;
  tags: string | null;
  box_level: number;
  next_review: string;
  last_reviewed: string | null;
  review_count: number;
  correct_count: number;
  wrong_count: number;
  status: 'new' | 'learning' | 'mastered';
  created_at: string;
  updated_at: string;
}

export interface WordStats {
  total: number;
  newWords: number;
  learning: number;
  mastered: number;
  dueToday: number;
  todayStats: {
    total: number;
    correct: number;
    wrong: number;
  };
  recentStats: Array<{ date: string; total: number; correct: number; wrong: number }>;
  streak: number;
}

export interface BoxDistributionItem {
  level: number;
  count: number;
  description: string;
  color: string;
}

export interface CurveData {
  forgettingCurve: Array<{ time: string; retention: number }>;
  spacedRepetitionEffect: Array<{ review: number; retention: number; interval: string }>;
  boxDistribution: BoxDistributionItem[];
  totalWords: number;
}

export interface AppSettings {
  daily_limit: number;
  auto_play_audio: boolean;
  show_phonetic: boolean;
  show_example: boolean;
  theme: string;
}

export interface ReviewResult {
  success: boolean;
  wordId: string;
  result: 'correct' | 'wrong';
  levelBefore: number;
  levelAfter: number;
  nextReview: string;
  status: string;
  boxDescription: string;
  boxColor: string;
}

