import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';

const PORT = Number(process.env.PORT) || 3000;
const MODEL_ID = 'gemini-3.8-flash';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const AGENT_TIMEOUT_MS = 15000;

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`TIMEOUT:${label}`));
    }, ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 1): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      const status =
        typeof err === 'object' && err !== null && 'status' in err
          ? Number((err as { status?: unknown }).status)
          : 0;
      const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
      const isRateOrQuota =
        status === 429 || msg.includes('429') || msg.includes('resource_exhausted') || msg.includes('quota');
      if (isRateOrQuota) {
        throw err;
      }
      const isTransient = status === 503 || status === 500;
      if (!isTransient || attempt === maxRetries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
  throw lastErr;
}

function parseJsonResponse<T>(text: string | undefined, fallback: T): T {
  if (!text) return fallback;
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(cleaned) as T;
}

const app = express();
app.use(express.json({ limit: '1mb' }));

// Agent 1: Profiler Agent — compares Current Skills vs Target Role
app.post('/api/agents/profiler', async (req: Request, res: Response) => {
  try {
    const { name, currentSkills, certifications, pastProjects, targetRole } = req.body as {
      name?: string;
      currentSkills?: string[];
      certifications?: string[];
      pastProjects?: string[];
      targetRole?: string;
    };

    const studentName = (name || 'Student').trim();
    const role = (targetRole || '').trim();
    const skills = Array.isArray(currentSkills)
      ? currentSkills.map((s) => String(s).trim()).filter(Boolean)
      : [];
    const certs = Array.isArray(certifications)
      ? certifications.map((c) => String(c).trim()).filter(Boolean)
      : [];
    const projects = Array.isArray(pastProjects)
      ? pastProjects.map((p) => String(p).trim()).filter(Boolean)
      : [];

    if (!role) {
      res.status(400).json({ error: 'Target role is required.' });
      return;
    }

    const prompt = `You are the Profiler Agent inside KairoPath.
Analyze the student's current skills, certifications, and past projects against real-world industry requirements for their target career role.

Student Name: ${studentName}
Current Skills: ${skills.length > 0 ? skills.join(', ') : 'None listed'}
Certifications: ${certs.length > 0 ? certs.join(', ') : 'None listed'}
Past Projects: ${projects.length > 0 ? projects.join(', ') : 'None listed'}
Target Role: ${role}

Instructions:
1. "verifiedSkills": Identify which of the student's skills, certifications, or applied project competencies (e.g. cloud fundamentals from AWS Cloud Practitioner, CLI tooling, database schema design) are directly relevant or foundational for "${role}". Keep crisp canonical names.
2. "missingSkills": Identify 4 to 6 high-priority technical skills or tools the student must learn to become job-ready for "${role}" (do not repeat skills already in verifiedSkills).
3. "careerMatchPercent": Provide a realistic integer from 0 to 100 estimating their current coverage for "${role}", factoring in their skills, certifications, and hands-on projects.
4. "summary": Write a concise 2-sentence assessment addressing ${studentName} by name, explicitly referencing strengths from their skills/certifications/projects and the primary skill gap.`;

    const buildProfilerFallback = () => {
      const normalizedRole = role.toLowerCase();
      let benchmarkSkills: string[];
      if (normalizedRole.includes('data')) {
        benchmarkSkills = [
          'Python',
          'SQL',
          'Apache Spark',
          'Airflow / Orchestration',
          'Data Warehousing',
          'dbt / Data Modeling',
          'Cloud Data Pipelines',
        ];
      } else if (normalizedRole.includes('ml') || normalizedRole.includes('ai')) {
        benchmarkSkills = [
          'Python',
          'PyTorch / TensorFlow',
          'Machine Learning Fundamentals',
          'Data Preprocessing & Pandas',
          'LLM & RAG Pipelines',
          'Model Evaluation & MLOps',
        ];
      } else if (normalizedRole.includes('devops') || normalizedRole.includes('cloud')) {
        benchmarkSkills = [
          'Linux & Shell Scripting',
          'Docker & Containers',
          'Kubernetes',
          'Terraform / IaC',
          'CI/CD Pipelines',
          'Cloud Architecture',
          'Observability & Monitoring',
        ];
      } else {
        benchmarkSkills = [
          'HTML & CSS',
          'JavaScript / TypeScript',
          'React & State Management',
          'Node.js & REST APIs',
          'SQL & Database Design',
          'Git, Testing & CI/CD',
        ];
      }

      const lowerUserTokens = [...skills, ...certs, ...projects].map((s) => s.toLowerCase());
      const verified: string[] = [...skills];
      if (certs.some((c) => c.toLowerCase().includes('aws'))) {
        verified.push('AWS Cloud Fundamentals');
      }
      if (projects.some((p) => p.toLowerCase().includes('cli'))) {
        verified.push('CLI Tooling');
      }
      if (projects.some((p) => p.toLowerCase().includes('db') || p.toLowerCase().includes('sql'))) {
        verified.push('Database Modeling');
      }

      const uniqueVerified = Array.from(new Set(verified));
      const missing = benchmarkSkills
        .filter((reqSkill) => {
          const reqLower = reqSkill.toLowerCase();
          return !lowerUserTokens.some(
            (tok) => reqLower.includes(tok) || tok.includes(reqLower.split(' ')[0])
          );
        })
        .slice(0, 5);

      const finalMissing =
        missing.length >= 4
          ? missing
          : [...missing, 'System Architecture', 'Automated Testing', 'Production Deployment'].slice(0, 5);

      const totalCount = uniqueVerified.length + finalMissing.length;
      const matchPct =
        totalCount > 0 ? Math.max(15, Math.min(85, Math.round((uniqueVerified.length / totalCount) * 100))) : 30;

      return {
        verifiedSkills: uniqueVerified,
        missingSkills: finalMissing,
        careerMatchPercent: matchPct,
        summary: `${studentName} brings a solid base across ${uniqueVerified.slice(0, 3).join(', ') || 'foundational concepts'} toward ${role}. Closing the gaps in ${finalMissing.slice(0, 3).join(', ')} will unlock full production readiness.`,
      };
    };

    let result: {
      verifiedSkills: string[];
      missingSkills: string[];
      careerMatchPercent: number;
      summary: string;
    };

    try {
      const ai = getAiClient();
      const response = await withTimeout(
        withRetry(() =>
          ai.models.generateContent({
            model: MODEL_ID,
            contents: prompt,
            config: {
              thinkingConfig: { thinkingBudget: 0 },
              systemInstruction:
                'You are an expert technical career profiler. Return strictly valid JSON matching the requested schema.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  verifiedSkills: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Relevant skills the student already possesses.',
                  },
                  missingSkills: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Critical missing skills needed for the target role.',
                  },
                  careerMatchPercent: {
                    type: Type.INTEGER,
                    description: 'Integer 0-100 representing current skill match percentage.',
                  },
                  summary: {
                    type: Type.STRING,
                    description: 'Concise 2-sentence executive summary of the skill gap.',
                  },
                },
                required: ['verifiedSkills', 'missingSkills', 'careerMatchPercent', 'summary'],
              },
            },
          })
        ),
        12000,
        'profiler'
      );

      result = parseJsonResponse(response.text, buildProfilerFallback());
    } catch (innerErr) {
      const reason = innerErr instanceof Error ? innerErr.message : String(innerErr);
      console.warn(`Profiler Agent fallback activated (${reason}).`);
      result = buildProfilerFallback();
    }

    result.careerMatchPercent = Math.max(0, Math.min(100, Math.round(Number(result.careerMatchPercent) || 0)));

    res.json(result);
  } catch (err) {
    console.error('Profiler Agent unexpected request error:', err);
    res.status(400).json({ error: 'Invalid profiler request payload.' });
  }
});

// Agent 2: Curriculum Architect Agent — turns Missing Skills into a sequenced Learning Roadmap
app.post('/api/agents/curriculum', async (req: Request, res: Response) => {
  try {
    const { name, targetRole, verifiedSkills, missingSkills } = req.body as {
      name?: string;
      targetRole?: string;
      verifiedSkills?: string[];
      missingSkills?: string[];
    };

    const studentName = (name || 'Student').trim();
    const role = (targetRole || '').trim();
    const missing = Array.isArray(missingSkills) ? missingSkills : [];
    const verified = Array.isArray(verifiedSkills) ? verifiedSkills : [];

    if (!role || missing.length === 0) {
      res.status(400).json({ error: 'Target role and missing skills are required.' });
      return;
    }

    const prompt = `You are the Curriculum Architect Agent inside KairoPath.
Design a sequenced, practical Learning Roadmap for ${studentName} aiming to become a ${role}.

Already Verified Skills: ${verified.join(', ') || 'None'}
Missing Skills to Master: ${missing.join(', ')}

Instructions:
Generate 4 to 6 logically ordered learning modules progressing from foundational gaps to capstone integration.
For every module include:
- "title": Clear, specific module title.
- "targetSkill": The primary missing skill this module builds.
- "estimatedHours": Realistic study + practice hours as an integer (between 4 and 16).
- "keyTopics": 3 to 4 concrete sub-topics covered.
- "recommendedCourses": 2 to 3 recommended courses or tutorials, each with "title" (e.g. specific course/tutorial name), "platform" (e.g. MDN Web Docs, Full Stack Open, freeCodeCamp, Coursera, Official Docs), and "format" (e.g. Course, Interactive Tutorial, Guide).
- "miniProject": An object with "title" and "description" (1-2 sentences) describing a hands-on practical exercise or buildable mini-project.`;

    const buildCurriculumFallback = () => {
      const paddedSkills = [...missing];
      while (paddedSkills.length < 5) {
        paddedSkills.push(
          paddedSkills.length === 4 ? `${role} Capstone Integration` : missing[paddedSkills.length % missing.length]
        );
      }
      const selectedSkills = paddedSkills.slice(0, 5);

      return {
        modules: selectedSkills.map((skill, idx) => {
          const isCapstone = idx === 4;
          return {
            title: isCapstone
              ? `End-to-End ${role} Capstone`
              : `${skill} Core Foundations & Applied Patterns`,
            targetSkill: skill,
            estimatedHours: isCapstone ? 12 : 6 + (idx % 3) * 2,
            keyTopics: isCapstone
              ? [
                  `Integrating ${selectedSkills.slice(0, 3).join(', ')}`,
                  'Production Error Handling & Observability',
                  'Automated Testing & Deployment Workflow',
                ]
              : [
                  `${skill} Mental Models & Architecture`,
                  `Common Production Workflows in ${skill}`,
                  `Debugging, Performance & Best Practices`,
                ],
            recommendedCourses: [
              {
                title: `${skill} Official Documentation & Guided Track`,
                platform: 'Official Docs',
                format: 'Interactive Guide',
              },
              {
                title: `Practical ${skill} for ${role}s`,
                platform: 'freeCodeCamp',
                format: 'Course',
              },
            ],
            miniProject: {
              title: isCapstone ? `${role} Portfolio Application` : `${skill} Mini-App`,
              description: isCapstone
                ? `Build and deploy an end-to-end ${role} project combining your verified skills and newly learned modules.`
                : `Implement a focused, real-world ${skill} feature with clean validation and test coverage.`,
            },
          };
        }),
      };
    };

    let parsed: {
      modules: Array<{
        title: string;
        targetSkill: string;
        estimatedHours: number;
        keyTopics: string[];
        recommendedCourses?: Array<{ title: string; platform: string; format: string }>;
        miniProject: { title: string; description: string };
      }>;
    };

    try {
      const ai = getAiClient();
      const response = await withTimeout(
        withRetry(() =>
          ai.models.generateContent({
            model: MODEL_ID,
            contents: prompt,
            config: {
              thinkingConfig: { thinkingBudget: 0 },
              systemInstruction:
                'You are a senior technical curriculum designer. Build sequenced, project-driven learning modules with recommended courses and tutorials in strict JSON.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  modules: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        targetSkill: { type: Type.STRING },
                        estimatedHours: { type: Type.INTEGER },
                        keyTopics: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        recommendedCourses: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              title: { type: Type.STRING },
                              platform: { type: Type.STRING },
                              format: { type: Type.STRING },
                            },
                            required: ['title', 'platform', 'format'],
                          },
                        },
                        miniProject: {
                          type: Type.OBJECT,
                          properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                          },
                          required: ['title', 'description'],
                        },
                      },
                      required: [
                        'title',
                        'targetSkill',
                        'estimatedHours',
                        'keyTopics',
                        'recommendedCourses',
                        'miniProject',
                      ],
                    },
                  },
                },
                required: ['modules'],
              },
            },
          })
        ),
        12000,
        'curriculum'
      );

      parsed = parseJsonResponse(response.text, buildCurriculumFallback());
    } catch (innerErr) {
      const reason = innerErr instanceof Error ? innerErr.message : String(innerErr);
      console.warn(`Curriculum Architect Agent fallback activated (${reason}).`);
      parsed = buildCurriculumFallback();
    }

    const modules = (parsed.modules || []).map((mod, idx) => ({
      id: `mod-${Date.now()}-${idx + 1}`,
      title: mod.title,
      targetSkill: mod.targetSkill,
      estimatedHours: Math.max(2, Math.round(Number(mod.estimatedHours) || 6)),
      keyTopics: Array.isArray(mod.keyTopics) ? mod.keyTopics : [],
      recommendedCourses: Array.isArray(mod.recommendedCourses) ? mod.recommendedCourses : [],
      miniProject: mod.miniProject || { title: 'Applied Lab', description: 'Build a small prototype applying this skill.' },
      completed: false,
      isRefresher: false,
    }));

    res.json({ modules });
  } catch (err) {
    console.error('Curriculum Agent unexpected request error:', err);
    res.status(400).json({ error: 'Invalid curriculum request payload.' });
  }
});

// Agent 3: Evaluator Agent — generates a 3-question multiple-choice quiz for a specific module
app.post('/api/agents/evaluator', async (req: Request, res: Response) => {
  try {
    const { targetRole, moduleId, moduleTitle, targetSkill, keyTopics, currentSkills } = req.body as {
      targetRole?: string;
      moduleId?: string;
      moduleTitle?: string;
      targetSkill?: string;
      keyTopics?: string[];
      currentSkills?: string[];
    };

    if (!moduleTitle) {
      res.status(400).json({ error: 'Module title is required to generate a quiz.' });
      return;
    }

    const prompt = `You are the Evaluator Agent inside KairoPath.
Create a crisp 3-question multiple-choice skill assessment specifically for this learning module.

Target Career Role: ${targetRole || 'Software Engineer'}
Module Title: ${moduleTitle}
Target Skill: ${targetSkill || moduleTitle}
Key Topics: ${(keyTopics || []).join(', ')}
Student Background: ${(currentSkills || []).join(', ') || 'Beginner'}

Instructions:
- Generate exactly 3 challenging but fair practical multiple-choice questions testing real understanding of "${moduleTitle}" and its key topics.
- Each question must have exactly 4 distinct answer choices in "options".
- "correctIndex" must be an integer 0, 1, 2, or 3 corresponding to the single right option.
- "explanation" must briefly explain why the correct answer is right (1-2 sentences).`;

    const skillLabel = targetSkill || moduleTitle;
    const primaryTopic = (keyTopics && keyTopics[0]) || skillLabel;
    const secondaryTopic = (keyTopics && keyTopics[1]) || `${skillLabel} architecture`;

    const buildEvaluatorFallback = () => ({
      questions: [
        {
          question: `When applying ${primaryTopic} in "${moduleTitle}", which practice best prevents subtle production bugs?`,
          options: [
            'Validate inputs at system boundaries and write isolated unit tests for edge cases',
            'Disable error handling so failures surface only in production logs',
            'Hardcode environment credentials directly inside application source files',
            'Skip modularization and place all business logic inside a single global script',
          ],
          correctIndex: 0,
          explanation: `Validating boundary inputs and testing edge cases ensures ${primaryTopic} behaves reliably under unexpected data.`,
        },
        {
          question: `Which approach is recommended when structuring ${secondaryTopic} for a ${targetRole || 'software'} project?`,
          options: [
            'Duplicate logic across components to avoid creating shared abstractions',
            'Separate core domain logic from external I/O so modules remain testable',
            'Rely exclusively on manual browser refreshes instead of automated checks',
            'Store transient state in unindexed flat text files in production',
          ],
          correctIndex: 1,
          explanation: `Separating core logic from I/O keeps ${secondaryTopic} maintainable, modular, and easy to verify.`,
        },
        {
          question: `What is the primary indicator that a feature built with ${skillLabel} is ready to ship?`,
          options: [
            'It compiles once locally without checking error states',
            'It passes automated verification, handles failure modes gracefully, and meets performance expectations',
            'All configuration values are hardcoded for a single developer laptop',
            'Documentation and tests are omitted to keep the repository smaller',
          ],
          correctIndex: 1,
          explanation: `Production readiness in ${skillLabel} requires automated verification, graceful error handling, and repeatable configuration.`,
        },
      ],
    });

    let parsed: {
      questions: Array<{
        question: string;
        options: string[];
        correctIndex: number;
        explanation: string;
      }>;
    };

    try {
      const ai = getAiClient();
      const response = await withTimeout(
        withRetry(() =>
          ai.models.generateContent({
            model: MODEL_ID,
            contents: prompt,
            config: {
              thinkingConfig: { thinkingBudget: 0 },
              systemInstruction:
                'You are a rigorous technical assessment author. Generate exactly 3 multiple-choice questions with 4 options each.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  questions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        question: { type: Type.STRING },
                        options: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        correctIndex: { type: Type.INTEGER },
                        explanation: { type: Type.STRING },
                      },
                      required: ['question', 'options', 'correctIndex', 'explanation'],
                    },
                  },
                },
                required: ['questions'],
              },
            },
          })
        ),
        AGENT_TIMEOUT_MS,
        'evaluator'
      );

      parsed = parseJsonResponse(response.text, buildEvaluatorFallback());
      if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        parsed = buildEvaluatorFallback();
      }
    } catch (innerErr) {
      const reason = innerErr instanceof Error ? innerErr.message : String(innerErr);
      console.warn(`Evaluator Agent fallback activated (${reason}).`);
      parsed = buildEvaluatorFallback();
    }

    const questions = (parsed.questions || []).slice(0, 3).map((q, idx) => ({
      id: `q-${moduleId || 'mod'}-${idx + 1}`,
      question: q.question,
      options: (q.options || []).slice(0, 4),
      correctIndex: Math.max(0, Math.min(3, Math.round(Number(q.correctIndex) || 0))),
      explanation: q.explanation,
    }));

    res.json({
      moduleId,
      moduleTitle,
      questions,
    });
  } catch (err) {
    console.error('Evaluator Agent unexpected request error:', err);
    res.status(400).json({ error: 'Invalid evaluator request payload.' });
  }
});

// Agent 4: Mentor Agent — grades quiz, explains struggles if < 70%, and generates Foundational Refresher module
app.post('/api/agents/mentor', async (req: Request, res: Response) => {
  try {
    const { name, targetRole, module, questions, selectedIndices } = req.body as {
      name?: string;
      targetRole?: string;
      module?: {
        id: string;
        title: string;
        targetSkill: string;
        keyTopics: string[];
      };
      questions?: Array<{
        question: string;
        options: string[];
        correctIndex: number;
        explanation: string;
      }>;
      selectedIndices?: number[];
    };

    if (!module || !Array.isArray(questions) || !Array.isArray(selectedIndices)) {
      res.status(400).json({ error: 'Module, questions, and selected answers are required.' });
      return;
    }

    const studentName = (name || 'Student').trim();
    const totalCount = questions.length || 3;
    let correctCount = 0;
    const missedDetails: string[] = [];

    questions.forEach((q, idx) => {
      const chosen = selectedIndices[idx];
      if (chosen === q.correctIndex) {
        correctCount += 1;
      } else {
        const chosenText = typeof chosen === 'number' && q.options[chosen] ? q.options[chosen] : 'No answer';
        const rightText = q.options[q.correctIndex] || '';
        missedDetails.push(
          `Question: "${q.question}" | Student answered: "${chosenText}" | Correct answer: "${rightText}"`
        );
      }
    });

    const scorePercent = Math.round((correctCount / totalCount) * 100);
    const passed = scorePercent >= 70;

    if (passed) {
      const prompt = `You are the Mentor Agent inside KairoPath.
${studentName} passed the skill quiz for module "${module.title}" (Target Role: ${targetRole || 'Developer'}) with ${correctCount}/${totalCount} (${scorePercent}%).
${missedDetails.length > 0 ? `They missed 1 question:\n${missedDetails.join('\n')}` : 'They answered every question correctly.'}

Write a concise, encouraging 2-sentence "feedbackSummary" acknowledging their mastery of ${module.targetSkill} and how it prepares them for the next step.`;

      const defaultPassFeedback = `Great work, ${studentName}! You demonstrated strong command of ${module.targetSkill} and unlocked this milestone toward ${targetRole || 'your target role'}.`;
      let parsed = { feedbackSummary: defaultPassFeedback };

      try {
        const ai = getAiClient();
        const response = await withTimeout(
          withRetry(() =>
            ai.models.generateContent({
              model: MODEL_ID,
              contents: prompt,
              config: {
                thinkingConfig: { thinkingBudget: 0 },
                systemInstruction: 'You are a supportive senior engineering mentor. Return strict JSON.',
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    feedbackSummary: { type: Type.STRING },
                  },
                  required: ['feedbackSummary'],
                },
              },
            })
          ),
          AGENT_TIMEOUT_MS,
          'mentor-pass'
        );

        parsed = parseJsonResponse<{ feedbackSummary: string }>(response.text, {
          feedbackSummary: defaultPassFeedback,
        });
      } catch (innerErr) {
        const reason = innerErr instanceof Error ? innerErr.message : String(innerErr);
        console.warn(`Mentor Agent (pass) fallback activated (${reason}).`);
      }

      res.json({
        scorePercent,
        correctCount,
        totalCount,
        passed: true,
        feedbackSummary: parsed.feedbackSummary,
      });
      return;
    }

    // Score < 70%: Mentor Agent diagnoses struggle AND builds a Foundational Refresher module
    const remediationPrompt = `You are the Mentor Agent inside KairoPath.
${studentName} scored ${correctCount}/${totalCount} (${scorePercent}%), which is below the 70% mastery threshold, on the module "${module.title}" (Target Skill: ${module.targetSkill}, Target Role: ${targetRole || 'Developer'}).

Missed Questions:
${missedDetails.join('\n')}

Module Key Topics: ${(module.keyTopics || []).join(', ')}

Instructions:
1. "feedbackSummary": A brief, supportive 1-2 sentence message encouraging ${studentName} while explaining that a refresher has been added.
2. "struggleReason": A clear, specific 2-sentence diagnostic explanation of WHY ${studentName} struggled based on the exact concepts missed above, pinpointing the foundational gap.
3. "refresherModule": Create a targeted prerequisite "Foundational Refresher" module to insert immediately BEFORE "${module.title}" in their roadmap:
   - "title": Must start with "Foundational Refresher: " followed by the prerequisite concept name.
   - "targetSkill": The prerequisite skill name.
   - "estimatedHours": Integer between 2 and 5 hours.
   - "keyTopics": 3 beginner-friendly stepping-stone topics that clear up the missed concepts.
   - "recommendedCourses": 2 beginner-friendly courses or tutorials, each with "title", "platform", and "format".
   - "miniProject": { "title": string, "description": string } — a quick, confidence-building hands-on exercise.`;

    const fallbackRemediation = {
      feedbackSummary: `You scored ${scorePercent}%, so we inserted a targeted refresher right before ${module.title}.`,
      struggleReason: `The missed questions indicate an underlying gap in core ${module.targetSkill} mental models and practical edge-case patterns before advancing to "${module.title}".`,
      refresherModule: {
        title: `Foundational Refresher: Core ${module.targetSkill} Fundamentals`,
        targetSkill: `${module.targetSkill} Basics`,
        estimatedHours: 3,
        keyTopics: ['Core Syntax & Mental Models', 'Common Pitfalls & Debugging', 'Guided Step-by-Step Patterns'],
        recommendedCourses: [
          {
            title: `${module.targetSkill} Core Concepts Walkthrough`,
            platform: 'Official Docs',
            format: 'Interactive Guide',
          },
          {
            title: `Intro to ${module.targetSkill} Foundations`,
            platform: 'freeCodeCamp',
            format: 'Tutorial',
          },
        ],
        miniProject: {
          title: `${module.targetSkill} Starter Sandbox`,
          description: 'Build a minimal working example reinforcing the core primitives before retrying the main module.',
        },
      },
    };

    let parsed: {
      feedbackSummary: string;
      struggleReason: string;
      refresherModule: {
        title: string;
        targetSkill: string;
        estimatedHours: number;
        keyTopics: string[];
        recommendedCourses?: Array<{ title: string; platform: string; format: string }>;
        miniProject: { title: string; description: string };
      };
    } = fallbackRemediation;

    try {
      const ai = getAiClient();
      const response = await withTimeout(
        withRetry(() =>
          ai.models.generateContent({
            model: MODEL_ID,
            contents: remediationPrompt,
            config: {
              thinkingConfig: { thinkingBudget: 0 },
              systemInstruction:
                'You are an empathetic adaptive learning mentor. Diagnose conceptual gaps and design targeted foundational refresher modules in strict JSON.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  feedbackSummary: { type: Type.STRING },
                  struggleReason: { type: Type.STRING },
                  refresherModule: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      targetSkill: { type: Type.STRING },
                      estimatedHours: { type: Type.INTEGER },
                      keyTopics: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      recommendedCourses: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            title: { type: Type.STRING },
                            platform: { type: Type.STRING },
                            format: { type: Type.STRING },
                          },
                          required: ['title', 'platform', 'format'],
                        },
                      },
                      miniProject: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          description: { type: Type.STRING },
                        },
                        required: ['title', 'description'],
                      },
                    },
                    required: [
                      'title',
                      'targetSkill',
                      'estimatedHours',
                      'keyTopics',
                      'recommendedCourses',
                      'miniProject',
                    ],
                  },
                },
                required: ['feedbackSummary', 'struggleReason', 'refresherModule'],
              },
            },
          })
        ),
        AGENT_TIMEOUT_MS,
        'mentor-remediate'
      );

      parsed = parseJsonResponse(response.text, fallbackRemediation);
    } catch (innerErr) {
      const reason = innerErr instanceof Error ? innerErr.message : String(innerErr);
      console.warn(`Mentor Agent (remediation) fallback activated (${reason}).`);
      parsed = fallbackRemediation;
    }

    if (parsed.refresherModule && !parsed.refresherModule.title.startsWith('Foundational Refresher:')) {
      parsed.refresherModule.title = `Foundational Refresher: ${parsed.refresherModule.title}`;
    }

    res.json({
      scorePercent,
      correctCount,
      totalCount,
      passed: false,
      feedbackSummary: parsed.feedbackSummary,
      struggleReason: parsed.struggleReason,
      refresherModule: parsed.refresherModule,
    });
  } catch (err) {
    console.error('Mentor Agent unexpected request error:', err);
    res.status(400).json({ error: 'Invalid mentor grading payload.' });
  }
});

// Smart Resume / Bio Auto-Fill — Profiler Agent extracts structured student profile from raw text
app.post('/api/agents/parse-profile', async (req: Request, res: Response) => {
  try {
    const { rawText } = req.body as { rawText?: string };
    const text = (rawText || '').trim();

    if (!text) {
      res.status(400).json({ error: 'Please paste a resume summary or bio first.' });
      return;
    }

    const buildBioFallback = () => {
      const nameMatch =
        text.match(/(?:I'm|I am|Name[:\s]+)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i) ||
        text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+[-–—]/);
      const extractedName = nameMatch ? nameMatch[1].trim() : 'Alex';

      const knownSkills = [
        'Python',
        'SQL',
        'PostgreSQL',
        'MySQL',
        'HTML',
        'CSS',
        'JavaScript',
        'TypeScript',
        'React',
        'Node.js',
        'Express',
        'Flask',
        'Django',
        'FastAPI',
        'Docker',
        'Kubernetes',
        'Terraform',
        'AWS',
        'Git',
        'GitHub Actions',
        'PyTorch',
        'TensorFlow',
        'Spark',
        'Airflow',
        'Linux',
      ];
      const lower = text.toLowerCase();
      const skills = knownSkills.filter((sk) => lower.includes(sk.toLowerCase()));

      const certMatches = text.match(
        /(AWS\s+[A-Za-z\s]+?(?:Practitioner|Associate|Professional)|HashiCorp\s+[A-Za-z\s]+?Associate|Google\s+Cloud\s+[A-Za-z\s]+|Azure\s+[A-Za-z\s]+|CKA|CKAD)/gi
      );
      const certifications = certMatches
        ? Array.from(new Set(certMatches.map((c) => c.trim())))
        : [];

      const projectMatches = text.match(
        /(?:projects?\s*(?:include|:)?\s*|built\s+(?:a|an)?\s*)([^.!?\n]+)/gi
      );
      const pastProjects = projectMatches
        ? projectMatches
            .slice(0, 3)
            .map((p) =>
              p
                .replace(/^(?:projects?\s*(?:include|:)?\s*|built\s+(?:a|an)?\s*)/i, '')
                .trim()
            )
            .filter((p) => p.length > 3)
        : [];

      let targetRole = 'Full Stack Developer';
      if (lower.includes('devops') || lower.includes('sre')) {
        targetRole = 'Cloud DevOps Engineer';
      } else if (lower.includes('data engineer')) {
        targetRole = 'Data Engineer';
      } else if (lower.includes('ml engineer') || lower.includes('ai engineer') || lower.includes('machine learning')) {
        targetRole = 'AI/ML Engineer';
      } else if (lower.includes('full stack') || lower.includes('fullstack')) {
        targetRole = 'Full Stack Developer';
      }

      return {
        name: extractedName,
        currentSkills: skills.length > 0 ? skills : ['Python', 'SQL'],
        certifications,
        pastProjects,
        targetRole,
      };
    };

    const prompt = `You are the Profiler Agent inside KairoPath.
Extract a structured student career profile from the following raw resume or bio text.

Raw Text:
"""
${text.slice(0, 4000)}
"""

Instructions:
- "name": Student's first or full name (or "Student" if unnamed).
- "currentSkills": Array of technical skills, languages, frameworks, and tools mentioned.
- "certifications": Array of professional or cloud certifications mentioned (empty array if none).
- "pastProjects": Array of concise project names/descriptions mentioned (empty array if none).
- "targetRole": The target career role they are aiming for (infer the closest engineering role if implicit).`;

    let parsed: {
      name: string;
      currentSkills: string[];
      certifications: string[];
      pastProjects: string[];
      targetRole: string;
    };

    try {
      const ai = getAiClient();
      const response = await withTimeout(
        withRetry(() =>
          ai.models.generateContent({
            model: MODEL_ID,
            contents: prompt,
            config: {
              thinkingConfig: { thinkingBudget: 0 },
              systemInstruction:
                'You are a precise resume parser. Extract structured student profile fields strictly in JSON.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  currentSkills: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  certifications: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  pastProjects: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  targetRole: { type: Type.STRING },
                },
                required: [
                  'name',
                  'currentSkills',
                  'certifications',
                  'pastProjects',
                  'targetRole',
                ],
              },
            },
          })
        ),
        12000,
        'parse-profile'
      );

      parsed = parseJsonResponse(response.text, buildBioFallback());
    } catch (innerErr) {
      const reason = innerErr instanceof Error ? innerErr.message : String(innerErr);
      console.warn(`Profiler bio parser fallback activated (${reason}).`);
      parsed = buildBioFallback();
    }

    res.json({
      name: (parsed.name || 'Student').trim(),
      currentSkills: Array.isArray(parsed.currentSkills) ? parsed.currentSkills : [],
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
      pastProjects: Array.isArray(parsed.pastProjects) ? parsed.pastProjects : [],
      targetRole: (parsed.targetRole || 'Full Stack Developer').trim(),
    });
  } catch (err) {
    console.error('Bio parser unexpected request error:', err);
    res.status(400).json({ error: 'Invalid bio parser request payload.' });
  }
});

// Live "Ask Kairo Mentor" Floating Chat — answers coaching questions and can dynamically refine/compress the roadmap
app.post('/api/agents/mentor-chat', async (req: Request, res: Response) => {
  try {
    const {
      message,
      studentProfile,
      profilerResult,
      modules,
      lastFailedAlert,
      chatHistory,
    } = req.body as {
      message?: string;
      studentProfile?: {
        name?: string;
        currentSkills?: string[];
        certifications?: string[];
        pastProjects?: string[];
        targetRole?: string;
      };
      profilerResult?: {
        verifiedSkills?: string[];
        missingSkills?: string[];
        careerMatchPercent?: number;
      } | null;
      modules?: Array<{
        id: string;
        title: string;
        targetSkill: string;
        estimatedHours: number;
        keyTopics: string[];
        recommendedCourses?: Array<{ title: string; platform: string; format: string }>;
        miniProject: { title: string; description: string };
        completed?: boolean;
        quizScore?: number;
        isRefresher?: boolean;
      }>;
      lastFailedAlert?: {
        failedModuleTitle?: string;
        scorePercent?: number;
        struggleReason?: string;
      } | null;
      chatHistory?: Array<{ role: string; content: string }>;
    };

    const userMsg = (message || '').trim();
    if (!userMsg) {
      res.status(400).json({ error: 'Chat message is required.' });
      return;
    }

    const studentName = (studentProfile?.name || 'Student').trim();
    const role = (studentProfile?.targetRole || 'Full Stack Developer').trim();
    const missingSkills = profilerResult?.missingSkills || [];
    const verifiedSkills = profilerResult?.verifiedSkills || studentProfile?.currentSkills || [];
    const currentModules = Array.isArray(modules) ? modules : [];

    const buildChatFallback = () => {
      const lower = userMsg.toLowerCase();
      const wantsAdjustment =
        currentModules.length > 0 &&
        (lower.includes('compress') ||
          lower.includes('2-week') ||
          lower.includes('two-week') ||
          lower.includes('interview') ||
          lower.includes('shorten') ||
          lower.includes('adjust') ||
          lower.includes('refine') ||
          lower.includes('prioritize') ||
          lower.includes('update roadmap'));

      if (wantsAdjustment) {
        const compressed = currentModules.slice(0, 4).map((m, idx) => ({
          ...m,
          id: m.id || `mod-sprint-${Date.now()}-${idx + 1}`,
          title: m.title.startsWith('Sprint Focus:') ? m.title : `Sprint Focus: ${m.title}`,
          estimatedHours: Math.max(2, Math.min(6, Math.round(m.estimatedHours * 0.55))),
          keyTopics: (m.keyTopics || []).slice(0, 3),
          recommendedCourses: m.recommendedCourses || [],
          miniProject: m.miniProject,
          completed: Boolean(m.completed),
        }));
        const totalHrs = compressed.reduce((s, m) => s + m.estimatedHours, 0);
        return {
          reply: `I compressed your ${role} roadmap into a high-impact ${compressed.length}-module, ${totalHrs}-hour 2-week interview sprint. Focus on passing each module's skill quiz in sequence to lock in readiness before interviews.`,
          shouldUpdateRoadmap: true,
          updatedModules: compressed,
        };
      }

      if (lower.includes('fail') || lower.includes('quiz') || lower.includes('struggle')) {
        if (lastFailedAlert?.failedModuleTitle) {
          return {
            reply: `On "${lastFailedAlert.failedModuleTitle}" (${lastFailedAlert.scorePercent}%), ${lastFailedAlert.struggleReason} Review the Foundational Refresher inserted right before that module and retake the quiz when ready.`,
            shouldUpdateRoadmap: false,
          };
        }
        return {
          reply: `You haven't failed a quiz yet! Whenever a module quiz scores below 70%, I diagnose the exact missed concepts and insert a Foundational Refresher right before that step.`,
          shouldUpdateRoadmap: false,
        };
      }

      if (lower.includes('capstone') || lower.includes('project')) {
        const gaps = missingSkills.slice(0, 3).join(', ') || 'API architecture, state management, and testing';
        const base = verifiedSkills.slice(0, 2).join(' + ') || 'your core stack';
        return {
          reply: `Build a production-grade "${role} Capstone Studio" combining ${base} with your target gaps (${gaps}). Include automated tests, clean error handling, and a live deployment checklist to showcase end-to-end ownership.`,
          shouldUpdateRoadmap: false,
        };
      }

      return {
        reply: `Focus next on ${currentModules.find((m) => !m.completed)?.title || missingSkills[0] || role}. If you have an upcoming deadline, ask me to compress your roadmap into a 2-week sprint and I'll rebalance the modules live.`,
        shouldUpdateRoadmap: false,
      };
    };

    const recentHistory = (chatHistory || [])
      .slice(-6)
      .map((h) => `${h.role === 'user' ? 'Student' : 'Mentor'}: ${h.content}`)
      .join('\n');

    const prompt = `You are Kairo Mentor, an expert adaptive career coach inside KairoPath.

Student Context:
- Name: ${studentName}
- Target Role: ${role}
- Verified Skills: ${verifiedSkills.join(', ') || 'None yet'}
- Missing Skills: ${missingSkills.join(', ') || 'None analyzed yet'}
- Career Match: ${profilerResult?.careerMatchPercent ?? 'N/A'}%
- Last Failed Quiz Alert: ${
      lastFailedAlert
        ? `${lastFailedAlert.failedModuleTitle} (${lastFailedAlert.scorePercent}%) — ${lastFailedAlert.struggleReason}`
        : 'None'
    }
- Current Roadmap Modules (${currentModules.length}):
${currentModules
  .map(
    (m, i) =>
      `  ${i + 1}. [${m.completed ? 'DONE' : 'TODO'}] ${m.title} (Skill: ${m.targetSkill}, ${m.estimatedHours}h)`
  )
  .join('\n') || '  (No roadmap generated yet)'}

Recent Chat:
${recentHistory || '(Start of conversation)'}

Student Question: "${userMsg}"

Instructions:
1. Give a sharp, practical, personalized coaching "reply" (2–4 sentences max).
2. Set "shouldUpdateRoadmap": true ONLY if the student asks to compress, shorten, reorder, prioritize, tailor, or adjust their existing roadmap (and there are current modules to adjust). Otherwise set "shouldUpdateRoadmap": false.
3. When "shouldUpdateRoadmap" is true, populate "updatedModules" with the refined array of modules (3–5 high-impact modules with realistic compressed "estimatedHours", clear "title", "targetSkill", "keyTopics", "recommendedCourses", and "miniProject", preserving "completed" where appropriate). When false, omit or return an empty array for "updatedModules".`;

    let parsed: {
      reply: string;
      shouldUpdateRoadmap: boolean;
      updatedModules?: Array<{
        title: string;
        targetSkill: string;
        estimatedHours: number;
        keyTopics: string[];
        recommendedCourses?: Array<{ title: string; platform: string; format: string }>;
        miniProject: { title: string; description: string };
        completed?: boolean;
        isRefresher?: boolean;
      }>;
    };

    try {
      const ai = getAiClient();
      const response = await withTimeout(
        withRetry(() =>
          ai.models.generateContent({
            model: MODEL_ID,
            contents: prompt,
            config: {
              thinkingConfig: { thinkingBudget: 0 },
              systemInstruction:
                'You are Kairo Mentor, an adaptive AI career coach. Reply in strict JSON and dynamically update roadmap modules when asked to compress or adjust the plan.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  reply: { type: Type.STRING },
                  shouldUpdateRoadmap: { type: Type.BOOLEAN },
                  updatedModules: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        targetSkill: { type: Type.STRING },
                        estimatedHours: { type: Type.INTEGER },
                        keyTopics: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        recommendedCourses: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              title: { type: Type.STRING },
                              platform: { type: Type.STRING },
                              format: { type: Type.STRING },
                            },
                            required: ['title', 'platform', 'format'],
                          },
                        },
                        miniProject: {
                          type: Type.OBJECT,
                          properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                          },
                          required: ['title', 'description'],
                        },
                        completed: { type: Type.BOOLEAN },
                        isRefresher: { type: Type.BOOLEAN },
                      },
                      required: [
                        'title',
                        'targetSkill',
                        'estimatedHours',
                        'keyTopics',
                        'recommendedCourses',
                        'miniProject',
                      ],
                    },
                  },
                },
                required: ['reply', 'shouldUpdateRoadmap'],
              },
            },
          })
        ),
        12000,
        'mentor-chat'
      );

      parsed = parseJsonResponse(response.text, buildChatFallback());
    } catch (innerErr) {
      const reason = innerErr instanceof Error ? innerErr.message : String(innerErr);
      console.warn(`Mentor Chat fallback activated (${reason}).`);
      parsed = buildChatFallback();
    }

    const shouldUpdate =
      Boolean(parsed.shouldUpdateRoadmap) &&
      Array.isArray(parsed.updatedModules) &&
      parsed.updatedModules.length > 0;

    const normalizedModules = shouldUpdate
      ? parsed.updatedModules!.map((mod, idx) => ({
          id: `mod-mentor-${Date.now()}-${idx + 1}`,
          title: mod.title,
          targetSkill: mod.targetSkill,
          estimatedHours: Math.max(1, Math.round(Number(mod.estimatedHours) || 4)),
          keyTopics: Array.isArray(mod.keyTopics) ? mod.keyTopics : [],
          recommendedCourses: Array.isArray(mod.recommendedCourses) ? mod.recommendedCourses : [],
          miniProject: mod.miniProject || {
            title: 'Focused Sprint Exercise',
            description: 'Build a concise deliverable demonstrating this skill.',
          },
          completed: Boolean(mod.completed),
          isRefresher: Boolean(mod.isRefresher),
        }))
      : undefined;

    res.json({
      reply: parsed.reply,
      shouldUpdateRoadmap: shouldUpdate,
      updatedModules: normalizedModules,
    });
  } catch (err) {
    console.error('Mentor Chat unexpected request error:', err);
    res.status(400).json({ error: 'Invalid mentor chat payload.' });
  }
});

// Mini-Project / Code Check Sandbox — Evaluator & Mentor Agents review code/architecture solution (HTTP 200 fallback)
app.post('/api/agents/review-project', async (req: Request, res: Response) => {
  try {
    const { name, targetRole, module, submission } = req.body as {
      name?: string;
      targetRole?: string;
      module?: {
        id?: string;
        title?: string;
        targetSkill?: string;
        miniProject?: { title?: string; description?: string };
      };
      submission?: string;
    };

    const codeText = (submission || '').trim();
    if (!codeText || !module?.title) {
      res.status(400).json({ error: 'Module details and solution submission are required.' });
      return;
    }

    const studentName = (name || 'Student').trim();
    const role = (targetRole || 'Software Engineer').trim();
    const skill = module.targetSkill || module.title;
    const projectTitle = module.miniProject?.title || module.title;

    const buildReviewFallback = () => {
      const lower = codeText.toLowerCase();
      const signals = ['async', 'await', 'try', 'catch', 'test', 'schema', 'validate', 'error', 'index', 'return', 'const', 'function', 'class', 'select', 'docker', 'api'];
      const matchedSignals = signals.filter((kw) => lower.includes(kw)).length;
      const isBrief = codeText.length < 45;
      const scorePercent = isBrief
        ? Math.min(65, 42 + Math.round(codeText.length / 2))
        : Math.min(94, 76 + Math.min(18, matchedSignals * 3));
      const verified = scorePercent >= 70;

      return {
        scorePercent,
        verified,
        summary: verified
          ? `${studentName}'s solution for "${projectTitle}" demonstrates solid ${skill} structure and production-minded separation of concerns for a ${role}.`
          : `Good start on "${projectTitle}", ${studentName}, but the submission is too brief to verify ${skill} edge-case handling and testability.`,
        strengths: verified
          ? [
              `Clear implementation structure aligned with ${skill} best practices.`,
              `Addresses core functional requirements for "${projectTitle}" cleanly.`,
            ]
          : [
              `Captures the core intent of "${projectTitle}".`,
              `Concise entry point that is easy to expand with validation.`,
            ],
        improvementTip: verified
          ? `Add explicit boundary error handling and an automated unit or integration test covering failure states in ${skill}.`
          : `Expand your snippet with input validation, error handling (try/catch), and at least one concrete test case to reach Portfolio Verified (>=70%).`,
      };
    };

    let parsed = buildReviewFallback();

    try {
      const ai = getAiClient();
      const prompt = `You are collaborating as the Evaluator & Mentor Agents inside KairoPath.
Review ${studentName}'s Mini-Project / Code Check submission for the target role "${role}".

Module: ${module.title}
Target Skill: ${skill}
Practical Exercise: ${projectTitle} — ${module.miniProject?.description || ''}

Student Submission:
"""
${codeText.slice(0, 4000)}
"""

Instructions:
1. "scorePercent": Integer 0–100 grading correctness, clarity, and production readiness for ${skill}. Award >= 70 for solid code or clear architecture explanations; < 70 only if incomplete, incorrect, or trivial.
2. "summary": Crisp 1–2 sentence overall verdict addressing ${studentName}.
3. "strengths": Exactly 2 concise bullet strings highlighting what the submission did well.
4. "improvementTip": 1 specific, actionable next improvement tip.`;

      const response = await withTimeout(
        withRetry(() =>
          ai.models.generateContent({
            model: MODEL_ID,
            contents: prompt,
            config: {
              thinkingConfig: { thinkingBudget: 0 },
              systemInstruction:
                'You are a constructive senior code reviewer & mentor. Return strictly valid JSON matching the schema.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  scorePercent: { type: Type.INTEGER },
                  summary: { type: Type.STRING },
                  strengths: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  improvementTip: { type: Type.STRING },
                },
                required: ['scorePercent', 'summary', 'strengths', 'improvementTip'],
              },
            },
          })
        ),
        12000,
        'review-project'
      );

      const aiParsed = parseJsonResponse<{
        scorePercent: number;
        summary: string;
        strengths: string[];
        improvementTip: string;
      }>(response.text, parsed);

      const scorePercent = Math.max(0, Math.min(100, Math.round(Number(aiParsed.scorePercent) || parsed.scorePercent)));
      parsed = {
        scorePercent,
        verified: scorePercent >= 70,
        summary: aiParsed.summary || parsed.summary,
        strengths: Array.isArray(aiParsed.strengths) && aiParsed.strengths.length > 0
          ? aiParsed.strengths.slice(0, 2)
          : parsed.strengths,
        improvementTip: aiParsed.improvementTip || parsed.improvementTip,
      };
    } catch (innerErr) {
      const reason = innerErr instanceof Error ? innerErr.message : String(innerErr);
      console.warn(`Project Review Agent fallback activated (${reason}).`);
      parsed = buildReviewFallback();
    }

    res.json(parsed);
  } catch (err) {
    console.error('Project Review unexpected request error:', err);
    res.status(400).json({ error: 'Invalid project review payload.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KairoPath server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
