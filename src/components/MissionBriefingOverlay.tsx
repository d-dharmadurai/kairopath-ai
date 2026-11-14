import { ArrowRight, Compass, Cpu, Play, Radar, ShieldCheck } from 'lucide-react';

interface MissionBriefingOverlayProps {
  isBooting: boolean;
  onInitialize: () => void;
  onLaunchInstantDemo: () => void;
}

const VALUE_PILLS = [
  {
    icon: Radar,
    label: 'AI Skill-Gap & Radar Diagnostics',
  },
  {
    icon: Compass,
    label: 'Dynamic Curriculum & Mini-Project Grading',
  },
  {
    icon: ShieldCheck,
    label: 'Real-Time Mentor Refresher Adaptation',
  },
];

export function MissionBriefingOverlay({
  isBooting,
  onInitialize,
  onLaunchInstantDemo,
}: MissionBriefingOverlayProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="briefing-title"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 ${
        isBooting ? 'hud-briefing-exit pointer-events-none' : 'hud-boot-in'
      }`}
    >
      {/* Translucent backdrop letting the animated Stark HUD city & Arc-Reactor shine through */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
      />

      {/* Holographic grid + scanline sweep triggered during 0.7s boot transition */}
      {isBooting && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 opacity-60 bg-[linear-gradient(to_right,rgba(0,229,255,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,229,255,0.14)_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="hud-boot-beam absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-transparent via-[#00E5FF]/45 to-transparent shadow-[0_0_40px_rgba(0,229,255,0.6)]" />
        </div>
      )}

      {/* Centered Frosted-Glass Hero Card */}
      <div className="studio-panel-amber relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl p-6 sm:p-9 text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-[#00E5FF]/15 blur-3xl"
        />

        {/* KairoPath Arc-Reactor Emblem */}
        <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
          <svg
            viewBox="0 0 64 64"
            className="hud-spin-cw absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <circle
              cx="32"
              cy="32"
              r="29"
              fill="none"
              stroke="rgba(0,229,255,0.55)"
              strokeWidth="1.5"
              strokeDasharray="10 6"
            />
            <circle
              cx="32"
              cy="32"
              r="22"
              fill="none"
              stroke="rgba(56,189,248,0.45)"
              strokeWidth="1.5"
              strokeDasharray="4 5"
            />
          </svg>
          <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#00E5FF]/70 bg-slate-950/75 shadow-[0_0_24px_rgba(0,229,255,0.5)]">
            <Cpu className="h-5 w-5 text-[#00E5FF]" aria-hidden="true" />
          </div>
        </div>

        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#00E5FF]">
          KairoPath Mission Briefing
        </p>

        <h1
          id="briefing-title"
          className="mt-2 font-display text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[#00E5FF] via-sky-200 to-cyan-100 bg-clip-text text-transparent drop-shadow-[0_0_16px_rgba(0,229,255,0.4)]"
        >
          KairoPath
        </h1>

        <p className="mx-auto mt-2.5 max-w-xl text-sm sm:text-base font-medium text-slate-200 leading-relaxed [text-wrap:balance]">
          Autonomous Multi-Agent Career Readiness &amp; Adaptive Learning Engine
        </p>

        {/* 3 Concise Value Pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {VALUE_PILLS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/35 bg-slate-950/60 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-cyan-100 shadow-[0_0_16px_-8px_rgba(0,229,255,0.45)]"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-[#00E5FF]" aria-hidden="true" />
                <span className="whitespace-nowrap">{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Primary & Secondary CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onInitialize}
            disabled={isBooting}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#00E5FF] to-sky-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-[0_0_28px_-4px_rgba(0,229,255,0.8)] hover:from-cyan-300 hover:to-sky-300 active:scale-[0.98] disabled:opacity-70 transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <span>Initialize KairoPath Workspace</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onLaunchInstantDemo}
            disabled={isBooting}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-[#00E5FF]/55 bg-slate-950/65 backdrop-blur-md px-5 py-3 text-sm font-semibold text-cyan-100 hover:border-[#00E5FF] hover:bg-cyan-500/20 active:scale-[0.98] disabled:opacity-70 transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <Play className="h-3.5 w-3.5 text-[#00E5FF]" aria-hidden="true" />
            <span>Launch Instant Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
