import { Award, CheckCircle2, Code2, Lightbulb, Loader2, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ProjectReviewResult, RoadmapModule } from '../types';

interface ProjectSandboxModalProps {
  module: RoadmapModule | null;
  isReviewing: boolean;
  review: ProjectReviewResult | null;
  error: string | null;
  onSubmitSolution: (submission: string) => void;
  onClose: () => void;
}

function buildSampleSolution(mod: RoadmapModule): string {
  return `// ${mod.miniProject.title} — ${mod.targetSkill} Solution
// Architecture: Validate boundary inputs, isolate core logic, and test error paths.

export async function executeTask(input: { id: string; payload: string }) {
  if (!input.id?.trim() || !input.payload?.trim()) {
    throw new Error('ValidationError: id and payload are required');
  }
  try {
    const normalized = input.payload.trim();
    return { ok: true, skill: '${mod.targetSkill}', id: input.id, data: normalized };
  } catch (err) {
    console.error('Execution failed:', err);
    throw err;
  }
}`;
}

export function ProjectSandboxModal({
  module,
  isReviewing,
  review,
  error,
  onSubmitSolution,
  onClose,
}: ProjectSandboxModalProps) {
  const [submission, setSubmission] = useState('');

  useEffect(() => {
    setSubmission('');
  }, [module?.id]);

  useEffect(() => {
    if (!module) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isReviewing) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [module, isReviewing, onClose]);

  if (!module) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sandbox-modal-title"
      onClick={(e) => e.target === e.currentTarget && !isReviewing && onClose()}
    >
      <div className="studio-panel-amber hud-boot-in flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-cyan-400/20 px-6 py-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#00E5FF]/55 bg-cyan-500/20 text-[#00E5FF]">
              <Code2 className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#00E5FF]">
                Mini-Project &amp; Code Check Sandbox
              </div>
              <h2 id="sandbox-modal-title" className="font-display text-base font-bold text-slate-50 truncate">
                {module.miniProject.title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isReviewing}
            aria-label="Close sandbox modal"
            className="rounded-lg p-1.5 text-cyan-200/80 hover:bg-cyan-500/20 hover:text-white disabled:opacity-40 transition-colors"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="rounded-xl border border-cyan-400/25 bg-slate-950/60 p-3.5 text-xs leading-relaxed text-slate-200">
            <span className="font-semibold text-[#00E5FF]">Prompt ({module.targetSkill}): </span>
            {module.miniProject.description}
          </div>

          {error && (
            <div className="rounded-lg border border-rose-400/45 bg-rose-500/15 p-3 text-xs text-rose-100">
              {error}
            </div>
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label htmlFor="sandbox-code-input" className="text-xs font-medium text-cyan-100">
                Paste code snippet, SQL, or architecture explanation
              </label>
              <button
                type="button"
                onClick={() => setSubmission(buildSampleSolution(module))}
                disabled={isReviewing}
                className="inline-flex items-center gap-1 rounded-md border border-cyan-400/35 bg-slate-950/70 px-2.5 py-1 text-[11px] font-medium text-cyan-100 hover:border-[#00E5FF]/70 transition-colors whitespace-nowrap"
              >
                <Sparkles className="h-3 w-3 text-[#00E5FF]" aria-hidden="true" />
                <span>Load Sample Solution</span>
              </button>
            </div>
            <textarea
              id="sandbox-code-input"
              rows={7}
              value={submission}
              onChange={(e) => setSubmission(e.target.value)}
              disabled={isReviewing}
              placeholder="Paste your code, API design, or step-by-step architecture approach..."
              className="w-full rounded-xl border border-cyan-400/30 bg-slate-950/65 p-3.5 font-mono text-xs leading-relaxed text-slate-50 placeholder-slate-400 focus:border-[#00E5FF] focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
            />
          </div>

          {review && (
            <div
              className={`rounded-xl border p-4 space-y-3 ${
                review.verified
                  ? 'border-emerald-400/50 bg-emerald-500/12 shadow-[0_0_24px_-8px_rgba(16,185,129,0.4)]'
                  : 'border-sky-400/55 bg-sky-500/12'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Award
                    className={`h-5 w-5 shrink-0 ${review.verified ? 'text-emerald-300' : 'text-[#00E5FF]'}`}
                    aria-hidden="true"
                  />
                  <span className="font-display text-sm font-bold text-slate-50">
                    {review.verified ? 'Portfolio Verified' : 'Needs Refinement (< 70%)'}
                  </span>
                </div>
                <span className="font-mono text-base font-bold text-slate-50 tabular-nums">
                  {review.scorePercent}%
                </span>
              </div>

              <p className="text-xs leading-relaxed text-slate-100">{review.summary}</p>

              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-emerald-300">Strengths</div>
                {review.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-200">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-300 shrink-0" aria-hidden="true" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-cyan-400/25 bg-slate-950/65 p-3 text-xs text-slate-200">
                <Lightbulb className="mt-0.5 h-4 w-4 text-[#00E5FF] shrink-0" aria-hidden="true" />
                <div>
                  <span className="font-semibold text-cyan-200">Next Tip: </span>
                  {review.improvementTip}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-cyan-400/20 bg-slate-950/60 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isReviewing}
            className="rounded-full border border-cyan-400/30 px-4 py-2 text-xs font-medium text-cyan-100 hover:bg-cyan-500/15 disabled:opacity-50 transition-colors"
          >
            {review ? 'Done' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={() => submission.trim() && onSubmitSolution(submission.trim())}
            disabled={!submission.trim() || isReviewing}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#00E5FF] to-sky-400 px-5 py-2 text-xs font-bold text-slate-950 shadow-[0_0_20px_-4px_rgba(0,229,255,0.6)] hover:from-cyan-300 hover:to-sky-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
          >
            {isReviewing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                <span>Reviewing Code...</span>
              </>
            ) : (
              <span>{review ? 'Re-submit Code Check' : 'Submit for AI Code Check'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
