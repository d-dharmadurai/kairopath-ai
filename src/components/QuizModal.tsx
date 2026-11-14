import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { MentorEvaluationResult, QuizData, RoadmapModule } from '../types';

interface QuizModalProps {
  module: RoadmapModule | null;
  quizData: QuizData | null;
  isGenerating: boolean;
  isGrading: boolean;
  evaluation: MentorEvaluationResult | null;
  error: string | null;
  onSubmitAnswers: (selectedIndices: number[]) => void;
  onClose: (scrollToRoadmap?: boolean) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export function QuizModal({
  module,
  quizData,
  isGenerating,
  isGrading,
  evaluation,
  error,
  onSubmitAnswers,
  onClose,
}: QuizModalProps) {
  const [selected, setSelected] = useState<Record<number, number>>({});

  useEffect(() => {
    setSelected({});
  }, [quizData?.moduleId, module?.id]);

  useEffect(() => {
    if (!module) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isGenerating && !isGrading) {
        onClose(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [module, isGenerating, isGrading, onClose]);

  if (!module) return null;

  const questions = quizData?.questions ?? [];
  const allAnswered =
    questions.length > 0 &&
    questions.every((_, idx) => typeof selected[idx] === 'number');

  const handleSubmit = () => {
    if (!allAnswered || isGrading) return;
    const ordered = questions.map((_, idx) => selected[idx]);
    onSubmitAnswers(ordered);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-modal-title"
    >
      <div className="studio-panel-amber hud-boot-in flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-cyan-400/20 px-6 py-4">
          <div className="min-w-0">
            <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#00E5FF]">
              {evaluation
                ? 'Mentor Agent Evaluation'
                : 'Evaluator Agent · 3-Question Skill Quiz'}
            </div>
            <h2
              id="quiz-modal-title"
              className="mt-0.5 font-display text-lg font-bold text-slate-50 truncate"
            >
              {module.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onClose(false)}
            disabled={isGenerating || isGrading}
            aria-label="Close quiz modal"
            className="rounded-lg p-1.5 text-cyan-200/80 hover:bg-cyan-500/20 hover:text-white disabled:opacity-40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {error && (
            <div className="rounded-lg border border-rose-400/45 bg-rose-500/15 p-4 text-sm text-rose-100">
              {error}
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#00E5FF] mb-3" aria-hidden="true" />
              <p className="text-sm font-medium text-cyan-50">
                Evaluator Agent is crafting 3 targeted questions...
              </p>
              <p className="mt-1 text-xs text-slate-300">
                Testing practical mastery of {module.targetSkill}
              </p>
            </div>
          )}

          {!isGenerating && questions.length > 0 && !evaluation && (
            <div className="space-y-6">
              {questions.map((q, qIdx) => (
                <fieldset key={q.id} className="space-y-2.5">
                  <legend className="text-sm font-medium text-slate-50 leading-relaxed">
                    <span className="font-mono text-[#00E5FF] mr-2 tabular-nums">
                      Q{qIdx + 1}.
                    </span>
                    {q.question}
                  </legend>
                  <div className="grid grid-cols-1 gap-2">
                    {q.options.map((opt, oIdx) => {
                      const isChosen = selected[qIdx] === oIdx;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() =>
                            setSelected((prev) => ({ ...prev, [qIdx]: oIdx }))
                          }
                          disabled={isGrading}
                          className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                            isChosen
                              ? 'border-[#00E5FF] bg-cyan-500/20 text-white shadow-[0_0_16px_-4px_rgba(0,229,255,0.45)]'
                              : 'border-cyan-400/25 bg-slate-950/60 text-slate-200 hover:border-[#00E5FF]/60 hover:bg-cyan-950/40'
                          }`}
                        >
                          <span
                            className={`font-mono text-xs font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                              isChosen
                                ? 'bg-[#00E5FF] text-slate-950'
                                : 'bg-slate-800/90 text-cyan-200'
                            }`}
                          >
                            {OPTION_LETTERS[oIdx]}
                          </span>
                          <span className="leading-snug">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          )}

          {/* Evaluation Result View */}
          {evaluation && (
            <div className="space-y-5">
              <div
                className={`rounded-xl border p-4 sm:p-5 ${
                  evaluation.passed
                    ? 'border-emerald-400/50 bg-emerald-500/12'
                    : 'border-sky-400/55 bg-sky-500/12'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    {evaluation.passed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-[#00E5FF] shrink-0" aria-hidden="true" />
                    )}
                    <h3 className="font-display text-base font-bold text-slate-50">
                      {evaluation.passed
                        ? 'Module Mastered'
                        : 'Below 70% Threshold — Refresher Added'}
                    </h3>
                  </div>
                  <span className="font-mono text-lg font-bold text-slate-50 tabular-nums">
                    {evaluation.correctCount}/{evaluation.totalCount} ({evaluation.scorePercent}%)
                  </span>
                </div>

                <p className="mt-2.5 text-sm leading-relaxed text-slate-100">
                  {evaluation.feedbackSummary}
                </p>

                {!evaluation.passed && evaluation.struggleReason && (
                  <div className="mt-3 rounded-lg border border-cyan-400/35 bg-slate-950/65 p-3.5">
                    <div className="text-xs font-semibold text-[#00E5FF] mb-1">
                      Mentor Agent Diagnosis
                    </div>
                    <p className="text-xs leading-relaxed text-slate-200">
                      {evaluation.struggleReason}
                    </p>
                    {evaluation.refresherModule && (
                      <p className="mt-2 text-xs font-medium text-cyan-200">
                        Inserted before this step: {evaluation.refresherModule.title}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Answer Review */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-cyan-200/80">
                  Question Breakdown
                </h4>
                {questions.map((q, qIdx) => {
                  const chosen = selected[qIdx];
                  const isCorrect = chosen === q.correctIndex;
                  return (
                    <div
                      key={q.id}
                      className="rounded-lg border border-cyan-400/25 bg-slate-950/60 p-4 text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-slate-100">
                          <span className="font-mono text-[#00E5FF] mr-1.5">
                            Q{qIdx + 1}.
                          </span>
                          {q.question}
                        </p>
                        {isCorrect ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" aria-hidden="true" />
                        ) : (
                          <XCircle className="h-4 w-4 text-rose-400 shrink-0" aria-hidden="true" />
                        )}
                      </div>
                      <div className="text-slate-300">
                        Your answer:{' '}
                        <span className={isCorrect ? 'text-emerald-300' : 'text-rose-300'}>
                          {typeof chosen === 'number' ? q.options[chosen] : 'None'}
                        </span>
                        {!isCorrect && (
                          <>
                            {' · '}Correct:{' '}
                            <span className="text-emerald-300">
                              {q.options[q.correctIndex]}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-slate-300 leading-relaxed">{q.explanation}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-cyan-400/20 px-6 py-4">
          {!evaluation ? (
            <>
              <span className="text-xs text-cyan-200/80 font-mono tabular-nums">
                {Object.keys(selected).length} / {questions.length} answered
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onClose(false)}
                  disabled={isGenerating || isGrading}
                  className="rounded-full border border-cyan-400/30 px-4 py-2 text-xs font-medium text-cyan-100 hover:bg-cyan-500/15 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!allAnswered || isGrading || isGenerating}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#00E5FF] to-sky-400 px-5 py-2 text-xs font-bold text-slate-950 shadow-[0_0_20px_-4px_rgba(0,229,255,0.6)] hover:from-cyan-300 hover:to-sky-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isGrading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      <span>Mentor Grading...</span>
                    </>
                  ) : (
                    <span>Submit Answers</span>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex w-full items-center justify-end">
              <button
                type="button"
                onClick={() => onClose(!evaluation.passed)}
                className="rounded-full bg-gradient-to-r from-[#00E5FF] to-sky-400 px-5 py-2 text-xs font-bold text-slate-950 shadow-[0_0_20px_-4px_rgba(0,229,255,0.6)] hover:from-cyan-300 hover:to-sky-300 transition-colors"
              >
                {evaluation.passed ? 'Continue Roadmap' : 'View Updated Roadmap'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
