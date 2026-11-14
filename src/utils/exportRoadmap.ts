import type { ProfilerResult, RoadmapModule } from '../types';

interface ExportRoadmapParams {
  studentName: string;
  targetRole: string;
  currentSkills: string[];
  certifications: string[];
  pastProjects: string[];
  profilerResult: ProfilerResult | null;
  modules: RoadmapModule[];
}

export function buildRoadmapMarkdown({
  studentName,
  targetRole,
  currentSkills,
  certifications,
  pastProjects,
  profilerResult,
  modules,
}: ExportRoadmapParams): string {
  const cleanName = studentName || 'Student';
  const cleanRole = targetRole || 'Target Role';
  const totalCount = modules.length;
  const completedCount = modules.filter((m) => m.completed).length;
  const readinessPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalHours = modules.reduce((sum, m) => sum + m.estimatedHours, 0);
  const generatedDate = new Date().toISOString().split('T')[0];

  const lines: string[] = [
    '# KairoPath — Career Readiness & Adaptive Learning Roadmap',
    `Generated: ${generatedDate}`,
    '',
    '## Student Profile',
    `- **Name:** ${cleanName}`,
    `- **Target Role:** ${cleanRole}`,
    `- **Current Skills:** ${currentSkills.length > 0 ? currentSkills.join(', ') : 'None listed'}`,
    `- **Certifications:** ${certifications.length > 0 ? certifications.join(', ') : 'None listed'}`,
    `- **Past Projects:** ${pastProjects.length > 0 ? pastProjects.join(', ') : 'None listed'}`,
    '',
    '## Career Readiness & Skill Gap Summary',
    `- **Overall Career Readiness:** ${readinessPercent}% (${completedCount}/${totalCount} modules completed)`,
    `- **Profiler Career Match:** ${profilerResult ? `${profilerResult.careerMatchPercent}%` : 'N/A'}`,
  ];

  if (profilerResult?.summary) {
    lines.push(`- **Assessment:** ${profilerResult.summary}`);
  }

  lines.push('', '### Verified Skills');
  if (profilerResult && profilerResult.verifiedSkills.length > 0) {
    profilerResult.verifiedSkills.forEach((skill) => lines.push(`- [x] ${skill}`));
  } else {
    lines.push('- None matched yet');
  }

  lines.push('', '### Missing Skills');
  if (profilerResult && profilerResult.missingSkills.length > 0) {
    profilerResult.missingSkills.forEach((skill) => lines.push(`- [ ] ${skill}`));
  } else {
    lines.push('- No critical skill gaps remaining');
  }

  lines.push(
    '',
    `## Sequenced Learning Roadmap (${totalCount} Modules · ${totalHours} Estimated Hours)`
  );

  if (modules.length === 0) {
    lines.push('', '_No modules generated yet._');
  } else {
    modules.forEach((mod, idx) => {
      const step = String(idx + 1).padStart(2, '0');
      const status = mod.completed
        ? `Completed${typeof mod.quizScore === 'number' ? ` (${mod.quizScore}%)` : ''}`
        : 'Pending';
      const refresherTag = mod.isRefresher ? ' [Foundational Refresher]' : '';

      lines.push(
        '',
        `### Step ${step}: ${mod.title}${refresherTag}`,
        `- **Target Skill:** ${mod.targetSkill}`,
        `- **Estimated Effort:** ${mod.estimatedHours} hrs`,
        `- **Status:** ${status}`,
        '',
        '**Key Topics:**'
      );

      mod.keyTopics.forEach((topic) => lines.push(`- ${topic}`));

      if (mod.recommendedCourses && mod.recommendedCourses.length > 0) {
        lines.push('', '**Courses & Tutorials:**');
        mod.recommendedCourses.forEach((c) =>
          lines.push(`- ${c.title} — _${c.platform} (${c.format})_`)
        );
      }

      lines.push(
        '',
        `**Practical Exercise / Mini-Project:** ${mod.miniProject.title}`,
        `${mod.miniProject.description}`
      );
    });
  }

  lines.push('');
  return lines.join('\n');
}

export function downloadRoadmapMarkdown(params: ExportRoadmapParams): void {
  const markdown = buildRoadmapMarkdown(params);
  const slug = (params.targetRole || 'career-roadmap')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `kairopath-${slug || 'roadmap'}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
