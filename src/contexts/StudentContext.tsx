import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

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

const STORAGE_KEY = 'vocab_student';

export function StudentProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从 localStorage 恢复登录状态
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setStudent(JSON.parse(saved));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('请输入姓名');

    // 查找或创建学生
    const { data: existing } = await supabase
      .from('students')
      .select('id, name')
      .eq('name', trimmed)
      .maybeSingle();

    if (existing) {
      const s = { id: existing.id, name: existing.name };
      setStudent(s);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      return;
    }

    const { data: created, error } = await supabase
      .from('students')
      .insert({ name: trimmed })
      .select('id, name')
      .single();

    if (error) throw error;
    const s = { id: created.id, name: created.name };
    setStudent(s);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));

    // 创建默认设置
    await supabase.from('student_settings').insert({ student_id: s.id }).eq('student_id', s.id);
  };

  const logout = () => {
    setStudent(null);
    localStorage.removeItem(STORAGE_KEY);
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
