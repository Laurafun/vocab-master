import { useState, useEffect } from 'react';
import { useStudent } from '../contexts/StudentContext';
import { GraduationCap, LogIn, BookOpen, Clock, RefreshCw } from 'lucide-react';
import { APP_CONFIG } from '../config';

export function LoginPage() {
  const { login, refreshStatus } = useStudent();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [pendingName, setPendingName] = useState('');

  const handleLogin = async () => {
    if (!name.trim()) { setError('请输入你的姓名'); return; }
    setLoading(true); setError('');
    try {
      const status = await login(name);
      if (status === 'pending') {
        setPending(true);
        setPendingName(name.trim());
      }
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally { setLoading(false); }
  };

  // 待审核页面 → 每 10 秒自动检查
  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(() => refreshStatus(), 10000);
    return () => clearInterval(timer);
  }, [pending, refreshStatus]);

  // 待审核
  if (pending) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100">
              <Clock size={32} color="#f59e0b" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">等待老师批准</h1>
            <p className="mt-2 text-sm text-gray-500">{pendingName}，请等待老师审核</p>
          </div>
          <div className="rounded-lg bg-orange-50 p-4 text-center">
            <p className="text-sm text-gray-600">老师批准后会自动进入</p>
            <p className="mt-1 text-xs text-gray-400">每 10 秒自动检查 · 请保持页面打开</p>
          </div>
          <button onClick={() => refreshStatus()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-orange-300 py-3 text-sm font-medium text-orange-600 hover:bg-orange-50">
            <RefreshCw size={16} />手动检查
          </button>
          <button onClick={() => { setPending(false); setName(''); }}
            className="mt-2 w-full text-xs text-gray-400">返回重新输入</button>
        </div>
      </div>
    );
  }

  // 登录页
  return (
    <div className="flex h-screen w-screen items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
            {APP_CONFIG.nameInitial}
          </div>
          <h1 className="text-xl font-bold text-gray-900">{APP_CONFIG.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{APP_CONFIG.description}</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg px-3 bg-gray-50 border border-gray-200">
            <GraduationCap size={20} color="#9ca3af" />
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="输入你的姓名" className="flex-1 bg-transparent py-3 text-sm outline-none text-gray-900"
              autoFocus maxLength={20} />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button onClick={handleLogin} disabled={loading || !name.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
            <LogIn size={18} />{loading ? '登录中...' : '开始背单词'}
          </button>
        </div>
        <div className="mt-6 flex items-start gap-2 rounded-lg p-3 bg-blue-50">
          <BookOpen size={16} color="#3b82f6" className="mt-0.5 flex-shrink-0" />
          <p className="text-xs leading-relaxed text-gray-600">
            首次使用需老师审核通过后才能开始背单词。已审核过的学生可直接进入。
          </p>
        </div>
      </div>
    </div>
  );
}