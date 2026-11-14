import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FolderGit2,
  GraduationCap,
  RotateCcw,
  X,
} from 'lucide-react';
import type { MentorAlert, RoadmapModule } from '../types';

interface RoadmapPanelProps {
  modules: RoadmapModule[];
  mentorAlerts: MentorAlert[];
  isLoading: boolean;
  onTakeQuiz: (module: RoadmapModule) => void;
  onDismissAlert: (failedModuleId: string) => void;
}

export function RoadmapPanel({
  modules,
  mentorAlerts,
  isLoading,
  onTakeQuiz,
  onDismissAlert,
}: RoadmapPanelProps) {
  if (isLoading) {
    return (
      <section
        id="roadmap"
        aria-label="Learning Roadmap Loading"
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="h-6 w-56 rounded bg-slate-800 animate-pulse" />
          <div className="h-4 w-24 rounded bg-slate-800 animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-44 rounded-xl border border-slate-800/90 bg-[#111827] p-6 animate-pulse"
          >
            <div className="h-5 w-1/2 rounded bg-slate-800 mb-3" />
            <div className="h-4 w-2/3 rounded bg-slate-800/80 mb-5" />
            <div className="h-16 rounded-lg bg-slate-800/60" />
          </div>
        ))}
      </section>
    );
  }

  if (modules.length === 0) {
    return null;
  }

  const totalHours = modules.reduce((acc, m) => acc + m.estimatedHours, 0);

  return (
    <section id="roadmap" aria-label="Personalized Learning Roadmap" className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs text-slate-400">
            Curriculum Architect Agent · Sequenced Learning Path
          </div>
          <h2 className="mt-0.5 font-display text-lg font-semibold text-slate-100">
            Adaptive Learning Roadmap
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono tabular-nums">
          <span>{modules.length} modules</span>
          <span aria-hidden="true">·</span>
          <span>{totalHours} hrs total</span>
        </div>
      </div>

      <div className="space-y-4">
        {modules.map((mod, index) => {
          const stepNumber = String(index + 1).padStart(2, '0');
          const alertForRefresher = mentorAlerts.find(
            (a) => a.refresherModuleId === mod.id
          );
          const courses = mod.recommendedCourses || [];

          return (
            <div key={mod.id} className="space-y-3">
              {alertForRefresher && (
                <div
                  role="alert"
                  className="rounded-xl border border-amber-500/45 bg-amber-500/10 p-4 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle
                        className="mt-0.5 h-5 w-5 text-amber-400 shrink-0"
                        aria-hidden="true"
                      />
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-300">
                          <span>Mentor Agent Intervention</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            Quiz Score: {alertForRefresher.scorePercent}% (
                            {alertForRefresher.correctCount}/
                            {alertForRefresher.totalCount})
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-100">
                          Why you struggled on &ldquo;{alertForRefresher.failedModuleTitle}&rdquo;:
                        </p>
                        <p className="text-sm leading-relaxed text-slate-300">
                          {alertForRefresher.struggleReason}
                        </p>
                        <p className="text-xs text-amber-200/90 pt-1">
                          Action taken: Automatically inserted a Foundational Refresher module immediately below before your retry.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDismissAlert(alertForRefresher.failedModuleId)}
                      aria-label="Dismiss mentor alert"
                      className="rounded-md p-1 text-amber-300/80 hover:bg-amber-500/20 hover:text-amber-100 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              <article
                id={`module-${mod.id}`}
                className={`rounded-xl border p-5 sm:p-6 transition-colors ${
                  mod.completed
                    ? 'border-emerald-500/35 bg-[#111827]'
                    : mod.isRefresher
                    ? 'border-amber-500/40 bg-[#151A26]'
                    : 'border-slate-800/90 bg-[#111827]'
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5 min-w-0">
                    {/* Clean unboxed metadata row */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono font-semibold text-sky-400 tabular-nums">
                        Step {stepNumber}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{mod.targetSkill}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                        <Clock className="h-3 w-3 text-slate-500" aria-hidden="true" />
                        {mod.estimatedHours} hrs
                      </span>
                      {mod.isRefresher && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 font-medium text-amber-300">
                            <BookOpen className="h-3 w-3" aria-hidden="true" />
                            Foundational Refresher
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="font-display text-base font-semibold text-slate-50 sm:text-lg">
                      {mod.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {mod.completed ? (
                      <>
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 whitespace-nowrap">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                          <span>Completed</span>
                          {typeof mod.quizScore === 'number' && (
                            <span className="font-mono tabular-nums">
                              · {mod.quizScore}%
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => onTakeQuiz(mod)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Retake Quiz</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onTakeQuiz(mod)}
                        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${
                          mod.isRefresher
                            ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                            : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                        }`}
                      >
                        <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Take Skill Quiz</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Key Topics */}
                <div className="mt-4">
                  <div className="text-xs font-medium text-slate-400 mb-2">
                    Key Topics
                  </div>
                  <ul className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                    {mod.keyTopics.map((topic, tIdx) => (
                      <li
                        key={tIdx}
                        className="flex items-baseline gap-2 text-sm text-slate-300"
                      >
                        <span className="font-mono text-xs text-slate-500 shrink-0">
                          {tIdx + 1}.
                        </span>
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Courses & Tutorials alongside Practical Exercise / Mini-Project */}
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-800/90 bg-[#0B0F17] p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                      <GraduationCap className="h-3.5 w-3.5 text-indigo-400 shrink-0" aria-hidden="true" />
                      <span>Courses &amp; Tutorials</span>
                    </div>
                    {courses.length > 0 ? (
                      <ul className="mt-2 space-y-2">
                        {courses.map((course, cIdx) => (
                          <li key={cIdx} className="text-xs leading-snug">
                            <div className="font-medium text-slate-200">
                              {course.title}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {course.platform}
                              <span aria-hidden="true"> · </span>
                              <span>{course.format}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1.5 text-xs text-slate-500">
                        Official documentation and guided interactive tutorials for {mod.targetSkill}.
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg border border-slate-800/90 bg-[#0B0F17] p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                      <FolderGit2 className="h-3.5 w-3.5 text-sky-400 shrink-0" aria-hidden="true" />
                      <span>Practical Exercise / Mini-Project</span>
                    </div>
                    <div className="mt-2 text-xs font-medium text-slate-200">
                      {mod.miniProject.title}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      {mod.miniProject.description}
                    </p>
                  </div>
                </div>
              </article>
            </div>
          );
        })}
      </div>
    </section>
  );
}
