import { useState, useEffect } from 'react';
import { getWhitelist, addToWhitelist, removeFromWhitelist } from '../lib/data-reporter';
import { RefreshCw, ArrowLeft, UserCheck, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function TeacherDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<string[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [newName, setNewName] = useState('');

  const TEACHER_PASSWORD = 'laura2026';

  const handleLogin = () => {
    if (password === TEACHER_PASSWORD) {
      setAuthed(true);
      setError('');
    } else {
      setError('密码错误');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const data = await getWhitelist();
    setStudents(data.students || []);
    setNames(data.names || {});
    setLoading(false);
  };

  useEffect(() => {
    if (authed) fetchData();
  }, [authed]);

  const handleAdd = async (name: string) => {
    if (!name.trim()) return;
    const id = 'student_' + name.trim().toLowerCase().replace(/\s+/g, '_');
    setActionLoading(id);
    const ok = await addToWhitelist(id, name.trim());
    if (ok) {
      setNewName('');
      await fetchData();
    } else {
      alert('添加失败，请重试');
    }
    setActionLoading('');
  };

  const handleRemove = async (studentId: string) => {
    if (!confirm('确定移除这个学生吗？')) return;
    setActionLoading(studentId);
    const ok = await removeFromWhitelist(studentId);
    if (ok) await fetchData();
    else alert('移除失败');
    setActionLoading('');
  };

  if (!authed) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}>
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl" style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', color: 'white' }}>👨‍🏫</div>
            <h1 className="text-xl font-bold text-gray-900">老师后台</h1>
            <p className="mt-1 text-sm text-gray-500">学生白名单管理</p>
          </div>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()} placeholder="请输入密码"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500" autoFocus />
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          <button onClick={handleLogin}
            className="mt-4 w-full rounded-lg py-3 text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}>
            进入后台
          </button>
          <button onClick={() => navigate('/')}
            className="mt-2 flex w-full items-center justify-center gap-1 text-xs text-gray-400">
            <ArrowLeft size={14} /> 返回应用
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col" style={{ backgroundColor: '#f8fafc' }}>
      {/* 顶部栏 */}
      <div className="flex items-center justify-between px-6 py-4" style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}>
        <div className="flex items-center gap-3">
          <span className="text-xl">👨‍🏫</span>
          <div>
            <h1 className="text-lg font-bold text-white">老师后台</h1>
            <p className="text-xs text-gray-300">白名单管理 · 已批准 {students.length} 人</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} disabled={loading}
            className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> 刷新
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto p-6">
        {/* 添加学生 */}
        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">添加学生到白名单</h2>
          <div className="flex gap-2">
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd(newName)}
              placeholder="输入学生姓名" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500" />
            <button onClick={() => handleAdd(newName)}
              className="flex items-center gap-1 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600">
              <UserCheck size={16} /> 批准
            </button>
          </div>
        </div>

        {/* 已批准列表 */}
        <div className="rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">已批准学生（{students.length}）</h2>
          </div>
          {loading && <div className="py-10 text-center text-gray-400">加载中...</div>}
          {!loading && students.length === 0 && (
            <div className="py-10 text-center text-gray-400">
              <p>暂无已批准学生</p>
              <p className="mt-1 text-sm">在上方输入学生姓名进行批准</p>
            </div>
          )}
          {!loading && students.length > 0 && students.map((id, i) => (
            <div key={i} className="flex items-center justify-between border-b border-gray-50 px-6 py-3 hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-gray-900">{names[id] || id}</span>
              </div>
              <button onClick={() => handleRemove(id)} disabled={actionLoading === id}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600">
                <UserX size={14} /> 移除
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl bg-blue-50 p-4">
          <p className="text-sm text-blue-900">
            💡 <strong>如何使用：</strong>学生首次登录会被拦截。在此输入学生姓名 → 点"批准" → 学生刷新页面后自动进入。已批准的学生后续无需再次审核。
          </p>
        </div>

        <div className="mt-4 text-center">
          <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-gray-600">← 返回应用</button>
        </div>
      </div>
    </div>
  );
}