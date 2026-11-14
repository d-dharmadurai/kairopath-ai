import type { ProfilerResult, RoadmapModule } from '../types';

export interface RadarDimension {
  key: 'frontend' | 'backend' | 'databases' | 'cloud' | 'architecture';
  label: string;
  shortLabel: string;
  current: number;
  target: number;
}

const ROLE_TARGETS: Record<
  string,
  Record<RadarDimension['key'], number>
> = {
  fullstack: {
    frontend: 90,
    backend: 90,
    databases: 82,
    cloud: 72,
    architecture: 84,
  },
  data: {
    frontend: 35,
    backend: 85,
    databases: 96,
    cloud: 86,
    architecture: 82,
  },
  aiml: {
    frontend: 40,
    backend: 88,
    databases: 80,
    cloud: 78,
    architecture: 86,
  },
  devops: {
    frontend: 30,
    backend: 74,
    databases: 70,
    cloud: 96,
    architecture: 90,
  },
  default: {
    frontend: 78,
    backend: 84,
    databases: 78,
    cloud: 74,
    architecture: 82,
  },
};

const DIMENSION_KEYWORDS: Record<RadarDimension['key'], string[]> = {
  frontend: [
    'html',
    'css',
    'javascript',
    'typescript',
    'react',
    'next',
    'vue',
    'angular',
    'tailwind',
    'ui',
    'ux',
    'dom',
    'frontend',
    'web',
    'accessibility',
    'responsive',
  ],
  backend: [
    'python',
    'node',
    'express',
    'fastapi',
    'django',
    'flask',
    'java',
    'go',
    'rust',
    'api',
    'rest',
    'graphql',
    'backend',
    'cli',
    'server',
    'microservices',
    'pytorch',
    'tensorflow',
    'ml',
    'llm',
    'rag',
    'pandas',
    'spark',
    'airflow',
  ],
  databases: [
    'sql',
    'postgres',
    'postgresql',
    'mysql',
    'mongodb',
    'redis',
    'database',
    'db',
    'warehouse',
    'snowflake',
    'bigquery',
    'dbt',
    'etl',
    'elt',
    'schema',
    'orm',
    'vector',
    'data modeling',
    'inventory',
  ],
  cloud: [
    'aws',
    'gcp',
    'azure',
    'cloud',
    'docker',
    'kubernetes',
    'k8s',
    'terraform',
    'iac',
    'ci/cd',
    'cicd',
    'github actions',
    'linux',
    'bash',
    'devops',
    'deploy',
    'serverless',
    'monitoring',
    'observability',
  ],
  architecture: [
    'architecture',
    'system design',
    'testing',
    'test',
    'jest',
    'vitest',
    'pytest',
    'git',
    'security',
    'auth',
    'oauth',
    'performance',
    'scalability',
    'tdd',
    'mlops',
    'evaluation',
    'observability',
    'capstone',
    'patterns',
  ],
};

function getTargetVector(targetRole: string): Record<RadarDimension['key'], number> {
  const lower = targetRole.toLowerCase();
  if (lower.includes('data')) return ROLE_TARGETS.data;
  if (lower.includes('ai') || lower.includes('ml') || lower.includes('machine learning')) {
    return ROLE_TARGETS.aiml;
  }
  if (lower.includes('devops') || lower.includes('cloud') || lower.includes('sre')) {
    return ROLE_TARGETS.devops;
  }
  if (lower.includes('full stack') || lower.includes('fullstack') || lower.includes('frontend')) {
    return ROLE_TARGETS.fullstack;
  }
  return ROLE_TARGETS.default;
}

function classifyTextToDimensions(text: string): RadarDimension['key'][] {
  const lower = text.toLowerCase();
  const matched: RadarDimension['key'][] = [];
  (Object.keys(DIMENSION_KEYWORDS) as RadarDimension['key'][]).forEach((dim) => {
    if (DIMENSION_KEYWORDS[dim].some((kw) => lower.includes(kw))) {
      matched.push(dim);
    }
  });
  return matched.length > 0 ? matched : ['architecture'];
}

export function computeSkillRadarDimensions(params: {
  targetRole: string;
  currentSkills: string[];
  certifications: string[];
  pastProjects: string[];
  profilerResult: ProfilerResult | null;
  modules: RoadmapModule[];
}): RadarDimension[] {
  const {
    targetRole,
    currentSkills,
    certifications,
    pastProjects,
    profilerResult,
    modules,
  } = params;

  const targets = getTargetVector(targetRole);
  const baseScores: Record<RadarDimension['key'], number> = {
    frontend: 16,
    backend: 18,
    databases: 16,
    cloud: 14,
    architecture: 18,
  };

  // Credit verified skills, raw skills, certifications, and past projects
  const verifiedTokens = profilerResult
    ? profilerResult.verifiedSkills
    : currentSkills;

  const positiveEvidence = [
    ...verifiedTokens,
    ...certifications,
    ...pastProjects,
  ];

  positiveEvidence.forEach((item) => {
    const dims = classifyTextToDimensions(item);
    dims.forEach((dim, i) => {
      baseScores[dim] += i === 0 ? 22 : 12;
    });
  });

  // Factor in careerMatchPercent to calibrate overall baseline reasonably
  if (profilerResult) {
    const missingDims = new Set<RadarDimension['key']>();
    profilerResult.missingSkills.forEach((gap) => {
      classifyTextToDimensions(gap).forEach((d) => missingDims.add(d));
    });

    (Object.keys(baseScores) as RadarDimension['key'][]).forEach((dim) => {
      if (missingDims.has(dim)) {
        // Ensure a visible gap exists on dimensions that still have missing skills
        baseScores[dim] = Math.min(baseScores[dim], Math.max(22, targets[dim] - 32));
      } else {
        baseScores[dim] = Math.min(92, Math.max(baseScores[dim], Math.round(targets[dim] * 0.72)));
      }
    });
  }

  // Apply dynamic boost from every completed quiz module!
  modules
    .filter((m) => m.completed)
    .forEach((mod) => {
      const combined = `${mod.targetSkill} ${mod.title} ${mod.keyTopics.join(' ')}`;
      const dims = classifyTextToDimensions(combined);
      const scoreFactor = (mod.quizScore ?? 85) / 100;
      dims.forEach((dim, idx) => {
        const boost = Math.round((idx === 0 ? 32 : 16) * scoreFactor);
        baseScores[dim] = Math.min(98, baseScores[dim] + boost);
      });
    });

  const clamp = (n: number) => Math.max(10, Math.min(98, Math.round(n)));

  return [
    {
      key: 'frontend',
      label: 'Frontend',
      shortLabel: 'Frontend',
      current: clamp(baseScores.frontend),
      target: targets.frontend,
    },
    {
      key: 'backend',
      label: 'Backend',
      shortLabel: 'Backend',
      current: clamp(baseScores.backend),
      target: targets.backend,
    },
    {
      key: 'databases',
      label: 'Databases',
      shortLabel: 'Databases',
      current: clamp(baseScores.databases),
      target: targets.databases,
    },
    {
      key: 'cloud',
      label: 'Cloud / DevOps',
      shortLabel: 'Cloud / DevOps',
      current: clamp(baseScores.cloud),
      target: targets.cloud,
    },
    {
      key: 'architecture',
      label: 'Architecture / Testing',
      shortLabel: 'Arch / Testing',
      current: clamp(baseScores.architecture),
      target: targets.architecture,
    },
  ];
}
