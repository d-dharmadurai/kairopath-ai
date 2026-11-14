export type AgentName =
  | 'Orchestrator'
  | 'Profiler'
  | 'Curriculum Architect'
  | 'Evaluator'
  | 'Mentor';

export type AgentLogStatus =
  | 'running'
  | 'completed'
  | 'handoff'
  | 'alert'
  | 'error';

export interface AgentLogEntry {
  id: string;
  timestamp: string;
  agent: AgentName;
  status: AgentLogStatus;
  message: string;
  detail?: string;
}

export interface StudentProfile {
  name: string;
  currentSkills: string[];
  certifications: string[];
  pastProjects: string[];
  targetRole: string;
}

export interface ProfilerResult {
  verifiedSkills: string[];
  missingSkills: string[];
  careerMatchPercent: number;
  summary: string;
}

export interface MiniProject {
  title: string;
  description: string;
}

export interface RecommendedCourse {
  title: string;
  platform: string;
  format: string;
}

export interface RoadmapModule {
  id: string;
  title: string;
  targetSkill: string;
  estimatedHours: number;
  keyTopics: string[];
  recommendedCourses: RecommendedCourse[];
  miniProject: MiniProject;
  completed: boolean;
  quizScore?: number;
  portfolioVerified?: boolean;
  portfolioScore?: number;
  isRefresher?: boolean;
  refresherForModuleId?: string;
}

export interface ProjectReviewResult {
  scorePercent: number;
  verified: boolean;
  summary: string;
  strengths: string[];
  improvementTip: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizData {
  moduleId: string;
  moduleTitle: string;
  questions: QuizQuestion[];
}

export interface MentorAlert {
  failedModuleId: string;
  failedModuleTitle: string;
  refresherModuleId: string;
  refresherTitle: string;
  scorePercent: number;
  correctCount: number;
  totalCount: number;
  struggleReason: string;
  feedbackSummary: string;
}

export interface MentorEvaluationResult {
  scorePercent: number;
  correctCount: number;
  totalCount: number;
  passed: boolean;
  feedbackSummary: string;
  struggleReason?: string;
  refresherModule?: {
    title: string;
    targetSkill: string;
    estimatedHours: number;
    keyTopics: string[];
    recommendedCourses: RecommendedCourse[];
    miniProject: MiniProject;
  };
}

export interface MentorChatMessage {
  id: string;
  role: 'user' | 'mentor';
  content: string;
  timestamp: string;
  roadmapUpdated?: boolean;
}

export interface MentorChatResponse {
  reply: string;
  shouldUpdateRoadmap: boolean;
  updatedModules?: RoadmapModule[];
}

