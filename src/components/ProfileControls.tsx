import { Loader2, Play } from 'lucide-react';
import type { FormEvent } from 'react';

interface ProfileControlsProps {
  name: string;
  skillsInput: string;
  certificationsInput: string;
  pastProjectsInput: string;
  targetRole: string;
  onNameChange: (value: string) => void;
  onSkillsChange: (value: string) => void;
  onCertificationsChange: (value: string) => void;
  onPastProjectsChange: (value: string) => void;
  onTargetRoleChange: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const ROLE_PRESETS = [
  'Full Stack Developer',
  'Data Engineer',
  'AI / ML Engineer',
  'Cloud DevOps Engineer',
];

export function ProfileControls({
  name,
  skillsInput,
  certificationsInput,
  pastProjectsInput,
  targetRole,
  onNameChange,
  onSkillsChange,
  onCertificationsChange,
  onPastProjectsChange,
  onTargetRoleChange,
  onAnalyze,
  isAnalyzing,
}: ProfileControlsProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isAnalyzing && targetRole.trim()) {
      onAnalyze();
    }
  };

  return (
    <section
      id="profile"
      aria-label="Student Profile Configuration"
      className="rounded-xl border border-slate-800/90 bg-[#111827] p-5 sm:p-6"
    >
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-100">
            Student Profile &amp; Target Career
          </h2>
          <p className="text-xs text-slate-400">
            Enter your skills, certifications, past projects, and target role to trigger the 4-agent Gemini collaboration pipeline.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-3">
            <label
              htmlFor="student-name"
              className="mb-1.5 block text-xs font-medium text-slate-300"
            >
              Student Name
            </label>
            <input
              id="student-name"
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full rounded-lg border border-slate-700/90 bg-[#0B0F17] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="md:col-span-5">
            <label
              htmlFor="current-skills"
              className="mb-1.5 block text-xs font-medium text-slate-300"
            >
              Current Skills (comma-separated)
            </label>
            <input
              id="current-skills"
              type="text"
              value={skillsInput}
              onChange={(e) => onSkillsChange(e.target.value)}
              placeholder="e.g. Python, SQL, HTML"
              className="w-full rounded-lg border border-slate-700/90 bg-[#0B0F17] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="md:col-span-4">
            <label
              htmlFor="target-role"
              className="mb-1.5 block text-xs font-medium text-slate-300"
            >
              Target Role
            </label>
            <input
              id="target-role"
              type="text"
              value={targetRole}
              onChange={(e) => onTargetRoleChange(e.target.value)}
              placeholder="e.g. Full Stack Developer"
              required
              className="w-full rounded-lg border border-slate-700/90 bg-[#0B0F17] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-5">
            <label
              htmlFor="certifications"
              className="mb-1.5 block text-xs font-medium text-slate-300"
            >
              Certifications
            </label>
            <input
              id="certifications"
              type="text"
              value={certificationsInput}
              onChange={(e) => onCertificationsChange(e.target.value)}
              placeholder="e.g. AWS Cloud Practitioner"
              className="w-full rounded-lg border border-slate-700/90 bg-[#0B0F17] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="md:col-span-7">
            <label
              htmlFor="past-projects"
              className="mb-1.5 block text-xs font-medium text-slate-300"
            >
              Past Projects
            </label>
            <input
              id="past-projects"
              type="text"
              value={pastProjectsInput}
              onChange={(e) => onPastProjectsChange(e.target.value)}
              placeholder="e.g. CLI Task Manager in Python, SQL Inventory DB"
              className="w-full rounded-lg border border-slate-700/90 bg-[#0B0F17] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">Quick roles:</span>
            {ROLE_PRESETS.map((role) => {
              const isSelected = targetRole.trim().toLowerCase() === role.toLowerCase();
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => onTargetRoleChange(role)}
                  disabled={isAnalyzing}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                    isSelected
                      ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40'
                      : 'bg-slate-800/70 text-slate-300 border border-slate-700/70 hover:bg-slate-800 hover:text-slate-100'
                  }`}
                >
                  {role}
                </button>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={isAnalyzing || !targetRole.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Agents Collaborating...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                <span>Analyze &amp; Build Path</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
