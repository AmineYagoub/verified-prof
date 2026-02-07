export enum TechCategory {
  DATABASE = 'DATABASE',
  ORM_ODM = 'ORM_ODM',
  BACKEND_FRAMEWORK = 'BACKEND_FRAMEWORK',
  FRONTEND_FRAMEWORK = 'FRONTEND_FRAMEWORK',
  BUILD_TOOL = 'BUILD_TOOL',
  CI_CD = 'CI_CD',
  CLOUD_SERVICE = 'CLOUD_SERVICE',
  CONTAINER_ORCHESTRATION = 'CONTAINER_ORCHESTRATION',
  TESTING_FRAMEWORK = 'TESTING_FRAMEWORK',
  LANGUAGE_RUNTIME = 'LANGUAGE_RUNTIME',
  API_CLIENT = 'API_CLIENT',
  STATE_MANAGEMENT = 'STATE_MANAGEMENT',
  AUTHENTICATION = 'AUTHENTICATION',
  MONITORING = 'MONITORING',
  MESSAGE_QUEUE = 'MESSAGE_QUEUE',
}

export enum MasteryLevel {
  MENTIONED = 'MENTIONED',
  USED = 'USED',
  PROFICIENT = 'PROFICIENT',
  EXPERT = 'EXPERT',
}

export interface TechnologyStackResponse {
  id: string;
  category: TechCategory;
  name: string;
  version?: string;
  masteryLevel: MasteryLevel;
  implementationScore: number;
  usageCount: number;
  weeksActive: number;
  evidenceTypes: string[];
  codePatterns: string[];
  configFiles: string[];
}
