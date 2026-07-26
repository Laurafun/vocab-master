import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { studentApi } from '../api';
import { registerStudent, checkStudentStatus } from '../lib/data-reporter';

interface Student {
  id: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface StudentContextType {
  student: Student | null;
  loading: boolean;
  login: (name: string) => Promise<{ status: 'pending' | 'approved' | 'rejected' }>;
  logout: () => void;
  refreshStatus: () => Promise<void>;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

const STATUS_KEY = 'vocab_student_status';

function getLocalStatus(): string | null {
  try { return localStorage.getItem(STATUS_KEY); } catch { return null; }
}

function setLocalStatus(status: string) {
  try { localStorage.setItem(STATUS_KEY, status); } catch {}
}

export function StudentProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const current = studentApi.getCurrent();
    if (!current) { setLoading(false); return; }

    // 先读本地状态（立即响应，不等网络）
    const localStatus = getLocalStatus();

    // 如果本地是 pending，先显示 pending，然后异步检查云端
    if (localStatus === 'rejected') {
      studentApi.logout();
      setStudent(null);
      setLoading(false);
      return;
    }

    // 先用本地状态显示（pending 或 approved）
    setStudent({ ...current, status: (localStatus as any) || 'pending' });
    setLoading(false);

    // 异步检查云端最新状态
    checkStudentStatus(current.id).then(status => {
      if (status === 'rejected') {
        studentApi.logout();
        setLocalStatus('rejected');
        setStudent(null);
      } else if (status === 'approved') {
        setLocalStatus('approved');
        setStudent({ ...current, status: 'approved' });
      } else if (status === 'pending') {
        setLocalStatus('pending');
        setStudent({ ...current, status: 'pending' });
      }
      // status === 'unknown' → 保持本地状态不变（不自动批准！）
    }).catch(() => {
      // 网络错误 → 保持本地状态，不自动批准
    });
  }, []);

  const login = async (name: string) => {
    const s = await studentApi.login(name);
    // 先设为 pending（本地）
    setLocalStatus('pending');
    setStudent({ ...s, status: 'pending' });

    // 异步注册到云端
    try {
      const status = await registerStudent(s.id, s.name);
      if (status === 'approved') {
        // 老学生直接通过
        setLocalStatus('approved');
        setStudent({ ...s, status: 'approved' });
      } else {
        // 新学生保持 pending
        setLocalStatus('pending');
        setStudent({ ...s, status: 'pending' });
      }
      return { status };
    } catch {
      // 网络错误 → 保持 pending（不自动批准）
      return { status: 'pending' as const };
    }
  };

  const refreshStatus = async () => {
    if (!student) return;
    try {
      const status = await checkStudentStatus(student.id);
      if (status === 'approved') {
        setLocalStatus('approved');
        setStudent({ ...student, status: 'approved' });
      } else if (status === 'rejected') {
        studentApi.logout();
        setLocalStatus('rejected');
        setStudent(null);
      }
      // pending 或 unknown → 保持当前状态
    } catch {
      // 网络错误 → 不变
    }
  };

  const logout = () => {
    studentApi.logout();
    localStorage.removeItem(STATUS_KEY);
    setStudent(null);
  };

  return (
    <StudentContext.Provider value={{ student, loading, login, logout, refreshStatus }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error('useStudent must be used within StudentProvider');
  return ctx;
}
