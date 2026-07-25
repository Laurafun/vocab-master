import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, BookOpen, CheckCircle2, Flame, Target, Calendar } from 'lucide-react';
import { statsApi } from '../api';
import type { WordStats, CurveData } from '../types';
import { useStudent } from '../contexts/StudentContext';

export function DashboardPage() {
  const navigate = useNavigate();
  const { student } = useStudent();
  const [stats, setStats] = useState<WordStats | null>(null);
  const [curveData, setCurveData] = useState<CurveData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!student) return;
    try {
      const [s, c] = await Promise.all([statsApi.get(student.id), statsApi.getCurve(student.id)]);
      setStats(s);
      setCurveData(c);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg" style={{ color: 'var(--td-text-color-secondary)' }}>加载中...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg" style={{ color: 'var(--td-text-color-secondary)' }}>加载失败</div>
      </div>
    );
  }

  const statCards = [
    { label: '总单词数', value: stats.total, icon: BookOpen, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { label: '待复习', value: stats.dueToday, icon: Target, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: '已掌握', value: stats.mastered, icon: CheckCircle2, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    { label: '连续学习', value: `${stats.streak} 天`, icon: Flame, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  ];

  const todayProgress = stats.todayStats.total > 0
    ? Math.round((stats.todayStats.correct / stats.todayStats.total) * 100)
    : 0;

  return (
    <div className="h-full overflow-y-auto p-6" style={{ backgroundColor: 'var(--td-bg-color-page)' }}>
      {/* 标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--td-text-color-primary)' }}>学习仪表盘</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--td-text-color-secondary)' }}>
          基于艾宾浩斯记忆曲线的智能复习系统
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border p-5"
              style={{
                backgroundColor: 'var(--td-bg-color-container)',
                borderColor: 'var(--td-component-stroke)',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm" style={{ color: 'var(--td-text-color-secondary)' }}>{card.label}</div>
                  <div className="mt-1 text-2xl font-bold" style={{ color: 'var(--td-text-color-primary)' }}>{card.value}</div>
                </div>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: card.bg }}
                >
                  <Icon size={24} color={card.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 今日学习进度 */}
      <div
        className="mb-6 rounded-xl border p-5"
        style={{ backgroundColor: 'var(--td-bg-color-container)', borderColor: 'var(--td-component-stroke)' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold" style={{ color: 'var(--td-text-color-primary)' }}>
            <Calendar size={18} />
            今日学习
          </h2>
          <button
            onClick={() => navigate('/study')}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
          >
            {stats.dueToday > 0 ? `开始复习 (${stats.dueToday})` : '开始学习'}
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-sm" style={{ color: 'var(--td-text-color-secondary)' }}>已复习</div>
            <div className="text-xl font-bold" style={{ color: 'var(--td-text-color-primary)' }}>{stats.todayStats.total}</div>
          </div>
          <div>
            <div className="text-sm" style={{ color: 'var(--td-text-color-secondary)' }}>正确</div>
            <div className="text-xl font-bold" style={{ color: '#22c55e' }}>{stats.todayStats.correct}</div>
          </div>
          <div>
            <div className="text-sm" style={{ color: 'var(--td-text-color-secondary)' }}>错误</div>
            <div className="text-xl font-bold" style={{ color: '#ef4444' }}>{stats.todayStats.wrong}</div>
          </div>
          <div>
            <div className="text-sm" style={{ color: 'var(--td-text-color-secondary)' }}>正确率</div>
            <div className="text-xl font-bold" style={{ color: 'var(--td-text-color-primary)' }}>{todayProgress}%</div>
          </div>
        </div>
        {/* 进度条 */}
        <div className="mt-4">
          <div className="h-2 w-full rounded-full" style={{ backgroundColor: 'var(--td-bg-color-component)' }}>
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${todayProgress}%`,
                background: 'linear-gradient(90deg, #3b82f6, #6366f1)',
              }}
            />
          </div>
        </div>
      </div>

      {/* 图表区 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 遗忘曲线 */}
        {curveData && (
          <div
            className="rounded-xl border p-5"
            style={{ backgroundColor: 'var(--td-bg-color-container)', borderColor: 'var(--td-component-stroke)' }}
          >
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold" style={{ color: 'var(--td-text-color-primary)' }}>
              <TrendingUp size={18} />
              艾宾浩斯遗忘曲线
            </h2>
            <ForgettingCurveChart data={curveData.forgettingCurve} />
          </div>
        )}

        {/* 盒子分布 */}
        {curveData && (
          <div
            className="rounded-xl border p-5"
            style={{ backgroundColor: 'var(--td-bg-color-container)', borderColor: 'var(--td-component-stroke)' }}
          >
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold" style={{ color: 'var(--td-text-color-primary)' }}>
              <Target size={18} />
              单词掌握分布
            </h2>
            <BoxDistributionChart data={curveData.boxDistribution} />
          </div>
        )}
      </div>

      {/* 间隔重复效果 */}
      {curveData && (
        <div
          className="mt-4 rounded-xl border p-5"
          style={{ backgroundColor: 'var(--td-bg-color-container)', borderColor: 'var(--td-component-stroke)' }}
        >
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold" style={{ color: 'var(--td-text-color-primary)' }}>
            <TrendingUp size={18} />
            间隔重复效果 - 记忆保持率随复习次数提升
          </h2>
          <SpacedRepetitionChart data={curveData.spacedRepetitionEffect} />
        </div>
      )}
    </div>
  );
}

// ============= SVG 图表组件 =============

function ForgettingCurveChart({ data }: { data: Array<{ time: string; retention: number }> }) {
  const width = 480;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxY = 100;
  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartWidth,
    y: padding.top + (1 - d.retention / maxY) * chartHeight,
    ...d,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      <defs>
        <linearGradient id="forgettingGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* 网格线 */}
      {[0, 25, 50, 75, 100].map((y) => (
        <g key={y}>
          <line
            x1={padding.left} y1={padding.top + (1 - y / 100) * chartHeight}
            x2={width - padding.right} y2={padding.top + (1 - y / 100) * chartHeight}
            stroke="#d4d4d4" strokeWidth="1" strokeDasharray="3 3"
          />
          <text
            x={padding.left - 8} y={padding.top + (1 - y / 100) * chartHeight + 4}
            fontSize="10" fill="#737373" textAnchor="end"
          >
            {y}%
          </text>
        </g>
      ))}
      {/* 区域 */}
      <path d={areaD} fill="url(#forgettingGradient)" />
      {/* 曲线 */}
      <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" />
      {/* 数据点 */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#3b82f6" />
          <text x={p.x} y={height - 15} fontSize="10" fill="#737373" textAnchor="middle">
            {p.time}
          </text>
        </g>
      ))}
    </svg>
  );
}

function BoxDistributionChart({ data }: { data: Array<{ level: number; count: number; description: string; color: string }> }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.level} className="flex items-center gap-3">
          <div className="w-20 text-xs" style={{ color: 'var(--td-text-color-secondary)' }}>
            {item.description}
          </div>
          <div className="h-6 flex-1 rounded-md" style={{ backgroundColor: 'var(--td-bg-color-component)' }}>
            <div
              className="h-6 rounded-md transition-all"
              style={{
                width: `${(item.count / maxCount) * 100}%`,
                backgroundColor: item.color,
                minWidth: item.count > 0 ? '24px' : '0',
              }}
            />
          </div>
          <div className="w-8 text-right text-sm font-semibold" style={{ color: 'var(--td-text-color-primary)' }}>
            {item.count}
          </div>
        </div>
      ))}
    </div>
  );
}

function SpacedRepetitionChart({ data }: { data: Array<{ review: number; retention: number; interval: string }> }) {
  const width = 640;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxY = 100;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartWidth,
    y: padding.top + (1 - d.retention / maxY) * chartHeight,
    ...d,
  }));

  const barWidth = chartWidth / data.length * 0.5;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {/* 网格线 */}
      {[0, 25, 50, 75, 100].map((y) => (
        <g key={y}>
          <line
            x1={padding.left} y1={padding.top + (1 - y / 100) * chartHeight}
            x2={width - padding.right} y2={padding.top + (1 - y / 100) * chartHeight}
            stroke="#d4d4d4" strokeWidth="1" strokeDasharray="3 3"
          />
          <text x={padding.left - 8} y={padding.top + (1 - y / 100) * chartHeight + 4} fontSize="10" fill="#737373" textAnchor="end">
            {y}%
          </text>
        </g>
      ))}
      {/* 柱状图 */}
      {points.map((p, i) => {
        const barHeight = chartHeight - (p.y - padding.top);
        return (
          <g key={i}>
            <rect
              x={p.x - barWidth / 2} y={p.y}
              width={barWidth} height={barHeight}
              fill={`hsl(${200 + i * 15}, 70%, 60%)`} rx="4"
            />
            <text x={p.x} y={p.y - 6} fontSize="10" fill="#171717" textAnchor="middle" fontWeight="600">
              {p.retention}%
            </text>
            <text x={p.x} y={height - 15} fontSize="9" fill="#737373" textAnchor="middle">
              第{i + 1}次
            </text>
            <text x={p.x} y={height - 4} fontSize="8" fill="#737373" textAnchor="middle">
              {p.interval}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
