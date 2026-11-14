import { ClipboardCheck, Compass, HelpCircle, MessageSquare, Play, UserCheck, X } from 'lucide-react';
import { useEffect } from 'react';

interface Props {
  isOpen: boolean;
  isBusy: boolean;
  onClose: () => void;
  onLaunchDemo: () => void;
}

const STEPS = [
  {
    step: '01',
    title: 'Build or Paste Profile',
    text: 'Enter skills, certifications, and projects manually, click "Load Sample Student", or use "Paste Resume / Bio" to auto-extract with AI.',
    icon: UserCheck,
  },
  {
    step: '02',
    title: 'Watch 4 Agents Collaborate',
    text: 'Profiler computes your Readiness Telemetry & Skill Radar, Curriculum Architect builds your roadmap, and Weekly Study Pace estimates weeks to job-readiness.',
    icon: Compass,
  },
  {
    step: '03',
    title: 'Quizzes & Mini-Project Sandbox',
    text: 'Take 3-question Evaluator quizzes (scores <70% trigger a Mentor Refresher) and submit code/solutions in the Sandbox to earn "Portfolio Verified" badges.',
    icon: ClipboardCheck,
  },
  {
    step: '04',
    title: 'Live AI Mentor & Export',
    text: 'Open "Ask Kairo Mentor" anytime to compress or customize your roadmap, or click "Export Roadmap" to download your career report.',
    icon: MessageSquare,
  },
];

export function HowItWorksModal({ isOpen, isBusy, onClose, onLaunchDemo }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="studio-panel-amber hud-boot-in flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-cyan-400/20 px-6 py-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#00E5FF]/55 bg-cyan-500/20 text-[#00E5FF]">
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#00E5FF]">
                Interactive Guide
              </div>
              <h2 id="guide-modal-title" className="font-display text-lg font-bold text-slate-50 truncate">
                How to Use KairoPath
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close How It Works guide"
            className="rounded-lg p-1.5 text-cyan-200/80 hover:bg-cyan-500/20 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {STEPS.map(({ step, title, text, icon: Icon }) => (
            <div key={step} className="relative overflow-hidden rounded-xl border border-cyan-400/30 bg-slate-950/60 backdrop-blur-md p-4 pl-5">
              <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#00E5FF] to-sky-400" />
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-[#00E5FF] tabular-nums">STEP {step}</span>
                <Icon className="h-4 w-4 text-sky-300 shrink-0" aria-hidden="true" />
              </div>
              <h3 className="mt-1.5 font-display text-sm font-bold text-slate-50">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{text}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cyan-400/20 bg-slate-950/60 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-cyan-400/30 px-4 py-2 text-xs font-medium text-cyan-100 hover:bg-cyan-500/15 transition-colors"
          >
            Close Guide
          </button>

          <button
            type="button"
            onClick={onLaunchDemo}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#00E5FF] to-sky-400 px-5 py-2.5 text-xs font-bold text-slate-950 hover:from-cyan-300 hover:to-sky-300 disabled:opacity-50 transition-all shadow-[0_0_24px_-4px_rgba(0,229,255,0.65)] whitespace-nowrap"
          >
            <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
            <span>Launch Sample Demo Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
