import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Trash2, Edit2, Upload, X, Volume2, Tag } from 'lucide-react';
import { wordApi } from '../api';
import type { Word } from '../types';

const BOX_COLORS = ['#e34c4c', '#e8810c', '#e8b50c', '#7bc043', '#3aa655', '#2196a8', '#4a90d9'];
const BOX_DESCRIPTIONS = ['新单词', '1天', '2天', '4天', '7天', '15天', '已掌握'];

export function WordManagePage() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);

  const fetchWords = useCallback(async () => {
    try {
      setLoading(true);
      const data = await wordApi.getAll();
      setWords(data);
    } catch (err) {
      console.error('Failed to fetch words:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这个单词吗？')) return;
    try {
      await wordApi.delete(id);
      setWords(words.filter(w => w.id !== id));
    } catch (err) {
      alert('删除失败');
    }
  };

  const filteredWords = words.filter(w =>
    w.word.toLowerCase().includes(search.toLowerCase()) ||
    w.definition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full overflow-y-auto p-6" style={{ backgroundColor: 'var(--td-bg-color-page)' }}>
      {/* 标题和操作 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--td-text-color-primary)' }}>单词库</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--td-text-color-secondary)' }}>
            共 {words.length} 个单词
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setShowBatchForm(true); setShowAddForm(false); }}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
            style={{
              backgroundColor: 'var(--td-bg-color-container)',
              color: 'var(--td-text-color-primary)',
              border: '1px solid var(--td-component-stroke)',
            }}
          >
            <Upload size={16} />
            批量导入
          </button>
          <button
            onClick={() => { setShowAddForm(true); setShowBatchForm(false); }}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
          >
            <Plus size={16} />
            添加单词
          </button>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="mb-4 relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          color="var(--td-text-color-placeholder)"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索单词或释义..."
          className="w-full rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none"
          style={{
            backgroundColor: 'var(--td-bg-color-container)',
            color: 'var(--td-text-color-primary)',
            border: '1px solid var(--td-component-stroke)',
          }}
        />
      </div>

      {/* 添加单词表单 */}
      {showAddForm && (
        <AddWordForm
          onClose={() => setShowAddForm(false)}
          onAdded={() => { fetchWords(); setShowAddForm(false); }}
        />
      )}

      {/* 批量导入表单 */}
      {showBatchForm && (
        <BatchImportForm
          onClose={() => setShowBatchForm(false)}
          onAdded={() => { fetchWords(); setShowBatchForm(false); }}
        />
      )}

      {/* 编辑表单 */}
      {editingWord && (
        <EditWordForm
          word={editingWord}
          onClose={() => setEditingWord(null)}
          onUpdated={() => { fetchWords(); setEditingWord(null); }}
        />
      )}

      {/* 单词列表 */}
      {loading ? (
        <div className="py-20 text-center" style={{ color: 'var(--td-text-color-secondary)' }}>加载中...</div>
      ) : filteredWords.length === 0 ? (
        <div className="py-20 text-center" style={{ color: 'var(--td-text-color-secondary)' }}>
          {search ? '没有找到匹配的单词' : '还没有单词，点击"添加单词"开始吧'}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredWords.map((word) => (
            <div
              key={word.id}
              className="rounded-xl border p-4 transition-all hover:shadow-md"
              style={{
                backgroundColor: 'var(--td-bg-color-container)',
                borderColor: 'var(--td-component-stroke)',
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold" style={{ color: 'var(--td-text-color-primary)' }}>
                      {word.word}
                    </h3>
                    <button
                      onClick={() => {
                        if ('speechSynthesis' in window) {
                          const u = new SpeechSynthesisUtterance(word.word);
                          u.lang = 'en-US';
                          window.speechSynthesis.speak(u);
                        }
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ backgroundColor: 'var(--td-brand-color-light)' }}
                    >
                      <Volume2 size={12} color="var(--td-brand-color)" />
                    </button>
                  </div>
                  {word.phonetic && (
                    <p className="text-xs italic" style={{ color: 'var(--td-text-color-secondary)' }}>
                      /{word.phonetic}/
                    </p>
                  )}
                  <p className="mt-1 text-sm" style={{ color: 'var(--td-text-color-primary)' }}>
                    {word.definition}
                  </p>
                  {word.example && (
                    <p className="mt-1 text-xs italic" style={{ color: 'var(--td-text-color-secondary)' }}>
                      "{word.example}"
                    </p>
                  )}
                  {word.tags && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {word.tags.split(',').map((tag, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                          style={{ backgroundColor: 'var(--td-brand-color-light)', color: 'var(--td-brand-color)' }}
                        >
                          <Tag size={10} />
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: BOX_COLORS[Math.min(word.box_level, 6)] }}
                  >
                    {BOX_DESCRIPTIONS[Math.min(word.box_level, 6)]}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--td-text-color-secondary)' }}>
                    复习 {word.review_count} 次
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingWord(word)}
                      className="flex h-7 w-7 items-center justify-center rounded-md transition-all hover:bg-blue-50"
                      style={{ color: 'var(--td-text-color-secondary)' }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(word.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-md transition-all hover:bg-red-50"
                      style={{ color: '#ef4444' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============= 添加单词表单 =============

function AddWordForm({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [word, setWord] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [definition, setDefinition] = useState('');
  const [example, setExample] = useState('');
  const [exampleTranslation, setExampleTranslation] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!word.trim() || !definition.trim()) return;
    setLoading(true);
    try {
      await wordApi.create({
        word: word.trim(),
        phonetic: phonetic.trim() || undefined,
        definition: definition.trim(),
        example: example.trim() || undefined,
        example_translation: exampleTranslation.trim() || undefined,
        tags: tags.trim() || undefined,
      });
      onAdded();
    } catch (err: any) {
      alert(err.message || '添加失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="mb-4 rounded-xl border p-5"
      style={{ backgroundColor: 'var(--td-bg-color-container)', borderColor: 'var(--td-component-stroke)' }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold" style={{ color: 'var(--td-text-color-primary)' }}>添加单词</h3>
        <button onClick={onClose} className="rounded-md p-1" style={{ color: 'var(--td-text-color-secondary)' }}>
          <X size={18} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input
          value={word} onChange={(e) => setWord(e.target.value)}
          placeholder="单词 *"
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ backgroundColor: 'var(--td-bg-color-component)', color: 'var(--td-text-color-primary)', border: '1px solid var(--td-component-stroke)' }}
        />
        <input
          value={phonetic} onChange={(e) => setPhonetic(e.target.value)}
          placeholder="音标（如 ˈæpəl）"
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ backgroundColor: 'var(--td-bg-color-component)', color: 'var(--td-text-color-primary)', border: '1px solid var(--td-component-stroke)' }}
        />
        <input
          value={definition} onChange={(e) => setDefinition(e.target.value)}
          placeholder="释义 *"
          className="col-span-2 rounded-lg px-3 py-2 text-sm outline-none"
          style={{ backgroundColor: 'var(--td-bg-color-component)', color: 'var(--td-text-color-primary)', border: '1px solid var(--td-component-stroke)' }}
        />
        <input
          value={example} onChange={(e) => setExample(e.target.value)}
          placeholder="例句"
          className="col-span-2 rounded-lg px-3 py-2 text-sm outline-none"
          style={{ backgroundColor: 'var(--td-bg-color-component)', color: 'var(--td-text-color-primary)', border: '1px solid var(--td-component-stroke)' }}
        />
        <input
          value={exampleTranslation} onChange={(e) => setExampleTranslation(e.target.value)}
          placeholder="例句翻译"
          className="col-span-2 rounded-lg px-3 py-2 text-sm outline-none"
          style={{ backgroundColor: 'var(--td-bg-color-component)', color: 'var(--td-text-color-primary)', border: '1px solid var(--td-component-stroke)' }}
        />
        <input
          value={tags} onChange={(e) => setTags(e.target.value)}
          placeholder="标签（用逗号分隔，如 四级,高频词）"
          className="col-span-2 rounded-lg px-3 py-2 text-sm outline-none"
          style={{ backgroundColor: 'var(--td-bg-color-component)', color: 'var(--td-text-color-primary)', border: '1px solid var(--td-component-stroke)' }}
        />
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-all"
          style={{ backgroundColor: 'var(--td-bg-color-component)', color: 'var(--td-text-color-secondary)', border: '1px solid var(--td-component-stroke)' }}
        >
          取消
        </button>
        <button
          onClick={handleSubmit} disabled={loading || !word.trim() || !definition.trim()}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
        >
          {loading ? '添加中...' : '添加'}
        </button>
      </div>
    </div>
  );
}

// ============= 批量导入 =============

function BatchImportForm({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ inserted: number; skipped: number; skippedWords: string[] } | null>(null);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      // 解析文本：每行一个单词，格式为 "word|definition" 或 "word,definition" 或 "word definition"
      const lines = text.trim().split('\n');
      const words = lines
        .map(line => {
          line = line.trim();
          if (!line) return null;
          // 尝试用 | 或 : 或制表符分隔
          let parts = line.split(/\t|\||：/);
          if (parts.length < 2) {
            // 尝试用第一个空格分隔
            const spaceIdx = line.indexOf(' ');
            if (spaceIdx > 0) {
              parts = [line.substring(0, spaceIdx), line.substring(spaceIdx + 1)];
            }
          }
          if (parts.length < 2) return null;
          return {
            word: parts[0].trim(),
            definition: parts.slice(1).join(' ').trim(),
          };
        })
        .filter(w => w !== null) as Array<{ word: string; definition: string }>;

      if (words.length === 0) {
        alert('没有解析到有效单词，请检查格式');
        setLoading(false);
        return;
      }

      const res = await wordApi.batchCreate(words);
      setResult(res);
    } catch (err: any) {
      alert(err.message || '导入失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="mb-4 rounded-xl border p-5"
      style={{ backgroundColor: 'var(--td-bg-color-container)', borderColor: 'var(--td-component-stroke)' }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold" style={{ color: 'var(--td-text-color-primary)' }}>批量导入单词</h3>
        <button onClick={onClose} className="rounded-md p-1" style={{ color: 'var(--td-text-color-secondary)' }}>
          <X size={18} />
        </button>
      </div>
      <p className="mb-2 text-sm" style={{ color: 'var(--td-text-color-secondary)' }}>
        每行一个单词，格式：<code className="rounded px-1" style={{ backgroundColor: 'var(--td-bg-color-component)' }}>单词|释义</code> 或 <code className="rounded px-1" style={{ backgroundColor: 'var(--td-bg-color-component)' }}>单词:释义</code> 或 <code className="rounded px-1" style={{ backgroundColor: 'var(--td-bg-color-component)' }}>单词 释义</code>
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'apple|苹果\nbeautiful|美丽的\ncomputer|电脑'}
        rows={8}
        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
        style={{ backgroundColor: 'var(--td-bg-color-component)', color: 'var(--td-text-color-primary)', border: '1px solid var(--td-component-stroke)', fontFamily: 'monospace' }}
      />
      {result && (
        <div className="mt-3 rounded-lg p-3" style={{ backgroundColor: 'var(--td-bg-color-component)' }}>
          <p className="text-sm" style={{ color: '#22c55e' }}>成功导入 {result.inserted} 个单词</p>
          {result.skipped > 0 && (
            <p className="text-sm" style={{ color: '#f59e0b' }}>跳过 {result.skipped} 个重复单词: {result.skippedWords.join(', ')}</p>
          )}
        </div>
      )}
      <div className="mt-4 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium" style={{ backgroundColor: 'var(--td-bg-color-component)', color: 'var(--td-text-color-secondary)', border: '1px solid var(--td-component-stroke)' }}>
          {result ? '关闭' : '取消'}
        </button>
        {!result && (
          <button
            onClick={handleSubmit} disabled={loading || !text.trim()}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
          >
            {loading ? '导入中...' : '导入'}
          </button>
        )}
      </div>
    </div>
  );
}

// ============= 编辑表单 =============

function EditWordForm({ word, onClose, onUpdated }: { word: Word; onClose: () => void; onUpdated: () => void }) {
  const [w, setW] = useState(word.word);
  const [phonetic, setPhonetic] = useState(word.phonetic || '');
  const [definition, setDefinition] = useState(word.definition);
  const [example, setExample] = useState(word.example || '');
  const [exampleTranslation, setExampleTranslation] = useState(word.example_translation || '');
  const [tags, setTags] = useState(word.tags || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!w.trim() || !definition.trim()) return;
    setLoading(true);
    try {
      await wordApi.update(word.id, {
        word: w.trim(),
        phonetic: phonetic.trim(),
        definition: definition.trim(),
        example: example.trim(),
        example_translation: exampleTranslation.trim(),
        tags: tags.trim(),
      });
      onUpdated();
    } catch (err: any) {
      alert(err.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4 rounded-xl border p-5" style={{ backgroundColor: 'var(--td-bg-color-container)', borderColor: 'var(--td-component-stroke)' }}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold" style={{ color: 'var(--td-text-color-primary)' }}>编辑单词</h3>
        <button onClick={onClose} className="rounded-md p-1" style={{ color: 'var(--td-text-color-secondary)' }}>
          <X size={18} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input value={w} onChange={(e) => setW(e.target.value)} placeholder="单词" className="rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: 'var(--td-bg-color-component)', color: 'var(--td-text-color-primary)', border: '1px solid var(--td-component-stroke)' }} />
        <input value={phonetic} onChange={(e) => setPhonetic(e.target.value)} placeholder="音标" className="rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: 'var(--td-bg-color-component)', color: 'var(--td-text-color-primary)', border: '1px solid var(--td-component-stroke)' }} />
        <input value={definition} onChange={(e) => setDefinition(e.target.value)} placeholder="释义" className="col-span-2 rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: 'var(--td-bg-color-component)', color: 'var(--td-text-color-primary)', border: '1px solid var(--td-component-stroke)' }} />
        <input value={example} onChange={(e) => setExample(e.target.value)} placeholder="例句" className="col-span-2 rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: 'var(--td-bg-color-component)', color: 'var(--td-text-color-primary)', border: '1px solid var(--td-component-stroke)' }} />
        <input value={exampleTranslation} onChange={(e) => setExampleTranslation(e.target.value)} placeholder="例句翻译" className="col-span-2 rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: 'var(--td-bg-color-component)', color: 'var(--td-text-color-primary)', border: '1px solid var(--td-component-stroke)' }} />
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="标签" className="col-span-2 rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: 'var(--td-bg-color-component)', color: 'var(--td-text-color-primary)', border: '1px solid var(--td-component-stroke)' }} />
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium" style={{ backgroundColor: 'var(--td-bg-color-component)', color: 'var(--td-text-color-secondary)', border: '1px solid var(--td-component-stroke)' }}>取消</button>
        <button onClick={handleSubmit} disabled={loading} className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>{loading ? '保存中...' : '保存'}</button>
      </div>
    </div>
  );
}
