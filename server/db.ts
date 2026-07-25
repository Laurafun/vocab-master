import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库文件路径
const dbPath = path.join(__dirname, '..', 'data', 'chat.db');

// 确保 data 目录存在
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 创建数据库连接
const db = new Database(dbPath);

// 启用 WAL 模式以提高性能
db.pragma('journal_mode = WAL');

// 初始化数据库表
db.exec(`
  -- 会话表（用于 AI 助手聊天）
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    model TEXT NOT NULL,
    sdk_session_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  -- 消息表（用于 AI 助手聊天）
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    model TEXT,
    created_at TEXT NOT NULL,
    tool_calls TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
  );

  -- 为会话 ID 创建索引
  CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);

  -- 单词表
  CREATE TABLE IF NOT EXISTS words (
    id TEXT PRIMARY KEY,
    word TEXT NOT NULL UNIQUE,
    phonetic TEXT,
    definition TEXT NOT NULL,
    example TEXT,
    example_translation TEXT,
    tags TEXT,
    box_level INTEGER NOT NULL DEFAULT 0,
    next_review TEXT NOT NULL,
    last_reviewed TEXT,
    review_count INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    wrong_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_words_next_review ON words(next_review);
  CREATE INDEX IF NOT EXISTS idx_words_box_level ON words(box_level);
  CREATE INDEX IF NOT EXISTS idx_words_status ON words(status);

  -- 复习记录表
  CREATE TABLE IF NOT EXISTS review_records (
    id TEXT PRIMARY KEY,
    word_id TEXT NOT NULL,
    result TEXT NOT NULL CHECK (result IN ('correct', 'wrong')),
    box_level_before INTEGER NOT NULL,
    box_level_after INTEGER NOT NULL,
    reviewed_at TEXT NOT NULL,
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_review_records_word_id ON review_records(word_id);
  CREATE INDEX IF NOT EXISTS idx_review_records_reviewed_at ON review_records(reviewed_at);

  -- 用户设置表
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

// 数据库迁移：添加 sdk_session_id 列（如果不存在）
try {
  const tableInfo = db.prepare("PRAGMA table_info(sessions)").all() as Array<{ name: string }>;
  const hasColumn = tableInfo.some(col => col.name === 'sdk_session_id');
  if (!hasColumn) {
    db.exec("ALTER TABLE sessions ADD COLUMN sdk_session_id TEXT");
    console.log("[DB] Added sdk_session_id column to sessions table");
  }
} catch (e) {
  // 忽略错误（列可能已存在）
}

// 类型定义
export interface DbSession {
  id: string;
  title: string;
  model: string;
  sdk_session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  model: string | null;
  created_at: string;
  tool_calls: string | null;
}

// ============= 会话操作 =============

// 获取所有会话
export function getAllSessions(): DbSession[] {
  const stmt = db.prepare('SELECT * FROM sessions ORDER BY updated_at DESC');
  return stmt.all() as DbSession[];
}

// 获取单个会话
export function getSession(id: string): DbSession | undefined {
  const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
  return stmt.get(id) as DbSession | undefined;
}

// 创建会话
export function createSession(session: DbSession): DbSession {
  const stmt = db.prepare(`
    INSERT INTO sessions (id, title, model, sdk_session_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(session.id, session.title, session.model, session.sdk_session_id, session.created_at, session.updated_at);
  return session;
}

// 更新会话
export function updateSession(id: string, updates: Partial<Pick<DbSession, 'title' | 'model' | 'sdk_session_id'>>): boolean {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.model !== undefined) {
    fields.push('model = ?');
    values.push(updates.model);
  }
  if (updates.sdk_session_id !== undefined) {
    fields.push('sdk_session_id = ?');
    values.push(updates.sdk_session_id);
  }
  
  if (fields.length === 0) return false;
  
  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);
  
  const stmt = db.prepare(`UPDATE sessions SET ${fields.join(', ')} WHERE id = ?`);
  const result = stmt.run(...values);
  return result.changes > 0;
}

// 删除会话
export function deleteSession(id: string): boolean {
  const stmt = db.prepare('DELETE FROM sessions WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

// ============= 消息操作 =============

// 获取会话的所有消息
export function getMessagesBySession(sessionId: string): DbMessage[] {
  const stmt = db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC');
  return stmt.all(sessionId) as DbMessage[];
}

// 创建消息
export function createMessage(message: DbMessage): DbMessage {
  const stmt = db.prepare(`
    INSERT INTO messages (id, session_id, role, content, model, created_at, tool_calls)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    message.id,
    message.session_id,
    message.role,
    message.content,
    message.model,
    message.created_at,
    message.tool_calls
  );
  
  // 更新会话的 updated_at
  const updateStmt = db.prepare('UPDATE sessions SET updated_at = ? WHERE id = ?');
  updateStmt.run(new Date().toISOString(), message.session_id);
  
  return message;
}

// 更新消息内容
export function updateMessage(id: string, updates: Partial<Pick<DbMessage, 'content' | 'tool_calls'>>): boolean {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.content !== undefined) {
    fields.push('content = ?');
    values.push(updates.content);
  }
  if (updates.tool_calls !== undefined) {
    fields.push('tool_calls = ?');
    values.push(updates.tool_calls);
  }
  
  if (fields.length === 0) return false;
  
  values.push(id);
  
  const stmt = db.prepare(`UPDATE messages SET ${fields.join(', ')} WHERE id = ?`);
  const result = stmt.run(...values);
  return result.changes > 0;
}

// 删除消息
export function deleteMessage(id: string): boolean {
  const stmt = db.prepare('DELETE FROM messages WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

// 批量创建消息（用于保存对话）
export function createMessages(messages: DbMessage[]): void {
  const stmt = db.prepare(`
    INSERT INTO messages (id, session_id, role, content, model, created_at, tool_calls)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insertMany = db.transaction((msgs: DbMessage[]) => {
    for (const msg of msgs) {
      stmt.run(msg.id, msg.session_id, msg.role, msg.content, msg.model, msg.created_at, msg.tool_calls);
    }
  });
  
  insertMany(messages);
}

// 清空所有数据
export function clearAllData(): void {
  db.exec('DELETE FROM messages');
  db.exec('DELETE FROM sessions');
}

// ============= 单词操作 =============

export interface DbWord {
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
  status: string; // new, learning, mastered
  created_at: string;
  updated_at: string;
}

// 添加单词
export function createWord(word: Omit<DbWord, 'id' | 'created_at' | 'updated_at' | 'box_level' | 'next_review' | 'last_reviewed' | 'review_count' | 'correct_count' | 'wrong_count' | 'status'> & { id?: string }): DbWord {
  const id = word.id || uuidv4();
  const now = new Date().toISOString();
  const newWord: DbWord = {
    id,
    word: word.word,
    phonetic: word.phonetic || null,
    definition: word.definition,
    example: word.example || null,
    example_translation: word.example_translation || null,
    tags: word.tags || null,
    box_level: 0,
    next_review: now,
    last_reviewed: null,
    review_count: 0,
    correct_count: 0,
    wrong_count: 0,
    status: 'new',
    created_at: now,
    updated_at: now,
  };
  const stmt = db.prepare(`
    INSERT INTO words (id, word, phonetic, definition, example, example_translation, tags, box_level, next_review, last_reviewed, review_count, correct_count, wrong_count, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    newWord.id, newWord.word, newWord.phonetic, newWord.definition,
    newWord.example, newWord.example_translation, newWord.tags,
    newWord.box_level, newWord.next_review, newWord.last_reviewed,
    newWord.review_count, newWord.correct_count, newWord.wrong_count,
    newWord.status, newWord.created_at, newWord.updated_at
  );
  return newWord;
}

// 批量添加单词
export function createWords(words: Array<{ word: string; phonetic?: string; definition: string; example?: string; example_translation?: string; tags?: string }>): { inserted: number; skipped: number; skippedWords: string[] } {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO words (id, word, phonetic, definition, example, example_translation, tags, box_level, next_review, last_reviewed, review_count, correct_count, wrong_count, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMany = db.transaction((wordsData: typeof words) => {
    let inserted = 0;
    let skipped = 0;
    const skippedWords: string[] = [];
    for (const w of wordsData) {
      const id = uuidv4();
      const now = new Date().toISOString();
      const result = stmt.run(
        id, w.word, w.phonetic || null, w.definition,
        w.example || null, w.example_translation || null, w.tags || null,
        0, now, null, 0, 0, 0, 'new', now, now
      );
      if (result.changes > 0) {
        inserted++;
      } else {
        skipped++;
        skippedWords.push(w.word);
      }
    }
    return { inserted, skipped, skippedWords };
  });
  return insertMany(words);
}

// 获取所有单词
export function getAllWords(): DbWord[] {
  const stmt = db.prepare('SELECT * FROM words ORDER BY created_at DESC');
  return stmt.all() as DbWord[];
}

// 获取单个单词
export function getWord(id: string): DbWord | undefined {
  const stmt = db.prepare('SELECT * FROM words WHERE id = ?');
  return stmt.get(id) as DbWord | undefined;
}

// 根据单词文本查找
export function getWordByText(word: string): DbWord | undefined {
  const stmt = db.prepare('SELECT * FROM words WHERE word = ? COLLATE NOCASE');
  return stmt.get(word) as DbWord | undefined;
}

// 更新单词
export function updateWord(id: string, updates: Partial<Pick<DbWord, 'word' | 'phonetic' | 'definition' | 'example' | 'example_translation' | 'tags' | 'box_level' | 'next_review' | 'last_reviewed' | 'review_count' | 'correct_count' | 'wrong_count' | 'status'>>): boolean {
  const fields: string[] = [];
  const values: any[] = [];
  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }
  if (fields.length === 0) return false;
  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);
  const stmt = db.prepare(`UPDATE words SET ${fields.join(', ')} WHERE id = ?`);
  const result = stmt.run(...values);
  return result.changes > 0;
}

// 删除单词
export function deleteWord(id: string): boolean {
  const stmt = db.prepare('DELETE FROM words WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

// 获取今日待复习的单词（next_review <= now）
export function getDueWords(limit: number = 60): DbWord[] {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    SELECT * FROM words 
    WHERE next_review <= ? AND status != 'mastered'
    ORDER BY 
      CASE WHEN status = 'new' THEN 0 ELSE 1 END,
      next_review ASC
    LIMIT ?
  `);
  return stmt.all(now, limit) as DbWord[];
}

// 获取新单词（status = 'new'）
export function getNewWords(limit: number = 60): DbWord[] {
  const stmt = db.prepare(`
    SELECT * FROM words WHERE status = 'new' 
    ORDER BY created_at ASC LIMIT ?
  `);
  return stmt.all(limit) as DbWord[];
}

// 获取今日学习的单词
export function getTodayStudiedWords(): DbWord[] {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const stmt = db.prepare(`
    SELECT * FROM words 
    WHERE last_reviewed >= ? 
    ORDER BY last_reviewed DESC
  `);
  return stmt.all(todayStart.toISOString()) as DbWord[];
}

// ============= 复习记录操作 =============

export interface DbReviewRecord {
  id: string;
  word_id: string;
  result: 'correct' | 'wrong';
  box_level_before: number;
  box_level_after: number;
  reviewed_at: string;
}

// 创建复习记录
export function createReviewRecord(record: Omit<DbReviewRecord, 'id'>): DbReviewRecord {
  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO review_records (id, word_id, result, box_level_before, box_level_after, reviewed_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, record.word_id, record.result, record.box_level_before, record.box_level_after, record.reviewed_at);
  return { id, ...record };
}

// 获取单词的复习记录
export function getReviewRecordsByWord(wordId: string): DbReviewRecord[] {
  const stmt = db.prepare('SELECT * FROM review_records WHERE word_id = ? ORDER BY reviewed_at DESC');
  return stmt.all(wordId) as DbReviewRecord[];
}

// 获取今日复习统计
export function getTodayReviewStats(): { total: number; correct: number; wrong: number } {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const records = db.prepare('SELECT result FROM review_records WHERE reviewed_at >= ?').all(todayStart.toISOString()) as Array<{ result: string }>;
  return {
    total: records.length,
    correct: records.filter(r => r.result === 'correct').length,
    wrong: records.filter(r => r.result === 'wrong').length,
  };
}

// 获取最近 N 天的复习统计
export function getRecentReviewStats(days: number = 30): Array<{ date: string; total: number; correct: number; wrong: number }> {
  const stats: Array<{ date: string; total: number; correct: number; wrong: number }> = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setDate(now.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    const records = db.prepare('SELECT result FROM review_records WHERE reviewed_at >= ? AND reviewed_at <= ?').all(dayStart.toISOString(), dayEnd.toISOString()) as Array<{ result: string }>;
    stats.push({
      date: dayStart.toISOString().split('T')[0],
      total: records.length,
      correct: records.filter(r => r.result === 'correct').length,
      wrong: records.filter(r => r.result === 'wrong').length,
    });
  }
  return stats;
}

// ============= 设置操作 =============

export function getSetting(key: string): string | null {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const row = stmt.get(key) as { value: string } | undefined;
  return row?.value || null;
}

export function setSetting(key: string, value: string): void {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
  `);
  stmt.run(key, value, now, value, now);
}

export function getAllSettings(): Record<string, string> {
  const stmt = db.prepare('SELECT * FROM settings');
  const rows = stmt.all() as Array<{ key: string; value: string }>;
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

// ============= 统计操作 =============

export function getWordStats(): {
  total: number;
  newWords: number;
  learning: number;
  mastered: number;
  dueToday: number;
} {
  const now = new Date().toISOString();
  const total = (db.prepare('SELECT COUNT(*) as count FROM words').get() as { count: number }).count;
  const newWords = (db.prepare("SELECT COUNT(*) as count FROM words WHERE status = 'new'").get() as { count: number }).count;
  const learning = (db.prepare("SELECT COUNT(*) as count FROM words WHERE status = 'learning'").get() as { count: number }).count;
  const mastered = (db.prepare("SELECT COUNT(*) as count FROM words WHERE status = 'mastered'").get() as { count: number }).count;
  const dueToday = (db.prepare('SELECT COUNT(*) as count FROM words WHERE next_review <= ? AND status != ?').get(now, 'mastered') as { count: number }).count;
  return { total, newWords, learning, mastered, dueToday };
}

// 获取各 Box 等级的单词分布
export function getBoxDistribution(): Array<{ level: number; count: number }> {
  const result: Array<{ level: number; count: number }> = [];
  for (let i = 0; i <= 6; i++) {
    const count = (db.prepare('SELECT COUNT(*) as count FROM words WHERE box_level = ?').get(i) as { count: number }).count;
    result.push({ level: i, count });
  }
  return result;
}

// 检查是否需要添加初始单词
export function seedWordsIfEmpty(): void {
  const count = (db.prepare('SELECT COUNT(*) as count FROM words').get() as { count: number }).count;
  if (count > 0) return;

  const sampleWords = [
    { word: 'abandon', phonetic: 'əˈbændən', definition: 'v. 放弃，抛弃', example: 'He abandoned his career.', example_translation: '他放弃了他的事业。', tags: '四级,高频' },
    { word: 'benefit', phonetic: 'ˈbenɪfɪt', definition: 'n. 利益，好处 v. 获益', example: 'Exercise benefits your health.', example_translation: '锻炼有益于你的健康。', tags: '四级,高频' },
    { word: 'curious', phonetic: 'ˈkjʊəriəs', definition: 'adj. 好奇的，奇特的', example: 'Children are naturally curious.', example_translation: '孩子们天生好奇。', tags: '四级,高频' },
    { word: 'determine', phonetic: 'dɪˈtɜːmɪn', definition: 'v. 决定，决心', example: 'She determined to win.', example_translation: '她决心要赢。', tags: '四级,高频' },
    { word: 'essential', phonetic: 'ɪˈsenʃl', definition: 'adj. 必要的，本质的', example: 'Water is essential for life.', example_translation: '水对生命是必不可少的。', tags: '四级,高频' },
    { word: 'frequent', phonetic: 'ˈfriːkwənt', definition: 'adj. 频繁的，常见的', example: 'He is a frequent visitor.', example_translation: '他是常客。', tags: '四级,高频' },
    { word: 'generate', phonetic: 'ˈdʒenəreɪt', definition: 'v. 产生，发生', example: 'Wind turbines generate electricity.', example_translation: '风力涡轮机发电。', tags: '四级,高频' },
    { word: 'horizon', phonetic: 'həˈraɪzn', definition: 'n. 地平线，眼界', example: 'The sun set below the horizon.', example_translation: '太阳沉入地平线以下。', tags: '四级,高频' },
    { word: 'imagine', phonetic: 'ɪˈmædʒɪn', definition: 'v. 想象，设想', example: 'Imagine living on Mars.', example_translation: '想象一下住在火星上。', tags: '四级,高频' },
    { word: 'journey', phonetic: 'ˈdʒɜːni', definition: 'n. 旅程，旅行', example: 'Life is a journey.', example_translation: '生命是一场旅程。', tags: '四级,高频' },
    { word: 'knowledge', phonetic: 'ˈnɒlɪdʒ', definition: 'n. 知识，学问', example: 'Knowledge is power.', example_translation: '知识就是力量。', tags: '四级,高频' },
    { word: 'literature', phonetic: 'ˈlɪtərətʃə', definition: 'n. 文学，文献', example: 'She studies English literature.', example_translation: '她研究英国文学。', tags: '四级,高频' },
    { word: 'maintain', phonetic: 'meɪnˈteɪn', definition: 'v. 维持，保养', example: 'Maintain a healthy diet.', example_translation: '保持健康的饮食。', tags: '四级,高频' },
    { word: 'necessary', phonetic: 'ˈnesəsəri', definition: 'adj. 必要的，必需的', example: 'Sleep is necessary for health.', example_translation: '睡眠对健康是必要的。', tags: '四级,高频' },
    { word: 'opportunity', phonetic: 'ˌɒpəˈtjuːnəti', definition: 'n. 机会，时机', example: 'Don\'t miss this opportunity.', example_translation: '不要错过这个机会。', tags: '四级,高频' },
    { word: 'particular', phonetic: 'pəˈtɪkjələ', definition: 'adj. 特别的，特定的', example: 'Is there any particular color?', example_translation: '有什么特别的颜色吗？', tags: '四级,高频' },
    { word: 'quality', phonetic: 'ˈkwɒləti', definition: 'n. 质量，品质', example: 'Quality matters more than quantity.', example_translation: '质量比数量更重要。', tags: '四级,高频' },
    { word: 'recognize', phonetic: 'ˈrekəɡnaɪz', definition: 'v. 认出，识别', example: 'I didn\'t recognize you.', example_translation: '我没认出你。', tags: '四级,高频' },
    { word: 'suggest', phonetic: 'səˈdʒest', definition: 'v. 建议，暗示', example: 'I suggest taking a break.', example_translation: '我建议休息一下。', tags: '四级,高频' },
    { word: 'typical', phonetic: 'ˈtɪpɪkl', definition: 'adj. 典型的，特有的', example: 'It\'s a typical English breakfast.', example_translation: '这是典型的英式早餐。', tags: '四级,高频' },
  ];

  createWords(sampleWords);
  console.log(`[DB] Seeded ${sampleWords.length} sample words`);
}

export default db;
