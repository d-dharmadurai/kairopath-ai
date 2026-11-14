import { AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { ProfilerResult } from '../types';

interface SkillGapPanelProps {
  profilerResult: ProfilerResult | null;
  targetRole: string;
  isLoading: boolean;
}

export function SkillGapPanel({
  profilerResult,
  targetRole,
  isLoading,
}: SkillGapPanelProps) {
  if (isLoading) {
    return (
      <section
        id="skill-gap"
        aria-label="Skill Gap Analysis Loading"
        className="rounded-xl border border-slate-800/90 bg-[#111827] p-5 sm:p-6 animate-pulse"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-48 rounded bg-slate-800" />
          <div className="h-7 w-28 rounded bg-slate-800" />
        </div>
        <div className="h-4 w-3/4 rounded bg-slate-800 mb-6" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="h-28 rounded-lg bg-slate-800/70" />
          <div className="h-28 rounded-lg bg-slate-800/70" />
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
      className="rounded-xl border border-slate-800/90 bg-[#111827] p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 border-b border-slate-800/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
            <span>Profiler Agent Assessment</span>
            {targetRole && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-slate-300">{targetRole}</span>
              </>
            )}
          </div>
          <h2 className="mt-1 font-display text-lg font-semibold text-slate-100">
            Skill Gap Breakdown
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-400">Career Match</div>
            <div className="font-mono text-2xl font-bold text-slate-50 tabular-nums">
              {careerMatchPercent}%
            </div>
          </div>
          <div className="w-24">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full w-full origin-left rounded-full transition-transform duration-500 ${
                  careerMatchPercent >= 70
                    ? 'bg-emerald-400'
                    : careerMatchPercent >= 40
                    ? 'bg-sky-400'
                    : 'bg-orange-400'
                }`}
                style={{ transform: `scaleX(${careerMatchPercent / 100})` }}
              />
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-slate-300">{summary}</p>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Verified Skills */}
        <div className="rounded-lg border border-slate-800/90 bg-[#0B0F17] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-wide text-emerald-400">
              Verified Skills
            </h3>
            <span className="font-mono text-xs text-slate-400 tabular-nums">
              {verifiedSkills.length} matched
            </span>
          </div>

          {verifiedSkills.length === 0 ? (
            <p className="text-xs text-slate-500">
              No direct role-matched skills detected yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {verifiedSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/35 bg-emerald-500/12 px-2.5 py-1 text-xs font-medium text-emerald-300"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>{skill}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Missing Skills */}
        <div className="rounded-lg border border-slate-800/90 bg-[#0B0F17] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-wide text-orange-400">
              Missing Skills
            </h3>
            <span className="font-mono text-xs text-slate-400 tabular-nums">
              {missingSkills.length} gaps
            </span>
          </div>

          {missingSkills.length === 0 ? (
            <p className="text-xs text-slate-500">
              No critical skill gaps remaining for this role.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {missingSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-md border border-orange-500/35 bg-orange-500/12 px-2.5 py-1 text-xs font-medium text-orange-300"
                >
                  <AlertCircle className="h-3.5 w-3.5 text-orange-400 shrink-0" aria-hidden="true" />
                  <span>{skill}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
