import { useCallback, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  ClipboardCheck,
  Compass,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { AgentLogPanel } from './components/AgentLogPanel';
import { ProfileControls } from './components/ProfileControls';
import { QuizModal } from './components/QuizModal';
import { ReadinessHeader } from './components/ReadinessHeader';
import { RoadmapPanel } from './components/RoadmapPanel';
import { SkillGapPanel } from './components/SkillGapPanel';
import { TopBar } from './components/TopBar';
import type {
  AgentLogEntry,
  AgentLogStatus,
  AgentName,
  MentorAlert,
  MentorEvaluationResult,
  ProfilerResult,
  QuizData,
  RoadmapModule,
} from './types';

function formatTimestamp(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function parseSkillsList(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const AGENT_OVERVIEW = [
  {
    step: '01',
    name: 'Profiler Agent',
    role: 'Compares your current skills against real-world target role benchmarks.',
    icon: ShieldCheck,
  },
  {
    step: '02',
    name: 'Curriculum Architect',
    role: 'Sequences missing skills into a project-driven learning roadmap.',
    icon: Compass,
  },
  {
    step: '03',
    name: 'Evaluator Agent',
    role: 'Generates dynamic 3-question skill quizzes tailored to each module.',
    icon: ClipboardCheck,
  },
  {
    step: '04',
    name: 'Mentor Agent',
    role: 'Grades quizzes, diagnoses struggles below 70%, and injects refresher modules.',
    icon: BookOpen,
  },
];

export default function App() {
  // Profile state
  const [name, setName] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [certificationsInput, setCertificationsInput] = useState('');
  const [pastProjectsInput, setPastProjectsInput] = useState('');
  const [targetRole, setTargetRole] = useState('');

  // Pipeline state
  const [activeAgent, setActiveAgent] = useState<AgentName | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingProfiler, setIsLoadingProfiler] = useState(false);
  const [isLoadingCurriculum, setIsLoadingCurriculum] = useState(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  // Domain results
  const [profilerResult, setProfilerResult] = useState<ProfilerResult | null>(null);
  const [modules, setModules] = useState<RoadmapModule[]>([]);
  const [mentorAlerts, setMentorAlerts] = useState<MentorAlert[]>([]);
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);

  // Quiz Modal state
  const [quizModule, setQuizModule] = useState<RoadmapModule | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isGradingQuiz, setIsGradingQuiz] = useState(false);
  const [evaluation, setEvaluation] = useState<MentorEvaluationResult | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);

  const appendLog = useCallback(
    (
      agent: AgentName,
      status: AgentLogStatus,
      message: string,
      detail?: string
    ) => {
      setLogs((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: formatTimestamp(),
          agent,
          status,
          message,
          detail,
        },
      ]);
    },
    []
  );

  const handleLoadSample = useCallback(() => {
    setName('Alex');
    setSkillsInput('Python, SQL, HTML');
    setCertificationsInput('AWS Cloud Practitioner');
    setPastProjectsInput('CLI Task Manager in Python, SQL Inventory DB');
    setTargetRole('Full Stack Developer');
    setPipelineError(null);
    appendLog(
      'Orchestrator',
      'completed',
      'Loaded sample student profile: Alex (Full Stack Developer).',
      'Skills: Python, SQL, HTML · Certs: AWS Cloud Practitioner · Projects: CLI Task Manager in Python, SQL Inventory DB'
    );
  }, [appendLog]);

  const handleAnalyzeAndBuild = useCallback(async () => {
    const cleanRole = targetRole.trim();
    if (!cleanRole) return;

    const cleanName = name.trim() || 'Student';
    const currentSkills = parseSkillsList(skillsInput);
    const certifications = parseSkillsList(certificationsInput);
    const pastProjects = parseSkillsList(pastProjectsInput);

    setIsAnalyzing(true);
    setIsLoadingProfiler(true);
    setIsLoadingCurriculum(false);
    setPipelineError(null);
    setProfilerResult(null);
    setModules([]);
    setMentorAlerts([]);

    appendLog(
      'Orchestrator',
      'handoff',
      `Initiating 4-agent collaboration for ${cleanName} targeting "${cleanRole}".`,
      `Skills: ${currentSkills.join(', ') || 'None'} · Certs: ${certifications.join(', ') || 'None'} · Projects: ${pastProjects.join(', ') || 'None'}`
    );

    try {
      // Step 1: Profiler Agent
      setActiveAgent('Profiler');
      appendLog(
        'Profiler',
        'running',
        `Evaluating skills, certifications, and past projects against "${cleanRole}" requirements...`
      );

      const profilerRes = await fetch('/api/agents/profiler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          currentSkills,
          certifications,
          pastProjects,
          targetRole: cleanRole,
        }),
      });

      const profilerJson = await profilerRes.json();
      if (!profilerRes.ok) {
        throw new Error(profilerJson.error || 'Profiler Agent failed to analyze skills.');
      }

      const typedProfiler = profilerJson as ProfilerResult;
      setProfilerResult(typedProfiler);
      setIsLoadingProfiler(false);

      appendLog(
        'Profiler',
        'handoff',
        `Analysis complete: ${typedProfiler.careerMatchPercent}% Career Match (${typedProfiler.verifiedSkills.length} verified, ${typedProfiler.missingSkills.length} missing).`,
        `Passing missing skills → Curriculum Architect Agent: ${typedProfiler.missingSkills.join(', ')}`
      );

      // Step 2: Curriculum Architect Agent
      setActiveAgent('Curriculum Architect');
      setIsLoadingCurriculum(true);
      appendLog(
        'Curriculum Architect',
        'running',
        'Sequencing missing skills into project-based roadmap modules...'
      );

      const curriculumRes = await fetch('/api/agents/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          targetRole: cleanRole,
          verifiedSkills: typedProfiler.verifiedSkills,
          missingSkills: typedProfiler.missingSkills,
        }),
      });

      const curriculumJson = await curriculumRes.json();
      if (!curriculumRes.ok) {
        throw new Error(
          curriculumJson.error || 'Curriculum Architect Agent failed to build roadmap.'
        );
      }

      const generatedModules = (curriculumJson.modules || []) as RoadmapModule[];
      setModules(generatedModules);
      setIsLoadingCurriculum(false);

      const totalHours = generatedModules.reduce((acc, m) => acc + m.estimatedHours, 0);
      appendLog(
        'Curriculum Architect',
        'handoff',
        `Sequenced ${generatedModules.length} adaptive modules (${totalHours} total hrs) with hands-on mini-projects.`,
        'Handing modules → Evaluator Agent (skill quizzes ready).'
      );

      appendLog(
        'Mentor',
        'completed',
        'Monitoring module mastery. Any quiz score below 70% will trigger an automatic Foundational Refresher.'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected agent pipeline error.';
      setPipelineError(msg);
      setIsLoadingProfiler(false);
      setIsLoadingCurriculum(false);
      appendLog('Orchestrator', 'error', 'Agent pipeline halted.', msg);
    } finally {
      setActiveAgent(null);
      setIsAnalyzing(false);
    }
  }, [name, skillsInput, certificationsInput, pastProjectsInput, targetRole, appendLog]);

  const handleTakeQuiz = useCallback(
    async (mod: RoadmapModule) => {
      setQuizModule(mod);
      setQuizData(null);
      setEvaluation(null);
      setQuizError(null);
      setIsGeneratingQuiz(true);
      setActiveAgent('Evaluator');

      appendLog(
        'Evaluator',
        'running',
        `Generating 3-question multiple-choice quiz for "${mod.title}"...`,
        `Topics: ${mod.keyTopics.join(' · ')}`
      );

      try {
        const res = await fetch('/api/agents/evaluator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetRole: targetRole.trim() || 'Developer',
            moduleId: mod.id,
            moduleTitle: mod.title,
            targetSkill: mod.targetSkill,
            keyTopics: mod.keyTopics,
            currentSkills: parseSkillsList(skillsInput),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Evaluator Agent failed to generate quiz.');
        }

        setQuizData(data as QuizData);
        appendLog(
          'Evaluator',
          'handoff',
          `3-question quiz ready for "${mod.title}".`,
          'Awaiting student submission → Mentor Agent ready to grade.'
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to generate quiz.';
        setQuizError(msg);
        appendLog('Evaluator', 'error', `Quiz generation failed for "${mod.title}".`, msg);
      } finally {
        setIsGeneratingQuiz(false);
        setActiveAgent(null);
      }
    },
    [targetRole, skillsInput, appendLog]
  );

  const handleSubmitQuiz = useCallback(
    async (selectedIndices: number[]) => {
      if (!quizModule || !quizData) return;

      setIsGradingQuiz(true);
      setQuizError(null);
      setActiveAgent('Mentor');

      appendLog(
        'Mentor',
        'running',
        `Grading quiz submission for "${quizModule.title}" against 70% mastery threshold...`
      );

      try {
        const res = await fetch('/api/agents/mentor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim() || 'Student',
            targetRole: targetRole.trim() || 'Developer',
            module: {
              id: quizModule.id,
              title: quizModule.title,
              targetSkill: quizModule.targetSkill,
              keyTopics: quizModule.keyTopics,
            },
            questions: quizData.questions,
            selectedIndices,
          }),
        });

        const result = (await res.json()) as MentorEvaluationResult & { error?: string };
        if (!res.ok) {
          throw new Error(result.error || 'Mentor Agent failed to grade quiz.');
        }

        setEvaluation(result);

        if (result.passed) {
          setModules((prev) =>
            prev.map((m) =>
              m.id === quizModule.id
                ? { ...m, completed: true, quizScore: result.scorePercent }
                : m
            )
          );
          appendLog(
            'Mentor',
            'completed',
            `Mastery verified on "${quizModule.title}" (${result.correctCount}/${result.totalCount} · ${result.scorePercent}%).`,
            'Marked module complete and increased Overall Career Readiness.'
          );
        } else if (result.refresherModule) {
          const refresherId = `refresher-${Date.now()}`;
          const newRefresher: RoadmapModule = {
            id: refresherId,
            title: result.refresherModule.title,
            targetSkill: result.refresherModule.targetSkill,
            estimatedHours: result.refresherModule.estimatedHours,
            keyTopics: result.refresherModule.keyTopics,
            recommendedCourses: result.refresherModule.recommendedCourses || [],
            miniProject: result.refresherModule.miniProject,
            completed: false,
            isRefresher: true,
            refresherForModuleId: quizModule.id,
          };

          // Insert Foundational Refresher right before the failed module
          setModules((prev) => {
            const idx = prev.findIndex((m) => m.id === quizModule.id);
            if (idx === -1) return [newRefresher, ...prev];
            const next = [...prev];
            next.splice(idx, 0, newRefresher);
            return next;
          });

          setMentorAlerts((prev) => [
            ...prev.filter((a) => a.failedModuleId !== quizModule.id),
            {
              failedModuleId: quizModule.id,
              failedModuleTitle: quizModule.title,
              refresherModuleId: refresherId,
              refresherTitle: newRefresher.title,
              scorePercent: result.scorePercent,
              correctCount: result.correctCount,
              totalCount: result.totalCount,
              struggleReason:
                result.struggleReason ||
                'Foundational prerequisite concepts need reinforcement before advancing.',
              feedbackSummary: result.feedbackSummary,
            },
          ]);

          appendLog(
            'Mentor',
            'alert',
            `Score ${result.scorePercent}% (${result.correctCount}/${result.totalCount}) is below 70% on "${quizModule.title}".`,
            `Inserted "${newRefresher.title}" immediately before "${quizModule.title}".`
          );
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to grade quiz.';
        setQuizError(msg);
        appendLog('Mentor', 'error', 'Quiz grading failed.', msg);
      } finally {
        setIsGradingQuiz(false);
        setActiveAgent(null);
      }
    },
    [quizModule, quizData, name, targetRole, appendLog]
  );

  const handleCloseQuiz = useCallback((scrollToRoadmap = false) => {
    setQuizModule(null);
    setQuizData(null);
    setEvaluation(null);
    setQuizError(null);
    if (scrollToRoadmap) {
      requestAnimationFrame(() => {
        document.getElementById('roadmap')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    }
  }, []);

  const handleDismissAlert = useCallback((failedModuleId: string) => {
    setMentorAlerts((prev) => prev.filter((a) => a.failedModuleId !== failedModuleId));
  }, []);

  const hasResults =
    profilerResult !== null ||
    modules.length > 0 ||
    isLoadingProfiler ||
    isLoadingCurriculum;

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100">
      <TopBar onLoadSample={handleLoadSample} isBusy={isAnalyzing} />

      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Overall Career Readiness Progress Bar */}
        <ReadinessHeader
          studentName={name.trim()}
          targetRole={targetRole.trim()}
          modules={modules}
          careerMatchPercent={profilerResult?.careerMatchPercent ?? null}
        />

        {/* Two-column Workspace: Main Content (Left) + Agent Collaboration Log (Right) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          <div className="space-y-6 lg:col-span-8">
            <ProfileControls
              name={name}
              skillsInput={skillsInput}
              certificationsInput={certificationsInput}
              pastProjectsInput={pastProjectsInput}
              targetRole={targetRole}
              onNameChange={setName}
              onSkillsChange={setSkillsInput}
              onCertificationsChange={setCertificationsInput}
              onPastProjectsChange={setPastProjectsInput}
              onTargetRoleChange={setTargetRole}
              onAnalyze={handleAnalyzeAndBuild}
              isAnalyzing={isAnalyzing}
            />

            {pipelineError && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 text-rose-400 shrink-0" aria-hidden="true" />
                <div>
                  <div className="font-semibold text-rose-100">Agent Pipeline Error</div>
                  <p className="mt-0.5 text-xs text-rose-200/90">{pipelineError}</p>
                </div>
              </div>
            )}

            {!hasResults ? (
              <section
                aria-label="How KairoPath Works"
                className="rounded-xl border border-slate-800/90 bg-[#111827] p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-5">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-slate-100">
                      Four Collaborating AI Agents
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Load the sample student profile or enter your own skills and target role to begin.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="inline-flex items-center gap-2 rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  >
                    <UserCheck className="h-4 w-4" aria-hidden="true" />
                    <span>Load Sample Student (Alex)</span>
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {AGENT_OVERVIEW.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.step}
                        className="rounded-lg border border-slate-800/90 bg-[#0B0F17] p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-semibold text-sky-400 tabular-nums">
                            {item.step}. {item.name}
                          </span>
                          <Icon className="h-4 w-4 text-slate-500" aria-hidden="true" />
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-slate-400">
                          {item.role}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : (
              <>
                <SkillGapPanel
                  profilerResult={profilerResult}
                  targetRole={targetRole.trim()}
                  isLoading={isLoadingProfiler}
                />

                <RoadmapPanel
                  modules={modules}
                  mentorAlerts={mentorAlerts}
                  isLoading={isLoadingCurriculum}
                  onTakeQuiz={handleTakeQuiz}
                  onDismissAlert={handleDismissAlert}
                />
              </>
            )}
          </div>

          {/* Right Panel: Live Agent Collaboration Log */}
          <div className="lg:col-span-4">
            <AgentLogPanel
              logs={logs}
              activeAgent={activeAgent}
              onClearLogs={() => setLogs([])}
            />
          </div>
        </div>
      </main>

      <QuizModal
        module={quizModule}
        quizData={quizData}
        isGenerating={isGeneratingQuiz}
        isGrading={isGradingQuiz}
        evaluation={evaluation}
        error={quizError}
        onSubmitAnswers={handleSubmitQuiz}
        onClose={handleCloseQuiz}
      />
    </div>
  );
}
