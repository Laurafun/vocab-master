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

export function StudentProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const current = studentApi.getCurrent();
    if (current) {
      // 检查审核状态
      checkStudentStatus(current.id).then(status => {
        if (status === 'rejected') {
          // 被拒绝 → 清除登录
          studentApi.logout();
          setStudent(null);
        } else {
          setStudent({ ...current, status: status === 'unknown' ? 'approved' : status });
        }
        setLoading(false);
      }).catch(() => {
        // 网络错误 → 允许使用（离线模式）
        setStudent({ ...current, status: 'approved' });
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (name: string) => {
    const s = await studentApi.login(name);
    // 注册到云端，获取审核状态
    const status = await registerStudent(s.id, s.name);
    setStudent({ ...s, status });
    return { status };
  };

  const refreshStatus = async () => {
    if (!student) return;
    const status = await checkStudentStatus(student.id);
    if (status === 'approved') {
      setStudent({ ...student, status: 'approved' });
    } else if (status === 'rejected') {
      studentApi.logout();
      setStudent(null);
    }
  };

  const logout = () => {
    studentApi.logout();
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
