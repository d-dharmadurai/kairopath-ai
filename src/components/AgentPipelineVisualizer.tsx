import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import type { AgentName } from '../types';

interface AgentPipelineVisualizerProps {
  activeAgent: AgentName | null;
  hasProfilerResult: boolean;
  hasRoadmap: boolean;
  hasPassedQuiz: boolean;
  hasMentorAlert: boolean;
}

interface StageConfig {
  id: Exclude<AgentName, 'Orchestrator'>;
  step: string;
  label: string;
  subtitle: string;
  icon: typeof ShieldCheck;
}

const STAGES: StageConfig[] = [
  {
    id: 'Profiler',
    step: '01',
    label: 'Profiler',
    subtitle: 'Skill gap & match',
    icon: ShieldCheck,
  },
  {
    id: 'Curriculum Architect',
    step: '02',
    label: 'Curriculum',
    subtitle: 'Roadmap & courses',
    icon: Compass,
  },
  {
    id: 'Evaluator',
    step: '03',
    label: 'Evaluator',
    subtitle: 'Dynamic 3-MCQ quiz',
    icon: ClipboardCheck,
  },
  {
    id: 'Mentor',
    step: '04',
    label: 'Mentor',
    subtitle: 'Grading & refreshers',
    icon: BookOpen,
  },
];

export function AgentPipelineVisualizer({
  activeAgent,
  hasProfilerResult,
  hasRoadmap,
  hasPassedQuiz,
  hasMentorAlert,
}: AgentPipelineVisualizerProps) {
  const getStageState = (
    id: StageConfig['id']
  ): 'active' | 'done' | 'alert' | 'idle' => {
    if (activeAgent === id) return 'active';
    if (id === 'Profiler' && hasProfilerResult) return 'done';
    if (id === 'Curriculum Architect' && hasRoadmap) return 'done';
    if (id === 'Evaluator' && (hasPassedQuiz || hasMentorAlert)) return 'done';
    if (id === 'Mentor') {
      if (hasMentorAlert) return 'alert';
      if (hasPassedQuiz) return 'done';
    }
    return 'idle';
  };

  return (
    <section
      id="pipeline"
      aria-label="4-Agent Collaboration Pipeline"
      className="studio-panel rounded-xl p-4"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#00E5FF]">
          4-Agent Pipeline Strip
        </h2>
        <span className="font-mono text-[11px] text-cyan-200/80">
          {activeAgent
            ? `Active: ${activeAgent} Agent`
            : hasRoadmap
            ? 'Pipeline synced · Quizzes & Mentor live'
            : 'Standby'}
        </span>
      </div>

      <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:gap-0">
        {STAGES.map((stage, index) => {
          const state = getStageState(stage.id);
          const Icon = stage.icon;
          const isConnectorActive =
            activeAgent === stage.id ||
            (index === 0 && (activeAgent === 'Curriculum Architect' || hasProfilerResult)) ||
            (index === 1 && (activeAgent === 'Evaluator' || hasRoadmap)) ||
            (index === 2 && (activeAgent === 'Mentor' || hasPassedQuiz || hasMentorAlert));

          const isConnectorPulsing =
            activeAgent === stage.id ||
            (index === 0 && activeAgent === 'Curriculum Architect') ||
            (index === 1 && activeAgent === 'Evaluator') ||
            (index === 2 && activeAgent === 'Mentor');

          return (
            <div
              key={stage.id}
              className="flex flex-1 flex-col md:flex-row md:items-center min-w-0"
            >
              {/* Agent Node */}
              <div
                className={`relative flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2.5 backdrop-blur-md transition-all duration-300 min-w-0 ${
                  state === 'active'
                    ? 'border-[#00E5FF]/80 bg-gradient-to-br from-cyan-500/20 to-sky-500/15 shadow-[0_0_24px_-4px_rgba(0,229,255,0.6)]'
                    : state === 'alert'
                    ? 'border-sky-300/70 bg-sky-500/15 shadow-[0_0_20px_-6px_rgba(56,189,248,0.45)]'
                    : state === 'done'
                    ? 'border-emerald-400/45 bg-emerald-500/10'
                    : 'border-cyan-400/25 bg-slate-950/55'
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                    state === 'active'
                      ? 'border-[#00E5FF]/70 bg-cyan-500/25 text-[#00E5FF]'
                      : state === 'alert'
                      ? 'border-sky-300/60 bg-sky-500/20 text-sky-200'
                      : state === 'done'
                      ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300'
                      : 'border-cyan-400/20 bg-slate-900/75 text-sky-300/80'
                  }`}
                >
                  {state === 'active' ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : state === 'alert' ? (
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  ) : state === 'done' ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-[10px] font-semibold text-cyan-300/75 tabular-nums">
                      {stage.step}
                    </span>
                    <span
                      className={`font-mono text-[10px] font-medium ${
                        state === 'active'
                          ? 'text-[#00E5FF]'
                          : state === 'alert'
                          ? 'text-sky-200'
                          : state === 'done'
                          ? 'text-emerald-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {state === 'active'
                        ? 'Running'
                        : state === 'alert'
                        ? 'Refresher'
                        : state === 'done'
                        ? 'Synced'
                        : 'Idle'}
                    </span>
                  </div>
                  <div className="truncate font-display text-xs font-semibold text-slate-50">
                    {stage.label}
                  </div>
                  <div className="truncate text-[11px] text-slate-300">
                    {stage.subtitle}
                  </div>
                </div>
              </div>

              {/* Animated Horizontal Connector */}
              {index < STAGES.length - 1 && (
                <div
                  aria-hidden="true"
                  className="hidden md:flex items-center px-1 w-6 lg:w-7 shrink-0"
                >
                  <div className="relative h-0.5 w-full overflow-hidden rounded-full bg-slate-800/80">
                    <div
                      className={`h-full w-full transition-colors duration-300 ${
                        isConnectorActive
                          ? 'bg-gradient-to-r from-[#00E5FF] to-sky-400'
                          : 'bg-slate-800/80'
                      }`}
                    />
                    {isConnectorPulsing && (
                      <div className="animate-pipeline-beam absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white to-transparent" />
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
