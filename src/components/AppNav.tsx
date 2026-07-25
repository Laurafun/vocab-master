import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Library, Bot, Settings, BookMarked, LogOut, User } from 'lucide-react';
import { APP_CONFIG } from '../config';
import { useStudent } from '../contexts/StudentContext';

interface AppNavProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  variant: 'top' | 'bottom' | 'side';
  studentName?: string;
}

const navItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/study', label: '背单词', icon: BookOpen },
  { path: '/words', label: '单词库', icon: Library },
  { path: '/chat', label: 'AI', icon: Bot },
  { path: '/settings', label: '设置', icon: Settings },
];

export function AppNav({ theme, onToggleTheme, variant, studentName }: AppNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useStudent();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // 移动端顶部栏
  if (variant === 'top') {
    return (
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ backgroundColor: 'var(--td-bg-color-container)', borderBottom: '1px solid var(--td-component-stroke)' }}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
            {APP_CONFIG.nameInitial}
          </div>
          <span className="text-base font-semibold" style={{ color: 'var(--td-text-color-primary)' }}>{APP_CONFIG.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {studentName && (
            <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--td-text-color-secondary)' }}>
              <User size={14} />{studentName}
            </span>
          )}
          <button onClick={onToggleTheme} className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--td-bg-color-component)' }}>
            <BookMarked size={16} color="var(--td-text-color-secondary)" />
          </button>
          <button onClick={logout} className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--td-bg-color-component)' }}>
            <LogOut size={16} color="var(--td-text-color-secondary)" />
          </button>
        </div>
      </div>
    );
  }

  // 移动端底部导航栏
  if (variant === 'bottom') {
    return (
      <nav
        className="flex flex-shrink-0 items-center justify-around"
        style={{ backgroundColor: 'var(--td-bg-color-container)', borderTop: '1px solid var(--td-component-stroke)', paddingBottom: 'env(safe-area-inset-bottom)', height: '56px' }}
      >
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <button key={item.path} onClick={() => navigate(item.path)} className="flex flex-1 flex-col items-center justify-center gap-0.5" style={{ color: active ? 'var(--td-brand-color)' : 'var(--td-text-color-secondary)' }}>
              <Icon size={20} />
              <span style={{ fontSize: '10px' }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  // 桌面端左侧导航栏
  return (
    <nav className="flex h-full w-60 flex-col border-r flex-shrink-0" style={{ backgroundColor: 'var(--td-bg-color-container)', borderColor: 'var(--td-component-stroke)' }}>
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid var(--td-component-stroke)' }}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
          {APP_CONFIG.nameInitial}
        </div>
        <div>
          <div className="text-base font-semibold" style={{ color: 'var(--td-text-color-primary)' }}>{APP_CONFIG.name}</div>
          <div className="text-xs" style={{ color: 'var(--td-text-color-secondary)' }}>{APP_CONFIG.description}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <button key={item.path} onClick={() => navigate(item.path)} className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all" style={{ backgroundColor: active ? 'var(--td-brand-color-light)' : 'transparent', color: active ? 'var(--td-brand-color)' : 'var(--td-text-color-secondary)' }}>
              <Icon size={18} />{item.label}
            </button>
          );
        })}
      </div>

      <div className="px-3 py-3" style={{ borderTop: '1px solid var(--td-component-stroke)' }}>
        {studentName && (
          <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--td-bg-color-component)' }}>
            <User size={16} color="var(--td-brand-color)" />
            <span className="text-sm font-medium" style={{ color: 'var(--td-text-color-primary)' }}>{studentName}</span>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onToggleTheme} className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium" style={{ color: 'var(--td-text-color-secondary)' }}>
            <BookMarked size={16} />
          </button>
          <button onClick={logout} className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium" style={{ color: '#ef4444' }}>
            <LogOut size={16} />退出
          </button>
        </div>
      </div>
    </nav>
  );
}
