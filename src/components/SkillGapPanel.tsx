import { AlertCircle, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { ProfilerResult } from '../types';
import type { RadarDimension } from '../utils/radarMetrics';
import { SkillRadarChart } from './SkillRadarChart';

interface SkillGapPanelProps {
  profilerResult: ProfilerResult | null;
  radarDimensions: RadarDimension[];
  completedModulesCount: number;
  targetRole: string;
  isLoading: boolean;
  onGoToRoadmap?: () => void;
  modulesCount?: number;
}

export function SkillGapPanel({
  profilerResult,
  radarDimensions,
  completedModulesCount,
  targetRole,
  isLoading,
  onGoToRoadmap,
  modulesCount = 0,
}: SkillGapPanelProps) {
  if (isLoading) {
    return (
      <section
        id="skill-gap"
        aria-label="Skill Gap Analysis Loading"
        className="studio-panel rounded-xl p-5 sm:p-6 animate-pulse"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-48 rounded bg-cyan-950/60" />
          <div className="h-7 w-28 rounded bg-cyan-950/60" />
        </div>
        <div className="h-4 w-3/4 rounded bg-cyan-950/50 mb-6" />
        <div className="h-64 rounded-xl bg-slate-900/50 mb-5" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="h-28 rounded-lg bg-slate-900/55" />
          <div className="h-28 rounded-lg bg-slate-900/55" />
        </div>
      </section>
    );
  }

  if (!profilerResult) {
    return null;
  }

  const { verifiedSkills, missingSkills, careerMatchPercent, summary } = profilerResult;

  return (
    <section
      id="skill-gap"
      aria-label="Skill Gap Analysis"
      className="studio-panel rounded-xl p-5 sm:p-6 space-y-5"
    >
      <div className="flex flex-col gap-4 border-b border-cyan-400/20 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <ShieldCheck className="h-3.5 w-3.5 text-[#00E5FF]" aria-hidden="true" />
            <span>Profiler Agent Assessment</span>
            {targetRole && (
              <>
                <span aria-hidden="true" className="text-cyan-400/50">·</span>
                <span className="text-cyan-200 font-medium">{targetRole}</span>
              </>
            )}
          </div>
          <h2 className="mt-1 font-display text-lg font-bold text-slate-50">
            Skill Gap Breakdown &amp; Competency Radar
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-300">Career Match</div>
            <div className="font-mono text-2xl font-bold text-[#00E5FF] tabular-nums">
              {careerMatchPercent}%
            </div>
          </div>
          <div className="w-24">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/80">
              <div
                className={`h-full w-full origin-left rounded-full transition-transform duration-500 ${
                  careerMatchPercent >= 70
                    ? 'bg-emerald-400'
                    : careerMatchPercent >= 40
                    ? 'bg-[#00E5FF]'
                    : 'bg-sky-400'
                }`}
                style={{ transform: `scaleX(${careerMatchPercent / 100})` }}
              />
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-slate-200">{summary}</p>

      {/* Interactive 5-Axis SVG Radar Chart */}
      <SkillRadarChart
        dimensions={radarDimensions}
        targetRole={targetRole}
        completedModulesCount={completedModulesCount}
      />

      {/* Verified & Missing Skill Badges */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Verified Skills */}
        <div className="rounded-xl border border-emerald-400/30 bg-slate-950/55 backdrop-blur-md p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-wide text-emerald-300">
              Verified Skills
            </h3>
            <span className="font-mono text-xs text-slate-300 tabular-nums">
              {verifiedSkills.length} matched
            </span>
          </div>

          {verifiedSkills.length === 0 ? (
            <p className="text-xs text-slate-400">
              No direct role-matched skills detected yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {verifiedSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/40 bg-emerald-500/12 px-2.5 py-1 text-xs font-medium text-emerald-200"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>{skill}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Missing Skills */}
        <div className="rounded-xl border border-cyan-400/30 bg-slate-950/55 backdrop-blur-md p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-wide text-[#00E5FF]">
              Missing Skills
            </h3>
            <span className="font-mono text-xs text-slate-300 tabular-nums">
              {missingSkills.length} gaps
            </span>
          </div>

          {missingSkills.length === 0 ? (
            <p className="text-xs text-slate-400">
              No critical skill gaps remaining for this role.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {missingSkills.map((skill, idx) => {
                const isCore = idx < 2;
                return (
                  <span
                    key={skill}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${
                      isCore
                        ? 'border-[#00E5FF]/55 bg-cyan-500/15 text-cyan-100'
                        : 'border-sky-400/40 bg-sky-500/12 text-sky-100'
                    }`}
                  >
                    <AlertCircle
                      className={`h-3.5 w-3.5 shrink-0 ${isCore ? 'text-[#00E5FF]' : 'text-sky-300'}`}
                      aria-hidden="true"
                    />
                    <span>{skill}</span>
                    <span
                      className={`ml-0.5 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${
                        isCore
                          ? 'bg-cyan-400/25 text-cyan-100'
                          : 'bg-sky-400/20 text-sky-200'
                      }`}
                    >
                      {isCore ? 'Core Gap' : 'High Impact'}
                    </span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {onGoToRoadmap && modulesCount > 0 && (
        <div className="flex justify-end pt-2 border-t border-cyan-400/20">
          <button
            type="button"
            onClick={onGoToRoadmap}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#00E5FF] to-sky-400 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-[0_0_24px_-4px_rgba(0,229,255,0.7)] hover:from-cyan-300 hover:to-sky-300 transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <span>Continue to Learning Roadmap</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
