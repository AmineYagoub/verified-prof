import { Injectable } from '@nestjs/common';
import { TechCategory } from '@verified-prof/shared';
import { DetectedTechnology } from '../types/tech-detection.types';

@Injectable()
export class InfrastructureDetectorService {
  async detectFromInfrastructure(file: {
    filename: string;
    content: string;
    extension: string;
  }): Promise<DetectedTechnology[]> {
    const detectedTechs: DetectedTechnology[] = [];

    if (file.filename.includes('.github/workflows/')) {
      detectedTechs.push(...(await this.detectGitHubActions(file)));
    } else if (file.filename.includes('docker-compose')) {
      detectedTechs.push(...(await this.detectDockerCompose(file)));
    } else if (file.filename.includes('Dockerfile')) {
      detectedTechs.push(...this.detectDocker(file.filename));
    }

    return detectedTechs;
  }

  private async detectGitHubActions(file: {
    filename: string;
    content: string;
  }): Promise<DetectedTechnology[]> {
    return [
      {
        category: TechCategory.CI_CD,
        name: 'GitHub Actions',
        evidenceType: 'workflow-file',
        filePath: file.filename,
        patterns: ['.github/workflows/*.yml'],
        confidence: 100,
      },
    ];
  }

  private async detectDockerCompose(file: {
    filename: string;
    content: string;
  }): Promise<DetectedTechnology[]> {
    return [
      {
        category: TechCategory.CONTAINER_ORCHESTRATION,
        name: 'Docker Compose',
        evidenceType: 'compose-file',
        filePath: file.filename,
        patterns: ['docker-compose.yml'],
        confidence: 100,
      },
    ];
  }

  private detectDocker(filePath: string): DetectedTechnology[] {
    return [
      {
        category: TechCategory.CONTAINER_ORCHESTRATION,
        name: 'Docker',
        evidenceType: 'dockerfile',
        filePath,
        patterns: ['Dockerfile'],
        confidence: 100,
      },
    ];
  }
}
