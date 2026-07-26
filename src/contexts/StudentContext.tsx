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
const STATUS_TIME_KEY = 'vocab_student_status_time';

export function StudentProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const current = studentApi.getCurrent();
    if (!current) { setLoading(false); return; }

    const localStatus = localStorage.getItem(STATUS_KEY);

    // 被拒绝 → 直接退出
    if (localStatus === 'rejected') {
      studentApi.logout();
      setStudent(null);
      setLoading(false);
      return;
    }

    // 已批准（本地缓存）→ 先放行，再异步验证
    if (localStatus === 'approved') {
      setStudent({ ...current, status: 'approved' });
      setLoading(false);
      // 异步验证
      checkStudentStatus(current.id).then(status => {
        if (status === 'rejected') {
          studentApi.logout();
          localStorage.removeItem(STATUS_KEY);
          setStudent(null);
        }
      }).catch(() => {});
      return;
    }

    // pending 或无状态 → 显示 pending，异步检查
    setStudent({ ...current, status: 'pending' });
    setLoading(false);

    checkStudentStatus(current.id).then(status => {
      if (status === 'approved') {
        localStorage.setItem(STATUS_KEY, 'approved');
        setStudent({ ...current, status: 'approved' });
      } else if (status === 'rejected') {
        studentApi.logout();
        localStorage.setItem(STATUS_KEY, 'rejected');
        setStudent(null);
      } else if (status === 'pending') {
        setStudent({ ...current, status: 'pending' });
      }
      // unknown → 保持 pending（不放行！）
    }).catch(() => {
      // 网络错误 → 保持 pending（不放行！）
    });
  }, []);

  const login = async (name: string) => {
    const s = await studentApi.login(name);
    // 先设为 pending
    localStorage.setItem(STATUS_KEY, 'pending');
    setStudent({ ...s, status: 'pending' });

    try {
      const status = await registerStudent(s.id, s.name);
      if (status === 'approved') {
        localStorage.setItem(STATUS_KEY, 'approved');
        setStudent({ ...s, status: 'approved' });
      }
      return { status };
    } catch {
      // 网络错误 → 保持 pending
      return { status: 'pending' as const };
    }
  };

  const refreshStatus = async () => {
    if (!student) return;
    try {
      const status = await checkStudentStatus(student.id);
      if (status === 'approved') {
        localStorage.setItem(STATUS_KEY, 'approved');
        setStudent({ ...student, status: 'approved' });
      } else if (status === 'rejected') {
        studentApi.logout();
        localStorage.setItem(STATUS_KEY, 'rejected');
        setStudent(null);
      }
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
