import { Injectable } from '@nestjs/common';
import { UserProfileResponse } from '@verified-prof/shared';

@Injectable()
export class ContextBuilderService {
  buildVoiceTwinContext(profile: UserProfileResponse): string {
    const sections: string[] = [];

    sections.push(this.buildInterviewInstructions());
    sections.push(this.buildIdentitySection(profile));
    sections.push(this.buildCoreMetricsSection(profile));
    sections.push(this.buildTechStackSection(profile));
    sections.push(this.buildMissionSection(profile));

    return sections.filter(Boolean).join('\n\n');
  }

  private buildInterviewInstructions(): string {
    return `=== YOUR ROLE ===
You are the Voice Twin of this software developer, designed to help hiring managers conduct technical interviews. You have deep knowledge of this developer's verified work history, code contributions, and technical achievements.

Your communication style:
- Professional yet conversational
- Confident about accomplishments backed by real code commits
- Honest about areas still developing
- Provide specific examples from actual missions when asked
- Use technical terminology appropriately for the audience

When answering questions:
- Reference specific missions and code patterns from the profile
- Explain architectural decisions and their trade-offs
- Discuss challenges faced and how they were overcome
- Be ready to deep-dive into technical implementations
- If asked about something not in the profile, acknowledge the limitation

Remember: All your knowledge comes from VERIFIED code commits and analysis. You represent real work, not assumptions.`;
  }

  private buildIdentitySection(profile: UserProfileResponse): string {
    const yearsExp = this.estimateYearsOfExperience(profile);
    return `=== DEVELOPER PROFILE ===
Name: ${profile.name || 'Anonymous Developer'}
Seniority Level: ${profile.coreMetrics?.seniorityRank || 'Unknown'}
Primary Specialization: ${profile.coreMetrics?.specialization || 'Full-stack development'}
Estimated Experience: ${yearsExp}
Last Analyzed: ${profile.lastAnalyzedAt ? new Date(profile.lastAnalyzedAt).toLocaleDateString() : 'Recently'}`;
  }

  private estimateYearsOfExperience(profile: UserProfileResponse): string {
    const seniority = profile.coreMetrics?.seniorityRank;
    if (seniority === 'Principal' || seniority === 'Staff') return '10+ years';
    if (seniority === 'Senior') return '5-10 years';
    if (seniority === 'Mid') return '2-5 years';
    return '0-2 years';
  }

  private buildCoreMetricsSection(profile: UserProfileResponse): string {
    if (!profile.coreMetrics) return '';

    const metrics = profile.coreMetrics;
    const performanceLevel = this.getPerformanceLevel(metrics.codeImpact);
    return `=== VERIFIED PERFORMANCE METRICS ===
Code Impact Score: ${metrics.codeImpact}/100 (${performanceLevel})
- Measures quality, maintainability, and architectural impact
- Based on complexity, patterns used, and code organization

Development Velocity:
- Cycle Time: ${metrics.cycleTime} days (commit frequency)
- Velocity Percentile: ${metrics.velocityPercentile}th percentile
- Trend: ${metrics.trend || 'STABLE'}

Technical Depth:
- Logic Density: ${metrics.logicDensity}/100 (algorithmic complexity)
- System Complexity: ${metrics.systemComplexityScore}/100 (architectural scale)

Quality Trend: ${this.getTrendDescription(metrics.trend)}`;
  }

  private getPerformanceLevel(score: number): string {
    if (score >= 85) return 'Exceptional';
    if (score >= 70) return 'Strong';
    if (score >= 50) return 'Solid';
    return 'Developing';
  }

  private getTrendDescription(trend: string | null): string {
    if (trend === 'IMPROVING')
      return 'Consistently improving code quality over time';
    if (trend === 'DECLINING') return 'Recent metrics show areas for attention';
    return 'Maintaining consistent quality standards';
  }

  private buildTechStackSection(profile: UserProfileResponse): string {
    if (!profile.techStackDNA) return '';

    const stack = profile.techStackDNA;
    const topLanguages = stack.languages
      ?.slice(0, 5)
      .map((lang) => {
        const proficiencyLevel = this.getProficiencyLevel(lang.expertise);
        const recency =
          lang.weeksActive > 12 ? 'actively used' : 'occasional use';
        return `  • ${lang.name}: ${proficiencyLevel} (${lang.expertise}/100)
    - ${lang.daysToMastery} days to mastery
    - ${recency}, ${lang.weeksActive} weeks active
    - Key patterns: ${lang.topLibraryPatterns?.slice(0, 3).join(', ') || 'various'}`;
      })
      .join('\n');

    return `=== TECHNICAL EXPERTISE ===
Learning Profile: ${this.getLearningDescription(stack.learningCurveTrend)}
Primary Languages: ${stack.dominantLanguages?.join(', ') || 'Multiple'}

Top 5 Language Proficiencies:
${topLanguages || '  None'}

Strengths: ${this.identifyStrengths(stack.languages)}`;
  }

  private getProficiencyLevel(score: number): string {
    if (score >= 85) return 'Expert';
    if (score >= 70) return 'Proficient';
    if (score >= 50) return 'Competent';
    return 'Learning';
  }

  private getLearningDescription(trend: string): string {
    if (trend === 'Exponential')
      return 'Rapid learner, quickly masters new technologies';
    if (trend === 'Specialist')
      return 'Deep specialist, focuses on mastering specific domains';
    return 'Steady learner, consistent skill development';
  }

  private identifyStrengths(
    languages?: Array<{ name: string; expertise: number }>,
  ): string {
    if (!languages?.length) return 'Various technologies';
    const strong = languages.filter((l) => l.expertise >= 70);
    if (strong.length === 0)
      return 'Developing proficiency across multiple areas';
    return strong
      .map((l) => l.name)
      .slice(0, 3)
      .join(', ');
  }

  private buildMissionSection(profile: UserProfileResponse): string {
    if (!profile.missionTimeline?.missions?.length) return '';

    const heroMissions = profile.missionTimeline.missions.filter(
      (m) => m.isHeroMission,
    );
    const regularMissions = profile.missionTimeline.missions.filter(
      (m) => !m.isHeroMission,
    );

    const missions = profile.missionTimeline.missions
      .slice(0, 6)
      .map((mission, idx) => {
        const isHero = mission.isHeroMission ? ' 🏆 HERO MISSION' : '';
        const date = new Date(mission.date).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        });
        return `${idx + 1}. [${mission.impact}${isHero}] ${mission.title}
   Date: ${date}
   Summary: ${mission.summary}
   Technical Achievements:
   ${mission.achievements?.map((a) => `  - ${a}`).join('\n   ') || '  - Details in code commits'}
   Design Patterns: ${mission.patterns?.join(', ') || 'Standard practices'}
   Domain: ${mission.domainContext}
   Architectural Feature: ${mission.architecturalFeat || 'Component-level work'}
   Impact: ${mission.commitCount} commits across project`;
      })
      .join('\n\n');

    return `=== MISSION TIMELINE (Top 6 Verified Projects) ===
Hero Missions: ${heroMissions.length} (highest impact work)
Total Missions Documented: ${profile.missionTimeline.missions.length}

${missions}

Note: Each mission represents a cohesive body of work with verified code commits. Use these when discussing specific projects or technical implementations.`;
  }
}
