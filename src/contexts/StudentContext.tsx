import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { studentApi } from '../api';

interface Student {
  id: string;
  name: string;
}

interface StudentContextType {
  student: Student | null;
  loading: boolean;
  login: (name: string) => Promise<void>;
  logout: () => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function StudentProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const current = studentApi.getCurrent();
    if (current) setStudent(current);
    setLoading(false);
  }, []);

  const login = async (name: string) => {
    const s = await studentApi.login(name);
    setStudent(s);
  };

  const logout = () => {
    studentApi.logout();
    setStudent(null);
  };

  return (
    <StudentContext.Provider value={{ student, loading, login, logout }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error('useStudent must be used within StudentProvider');
  return ctx;
}