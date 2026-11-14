import { UserCheck } from 'lucide-react';

interface TopBarProps {
  onLoadSample: () => void;
  isBusy: boolean;
}

export function TopBar({ onLoadSample, isBusy }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-[#0B0F17]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#"
          className="font-display text-lg font-bold tracking-tight text-slate-50 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-sm"
        >
          KairoPath
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400"
        >
          <a
            href="#readiness"
            className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            Readiness
          </a>
          <a
            href="#profile"
            className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            Profile
          </a>
          <a
            href="#skill-gap"
            className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            Skill Gap
          </a>
          <a
            href="#roadmap"
            className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            Roadmap
          </a>
        </nav>

        {/* Zone 3: Single utility action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onLoadSample}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700/90 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <UserCheck className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
            <span>Load Sample Student</span>
          </button>
        </div>
      </div>
    </header>
  );
}
