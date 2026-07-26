import { useState } from 'react';
import { useStudent } from '../contexts/StudentContext';
import { GraduationCap, LogIn, BookOpen } from 'lucide-react';
import { APP_CONFIG } from '../config';

export function LoginPage() {
  const { login } = useStudent();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!name.trim()) { setError('请输入你的姓名'); return; }
    setLoading(true); setError('');
    try {
      await login(name);
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally { setLoading(false); }
  };

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
            输入姓名即可使用。系统每天安排 20 个单词，按记忆曲线自动安排复习。进度自动保存在你的手机里。
          </p>
        </div>
      </div>
    </div>
  );
}