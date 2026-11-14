import { Compass, Radar, Terminal, User } from 'lucide-react';

export type WorkspaceScreen = 'profile' | 'radar' | 'roadmap' | 'telemetry';

interface ScreenSwitcherProps {
  activeScreen: WorkspaceScreen;
  onSelectScreen: (screen: WorkspaceScreen) => void;
  verifiedCount: number;
  missingCount: number;
  hasProfilerResult: boolean;
  modulesCount: number;
  logsCount: number;
}

export function ScreenSwitcher({
  activeScreen,
  onSelectScreen,
  verifiedCount,
  missingCount,
  hasProfilerResult,
  modulesCount,
  logsCount,
}: ScreenSwitcherProps) {
  const buttons: Array<{
    id: WorkspaceScreen;
    num: string;
    label: string;
    icon: typeof User;
    badge: string | null;
  }> = [
    {
      id: 'profile',
      num: '01.',
      label: 'Student Profile & Goal',
      icon: User,
      badge: null,
    },
    {
      id: 'radar',
      num: '02.',
      label: 'Skill Gap & Radar',
      icon: Radar,
      badge: hasProfilerResult ? `${verifiedCount}✓ · ${missingCount} gaps` : null,
    },
    {
      id: 'roadmap',
      num: '03.',
      label: 'Adaptive Roadmap',
      icon: Compass,
      badge: modulesCount > 0 ? `${modulesCount}` : null,
    },
    {
      id: 'telemetry',
      num: '04.',
      label: 'Live Agent Telemetry',
      icon: Terminal,
      badge: logsCount > 0 ? `${logsCount}` : null,
    },
  ];

  return (
    <nav
      aria-label="Workspace Screen Switcher"
      className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4"
    >
      {buttons.map((btn) => {
        const Icon = btn.icon;
        const isActive = activeScreen === btn.id;
        return (
          <button
            key={btn.id}
            type="button"
            onClick={() => onSelectScreen(btn.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`group flex items-center justify-between gap-2.5 rounded-xl border px-4 py-3 text-left transition-all cursor-pointer backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              isActive
                ? 'border-[#00E5FF]/85 bg-gradient-to-r from-cyan-500/25 via-sky-500/20 to-slate-950/65 shadow-[0_0_26px_-4px_rgba(0,229,255,0.65)]'
                : 'border-cyan-400/30 bg-slate-950/55 hover:border-[#00E5FF]/65 hover:bg-cyan-950/45'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                  isActive
                    ? 'border-cyan-200/80 bg-[#00E5FF] text-slate-950 shadow-[0_0_16px_rgba(0,229,255,0.75)]'
                    : 'border-cyan-400/30 bg-slate-950/65 text-[#00E5FF] group-hover:border-[#00E5FF]/60'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div
                  className={`truncate font-display text-xs sm:text-[13px] font-bold ${
                    isActive ? 'text-cyan-50' : 'text-slate-100'
                  }`}
                >
                  <span className="font-mono mr-1 text-[#00E5FF]">{btn.num}</span>
                  <span>{btn.label}</span>
                </div>
              </div>
            </div>

            {btn.badge && (
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold tabular-nums whitespace-nowrap ${
                  isActive
                    ? 'bg-[#00E5FF]/20 text-cyan-100 border border-[#00E5FF]/50'
                    : 'bg-slate-900/70 text-cyan-200/90 border border-cyan-400/25'
                }`}
              >
                {btn.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
