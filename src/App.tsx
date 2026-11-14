import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  ClipboardCheck,
  Compass,
  Radar,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { AgentLogPanel } from './components/AgentLogPanel';
import { AgentPipelineVisualizer } from './components/AgentPipelineVisualizer';
import { HowItWorksModal } from './components/HowItWorksModal';
import { MentorChatDrawer } from './components/MentorChatDrawer';
import { MissionBriefingOverlay } from './components/MissionBriefingOverlay';
import { ProfileControls } from './components/ProfileControls';
import { ProjectSandboxModal } from './components/ProjectSandboxModal';
import { QuizModal } from './components/QuizModal';
import { ReadinessGauge } from './components/ReadinessGauge';
import { RoadmapPanel } from './components/RoadmapPanel';
import { ScreenSwitcher, type WorkspaceScreen } from './components/ScreenSwitcher';
import { SkillGapPanel } from './components/SkillGapPanel';
import { StarkHudBackground } from './components/StarkHudBackground';
import { StudyChecklistCard, type StudyTask } from './components/StudyChecklistCard';
import { TopBar } from './components/TopBar';
import type {
  AgentLogEntry,
  AgentLogStatus,
  AgentName,
  MentorAlert,
  MentorChatMessage,
  MentorChatResponse,
  MentorEvaluationResult,
  ProfilerResult,
  ProjectReviewResult,
  QuizData,
  RoadmapModule,
} from './types';
import { downloadRoadmapMarkdown } from './utils/exportRoadmap';
import { computeSkillRadarDimensions } from './utils/radarMetrics';

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
    role: 'Compares your current skills, certifications, and past projects against real-world target role benchmarks.',
    icon: ShieldCheck,
  },
  {
    step: '02',
    name: 'Curriculum Architect',
    role: 'Sequences missing skills into a project-driven learning roadmap with curated courses and tutorials.',
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
    role: 'Grades quizzes, diagnoses struggles below 70%, injects refreshers, and refines your roadmap via live chat.',
    icon: BookOpen,
  },
];

interface PipelineOverrides {
  name?: string;
  currentSkills?: string[];
  certifications?: string[];
  pastProjects?: string[];
  targetRole?: string;
}

export default function App() {
  // Profile state
  const [name, setName] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [certificationsInput, setCertificationsInput] = useState('');
  const [pastProjectsInput, setPastProjectsInput] = useState('');
  const [targetRole, setTargetRole] = useState('');

  // Active workspace screen (button-driven multi-screen navigation)
  const [activeScreen, setActiveScreen] = useState<WorkspaceScreen>('profile');

  // Pipeline state
  const [activeAgent, setActiveAgent] = useState<AgentName | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtractingBio, setIsExtractingBio] = useState(false);
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

  // Floating Mentor Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<MentorChatMessage[]>([]);
  const [isChatSending, setIsChatSending] = useState(false);

  // Interactive Guide Modal & Weekly Study Pace state
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [weeklyHours, setWeeklyHours] = useState(15);

  // Mission Briefing first-load overlay & 0.7s HUD boot-up state
  const [showBriefing, setShowBriefing] = useState(() => {
    try {
      return sessionStorage.getItem('kairopath.briefingDismissed.v1') !== '1';
    } catch {
      return true;
    }
  });
  const [isBootingWorkspace, setIsBootingWorkspace] = useState(false);
  const [workspaceBootKey, setWorkspaceBootKey] = useState(0);

  // Mini-Project / Code Check Sandbox state
  const [sandboxModule, setSandboxModule] = useState<RoadmapModule | null>(null);
  const [isReviewingProject, setIsReviewingProject] = useState(false);
  const [projectReview, setProjectReview] = useState<ProjectReviewResult | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);

  // Daily Study Action Checklist (localStorage persisted)
  const [isChecklistOpen, setIsChecklistOpen] = useState(true);
  const [studyTasks, setStudyTasks] = useState<StudyTask[]>(() => {
    try {
      const saved = localStorage.getItem('kairopath.studyChecklist.v1');
      return saved ? (JSON.parse(saved) as StudyTask[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('kairopath.studyChecklist.v1', JSON.stringify(studyTasks));
    } catch {
      // Ignore storage quota errors
    }
  }, [studyTasks]);

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
    setActiveScreen('profile');
    appendLog(
      'Orchestrator',
      'completed',
      'Loaded sample student profile: Alex (Full Stack Developer).',
      'Skills: Python, SQL, HTML · Certs: AWS Cloud Practitioner · Projects: CLI Task Manager in Python, SQL Inventory DB'
    );
  }, [appendLog]);

  const runAnalysisPipeline = useCallback(
    async (overrides?: PipelineOverrides) => {
      const cleanRole = (overrides?.targetRole ?? targetRole).trim();
      if (!cleanRole || isAnalyzing) return;

      const cleanName = (overrides?.name ?? name).trim() || 'Student';
      const currentSkills = overrides?.currentSkills ?? parseSkillsList(skillsInput);
      const certifications = overrides?.certifications ?? parseSkillsList(certificationsInput);
      const pastProjects = overrides?.pastProjects ?? parseSkillsList(pastProjectsInput);

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

        // Automatically transition to [02. Skill Gap & Radar] once analysis completes
        setActiveScreen('radar');
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
    },
    [
      targetRole,
      isAnalyzing,
      name,
      skillsInput,
      certificationsInput,
      pastProjectsInput,
      appendLog,
    ]
  );

  const handleAnalyzeAndBuild = useCallback(() => {
    void runAnalysisPipeline();
  }, [runAnalysisPipeline]);

  const handleQuickSwitchRole = useCallback(
    (newRole: string) => {
      setTargetRole(newRole);
      void runAnalysisPipeline({ targetRole: newRole });
    },
    [runAnalysisPipeline]
  );

  const handleLaunchSampleDemo = useCallback(() => {
    setIsGuideOpen(false);
    handleLoadSample();
    void runAnalysisPipeline({
      name: 'Alex',
      currentSkills: ['Python', 'SQL', 'HTML'],
      certifications: ['AWS Cloud Practitioner'],
      pastProjects: ['CLI Task Manager in Python', 'SQL Inventory DB'],
      targetRole: 'Full Stack Developer',
    });
  }, [handleLoadSample, runAnalysisPipeline]);

  const handleExtractBio = useCallback(
    async (rawText: string) => {
      setIsExtractingBio(true);
      setActiveAgent('Profiler');
      setPipelineError(null);
      appendLog(
        'Profiler',
        'running',
        'Extracting structured student profile from pasted resume / bio...'
      );

      try {
        const res = await fetch('/api/agents/parse-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawText }),
        });

        const data = (await res.json()) as {
          name: string;
          currentSkills: string[];
          certifications: string[];
          pastProjects: string[];
          targetRole: string;
          error?: string;
        };

        if (!res.ok) {
          throw new Error(data.error || 'Profiler Agent could not parse bio.');
        }

        const extractedName = data.name || 'Student';
        const extractedSkills = data.currentSkills || [];
        const extractedCerts = data.certifications || [];
        const extractedProjects = data.pastProjects || [];
        const extractedRole = data.targetRole || 'Full Stack Developer';

        setName(extractedName);
        setSkillsInput(extractedSkills.join(', '));
        setCertificationsInput(extractedCerts.join(', '));
        setPastProjectsInput(extractedProjects.join(', '));
        setTargetRole(extractedRole);

        appendLog(
          'Profiler',
          'completed',
          `Extracted profile for ${extractedName} (${extractedRole}).`,
          `Skills: ${extractedSkills.join(', ') || 'None'} · Certs: ${extractedCerts.join(', ') || 'None'}`
        );

        setIsExtractingBio(false);
        setActiveAgent(null);

        await runAnalysisPipeline({
          name: extractedName,
          currentSkills: extractedSkills,
          certifications: extractedCerts,
          pastProjects: extractedProjects,
          targetRole: extractedRole,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to extract resume/bio.';
        setPipelineError(msg);
        appendLog('Profiler', 'error', 'Bio extraction failed.', msg);
        setIsExtractingBio(false);
        setActiveAgent(null);
      }
    },
    [appendLog, runAnalysisPipeline]
  );

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
            'Marked module complete, boosted Skill Radar, and updated Readiness Speedometer.'
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

  const handleOpenSandbox = useCallback((mod: RoadmapModule) => {
    setSandboxModule(mod);
    setProjectReview(null);
    setProjectError(null);
  }, []);

  const handleSubmitProject = useCallback(
    async (submission: string) => {
      if (!sandboxModule) return;
      setIsReviewingProject(true);
      setProjectError(null);
      setActiveAgent('Evaluator');
      appendLog(
        'Evaluator',
        'running',
        `Reviewing Mini-Project / Code Check for "${sandboxModule.miniProject.title}"...`
      );

      try {
        const res = await fetch('/api/agents/review-project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim() || 'Student',
            targetRole: targetRole.trim() || 'Developer',
            module: {
              id: sandboxModule.id,
              title: sandboxModule.title,
              targetSkill: sandboxModule.targetSkill,
              miniProject: sandboxModule.miniProject,
            },
            submission,
          }),
        });
        const data = (await res.json()) as ProjectReviewResult & { error?: string };
        if (!res.ok) {
          throw new Error(data.error || 'Failed to review mini-project.');
        }

        setProjectReview(data);
        if (data.verified) {
          setModules((prev) =>
            prev.map((m) =>
              m.id === sandboxModule.id
                ? { ...m, portfolioVerified: true, portfolioScore: data.scorePercent }
                : m
            )
          );
          appendLog(
            'Mentor',
            'completed',
            `Portfolio Verified on "${sandboxModule.miniProject.title}" (${data.scorePercent}%).`,
            data.summary
          );
        } else {
          appendLog(
            'Mentor',
            'alert',
            `Code Check scored ${data.scorePercent}% on "${sandboxModule.miniProject.title}".`,
            data.improvementTip
          );
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unable to review submission.';
        setProjectError(msg);
        appendLog('Evaluator', 'error', 'Mini-Project review failed.', msg);
      } finally {
        setIsReviewingProject(false);
        setActiveAgent(null);
      }
    },
    [sandboxModule, name, targetRole, appendLog]
  );

  const handleSendChatMessage = useCallback(
    async (text: string) => {
      const userMsg: MentorChatMessage = {
        id: `chat-user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: formatTimestamp(),
      };

      setChatMessages((prev) => [...prev, userMsg]);
      setIsChatSending(true);
      setActiveAgent('Mentor');

      try {
        const lastAlert =
          mentorAlerts.length > 0 ? mentorAlerts[mentorAlerts.length - 1] : null;

        const res = await fetch('/api/agents/mentor-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            studentProfile: {
              name: name.trim() || 'Student',
              currentSkills: parseSkillsList(skillsInput),
              certifications: parseSkillsList(certificationsInput),
              pastProjects: parseSkillsList(pastProjectsInput),
              targetRole: targetRole.trim() || 'Full Stack Developer',
            },
            profilerResult,
            modules,
            lastFailedAlert: lastAlert,
            chatHistory: chatMessages.slice(-6).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        const data = (await res.json()) as MentorChatResponse & { error?: string };
        if (!res.ok) {
          throw new Error(data.error || 'Kairo Mentor failed to respond.');
        }

        let updated = false;
        if (data.shouldUpdateRoadmap && Array.isArray(data.updatedModules) && data.updatedModules.length > 0) {
          setModules(data.updatedModules);
          setActiveScreen('roadmap');
          updated = true;
          appendLog(
            'Mentor',
            'handoff',
            `Refined active roadmap via live chat (${data.updatedModules.length} modules).`,
            `Request: "${text}"`
          );
        } else {
          appendLog('Mentor', 'completed', 'Answered live coaching question in Kairo Mentor chat.');
        }

        const mentorMsg: MentorChatMessage = {
          id: `chat-mentor-${Date.now()}`,
          role: 'mentor',
          content: data.reply,
          timestamp: formatTimestamp(),
          roadmapUpdated: updated,
        };
        setChatMessages((prev) => [...prev, mentorMsg]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unable to reach Kairo Mentor.';
        setChatMessages((prev) => [
          ...prev,
          {
            id: `chat-err-${Date.now()}`,
            role: 'mentor',
            content: `Error: ${msg}`,
            timestamp: formatTimestamp(),
          },
        ]);
      } finally {
        setIsChatSending(false);
        setActiveAgent(null);
      }
    },
    [
      mentorAlerts,
      name,
      skillsInput,
      certificationsInput,
      pastProjectsInput,
      targetRole,
      profilerResult,
      modules,
      chatMessages,
      appendLog,
    ]
  );

  const handleCloseQuiz = useCallback((scrollToRoadmap = false) => {
    setQuizModule(null);
    setQuizData(null);
    setEvaluation(null);
    setQuizError(null);
    if (scrollToRoadmap) {
      setActiveScreen('roadmap');
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

  const completedModulesCount = useMemo(
    () => modules.filter((m) => m.completed).length,
    [modules]
  );

  const radarDimensions = useMemo(
    () =>
      computeSkillRadarDimensions({
        targetRole: targetRole.trim() || 'Full Stack Developer',
        currentSkills: parseSkillsList(skillsInput),
        certifications: parseSkillsList(certificationsInput),
        pastProjects: parseSkillsList(pastProjectsInput),
        profilerResult,
        modules,
      }),
    [
      targetRole,
      skillsInput,
      certificationsInput,
      pastProjectsInput,
      profilerResult,
      modules,
    ]
  );

  const handleExportRoadmap = useCallback(() => {
    if (modules.length === 0 && !profilerResult) return;
    downloadRoadmapMarkdown({
      studentName: name.trim() || 'Student',
      targetRole: targetRole.trim() || 'Target Role',
      currentSkills: parseSkillsList(skillsInput),
      certifications: parseSkillsList(certificationsInput),
      pastProjects: parseSkillsList(pastProjectsInput),
      profilerResult,
      modules,
    });
    appendLog(
      'Orchestrator',
      'completed',
      'Exported Career Readiness & Adaptive Learning Roadmap (.md).',
      `Included ${modules.length} modules and Skill Gap summary for ${targetRole.trim() || 'Target Role'}.`
    );
  }, [
    modules,
    profilerResult,
    name,
    targetRole,
    skillsInput,
    certificationsInput,
    pastProjectsInput,
    appendLog,
  ]);

  const hasRadarContent = profilerResult !== null || isLoadingProfiler;
  const hasRoadmapContent = modules.length > 0 || isLoadingCurriculum;

  const goToScreen = useCallback((screen: WorkspaceScreen) => {
    setActiveScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleToggleChecklist = useCallback(() => {
    if (activeScreen !== 'profile') {
      setActiveScreen('profile');
      setIsChecklistOpen(true);
      requestAnimationFrame(() => {
        document.getElementById('study-checklist')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    } else {
      setIsChecklistOpen((prev) => !prev);
    }
  }, [activeScreen]);

  const handleAddStudyTask = useCallback((text: string) => {
    setStudyTasks((prev) => [...prev, { id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text, done: false }]);
  }, []);

  const handleToggleStudyTask = useCallback((id: string) => {
    setStudyTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const handleDeleteStudyTask = useCallback((id: string) => {
    setStudyTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleClearCompletedTasks = useCallback(() => {
    setStudyTasks((prev) => prev.filter((t) => !t.done));
  }, []);

  const handleAutoFillTasks = useCallback(() => {
    if (modules.length === 0) return;
    setStudyTasks((prev) => {
      const existing = new Set(prev.map((t) => t.text.toLowerCase()));
      const next = [...prev];
      modules.forEach((mod, idx) => {
        const step = idx + 1;
        const candidates = [
          `Complete Module ${step} Quiz: ${mod.title}`,
          `Build Mini-Project: ${mod.miniProject.title}`,
        ];
        for (const text of candidates) {
          if (!existing.has(text.toLowerCase())) {
            existing.add(text.toLowerCase());
            next.push({ id: `task-${Date.now()}-${next.length}`, text, done: false });
          }
        }
      });
      return next;
    });
  }, [modules]);

  const pendingTasksCount = useMemo(() => studyTasks.filter((t) => !t.done).length, [studyTasks]);

  const handleEnterWorkspace = useCallback(
    (launchDemo: boolean) => {
      if (isBootingWorkspace) return;
      try {
        sessionStorage.setItem('kairopath.briefingDismissed.v1', '1');
      } catch {
        // Ignore storage errors
      }
      setIsBootingWorkspace(true);
      setWorkspaceBootKey((k) => k + 1);
      if (launchDemo) {
        handleLaunchSampleDemo();
      }
      window.setTimeout(() => {
        setShowBriefing(false);
        setIsBootingWorkspace(false);
      }, 700);
    },
    [isBootingWorkspace, handleLaunchSampleDemo]
  );

  const handleReplayIntro = useCallback(() => {
    setIsBootingWorkspace(false);
    setShowBriefing(true);
  }, []);

  return (
    <div className="hud-canvas-bg relative min-h-screen overflow-x-clip text-slate-100">
      <StarkHudBackground />

      {showBriefing && (
        <MissionBriefingOverlay
          isBooting={isBootingWorkspace}
          onInitialize={() => handleEnterWorkspace(false)}
          onLaunchInstantDemo={() => handleEnterWorkspace(true)}
        />
      )}

      <TopBar
        onReplayIntro={handleReplayIntro}
        onOpenGuide={() => setIsGuideOpen(true)}
        onLoadSample={handleLoadSample}
        onExportRoadmap={handleExportRoadmap}
        onToggleChecklist={handleToggleChecklist}
        isChecklistOpen={activeScreen === 'profile' && isChecklistOpen}
        pendingTasksCount={pendingTasksCount}
        canExport={modules.length > 0 || profilerResult !== null}
        isBusy={isAnalyzing || isExtractingBio}
      />

      <main
        key={workspaceBootKey}
        className={`relative z-10 mx-auto max-w-[1280px] px-4 py-5 sm:px-6 lg:px-8 space-y-4 pb-24 ${
          workspaceBootKey > 0 ? 'hud-workspace-boot' : ''
        }`}
      >
        {/* Compact Top Readiness Telemetry Bar */}
        <div className="hud-stagger-1">
          <ReadinessGauge
            studentName={name.trim()}
            targetRole={targetRole.trim()}
            modules={modules}
            profilerResult={profilerResult}
            weeklyHours={weeklyHours}
            onWeeklyHoursChange={setWeeklyHours}
          />
        </div>

        {/* 4 Prominent Screen-Switcher Buttons */}
        <div className="hud-stagger-2">
          <ScreenSwitcher
            activeScreen={activeScreen}
            onSelectScreen={goToScreen}
            verifiedCount={profilerResult?.verifiedSkills.length ?? 0}
            missingCount={profilerResult?.missingSkills.length ?? 0}
            hasProfilerResult={profilerResult !== null}
            modulesCount={modules.length}
            logsCount={logs.length}
          />
        </div>

        {/* Compact 4-Agent Collaboration Pipeline Strip */}
        <div className="hud-stagger-3">
          <AgentPipelineVisualizer
            activeAgent={activeAgent}
            hasProfilerResult={profilerResult !== null}
            hasRoadmap={modules.length > 0}
            hasPassedQuiz={completedModulesCount > 0}
            hasMentorAlert={mentorAlerts.length > 0}
          />
        </div>

        {pipelineError && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-rose-400/50 bg-slate-950/70 backdrop-blur-md p-4 text-sm text-rose-100"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 text-rose-400 shrink-0" aria-hidden="true" />
            <div>
              <div className="font-semibold text-rose-100">Agent Pipeline Error</div>
              <p className="mt-0.5 text-xs text-rose-200/90">{pipelineError}</p>
            </div>
          </div>
        )}

        {/* Active Screen Container with HUD Boot-Up & Holographic Scanline Sweep */}
        <div key={activeScreen} className="hud-stagger-4 relative overflow-hidden rounded-xl">
          <div
            aria-hidden="true"
            className="hud-scan-sweep pointer-events-none absolute inset-x-0 top-0 z-20 h-24 bg-gradient-to-b from-transparent via-[#00E5FF]/15 to-transparent"
          />

          {/* SCREEN 01: Student Profile & Goal */}
          {activeScreen === 'profile' && (
            <div className="space-y-4">
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
                onQuickSwitchRole={handleQuickSwitchRole}
                onExtractBio={handleExtractBio}
                onAnalyze={handleAnalyzeAndBuild}
                isAnalyzing={isAnalyzing}
                isExtractingBio={isExtractingBio}
                highlightNextAction={!profilerResult}
              />

              {isChecklistOpen && (
                <StudyChecklistCard
                  tasks={studyTasks}
                  modules={modules}
                  onAddTask={handleAddStudyTask}
                  onToggleTask={handleToggleStudyTask}
                  onDeleteTask={handleDeleteStudyTask}
                  onClearCompleted={handleClearCompletedTasks}
                  onAutoFillFromRoadmap={handleAutoFillTasks}
                />
              )}

              {!profilerResult && (
                <section aria-label="4 Collaborating AI Agents" className="studio-panel rounded-xl p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#00E5FF]">
                      How KairoPath Works Under the Hood
                    </span>
                    <button
                      type="button"
                      onClick={handleLoadSample}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#00E5FF]/50 bg-cyan-500/15 px-3.5 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/25 transition-colors whitespace-nowrap"
                    >
                      <UserCheck className="h-3.5 w-3.5 text-[#00E5FF]" aria-hidden="true" />
                      <span>Load Sample Student (Alex)</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {AGENT_OVERVIEW.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.step}
                          className="rounded-xl border border-cyan-400/25 bg-slate-950/55 backdrop-blur-md p-3.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-semibold text-[#00E5FF] tabular-nums">
                              {item.step}. {item.name}
                            </span>
                            <Icon className="h-3.5 w-3.5 text-sky-300" aria-hidden="true" />
                          </div>
                          <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                            {item.role}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* SCREEN 02: Skill Gap & Radar */}
          {activeScreen === 'radar' && (
            hasRadarContent ? (
              <SkillGapPanel
                profilerResult={profilerResult}
                radarDimensions={radarDimensions}
                completedModulesCount={completedModulesCount}
                targetRole={targetRole.trim()}
                isLoading={isLoadingProfiler}
                onGoToRoadmap={() => goToScreen('roadmap')}
                modulesCount={modules.length}
              />
            ) : (
              <section className="studio-panel rounded-xl p-10 text-center">
                <Radar className="mx-auto h-9 w-9 text-[#00E5FF]" aria-hidden="true" />
                <h2 className="mt-3 font-display text-base font-bold text-slate-50">
                  Skill Gap &amp; Competency Radar Standby
                </h2>
                <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-slate-300">
                  Configure your skills or pick a Role Switcher chip on Screen 01 to run the Profiler Agent and populate your 5-axis skill radar.
                </p>
                <button
                  type="button"
                  onClick={() => goToScreen('profile')}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#00E5FF] to-sky-400 px-5 py-2 text-xs font-bold text-slate-950 shadow-[0_0_22px_-4px_rgba(0,229,255,0.65)] hover:from-cyan-300 hover:to-sky-300 transition-all"
                >
                  <span>Go to 01. Student Profile &amp; Goal</span>
                </button>
              </section>
            )
          )}

          {/* SCREEN 03: Adaptive Roadmap */}
          {activeScreen === 'roadmap' && (
            hasRoadmapContent ? (
              <RoadmapPanel
                modules={modules}
                mentorAlerts={mentorAlerts}
                isLoading={isLoadingCurriculum}
                onTakeQuiz={handleTakeQuiz}
                onOpenSandbox={handleOpenSandbox}
                onDismissAlert={handleDismissAlert}
                highlightActiveQuiz={true}
              />
            ) : (
              <section className="studio-panel rounded-xl p-10 text-center">
                <Compass className="mx-auto h-9 w-9 text-[#00E5FF]" aria-hidden="true" />
                <h2 className="mt-3 font-display text-base font-bold text-slate-50">
                  Adaptive Roadmap Standby
                </h2>
                <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-slate-300">
                  Run &ldquo;Analyze &amp; Build Path&rdquo; on Screen 01 (or generate a quick Full Stack roadmap now) to view your Career Milestone Timeline.
                </p>
                <button
                  type="button"
                  onClick={() => handleQuickSwitchRole(targetRole.trim() || 'Full Stack Developer')}
                  disabled={isAnalyzing}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#00E5FF] to-sky-400 px-5 py-2 text-xs font-bold text-slate-950 shadow-[0_0_22px_-4px_rgba(0,229,255,0.65)] hover:from-cyan-300 hover:to-sky-300 transition-all"
                >
                  <span>Generate Roadmap Now</span>
                </button>
              </section>
            )
          )}

          {/* SCREEN 04: Live Agent Telemetry */}
          {activeScreen === 'telemetry' && (
            <AgentLogPanel
              logs={logs}
              activeAgent={activeAgent}
              onClearLogs={() => setLogs([])}
            />
          )}
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

      <MentorChatDrawer
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen((prev) => !prev)}
        messages={chatMessages}
        isSending={isChatSending}
        onSendMessage={handleSendChatMessage}
      />

      <HowItWorksModal
        isOpen={isGuideOpen}
        isBusy={isAnalyzing || isExtractingBio}
        onClose={() => setIsGuideOpen(false)}
        onLaunchDemo={handleLaunchSampleDemo}
      />

      <ProjectSandboxModal
        module={sandboxModule}
        isReviewing={isReviewingProject}
        review={projectReview}
        error={projectError}
        onSubmitSolution={handleSubmitProject}
        onClose={() => {
          setSandboxModule(null);
          setProjectReview(null);
          setProjectError(null);
        }}
      />
    </div>
  );
}
