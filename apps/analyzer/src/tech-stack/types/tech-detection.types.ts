import { TechCategory } from '@verified-prof/shared';

export interface DetectedTechnology {
  category: TechCategory;
  name: string;
  version?: string;
  evidenceType: string;
  filePath: string;
  patterns: string[];
  confidence: number;
}

export interface TechnologyEvidence {
  category: TechCategory;
  name: string;
  version?: string;
  usageCount: number;
  totalDays: number;
  weeksActive: number;
  firstSeen: Date;
  lastUsed: Date;
  evidenceTypes: string[];
  codePatterns: string[];
  configFiles: string[];
  projectContexts: string[];
  relatedTechs: string[];
}
