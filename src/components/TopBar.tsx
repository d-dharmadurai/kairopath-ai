import { Download, HelpCircle, ListTodo, Sparkles, UserCheck } from 'lucide-react';

interface TopBarProps {
  onReplayIntro: () => void;
  onOpenGuide: () => void;
  onLoadSample: () => void;
  onExportRoadmap: () => void;
  onToggleChecklist: () => void;
  isChecklistOpen: boolean;
  pendingTasksCount: number;
  canExport: boolean;
  isBusy: boolean;
}

export function TopBar({
  onReplayIntro,
  onOpenGuide,
  onLoadSample,
  onExportRoadmap,
  onToggleChecklist,
  isChecklistOpen,
  pendingTasksCount,
  canExport,
  isBusy,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-cyan-400/25 bg-slate-950/60 backdrop-blur-xl shadow-[0_4px_28px_-10px_rgba(0,229,255,0.28)]">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#"
          className="font-display text-lg font-extrabold tracking-tight bg-gradient-to-r from-[#00E5FF] via-sky-300 to-cyan-100 bg-clip-text text-transparent whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-sm drop-shadow-[0_0_10px_rgba(0,229,255,0.45)]"
        >
          KairoPath
        </a>

        {/* Zone 2: Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onReplayIntro}
            title="Replay KairoPath Mission Briefing"
            className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/25 bg-slate-950/55 backdrop-blur-md px-2.5 py-2 text-xs font-semibold text-cyan-200 hover:border-[#00E5FF]/65 hover:bg-cyan-500/15 hover:text-cyan-100 transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#00E5FF]" aria-hidden="true" />
            <span>Intro</span>
          </button>

          <button
            type="button"
            onClick={onToggleChecklist}
            aria-pressed={isChecklistOpen}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-md transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              isChecklistOpen
                ? 'border-[#00E5FF]/75 bg-cyan-500/20 text-cyan-100 shadow-[0_0_16px_-4px_rgba(0,229,255,0.6)]'
                : 'border-cyan-400/30 bg-slate-950/55 text-cyan-50 hover:border-[#00E5FF]/65'
            }`}
          >
            <ListTodo className="h-3.5 w-3.5 text-[#00E5FF]" aria-hidden="true" />
            <span className="hidden md:inline">Study Checklist</span>
            {pendingTasksCount > 0 && (
              <span className="rounded-full bg-[#00E5FF]/20 px-1.5 py-0.5 font-mono text-[10px] text-[#00E5FF] tabular-nums">
                {pendingTasksCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenGuide}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-slate-950/55 backdrop-blur-md px-3 py-2 text-xs font-semibold text-cyan-50 hover:border-[#00E5FF]/70 hover:bg-cyan-500/15 hover:text-cyan-200 transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <HelpCircle className="h-3.5 w-3.5 text-[#00E5FF]" aria-hidden="true" />
            <span>How It Works</span>
          </button>

          <button
            type="button"
            onClick={onExportRoadmap}
            disabled={!canExport || isBusy}
            title={
              canExport
                ? 'Download Career Readiness & Learning Roadmap (.md)'
                : 'Analyze a student profile first to export your roadmap'
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/35 bg-sky-500/12 backdrop-blur-md px-3 py-2 text-xs font-semibold text-sky-100 hover:bg-sky-500/22 hover:border-sky-300/70 disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <Download className="h-3.5 w-3.5 text-sky-300" aria-hidden="true" />
            <span className="hidden sm:inline">Export Roadmap</span>
          </button>

          <button
            type="button"
            onClick={onLoadSample}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#00E5FF]/55 bg-cyan-500/15 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-cyan-100 shadow-[0_0_18px_-6px_rgba(0,229,255,0.55)] hover:bg-cyan-500/25 hover:border-[#00E5FF]/85 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <UserCheck className="h-3.5 w-3.5 text-[#00E5FF]" aria-hidden="true" />
            <span>Load Sample Student</span>
          </button>
        </div>
      </div>
    </header>
  );
}
