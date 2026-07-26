import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import '@tdesign-react/chat/es/style/index.js';

import { useTheme } from './hooks/useTheme';
import { useStudent, StudentProvider } from './contexts/StudentContext';

import { AppNav } from './components/AppNav';
import { DashboardPage } from './pages/DashboardPage';
import { StudyPage } from './pages/StudyPage';
import { WordManagePage } from './pages/WordManagePage';
import { AIChatPage } from './pages/AIChatPage';
import { VocabSettings } from './pages/VocabSettings';
import { LoginPage } from './pages/LoginPage';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { APP_CONFIG } from './config';

document.title = APP_CONFIG.name;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  const { student, loading } = useStudent();

  // 老师后台 → 不需要学生登录，独立入口
  if (window.location.hash.includes('#/teacher')) {
    return <TeacherDashboard />;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="text-lg" style={{ color: '#737373' }}>加载中...</div>
      </div>
    );
  }

  // 未登录 → 显示登录页
  if (!student) {
    return <LoginPage />;
  }

  if (isMobile) {
    return (
      <div className="flex h-screen w-screen flex-col" style={{ backgroundColor: 'var(--td-bg-color-page)' }}>
        <AppNav theme={theme} onToggleTheme={toggleTheme} variant="top" studentName={student.name} />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/study" element={<StudyPage />} />
            <Route path="/words" element={<WordManagePage />} />
            <Route path="/chat" element={<AIChatPage />} />
            <Route path="/settings" element={<VocabSettings />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
          </Routes>
        </main>
        <AppNav theme={theme} onToggleTheme={toggleTheme} variant="bottom" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen">
      <AppNav theme={theme} onToggleTheme={toggleTheme} variant="side" studentName={student.name} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="/words" element={<WordManagePage />} />
          <Route path="/chat" element={<AIChatPage />} />
          <Route path="/settings" element={<VocabSettings />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
          </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <StudentProvider>
      <AppContent />
    </StudentProvider>
  );
}

export default App;
