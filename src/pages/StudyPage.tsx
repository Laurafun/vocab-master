import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, Check, X, RotateCcw, Trophy, ChevronRight, Brain } from 'lucide-react';
import { studyApi } from '../api';
import type { Word } from '../types';
import { useStudent } from '../contexts/StudentContext';

const BOX_COLORS = ['#e34c4c', '#e8810c', '#e8b50c', '#7bc043', '#3aa655', '#2196a8', '#4a90d9'];
const BOX_DESCRIPTIONS = ['新单词', '1天后复习', '2天后复习', '4天后复习', '7天后复习', '15天后复习', '已掌握'];

export function StudyPage() {
  const navigate = useNavigate();
  const { student } = useStudent();
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0, total: 0 });
  const [wrongWords, setWrongWords] = useState<Word[]>([]);
  const [dailyLimit, setDailyLimit] = useState(20);
  const [reviewingWrong, setReviewingWrong] = useState(false);

  const fetchWords = useCallback(async () => {
    if (!student) return;
    try {
      setLoading(true);
      const data = await studyApi.getToday(student.id);
      setWords(data.words);
      setDailyLimit(data.dailyLimit);
      setCurrentIndex(0);
      setFlipped(false);
      setCompleted(false);
      setSessionStats({ correct: 0, wrong: 0, total: 0 });
      setWrongWords([]);
      setReviewingWrong(false);
    } catch (err) {
      console.error('Failed to fetch words:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  // 朗读单词
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleReview = async (result: 'correct' | 'wrong') => {
    const currentWord = words[currentIndex];
    if (!currentWord) return;

    try {
      await studyApi.review(student!.id, currentWord.id, result);

      setSessionStats((prev) => ({
        correct: prev.correct + (result === 'correct' ? 1 : 0),
        wrong: prev.wrong + (result === 'wrong' ? 1 : 0),
        total: prev.total + 1,
      }));

      if (result === 'wrong') {
        setWrongWords((prev) => [...prev, currentWord]);
      }

      // 下一题
      if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setFlipped(false);
      } else {
        // 本轮完成
        if (!reviewingWrong && wrongWords.length + (result === 'wrong' ? 1 : 0) > 0) {
          // 有错误单词，进入错题重练
          const finalWrong = result === 'wrong' ? [...wrongWords, currentWord] : wrongWords;
          if (finalWrong.length > 0) {
            setWords(finalWrong);
            setCurrentIndex(0);
            setFlipped(false);
            setReviewingWrong(true);
            setWrongWords([]);
            return;
          }
        }
        setCompleted(true);
      }
    } catch (err) {
      console.error('Review failed:', err);
      // 即使 API 失败也继续
      if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setFlipped(false);
      } else {
        setCompleted(true);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg" style={{ color: 'var(--td-text-color-secondary)' }}>加载今日单词...</div>
      </div>
    );
  }

  // 完成页面
  if (completed) {
    const accuracy = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;
    return (
      <div className="flex h-full items-center justify-center p-6" style={{ backgroundColor: 'var(--td-bg-color-page)' }}>
        <div
          className="w-full max-w-md rounded-2xl border p-8 text-center"
          style={{ backgroundColor: 'var(--td-bg-color-container)', borderColor: 'var(--td-component-stroke)' }}
        >
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: accuracy >= 80 ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)' }}
          >
            <Trophy size={32} color={accuracy >= 80 ? '#22c55e' : '#f59e0b'} />
          </div>
          <h2 className="mb-2 text-xl font-bold" style={{ color: 'var(--td-text-color-primary)' }}>
            {reviewingWrong ? '错题重练完成！' : '今日学习完成！'}
          </h2>
          <p className="mb-6 text-sm" style={{ color: 'var(--td-text-color-secondary)' }}>
            {reviewingWrong ? '你已经复习了所有错题' : '继续保持，记忆会越来越牢固'}
          </p>

          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--td-bg-color-component)' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--td-text-color-primary)' }}>{sessionStats.total}</div>
              <div className="text-xs" style={{ color: 'var(--td-text-color-secondary)' }}>总复习</div>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}>
              <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>{sessionStats.correct}</div>
              <div className="text-xs" style={{ color: 'var(--td-text-color-secondary)' }}>正确</div>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
              <div className="text-2xl font-bold" style={{ color: '#ef4444' }}>{sessionStats.wrong}</div>
              <div className="text-xs" style={{ color: 'var(--td-text-color-secondary)' }}>错误</div>
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span style={{ color: 'var(--td-text-color-secondary)' }}>正确率</span>
              <span className="font-bold" style={{ color: 'var(--td-text-color-primary)' }}>{accuracy}%</span>
            </div>
            <div className="h-2 w-full rounded-full" style={{ backgroundColor: 'var(--td-bg-color-component)' }}>
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${accuracy}%`,
                  background: accuracy >= 80 ? 'linear-gradient(90deg, #22c55e, #16a34a)' : 'linear-gradient(90deg, #f59e0b, #d97706)',
                }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={fetchWords}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all"
              style={{
                backgroundColor: 'var(--td-bg-color-component)',
                color: 'var(--td-text-color-primary)',
                border: '1px solid var(--td-component-stroke)',
              }}
            >
              <RotateCcw size={16} />
              再来一轮
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
            >
              返回仪表盘
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 没有单词
  if (words.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6" style={{ backgroundColor: 'var(--td-bg-color-page)' }}>
        <div className="text-center">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}
          >
            <Brain size={32} color="#3b82f6" />
          </div>
          <h2 className="mb-2 text-xl font-bold" style={{ color: 'var(--td-text-color-primary)' }}>今日单词已全部完成</h2>
          <p className="mb-6 text-sm" style={{ color: 'var(--td-text-color-secondary)' }}>
            所有到期单词已复习完毕，去添加更多单词吧！
          </p>
          <button
            onClick={() => navigate('/words')}
            className="rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
          >
            添加单词
          </button>
        </div>
      </div>
    );
  }

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: 'var(--td-bg-color-page)' }}>
      {/* 顶部进度条 */}
      <div className="border-b px-6 py-4" style={{ borderColor: 'var(--td-component-stroke)', backgroundColor: 'var(--td-bg-color-container)' }}>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--td-text-color-primary)' }}>
            {reviewingWrong && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
              >
                错题重练
              </span>
            )}
            {currentIndex + 1} / {words.length}
          </div>
          <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--td-text-color-secondary)' }}>
            <span className="flex items-center gap-1">
              <Check size={14} color="#22c55e" /> {sessionStats.correct}
            </span>
            <span className="flex items-center gap-1">
              <X size={14} color="#ef4444" /> {sessionStats.wrong}
            </span>
          </div>
        </div>
        <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: 'var(--td-bg-color-component)' }}>
          <div
            className="h-1.5 rounded-full transition-all"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #3b82f6, #6366f1)' }}
          />
        </div>
      </div>

      {/* 单词卡片 */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* 卡片 */}
          <div
            className="relative min-h-[320px] cursor-pointer rounded-2xl border-2 p-8 transition-all"
            style={{
              backgroundColor: 'var(--td-bg-color-container)',
              borderColor: flipped ? BOX_COLORS[currentWord.box_level] : 'var(--td-component-stroke)',
              boxShadow: flipped ? `0 0 0 3px ${BOX_COLORS[currentWord.box_level]}33` : 'var(--td-shadow-2)',
            }}
            onClick={() => setFlipped(!flipped)}
          >
            {/* 等级标签 */}
            <div className="absolute right-4 top-4 flex items-center gap-2">
              <div
                className="rounded-full px-3 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: BOX_COLORS[Math.min(currentWord.box_level, 6)] }}
              >
                {BOX_DESCRIPTIONS[Math.min(currentWord.box_level, 6)]}
              </div>
            </div>

            {!flipped ? (
              // 正面：单词
              <div className="flex flex-col items-center justify-center py-8">
                <button
                  onClick={(e) => { e.stopPropagation(); speak(currentWord.word); }}
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110"
                  style={{ backgroundColor: 'var(--td-brand-color-light)' }}
                >
                  <Volume2 size={20} color="var(--td-brand-color)" />
                </button>
                <h2 className="mb-3 text-4xl font-bold tracking-wide" style={{ color: 'var(--td-text-color-primary)' }}>
                  {currentWord.word}
                </h2>
                {currentWord.phonetic && (
                  <p className="text-base" style={{ color: 'var(--td-text-color-secondary)', fontStyle: 'italic' }}>
                    /{currentWord.phonetic}/
                  </p>
                )}
                <p className="mt-8 text-sm" style={{ color: 'var(--td-text-color-placeholder)' }}>
                  点击卡片查看释义
                </p>
              </div>
            ) : (
              // 背面：释义
              <div className="py-4">
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-3xl font-bold" style={{ color: 'var(--td-text-color-primary)' }}>
                    {currentWord.word}
                  </h2>
                  <button
                    onClick={(e) => { e.stopPropagation(); speak(currentWord.word); }}
                    className="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-110"
                    style={{ backgroundColor: 'var(--td-brand-color-light)' }}
                  >
                    <Volume2 size={16} color="var(--td-brand-color)" />
                  </button>
                  {currentWord.phonetic && (
                    <span className="text-sm" style={{ color: 'var(--td-text-color-secondary)', fontStyle: 'italic' }}>
                      /{currentWord.phonetic}/
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--td-text-color-secondary)' }}>
                    释义
                  </div>
                  <p className="text-lg" style={{ color: 'var(--td-text-color-primary)' }}>
                    {currentWord.definition}
                  </p>
                </div>

                {currentWord.example && (
                  <div className="mb-4 rounded-lg p-3" style={{ backgroundColor: 'var(--td-bg-color-component)' }}>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--td-text-color-secondary)' }}>
                      例句
                    </div>
                    <p className="text-base italic" style={{ color: 'var(--td-text-color-primary)' }}>
                      "{currentWord.example}"
                    </p>
                    {currentWord.example_translation && (
                      <p className="mt-1 text-sm" style={{ color: 'var(--td-text-color-secondary)' }}>
                        {currentWord.example_translation}
                      </p>
                    )}
                  </div>
                )}

                {currentWord.tags && (
                  <div className="flex flex-wrap gap-2">
                    {currentWord.tags.split(',').map((tag, i) => (
                      <span
                        key={i}
                        className="rounded-full px-2.5 py-0.5 text-xs"
                        style={{ backgroundColor: 'var(--td-brand-color-light)', color: 'var(--td-brand-color)' }}
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          {flipped ? (
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => handleReview('wrong')}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-4 text-base font-semibold transition-all hover:scale-[1.02]"
                style={{
                  backgroundColor: 'rgba(239,68,68,0.1)',
                  color: '#ef4444',
                  border: '2px solid rgba(239,68,68,0.3)',
                }}
              >
                <X size={20} />
                不记得
              </button>
              <button
                onClick={() => handleReview('correct')}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-4 text-base font-semibold text-white transition-all hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                }}
              >
                <Check size={20} />
                记得
              </button>
            </div>
          ) : (
            <div className="mt-6 text-center">
              <p className="text-sm" style={{ color: 'var(--td-text-color-placeholder)' }}>
                先想一想这个词的意思，然后点击卡片翻转
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
