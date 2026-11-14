import { FileText, Loader2, Play, Wand2, X } from 'lucide-react';
import { type FormEvent, useState } from 'react';

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
  onQuickSwitchRole: (role: string) => void;
  onExtractBio: (rawText: string) => Promise<void>;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  isExtractingBio: boolean;
  highlightNextAction?: boolean;
}

const ROLE_PRESETS = [
  'Full Stack Developer',
  'Data Engineer',
  'AI/ML Engineer',
  'Cloud DevOps Engineer',
];

const SAMPLE_BIO = `Hi, I'm Maya Chen, a senior CS student aiming to become a Cloud DevOps Engineer. My core skills include Python, Linux, SQL, Docker, and Git. I hold the AWS Cloud Practitioner and HashiCorp Terraform Associate certifications. Recent projects include a Dockerized URL Shortener API in Python and an automated GitHub Actions CI pipeline.`;

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
  onQuickSwitchRole,
  onExtractBio,
  onAnalyze,
  isAnalyzing,
  isExtractingBio,
  highlightNextAction = false,
}: ProfileControlsProps) {
  const [showBioPanel, setShowBioPanel] = useState(false);
  const [bioText, setBioText] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isAnalyzing && !isExtractingBio && targetRole.trim()) {
      onAnalyze();
    }
  };

  const handleExtractClick = async () => {
    if (!bioText.trim() || isExtractingBio || isAnalyzing) return;
    await onExtractBio(bioText);
    setShowBioPanel(false);
  };

  return (
    <section
      id="profile"
      aria-label="Student Profile and Target Career"
      className="studio-panel rounded-xl p-5 sm:p-6"
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-cyan-400/20 pb-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#00E5FF]">
            Step 01 · Profile Configuration
          </div>
          <h2 className="mt-0.5 font-display text-lg font-bold text-slate-50">
            Student Profile &amp; Target Career
          </h2>
          <p className="text-xs text-slate-300">
            Enter your skills, certifications, and projects—or paste a bio—then launch the 4-agent pipeline.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowBioPanel((prev) => !prev)}
          disabled={isAnalyzing || isExtractingBio}
          className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold backdrop-blur-md transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
            showBioPanel
              ? 'border-[#00E5FF]/70 bg-cyan-500/20 text-cyan-100 shadow-[0_0_18px_-4px_rgba(0,229,255,0.5)]'
              : 'border-cyan-400/30 bg-slate-950/55 text-cyan-50 hover:border-[#00E5FF]/65 hover:text-cyan-200'
          }`}
        >
          {showBioPanel ? (
            <>
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Close Bio Import</span>
            </>
          ) : (
            <>
              <FileText className="h-3.5 w-3.5 text-[#00E5FF]" aria-hidden="true" />
              <span>Paste Resume / Bio</span>
            </>
          )}
        </button>
      </div>

      {/* Collapsible Smart Resume / Bio Auto-Fill Panel */}
      {showBioPanel && (
        <div className="mb-5 rounded-xl border border-cyan-400/35 bg-slate-950/60 backdrop-blur-md p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="resume-bio-textarea"
              className="text-xs font-semibold text-cyan-200"
            >
              Smart Resume / Bio Auto-Fill
            </label>
            <button
              type="button"
              onClick={() => setBioText(SAMPLE_BIO)}
              disabled={isExtractingBio}
              className="rounded-md border border-cyan-400/30 bg-slate-950/70 px-2.5 py-1 text-[11px] font-medium text-cyan-100 hover:border-[#00E5FF]/65 hover:text-[#00E5FF] transition-colors whitespace-nowrap"
            >
              Load Sample Bio
            </button>
          </div>

          <textarea
            id="resume-bio-textarea"
            rows={4}
            value={bioText}
            onChange={(e) => setBioText(e.target.value)}
            placeholder="Paste a LinkedIn summary, student bio, or resume snippet..."
            className="w-full rounded-lg border border-cyan-400/25 bg-slate-950/65 px-3.5 py-2.5 text-xs leading-relaxed text-slate-100 placeholder-slate-400 focus:border-[#00E5FF] focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
          />

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={handleExtractClick}
              disabled={!bioText.trim() || isExtractingBio || isAnalyzing}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#00E5FF] to-sky-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-[0_0_20px_-4px_rgba(0,229,255,0.65)] hover:from-cyan-300 hover:to-sky-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
            >
              {isExtractingBio ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  <span>Extracting Profile...</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Extract with Profiler Agent</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-3">
            <label
              htmlFor="student-name"
              className="mb-1.5 block text-xs font-medium text-cyan-100"
            >
              Student Name
            </label>
            <input
              id="student-name"
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full rounded-lg border border-cyan-400/25 bg-slate-950/55 px-3.5 py-2.5 text-sm text-slate-50 placeholder-slate-400 focus:border-[#00E5FF] focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
            />
          </div>

          <div className="md:col-span-5">
            <label
              htmlFor="current-skills"
              className="mb-1.5 block text-xs font-medium text-cyan-100"
            >
              Current Skills (comma-separated)
            </label>
            <input
              id="current-skills"
              type="text"
              value={skillsInput}
              onChange={(e) => onSkillsChange(e.target.value)}
              placeholder="e.g. Python, SQL, HTML"
              className="w-full rounded-lg border border-cyan-400/25 bg-slate-950/55 px-3.5 py-2.5 text-sm text-slate-50 placeholder-slate-400 focus:border-[#00E5FF] focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
            />
          </div>

          <div className="md:col-span-4">
            <label
              htmlFor="certifications"
              className="mb-1.5 block text-xs font-medium text-cyan-100"
            >
              Certifications
            </label>
            <input
              id="certifications"
              type="text"
              value={certificationsInput}
              onChange={(e) => onCertificationsChange(e.target.value)}
              placeholder="e.g. AWS Cloud Practitioner"
              className="w-full rounded-lg border border-cyan-400/25 bg-slate-950/55 px-3.5 py-2.5 text-sm text-slate-50 placeholder-slate-400 focus:border-[#00E5FF] focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="past-projects"
            className="mb-1.5 block text-xs font-medium text-cyan-100"
          >
            Past Projects
          </label>
          <input
            id="past-projects"
            type="text"
            value={pastProjectsInput}
            onChange={(e) => onPastProjectsChange(e.target.value)}
            placeholder="e.g. CLI Task Manager in Python, SQL Inventory DB"
            className="w-full rounded-lg border border-cyan-400/25 bg-slate-950/55 px-3.5 py-2.5 text-sm text-slate-50 placeholder-slate-400 focus:border-[#00E5FF] focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
          />
        </div>

        {/* Target Role + 1-Click Career Role Switcher */}
        <div className="rounded-xl border border-cyan-400/30 bg-slate-950/55 backdrop-blur-md p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-4">
              <label
                htmlFor="target-role"
                className="mb-1.5 block font-mono text-[11px] font-medium uppercase tracking-wider text-[#00E5FF]"
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
                className="w-full rounded-lg border border-cyan-400/35 bg-slate-950/70 px-3.5 py-2.5 text-sm font-medium text-slate-50 placeholder-slate-400 focus:border-[#00E5FF] focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
              />
            </div>

            <div className="lg:col-span-8">
              <div className="mb-1.5 text-xs font-medium text-slate-300">
                1-Click Role Switcher (analyzes &amp; opens Skill Gap &amp; Radar automatically)
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {ROLE_PRESETS.map((role) => {
                  const isSelected =
                    targetRole.trim().toLowerCase() === role.toLowerCase();
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => onQuickSwitchRole(role)}
                      disabled={isAnalyzing || isExtractingBio}
                      className={`rounded-lg px-3 py-2 text-xs font-medium transition-all whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                        isSelected
                          ? 'border border-[#00E5FF]/80 bg-gradient-to-r from-cyan-500/25 to-sky-500/20 text-cyan-100 shadow-[0_0_18px_-4px_rgba(0,229,255,0.6)]'
                          : 'border border-cyan-400/25 bg-slate-950/60 text-slate-200 hover:border-[#00E5FF]/60 hover:text-cyan-200'
                      }`}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isAnalyzing || isExtractingBio || !targetRole.trim()}
              className={`inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#00E5FF] to-sky-400 px-6 py-2.5 text-xs font-bold text-slate-950 hover:from-cyan-300 hover:to-sky-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                highlightNextAction
                  ? 'ring-2 ring-cyan-300/80 shadow-[0_0_28px_-2px_rgba(0,229,255,0.85)]'
                  : 'shadow-[0_0_22px_-4px_rgba(0,229,255,0.55)]'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Agents Collaborating...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  <span>Analyze &amp; Build Path</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
