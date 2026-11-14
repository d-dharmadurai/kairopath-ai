import {
  AlertTriangle,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Clock,
  Code2,
  FolderGit2,
  GraduationCap,
  RotateCcw,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { MentorAlert, RoadmapModule } from '../types';

interface RoadmapPanelProps {
  modules: RoadmapModule[];
  mentorAlerts: MentorAlert[];
  isLoading: boolean;
  onTakeQuiz: (module: RoadmapModule) => void;
  onOpenSandbox: (module: RoadmapModule) => void;
  onDismissAlert: (failedModuleId: string) => void;
  highlightActiveQuiz?: boolean;
}

export function RoadmapPanel({
  modules,
  mentorAlerts,
  isLoading,
  onTakeQuiz,
  onOpenSandbox,
  onDismissAlert,
  highlightActiveQuiz = false,
}: RoadmapPanelProps) {
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});

  if (isLoading) {
    return (
      <section
        id="roadmap"
        aria-label="Learning Roadmap Loading"
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="h-6 w-56 rounded bg-cyan-950/60 animate-pulse" />
          <div className="h-4 w-24 rounded bg-cyan-950/60 animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="studio-panel h-44 rounded-xl p-6 animate-pulse"
          >
            <div className="h-5 w-1/2 rounded bg-cyan-950/60 mb-3" />
            <div className="h-4 w-2/3 rounded bg-slate-900/60 mb-5" />
            <div className="h-16 rounded-lg bg-slate-900/50" />
          </div>
        ))}
      </section>
    );
  }

  if (modules.length === 0) {
    return null;
  }

  const totalHours = modules.reduce((acc, m) => acc + m.estimatedHours, 0);
  const allCollapsed = modules.every((m) => collapsedMap[m.id]);

  const toggleModule = (id: string) => {
    setCollapsedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = () => {
    const nextState = !allCollapsed;
    const next: Record<string, boolean> = {};
    for (const m of modules) {
      next[m.id] = nextState;
    }
    setCollapsedMap(next);
  };

  return (
    <section id="roadmap" aria-label="Personalized Learning Roadmap" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#00E5FF]">
            Curriculum Architect · Sequenced Steps
          </div>
          <h2 className="mt-0.5 font-display text-lg font-bold text-slate-50">
            Adaptive Learning Roadmap
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-300 font-mono tabular-nums">
            {modules.length} modules · {totalHours} hrs
          </span>
          <button
            type="button"
            onClick={toggleAll}
            className="rounded-full border border-cyan-400/30 bg-slate-950/55 backdrop-blur-md px-3 py-1 text-[11px] font-medium text-cyan-100 hover:border-[#00E5FF]/65 hover:text-[#00E5FF] transition-colors whitespace-nowrap"
          >
            {allCollapsed ? 'Expand All' : 'Collapse All'}
          </button>
        </div>
      </div>

      {/* Career Milestone Timeline */}
      <div className="relative space-y-4">
        {/* Continuous vertical glowing timeline track */}
        <div
          aria-hidden="true"
          className="absolute left-[15px] sm:left-[17px] top-6 bottom-6 w-0.5 rounded-full bg-gradient-to-b from-[#00E5FF]/80 via-sky-400/55 to-emerald-400/70"
        />

        {modules.map((mod, index) => {
          const stepNumber = String(index + 1).padStart(2, '0');
          const alertForRefresher = mentorAlerts.find(
            (a) => a.refresherModuleId === mod.id
          );
          const courses = mod.recommendedCourses || [];
          const isCollapsed = Boolean(collapsedMap[mod.id]);
          const firstIncompleteIndex = modules.findIndex((m) => !m.completed && !m.portfolioVerified);
          const isActiveStep = !mod.completed && (index === firstIncompleteIndex || Boolean(mod.isRefresher));
          const isMilestoneDone = Boolean(mod.completed || mod.portfolioVerified);

          const railClass = mod.completed
            ? 'bg-emerald-400'
            : mod.isRefresher
            ? 'bg-sky-300'
            : 'bg-gradient-to-b from-[#00E5FF] via-sky-400 to-cyan-500';

          return (
            <div
              key={mod.id}
              className="hud-boot-in relative pl-10 sm:pl-12 space-y-3"
              style={{ animationDelay: `${Math.min(index, 5) * 65}ms` }}
            >
              {/* Timeline Milestone Node */}
              <div
                aria-hidden="true"
                className="absolute left-0 top-5 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center"
              >
                {isActiveStep && !isMilestoneDone && (
                  <span className="absolute inset-0 rounded-full bg-[#00E5FF]/35 animate-ping" />
                )}
                <span
                  className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full font-mono text-xs font-bold tabular-nums transition-all ${
                    isMilestoneDone
                      ? 'bg-emerald-400 text-slate-950 border-2 border-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.6)]'
                      : isActiveStep
                      ? 'bg-slate-950/90 text-[#00E5FF] border-2 border-[#00E5FF] shadow-[0_0_18px_rgba(0,229,255,0.7)]'
                      : 'bg-slate-950/75 text-cyan-200/75 border border-cyan-400/30'
                  }`}
                >
                  {isMilestoneDone ? (
                    <Check className="h-4 w-4 stroke-[2.75]" />
                  ) : (
                    stepNumber
                  )}
                </span>
              </div>

              {alertForRefresher && (
                <div
                  role="alert"
                  className="rounded-xl border border-sky-400/55 bg-slate-950/65 backdrop-blur-md p-4 sm:p-5 shadow-[0_0_24px_-8px_rgba(56,189,248,0.45)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle
                        className="mt-0.5 h-5 w-5 text-[#00E5FF] shrink-0"
                        aria-hidden="true"
                      />
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#00E5FF]">
                          <span>Mentor Agent Intervention</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            Quiz Score: {alertForRefresher.scorePercent}% (
                            {alertForRefresher.correctCount}/
                            {alertForRefresher.totalCount})
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-50">
                          Why you struggled on &ldquo;{alertForRefresher.failedModuleTitle}&rdquo;:
                        </p>
                        <p className="text-sm leading-relaxed text-slate-200">
                          {alertForRefresher.struggleReason}
                        </p>
                        <p className="text-xs text-cyan-200/90 pt-1">
                          Action taken: Automatically inserted a Foundational Refresher module immediately below before your retry.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDismissAlert(alertForRefresher.failedModuleId)}
                      aria-label="Dismiss mentor alert"
                      className="rounded-md p-1 text-cyan-300/80 hover:bg-cyan-500/20 hover:text-cyan-100 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              {/* Tactile Step-Card with Frosted Glass */}
              <article
                id={`module-${mod.id}`}
                className={`relative overflow-hidden rounded-xl pl-5 pr-4 py-4 sm:pl-6 sm:pr-5 sm:py-5 backdrop-blur-md transition-all ${
                  mod.completed
                    ? 'border border-emerald-400/45 bg-slate-950/60 shadow-[0_0_24px_-10px_rgba(16,185,129,0.3)]'
                    : mod.isRefresher
                    ? 'border border-sky-400/55 bg-slate-950/60 shadow-[0_0_24px_-10px_rgba(56,189,248,0.35)]'
                    : 'studio-panel hover:border-[#00E5FF]/55'
                }`}
              >
                {/* Distinct Left Accent Rail */}
                <div
                  aria-hidden="true"
                  className={`absolute inset-y-0 left-0 w-1.5 ${railClass}`}
                />

                <div className="flex flex-col gap-3.5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                      <span
                        className={`font-mono font-bold tabular-nums ${
                          mod.completed
                            ? 'text-emerald-300'
                            : mod.isRefresher
                            ? 'text-sky-300'
                            : 'text-[#00E5FF]'
                        }`}
                      >
                        STEP {stepNumber}
                      </span>
                      <span aria-hidden="true" className="text-cyan-400/50">·</span>
                      <span className="text-cyan-50 font-medium">{mod.targetSkill}</span>
                      <span aria-hidden="true" className="text-cyan-400/50">·</span>
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                        <Clock className="h-3 w-3 text-[#00E5FF]" aria-hidden="true" />
                        {mod.estimatedHours} hrs
                      </span>
                      {mod.isRefresher && (
                        <>
                          <span aria-hidden="true" className="text-cyan-400/50">·</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-sky-300">
                            <BookOpen className="h-3 w-3" aria-hidden="true" />
                            Foundational Refresher
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-bold text-slate-50 sm:text-[17px]">
                        {mod.title}
                      </h3>
                      {mod.portfolioVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/60 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200 shadow-[0_0_16px_-2px_rgba(16,185,129,0.55)] whitespace-nowrap">
                          <Award className="h-3 w-3 text-emerald-300" aria-hidden="true" />
                          <span>Portfolio Verified{typeof mod.portfolioScore === 'number' ? ` · ${mod.portfolioScore}%` : ''}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pill-shaped CTAs + Collapsible Toggle */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenSandbox(mod)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/35 bg-slate-950/60 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-cyan-100 hover:border-[#00E5FF]/75 hover:text-[#00E5FF] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                    >
                      <Code2 className="h-3.5 w-3.5 text-[#00E5FF]" aria-hidden="true" />
                      <span>{mod.portfolioVerified ? 'Re-check Code' : 'Submit Mini-Project / Code Check'}</span>
                    </button>

                    {mod.completed ? (
                      <>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/45 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 whitespace-nowrap">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
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
                          className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-slate-950/60 px-3.5 py-1.5 text-xs font-medium text-cyan-100 hover:border-emerald-400/60 hover:text-emerald-200 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Retake Quiz</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onTakeQuiz(mod)}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                          mod.isRefresher
                            ? 'bg-sky-300 text-slate-950 hover:bg-sky-200 shadow-[0_0_20px_-4px_rgba(56,189,248,0.65)]'
                            : 'bg-gradient-to-r from-[#00E5FF] to-sky-400 text-slate-950 hover:from-cyan-300 hover:to-sky-300 shadow-[0_0_20px_-4px_rgba(0,229,255,0.6)]'
                        } ${
                          highlightActiveQuiz && isActiveStep
                            ? 'ring-2 ring-cyan-200/85 shadow-[0_0_28px_-2px_rgba(0,229,255,0.85)]'
                            : ''
                        }`}
                      >
                        <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Take Skill Quiz</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleModule(mod.id)}
                      aria-expanded={!isCollapsed}
                      aria-label={isCollapsed ? `Expand details for ${mod.title}` : `Collapse details for ${mod.title}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/25 bg-slate-950/60 text-cyan-200 hover:border-[#00E5FF]/65 hover:text-white transition-colors"
                    >
                      {isCollapsed ? (
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ChevronUp className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsible Module Details */}
                {!isCollapsed && (
                  <div className="mt-4 space-y-4 border-t border-cyan-400/20 pt-4">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300/80 mb-2">
                        Key Topics
                      </div>
                      <ul className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                        {mod.keyTopics.map((topic, tIdx) => (
                          <li
                            key={tIdx}
                            className="flex items-baseline gap-2 text-sm text-slate-200"
                          >
                            <span className="font-mono text-xs text-[#00E5FF] shrink-0 tabular-nums">
                              {tIdx + 1}.
                            </span>
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Courses & Tutorials alongside Practical Exercise / Mini-Project */}
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-cyan-400/25 bg-slate-950/55 backdrop-blur-md p-3.5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-100">
                          <GraduationCap className="h-3.5 w-3.5 text-[#00E5FF] shrink-0" aria-hidden="true" />
                          <span>Courses &amp; Tutorials</span>
                        </div>
                        {courses.length > 0 ? (
                          <ul className="mt-2 space-y-2">
                            {courses.map((course, cIdx) => (
                              <li key={cIdx} className="text-xs leading-snug">
                                <div className="font-medium text-slate-100">
                                  {course.title}
                                </div>
                                <div className="text-[11px] text-slate-300">
                                  {course.platform}
                                  <span aria-hidden="true"> · </span>
                                  <span>{course.format}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-1.5 text-xs text-slate-400">
                            Official documentation and guided interactive tutorials for {mod.targetSkill}.
                          </p>
                        )}
                      </div>

                      <div className="rounded-lg border border-cyan-400/25 bg-slate-950/55 backdrop-blur-md p-3.5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-100">
                          <FolderGit2 className="h-3.5 w-3.5 text-sky-300 shrink-0" aria-hidden="true" />
                          <span>Practical Exercise / Mini-Project</span>
                        </div>
                        <div className="mt-2 text-xs font-medium text-slate-100">
                          {mod.miniProject.title}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-300">
                          {mod.miniProject.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            </div>
          );
        })}
      </div>
    </section>
  );
}
