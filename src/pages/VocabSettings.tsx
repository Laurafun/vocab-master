import { useState, useEffect, useCallback } from 'react';
import { Save, Sliders, Info, LogOut } from 'lucide-react';
import { settingsApi } from '../api';
import type { AppSettings } from '../types';
import { useStudent } from '../contexts/StudentContext';

export function VocabSettings() {
  const { student, logout } = useStudent();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!student) return;
    try {
      const s = await settingsApi.get(student.id);
      setSettings(s);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  }, [student]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    if (!settings || !student) return;
    setSaving(true);
    try {
      await settingsApi.update(student.id, settings);
      alert('设置已保存');
    } catch (err: any) {
      alert(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="flex h-full items-center justify-center"><div className="text-lg" style={{ color: '#737373' }}>加载中...</div></div>;
  }

  return (
    <div className="h-full overflow-y-auto p-6" style={{ backgroundColor: 'var(--td-bg-color-page)' }}>
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold" style={{ color: 'var(--td-text-color-primary)' }}>设置</h1>

        {/* 学习设置 */}
        <div className="mb-6 rounded-xl border p-5" style={{ backgroundColor: 'var(--td-bg-color-container)', borderColor: 'var(--td-component-stroke)' }}>
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold" style={{ color: 'var(--td-text-color-primary)' }}>
            <Sliders size={18} />学习设置
          </h2>
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium" style={{ color: 'var(--td-text-color-primary)' }}>每日单词数</label>
              <span className="text-lg font-bold" style={{ color: 'var(--td-brand-color)' }}>{settings.daily_limit}</span>
            </div>
            <input type="range" min={10} max={60} step={5} value={settings.daily_limit}
              onChange={(e) => setSettings({ ...settings, daily_limit: parseInt(e.target.value) })}
              className="w-full" style={{ accentColor: 'var(--td-brand-color)' }} />
            <div className="mt-1 flex justify-between text-xs" style={{ color: 'var(--td-text-color-secondary)' }}>
              <span>10</span><span>30</span><span>60</span>
            </div>
            <p className="mt-2 text-xs" style={{ color: 'var(--td-text-color-secondary)' }}>每天学习的单词数量，系统会根据记忆曲线自动安排复习</p>
          </div>
          <div className="space-y-3">
            <ToggleRow label="显示音标" description="在单词卡片上显示音标" checked={settings.show_phonetic} onChange={(v) => setSettings({ ...settings, show_phonetic: v })} />
            <ToggleRow label="显示例句" description="在单词卡片上显示例句和翻译" checked={settings.show_example} onChange={(v) => setSettings({ ...settings, show_example: v })} />
            <ToggleRow label="自动播放发音" description="翻到新单词时自动播放发音" checked={settings.auto_play_audio} onChange={(v) => setSettings({ ...settings, auto_play_audio: v })} />
          </div>
          <button onClick={handleSave} disabled={saving}
            className="mt-5 flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
            <Save size={16} />{saving ? '保存中...' : '保存设置'}
          </button>
        </div>

        {/* 账号信息 */}
        <div className="mb-6 rounded-xl border p-5" style={{ backgroundColor: 'var(--td-bg-color-container)', borderColor: 'var(--td-component-stroke)' }}>
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold" style={{ color: 'var(--td-text-color-primary)' }}>
            <Info size={18} />账号信息
          </h2>
          <div className="mb-4">
            <div className="text-sm" style={{ color: 'var(--td-text-color-secondary)' }}>当前登录</div>
            <div className="text-lg font-semibold" style={{ color: 'var(--td-text-color-primary)' }}>{student?.name}</div>
            <div className="mt-1 text-xs" style={{ color: 'var(--td-text-color-secondary)' }}>你的学习进度已保存在云端，换设备登录同名账号即可继续</div>
          </div>
          <button onClick={logout}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
            <LogOut size={16} />退出登录
          </button>
        </div>

        {/* 关于 */}
        <div className="rounded-xl border p-5" style={{ backgroundColor: 'var(--td-bg-color-container)', borderColor: 'var(--td-component-stroke)' }}>
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold" style={{ color: 'var(--td-text-color-primary)' }}>
            <Info size={18} />关于
          </h2>
          <div className="space-y-2 text-sm" style={{ color: 'var(--td-text-color-secondary)' }}>
            <p>单词背诵大师 - 基于艾宾浩斯记忆曲线的智能单词学习应用</p>
            <p>技术栈: React + Supabase + Vercel</p>
            <p>记忆算法: Leitner System + 艾宾浩斯遗忘曲线</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void; }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium" style={{ color: 'var(--td-text-color-primary)' }}>{label}</div>
        <div className="text-xs" style={{ color: 'var(--td-text-color-secondary)' }}>{description}</div>
      </div>
      <button onClick={() => onChange(!checked)} className="relative h-6 w-11 rounded-full transition-all" style={{ backgroundColor: checked ? 'var(--td-brand-color)' : 'var(--td-bg-color-component)' }}>
        <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all" style={{ left: checked ? '22px' : '2px' }} />
      </button>
    </div>
  );
}
