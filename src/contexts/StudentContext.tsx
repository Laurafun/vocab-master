import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { studentApi } from '../api';
import { checkStudentInWhitelist } from '../lib/data-reporter';

interface Student {
  id: string;
  name: string;
  status: 'pending' | 'approved';
}

interface StudentContextType {
  student: Student | null;
  loading: boolean;
  login: (name: string) => Promise<'pending' | 'approved'>;
  logout: () => void;
  refreshStatus: () => Promise<void>;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function StudentProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  // 首次加载：检查已登录学生是否在白名单
  useEffect(() => {
    const current = studentApi.getCurrent();
    if (!current) { setLoading(false); return; }

    checkStudentInWhitelist(current.id).then(approved => {
      if (approved) {
        setStudent({ ...current, status: 'approved' });
      } else {
        // 不在白名单 → 保持 pending
        setStudent({ ...current, status: 'pending' });
      }
      setLoading(false);
    }).catch(() => {
      setStudent({ ...current, status: 'pending' });
      setLoading(false);
    });
  }, []);

  const login = async (name: string) => {
    const s = await studentApi.login(name);
    // 检查白名单
    const approved = await checkStudentInWhitelist(s.id);
    const status = approved ? 'approved' : 'pending';
    setStudent({ ...s, status });
    return status;
  };

  const refreshStatus = useCallback(async () => {
    if (!student) return;
    const approved = await checkStudentInWhitelist(student.id);
    if (approved && student.status === 'pending') {
      setStudent({ ...student, status: 'approved' });
    }
  }, [student]);

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