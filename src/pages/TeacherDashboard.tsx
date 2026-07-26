import { useState, useEffect } from 'react';
import { getAllStudents, approveStudent, rejectStudent } from '../lib/data-reporter';
import { Users, TrendingUp, CheckCircle2, Clock, RefreshCw, ArrowLeft, UserCheck, UserX, Hourglass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function TeacherDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // 简单密码保护
  const TEACHER_PASSWORD = 'laura2026';

  const handleLogin = () => {
    if (password === TEACHER_PASSWORD) {
      setAuthed(true);
      setError('');
      localStorage.setItem('vocab_teacher', '1');
    } else {
      setError('密码错误');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAllStudents();
      setStudents(data);
    } catch (e) {
      console.error('Failed to fetch students:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('vocab_teacher') === '1') {
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (authed) fetchData();
  }, [authed]);

  // 登录页
  if (!authed) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}>
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl" style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', color: 'white' }}>
              👨‍🏫
            </div>
            <h1 className="text-xl font-bold text-gray-900">老师后台</h1>
            <p className="mt-1 text-sm text-gray-500">输入密码查看学生进度</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="请输入密码"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
            autoFocus
          />
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          <button
            onClick={handleLogin}
            className="mt-4 w-full rounded-lg py-3 text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}
          >
            进入后台
          </button>
          <button
            onClick={() => navigate('/')}
            className="mt-2 flex w-full items-center justify-center gap-1 text-xs text-gray-400"
          >
            <ArrowLeft size={14} /> 返回应用
          </button>
          <p className="mt-4 text-center text-xs text-gray-400">默认密码: laura2026</p>
        </div>
      </div>
    );
  }

  // 统计
  const totalStudents = students.length;
  const pendingStudents = students.filter(s => s.status === 'pending');
  const approvedStudents = students.filter(s => s.status === 'approved');
  const rejectedStudents = students.filter(s => s.status === 'rejected');
  const todayActive = approvedStudents.filter(s => {
    const last = new Date(s.lastActive);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return last >= today;
  }).length;
  const totalMastered = approvedStudents.reduce((sum, s) => sum + (s.mastered || 0), 0);
  const totalReviews = approvedStudents.reduce((sum, s) => sum + (s.todayStats?.total || 0), 0);

  const handleApprove = async (studentId: string) => {
    await approveStudent(studentId);
    fetchData();
  };

  const handleReject = async (studentId: string) => {
    if (confirm('确定要拒绝这个学生吗？')) {
      await rejectStudent(studentId);
      fetchData();
    }
  };

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: '#f8fafc' }}>
      {/* 顶部栏 */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4" style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}>
        <div className="flex items-center gap-3">
          <span className="text-xl">👨‍🏫</span>
          <div>
            <h1 className="text-lg font-bold text-white">老师后台</h1>
            <p className="text-xs text-gray-300">单词背诵大师 - 学生进度管理</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} disabled={loading} className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> 刷新
          </button>
          <button onClick={() => { localStorage.removeItem('vocab_teacher'); setAuthed(false); }} className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20">
            退出
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl p-6">
        {/* 统计卡片 */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard icon={<Users size={20} />} label="学生总数" value={totalStudents} color="#3b82f6" />
          <StatCard icon={<Hourglass size={20} />} label="待审核" value={pendingStudents.length} color="#f59e0b" />
          <StatCard icon={<Clock size={20} />} label="今日活跃" value={todayActive} color="#10b981" />
          <StatCard icon={<CheckCircle2 size={20} />} label="已掌握单词" value={totalMastered} color="#8b5cf6" />
        </div>

        {/* 待审核区域 */}
        {pendingStudents.length > 0 && (
          <div className="mb-6 rounded-xl border-2 border-orange-200 bg-orange-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Hourglass size={18} color="#f59e0b" />
              <h2 className="text-base font-semibold text-orange-900">待审核学生（{pendingStudents.length}）</h2>
            </div>
            <div className="space-y-2">
              {pendingStudents.map((s, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{s.name}</span>
                    <span className="ml-2 text-xs text-gray-400">{new Date(s.createdAt).toLocaleString('zh-CN')}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(s.studentId)}
                      className="flex items-center gap-1 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600">
                      <UserCheck size={14} /> 批准
                    </button>
                    <button onClick={() => handleReject(s.studentId)}
                      className="flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600">
                      <UserX size={14} /> 拒绝
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 学生列表 */}
        <div className="rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">学生进度明细</h2>
          </div>

          {loading ? (
            <div className="py-20 text-center text-gray-400">加载中...</div>
          ) : students.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <p className="text-lg">暂无学生数据</p>
              <p className="mt-2 text-sm">学生开始背单词后，数据会自动显示在这里</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                    <th className="px-6 py-3 font-medium">姓名</th>
                    <th className="px-6 py-3 text-center font-medium">已学</th>
                    <th className="px-6 py-3 text-center font-medium">学习中</th>
                    <th className="px-6 py-3 text-center font-medium">已掌握</th>
                    <th className="px-6 py-3 text-center font-medium">今日</th>
                    <th className="px-6 py-3 text-center font-medium">连续</th>
                    <th className="px-6 py-3 text-right font-medium">最后活跃</th>
                  </tr>
                </thead>
                <tbody>
                  {students.filter(s => s.status !== 'rejected').map((s, i) => {
                    const isActive = (() => {
                      const last = new Date(s.lastActive);
                      const today = new Date(); today.setHours(0, 0, 0, 0);
                      return last >= today;
                    })();
                    return (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${s.status === 'pending' ? 'bg-orange-400' : isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className="text-sm font-medium text-gray-900">{s.name}</span>
                            {s.status === 'pending' && <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded">待审核</span>}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-center text-sm text-gray-600">{(s.newWords || 0) + (s.learning || 0) + (s.mastered || 0)}</td>
                        <td className="px-6 py-3 text-center text-sm text-gray-600">{s.learning || 0}</td>
                        <td className="px-6 py-3 text-center">
                          <span className="text-sm font-medium" style={{ color: '#f59e0b' }}>{s.mastered || 0}</span>
                        </td>
                        <td className="px-6 py-3 text-center text-sm text-gray-600">
                          {s.todayStats?.total || 0} 次
                          {s.todayStats?.total > 0 && (
                            <span className="ml-1 text-xs text-gray-400">
                              (对{s.todayStats?.correct || 0} 错{s.todayStats?.wrong || 0})
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className="text-sm" style={{ color: (s.streak || 0) > 0 ? '#ef4444' : '#ccc' }}>
                            {(s.streak || 0) > 0 ? `🔥${s.streak}天` : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right text-xs text-gray-400">
                          {formatTime(s.lastActive)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 说明 */}
        <div className="mt-6 rounded-xl bg-blue-50 p-4">
          <p className="text-sm text-blue-900">
            💡 <strong>数据说明：</strong>学生每次复习后自动上报进度。数据每 30 秒最多更新一次，避免频繁请求。如果学生离线，数据会在下次打开应用时补传。
          </p>
        </div>

        <div className="mt-4 text-center">
          <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-gray-600">
            ← 返回应用
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: color + '20', color }}>
          {icon}
        </div>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function formatTime(iso: string): string {
  if (!iso) return '从未';
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
  if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
  if (diff < 604800) return Math.floor(diff / 86400) + '天前';
  return d.toLocaleDateString('zh-CN');
}
