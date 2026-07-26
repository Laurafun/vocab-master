import { useState, useEffect, useCallback } from 'react';
import { Save, Sliders, Info, LogOut, FileText, Copy, CheckCircle2 } from 'lucide-react';
import { settingsApi, statsApi } from '../api';
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

        {/* 导出学习报告 */}
        <div className="rounded-xl border p-5" style={{ backgroundColor: 'var(--td-bg-color-container)', borderColor: 'var(--td-component-stroke)' }}>
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold" style={{ color: 'var(--td-text-color-primary)' }}>
            <FileText size={18} />导出学习报告
          </h2>
          <p className="mb-3 text-sm" style={{ color: 'var(--td-text-color-secondary)' }}>
            复制学习报告发送给老师
          </p>
          <ExportReport studentId={student!.id} studentName={student!.name} />
        </div>
      </div>
    </div>
  );
}

function ExportReport({ studentId, studentName }: { studentId: string; studentName: string }) {
  const [report, setReport] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const stats = await statsApi.get(studentId);
      const curve = await statsApi.getCurve(studentId);
      const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

      let rpt = `📊 学习报告 - ${studentName}\n━━━━━━━━━━━━━━━━\n📅 ${today}\n\n`;
      rpt += `📚 总单词量: ${stats.total} 个\n`;
      rpt += `🆕 新词: ${stats.newWords}\n`;
      rpt += `📖 学习中: ${stats.learning}\n`;
      rpt += `✅ 已掌握: ${stats.mastered}\n`;
      rpt += `⏰ 今日待复习: ${stats.dueToday}\n\n`;
      rpt += `📈 今日统计:\n`;
      rpt += `  总复习: ${stats.todayStats.total} 次\n`;
      rpt += `  答对: ${stats.todayStats.correct} 次\n`;
      rpt += `  答错: ${stats.todayStats.wrong} 次\n`;
      if (stats.todayStats.total > 0) {
        rpt += `  正确率: ${Math.round(stats.todayStats.correct / stats.todayStats.total * 100)}%\n`;
      }
      rpt += `\n🔥 连续打卡: ${stats.streak} 天\n`;
      if (curve) {
        rpt += `\n🗂️ 记忆箱分布:\n`;
        curve.boxDistribution.forEach((b: any) => {
          rpt += `  第${b.level}箱: ${b.count} 个 | ${b.description}\n`;
        });
      }
      setReport(rpt);
    } catch (e) {
      setReport(`❌ 生成失败: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const copyReport = async () => {
    if (!report) return;
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="flex gap-2">
        <button onClick={generateReport} disabled={loading}
          className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
          <FileText size={16} />{loading ? '生成中...' : '生成报告'}
        </button>
        {report && (
          <button onClick={copyReport}
            className="flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-medium"
            style={{ borderColor: '#22c55e', color: '#22c55e' }}>
            {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
            {copied ? '已复制' : '复制'}
          </button>
        )}
      </div>
      {report && (
        <div className="mt-3 rounded-lg bg-gray-800 p-3 text-xs text-green-300 font-mono whitespace-pre-line">
          {report}
        </div>
      )}
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
