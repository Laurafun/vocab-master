import { useState, useEffect } from 'react';
import { useStudent } from '../contexts/StudentContext';
import { GraduationCap, LogIn, BookOpen, Clock, RefreshCw, XCircle } from 'lucide-react';
import { APP_CONFIG } from '../config';

export function LoginPage() {
  const { login, refreshStatus } = useStudent();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [rejected, setRejected] = useState(false);

  const handleLogin = async () => {
    if (!name.trim()) { setError('请输入你的姓名'); return; }
    setLoading(true); setError('');
    try {
      const { status } = await login(name);
      if (status === 'pending') { setPending(true); }
      else if (status === 'rejected') { setRejected(true); }
    } catch (err: any) {
      setError(err.message || '登录失败，请重试');
    } finally { setLoading(false); }
  };

  // 待审核页面
  if (pending) {
    return <PendingApproval name={name} onRefresh={async () => { await refreshStatus(); }} />;
  }

  // 被拒绝页面
  if (rejected) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
              <XCircle size={32} color="#ef4444" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">账号未通过</h1>
            <p className="mt-2 text-sm text-gray-500">请联系老师获取使用权限</p>
          </div>
          <button onClick={() => { setRejected(false); setName(''); }}
            className="w-full rounded-lg border border-gray-300 py-3 text-sm font-medium text-gray-600">
            返回
          </button>
        </div>
      </div>
    );
  }

  // 登录页面
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
            首次使用需要老师审核通过后才能开始背单词。输入姓名后请等待老师批准。
          </p>
        </div>
      </div>
    </div>
  );
}

// 待审核页面
function PendingApproval({ name, onRefresh }: { name: string; onRefresh: () => Promise<void> }) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 1000);
  };

  // 每 10 秒自动检查一次
  useEffect(() => {
    const timer = setInterval(handleRefresh, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex h-screen items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100">
            <Clock size={32} color="#f59e0b" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">等待老师批准</h1>
          <p className="mt-2 text-sm text-gray-500">
            {name}，你的注册申请已提交
          </p>
        </div>
        <div className="rounded-lg bg-orange-50 p-4 text-center">
          <p className="text-sm text-gray-600">
            老师批准后，此页面会自动刷新
          </p>
          <p className="mt-2 text-xs text-gray-400">
            正在等待审核... 请保持页面打开
          </p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-orange-300 py-3 text-sm font-medium text-orange-600 hover:bg-orange-50">
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? '检查中...' : '手动刷新状态'}
        </button>
        <div className="mt-4 flex items-center gap-1 justify-center">
          <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-xs text-gray-400">每 10 秒自动检查</span>
        </div>
      </div>
    </div>
  );
}
