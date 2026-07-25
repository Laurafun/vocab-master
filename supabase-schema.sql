-- ========================================
-- 单词背诵大师 - Supabase 数据库建表脚本
-- 在 Supabase Dashboard → SQL Editor 中执行
-- ========================================

-- 1. 共享单词库（所有学生看到的同一套单词）
CREATE TABLE IF NOT EXISTS words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT UNIQUE NOT NULL,
  phonetic TEXT,
  definition TEXT NOT NULL,
  example TEXT,
  example_translation TEXT,
  tags TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 学生表（输入姓名即可，无需密码）
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 学生单词进度（每个学生对每个单词的独立记忆状态）
CREATE TABLE IF NOT EXISTS student_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  box_level INT DEFAULT 0,
  next_review TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed TIMESTAMPTZ,
  review_count INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  wrong_count INT DEFAULT 0,
  status TEXT DEFAULT 'new',
  UNIQUE(student_id, word_id)
);

-- 4. 复习记录
CREATE TABLE IF NOT EXISTS review_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  result TEXT NOT NULL CHECK (result IN ('correct', 'wrong')),
  box_level_before INT NOT NULL,
  box_level_after INT NOT NULL,
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 学生个人设置
CREATE TABLE IF NOT EXISTS student_settings (
  student_id UUID PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  daily_limit INT DEFAULT 20,
  show_phonetic BOOLEAN DEFAULT TRUE,
  show_example BOOLEAN DEFAULT TRUE,
  auto_play_audio BOOLEAN DEFAULT FALSE,
  theme TEXT DEFAULT 'light'
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_student_words_student ON student_words(student_id);
CREATE INDEX IF NOT EXISTS idx_student_words_review ON student_words(student_id, next_review);
CREATE INDEX IF NOT EXISTS idx_review_records_student ON review_records(student_id);
CREATE INDEX IF NOT EXISTS idx_words_word ON words(word);

-- 启用行级安全（RLS）- 允许匿名访问（课堂场景，无需登录验证）
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_settings ENABLE ROW LEVEL SECURITY;

-- 允许匿名读写（用 anon key 即可操作）
CREATE POLICY "Allow anonymous read words" ON words FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert words" ON words FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update words" ON words FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete words" ON words FOR DELETE USING (true);

CREATE POLICY "Allow anonymous all students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous all student_words" ON student_words FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous all review_records" ON review_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous all student_settings" ON student_settings FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- 初始示例单词（20个四级高频词）
-- ========================================
INSERT INTO words (word, phonetic, definition, example, example_translation, tags) VALUES
('abandon', 'əˈbændən', 'v. 放弃，抛弃', 'He abandoned his career.', '他放弃了他的事业。', '四级,高频'),
('benefit', 'ˈbenɪfɪt', 'n. 利益，好处 v. 获益', 'Exercise benefits your health.', '锻炼有益于你的健康。', '四级,高频'),
('curious', 'ˈkjʊəriəs', 'adj. 好奇的，奇特的', 'Children are naturally curious.', '孩子们天生好奇。', '四级,高频'),
('determine', 'dɪˈtɜːmɪn', 'v. 决定，决心', 'She determined to win.', '她决心要赢。', '四级,高频'),
('essential', 'ɪˈsenʃl', 'adj. 必要的，本质的', 'Water is essential for life.', '水对生命是必不可少的。', '四级,高频'),
('frequent', 'ˈfriːkwənt', 'adj. 频繁的，常见的', 'He is a frequent visitor.', '他是常客。', '四级,高频'),
('generate', 'ˈdʒenəreɪt', 'v. 产生，发生', 'Wind turbines generate electricity.', '风力涡轮机发电。', '四级,高频'),
('horizon', 'həˈraɪzn', 'n. 地平线，眼界', 'The sun set below the horizon.', '太阳沉入地平线以下。', '四级,高频'),
('imagine', 'ɪˈmædʒɪn', 'v. 想象，设想', 'Imagine living on Mars.', '想象一下住在火星上。', '四级,高频'),
('journey', 'ˈdʒɜːni', 'n. 旅程，旅行', 'Life is a journey.', '生命是一场旅程。', '四级,高频'),
('knowledge', 'ˈnɒlɪdʒ', 'n. 知识，学问', 'Knowledge is power.', '知识就是力量。', '四级,高频'),
('literature', 'ˈlɪtərətʃə', 'n. 文学，文献', 'She studies English literature.', '她研究英国文学。', '四级,高频'),
('maintain', 'meɪnˈteɪn', 'v. 维持，保养', 'Maintain a healthy diet.', '保持健康的饮食。', '四级,高频'),
('necessary', 'ˈnesəsəri', 'adj. 必要的，必需的', 'Sleep is necessary for health.', '睡眠对健康是必要的。', '四级,高频'),
('opportunity', 'ˌɒpəˈtjuːnəti', 'n. 机会，时机', 'Don''t miss this opportunity.', '不要错过这个机会。', '四级,高频'),
('particular', 'pəˈtɪkjələ', 'adj. 特别的，特定的', 'Is there any particular color?', '有什么特别的颜色吗？', '四级,高频'),
('quality', 'ˈkwɒləti', 'n. 质量，品质', 'Quality matters more than quantity.', '质量比数量更重要。', '四级,高频'),
('recognize', 'ˈrekəɡnaɪz', 'v. 认出，识别', 'I didn''t recognize you.', '我没认出你。', '四级,高频'),
('suggest', 'səˈdʒest', 'v. 建议，暗示', 'I suggest taking a break.', '我建议休息一下。', '四级,高频'),
('typical', 'ˈtɪpɪkl', 'adj. 典型的，特有的', 'It''s a typical English breakfast.', '这是典型的英式早餐。', '四级,高频')
ON CONFLICT (word) DO NOTHING;
