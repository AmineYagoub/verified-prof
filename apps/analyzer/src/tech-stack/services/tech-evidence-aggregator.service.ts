import { Injectable } from '@nestjs/common';
import {
  DetectedTechnology,
  TechnologyEvidence,
} from '../types/tech-detection.types';

@Injectable()
export class TechEvidenceAggregatorService {
  aggregateEvidence(
    detectedTechs: DetectedTechnology[],
    commitDates: Date[] = [],
  ): TechnologyEvidence[] {
    const techMap = new Map<string, TechnologyEvidence>();
    const sortedDates = commitDates.sort((a, b) => a.getTime() - b.getTime());
    const earliestDate = sortedDates[0] || new Date();
    const latestDate = sortedDates[sortedDates.length - 1] || new Date();
    const totalDays = Math.max(
      1,
      Math.floor(
        (latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );
    const weeksActive = Math.max(1, Math.floor(totalDays / 7));
    for (const tech of detectedTechs) {
      const key = `${tech.category}-${tech.name}`;
      const existing = techMap.get(key);
      if (!existing) {
        techMap.set(key, {
          category: tech.category,
          name: tech.name,
          version: tech.version,
          usageCount: 1,
          totalDays,
          weeksActive,
          firstSeen: earliestDate,
          lastUsed: latestDate,
          evidenceTypes: [tech.evidenceType],
          codePatterns: tech.patterns,
          configFiles: [tech.filePath],
          projectContexts: [],
          relatedTechs: [],
        });
      } else {
        existing.usageCount++;
        // Use Set for O(1) lookups instead of O(n) includes()
        const evidenceTypesSet = new Set(existing.evidenceTypes);
        if (!evidenceTypesSet.has(tech.evidenceType)) {
          existing.evidenceTypes.push(tech.evidenceType);
        }
        const codePatternsSet = new Set(existing.codePatterns);
        for (const pattern of tech.patterns) {
          if (!codePatternsSet.has(pattern)) {
            existing.codePatterns.push(pattern);
            codePatternsSet.add(pattern);
          }
        }
        const configFilesSet = new Set(existing.configFiles);
        if (!configFilesSet.has(tech.filePath)) {
          existing.configFiles.push(tech.filePath);
        }
      }
    }
    return Array.from(techMap.values());
  }
}
