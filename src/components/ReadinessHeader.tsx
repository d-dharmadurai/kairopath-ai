import { CheckCircle2, Clock, Target } from 'lucide-react';
import type { RoadmapModule } from '../types';

interface ReadinessHeaderProps {
  studentName: string;
  targetRole: string;
  modules: RoadmapModule[];
  careerMatchPercent: number | null;
}

export function ReadinessHeader({
  studentName,
  targetRole,
  modules,
  careerMatchPercent,
}: ReadinessHeaderProps) {
  const totalCount = modules.length;
  const completedCount = modules.filter((m) => m.completed).length;
  const readinessPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const remainingHours = modules
    .filter((m) => !m.completed)
    .reduce((sum, m) => sum + m.estimatedHours, 0);

  return (
    <section
      id="readiness"
      aria-label="Overall Career Readiness"
      className="rounded-xl border border-slate-800/90 bg-[#111827] p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-medium text-sky-400">Overall Career Readiness</span>
            {targetRole && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-slate-300">
                  {studentName ? `${studentName} → ` : ''}
                  {targetRole}
                </span>
              </>
            )}
          </div>
          <h1 className="font-display text-xl font-bold tracking-tight text-slate-50 sm:text-2xl text-balance">
            Adaptive Career &amp; Skill Workspace
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-6 sm:gap-8">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
            <div>
              <div className="text-xs text-slate-400">Modules Completed</div>
              <div className="font-mono text-sm font-semibold text-slate-100 tabular-nums">
                {completedCount} / {totalCount}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
            <div>
              <div className="text-xs text-slate-400">Est. Remaining</div>
              <div className="font-mono text-sm font-semibold text-slate-100 tabular-nums">
                {remainingHours} hrs
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Target className="h-4 w-4 text-sky-400 shrink-0" aria-hidden="true" />
            <div>
              <div className="text-xs text-slate-400">Career Readiness</div>
              <div className="font-mono text-lg font-bold text-sky-400 tabular-nums">
                {readinessPercent}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800/90"
          role="progressbar"
          aria-valuenow={readinessPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall Career Readiness Progress"
        >
          <div
            className="h-full w-full origin-left rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-transform duration-500 ease-out"
            style={{ transform: `scaleX(${readinessPercent / 100})` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>
            {totalCount === 0
              ? 'Analyze a student profile to generate your adaptive learning path.'
              : completedCount === totalCount
              ? 'All roadmap modules mastered — job-ready milestone achieved.'
              : 'Complete module skill quizzes (70%+ pass) to advance career readiness.'}
          </span>
          {careerMatchPercent !== null && (
            <span className="font-mono tabular-nums text-slate-400 shrink-0 ml-4">
              Baseline Match: {careerMatchPercent}%
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
