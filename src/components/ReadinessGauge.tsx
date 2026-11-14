import { TrendingUp } from 'lucide-react';
import type { ProfilerResult, RoadmapModule } from '../types';

interface ReadinessGaugeProps {
  studentName: string;
  targetRole: string;
  modules: RoadmapModule[];
  profilerResult: ProfilerResult | null;
  weeklyHours: number;
  onWeeklyHoursChange: (hours: number) => void;
}

function getMarketOutlook(role: string): { demand: string; compRange: string } {
  const lower = role.toLowerCase();
  if (lower.includes('ai') || lower.includes('ml')) {
    return { demand: 'High Demand', compRange: '$145k–$215k' };
  }
  if (lower.includes('devops') || lower.includes('cloud')) {
    return { demand: 'High Demand', compRange: '$130k–$190k' };
  }
  if (lower.includes('data')) {
    return { demand: 'High Demand', compRange: '$125k–$185k' };
  }
  if (lower.includes('full stack') || lower.includes('fullstack')) {
    return { demand: 'High Demand', compRange: '$115k–$175k' };
  }
  return { demand: 'High Demand', compRange: '$110k–$170k' };
}

const RADIUS = 48;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ReadinessGauge({
  studentName,
  targetRole,
  modules,
  profilerResult,
  weeklyHours,
  onWeeklyHoursChange,
}: ReadinessGaugeProps) {
  const totalCount = modules.length;
  const completedCount = modules.filter((m) => m.completed).length;
  const readinessPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const remainingHours = modules
    .filter((m) => !m.completed)
    .reduce((sum, m) => sum + m.estimatedHours, 0);

  const estWeeks =
    remainingHours > 0 ? Math.ceil(remainingHours / Math.max(5, weeklyHours)) : 0;
  const outlook = getMarketOutlook(targetRole || 'Full Stack Developer');

  const verifiedCount = profilerResult?.verifiedSkills.length ?? 0;
  const missingCount = profilerResult?.missingSkills.length ?? 0;

  const dashOffset = CIRCUMFERENCE * (1 - readinessPercent / 100);

  return (
    <section
      id="readiness"
      aria-label="Readiness Telemetry Bar"
      className="studio-panel-amber rounded-xl px-4 py-3.5 sm:px-5"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center">
        {/* Left: Bold 116px Circular Career Readiness Ring + Candidate / Role */}
        <div className="lg:col-span-5 flex items-center gap-4 min-w-0">
          <div className="relative flex h-[116px] w-[116px] shrink-0 items-center justify-center">
            <svg
              viewBox="0 0 120 120"
              className="h-[116px] w-[116px] overflow-visible"
              role="progressbar"
              aria-valuenow={readinessPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Overall Career Readiness Percentage"
            >
              <defs>
                <linearGradient id="readinessRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00E5FF" />
                  <stop offset="55%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#22D3EE" />
                </linearGradient>
                <filter id="readinessGlow" x="-25%" y="-25%" width="150%" height="150%">
                  <feGaussianBlur stdDeviation="3.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Base Track Ring + Inner Arc-Reactor Calibration Ring */}
              <circle
                cx="60"
                cy="60"
                r={RADIUS}
                fill="rgba(2, 6, 23, 0.65)"
                stroke="rgba(56, 189, 248, 0.18)"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r={36}
                fill="none"
                stroke="rgba(0, 229, 255, 0.25)"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />

              {/* Subtle 0% Ambient Halo or Active Glowing Progress Ring */}
              <circle
                cx="60"
                cy="60"
                r={RADIUS}
                fill="none"
                stroke="url(#readinessRingGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={readinessPercent > 0 ? dashOffset : CIRCUMFERENCE - 6}
                transform="rotate(-90 60 60)"
                filter="url(#readinessGlow)"
                opacity={readinessPercent > 0 ? 1 : 0.5}
                className="transition-all duration-700 ease-out"
              />

              <text
                x="60"
                y="62"
                textAnchor="middle"
                className="font-mono text-[26px] font-extrabold fill-cyan-50 tabular-nums"
              >
                {readinessPercent}%
              </text>
              <text
                x="60"
                y="78"
                textAnchor="middle"
                className="font-mono text-[9px] font-semibold uppercase tracking-widest fill-[#00E5FF]"
              >
                READY
              </text>
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#00E5FF] font-semibold">
                Readiness Telemetry
              </span>
              {profilerResult && (
                <span className="rounded bg-cyan-400/15 border border-cyan-400/35 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-cyan-200 tabular-nums">
                  {profilerResult.careerMatchPercent}% Match
                </span>
              )}
            </div>
            <h1 className="mt-0.5 font-display text-base sm:text-lg font-bold text-slate-50 truncate">
              {targetRole
                ? `${studentName || 'Candidate'} → ${targetRole}`
                : 'Configure Profile & Target Career'}
            </h1>
            <div className="mt-1.5 inline-flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 font-semibold text-cyan-300">
                <TrendingUp className="h-3.5 w-3.5 text-[#00E5FF]" aria-hidden="true" />
                {outlook.demand}
              </span>
              <span className="text-cyan-500/60" aria-hidden="true">·</span>
              <span className="font-mono text-sky-100 tabular-nums">{outlook.compRange}/yr</span>
            </div>
          </div>
        </div>

        {/* Middle: 4 Telemetry Counters */}
        <div className="lg:col-span-3 grid grid-cols-4 lg:grid-cols-2 gap-2 rounded-xl border border-cyan-400/30 bg-slate-950/55 backdrop-blur-md px-3 py-2.5 text-center">
          <div>
            <div className="font-mono text-sm font-bold text-emerald-300 tabular-nums">
              {verifiedCount}
            </div>
            <div className="text-[10px] text-slate-300">Verified</div>
          </div>
          <div>
            <div className="font-mono text-sm font-bold text-sky-300 tabular-nums">
              {missingCount}
            </div>
            <div className="text-[10px] text-slate-300">Missing</div>
          </div>
          <div>
            <div className="font-mono text-sm font-bold text-[#00E5FF] tabular-nums">
              {completedCount}/{totalCount}
            </div>
            <div className="text-[10px] text-slate-300">Modules</div>
          </div>
          <div>
            <div className="font-mono text-sm font-bold text-cyan-100 tabular-nums">
              {remainingHours}h
            </div>
            <div className="text-[10px] text-slate-300">Left</div>
          </div>
        </div>

        {/* Right: Weekly Study Pace Calculator */}
        <div className="lg:col-span-4 rounded-xl border border-cyan-400/30 bg-slate-950/55 backdrop-blur-md px-3.5 py-2 space-y-1">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <label htmlFor="weekly-study-hours" className="font-medium text-cyan-100">
              Weekly Study Hours
            </label>
            <span className="font-mono font-semibold text-[#00E5FF] tabular-nums">
              {weeklyHours} hrs/wk
            </span>
          </div>
          <input
            id="weekly-study-hours"
            type="range"
            min={5}
            max={40}
            step={1}
            value={weeklyHours}
            onChange={(e) => onWeeklyHoursChange(Number(e.target.value))}
            className="w-full h-1.5 cursor-pointer appearance-none rounded-full bg-slate-800 accent-[#00E5FF]"
          />
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300">Est. Weeks to Job-Ready</span>
            <span className="font-mono font-bold text-cyan-50 tabular-nums">
              {totalCount === 0
                ? '—'
                : remainingHours === 0
                ? 'Job-Ready!'
                : `${estWeeks} ${estWeeks === 1 ? 'week' : 'weeks'}`}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
