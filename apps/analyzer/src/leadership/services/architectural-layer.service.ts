import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@verified-prof/prisma';
import { PLAN_POLICIES, PlanPolicy } from '@verified-prof/shared';

interface FileAnalysis {
  filePath: string;
  createdAt: Date;
}

interface LayerDefinition {
  name: string;
  description: string;
  patterns: RegExp[];
}

@Injectable()
export class ArchitecturalLayerService {
  private readonly logger = new Logger(ArchitecturalLayerService.name);

  private readonly layerDefinitions: LayerDefinition[] = [
    {
      name: 'API Layer',
      description: 'REST endpoints, GraphQL resolvers, and API controllers',
      patterns: [
        /controllers?/i,
        /routes?/i,
        /api/i,
        /endpoints?/i,
        /resolvers?/i,
        /graphql/i,
        /\.(controller|route|resolver)\.(ts|js|py|go|rb|java)$/,
      ],
    },
    {
      name: 'Business Logic',
      description: 'Core domain logic, services, and use cases',
      patterns: [
        /services?/i,
        /use-?cases?/i,
        /domain/i,
        /business/i,
        /logic/i,
        /\.(service|usecase|domain)\.(ts|js|py|go|rb|java)$/,
      ],
    },
    {
      name: 'Data Layer',
      description: 'Database models, repositories, and data access',
      patterns: [
        /models?/i,
        /entities?/i,
        /repositories?/i,
        /database/i,
        /db/i,
        /schema/i,
        /migrations?/i,
        /prisma/i,
        /typeorm/i,
        /sequelize/i,
        /\.(model|entity|repository|schema)\.(ts|js|py|go|rb|java)$/,
      ],
    },
    {
      name: 'UI Components',
      description: 'User interface components and views',
      patterns: [
        /components?/i,
        /views?/i,
        /pages?/i,
        /ui/i,
        /frontend/i,
        /client/i,
        /\.(component|view|page)\.(tsx|jsx|vue|svelte)$/,
        /\.(tsx|jsx|vue|svelte)$/,
      ],
    },
    {
      name: 'Configuration',
      description: 'Application configuration and environment setup',
      patterns: [
        /config/i,
        /settings?/i,
        /environment/i,
        /\.(config|env|settings)\.(ts|js|json|yaml|yml|toml)$/,
        /\.env/,
        /package\.json$/,
        /tsconfig\.json$/,
      ],
    },
    {
      name: 'Testing',
      description: 'Unit tests, integration tests, and test utilities',
      patterns: [
        /test/i,
        /spec/i,
        /__tests__/i,
        /\.(test|spec)\.(ts|js|py|go|rb|java)$/,
      ],
    },
    {
      name: 'Infrastructure',
      description: 'DevOps, CI/CD, and deployment configuration',
      patterns: [
        /docker/i,
        /kubernetes/i,
        /k8s/i,
        /terraform/i,
        /ansible/i,
        /\.github/i,
        /\.gitlab/i,
        /ci-?cd/i,
        /deployment/i,
        /Dockerfile$/,
        /docker-compose/i,
        /\.ya?ml$/,
      ],
    },
    {
      name: 'Utilities',
      description: 'Helper functions, utilities, and shared code',
      patterns: [
        /utils?/i,
        /helpers?/i,
        /shared/i,
        /common/i,
        /lib/i,
        /\.(util|helper)\.(ts|js|py|go|rb|java)$/,
      ],
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async generateAndPersist(
    userId: string,
    plan: 'FREE' | 'PREMIUM' | 'ENTERPRISE' = 'FREE',
  ): Promise<void> {
    this.logger.log(`Generating architectural layers for user ${userId}`);

    const policy: PlanPolicy = PLAN_POLICIES[plan] ?? PLAN_POLICIES.FREE;

    const userProfile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
    });

    if (!userProfile) {
      this.logger.warn(`No profile found for user ${userId}`);
      return;
    }

    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - policy.windowDays);

    const analysisData = await this.prisma.client.analysisTagSummary.findMany({
      where: {
        userId,
        createdAt: {
          gte: windowStart,
        },
      },
      select: {
        filePath: true,
        createdAt: true,
      },
    });

    if (analysisData.length === 0) {
      this.logger.warn(`No analysis data found for user ${userId}`);
      return;
    }

    const layers = this.categorizeFiles(analysisData);

    await this.prisma.client.$transaction([
      this.prisma.client.architecturalLayer.deleteMany({
        where: { userProfileId: userProfile.id },
      }),
      ...layers.map((layer) =>
        this.prisma.client.architecturalLayer.create({
          data: {
            userProfileId: userProfile.id,
            layer: layer.layer,
            description: layer.description,
            fileCount: layer.fileCount,
            stabilityRate: layer.stabilityRate,
            involvement: layer.involvement,
          },
        }),
      ),
    ]);

    this.logger.log(
      `Architectural layers persisted for user ${userId} (${layers.length} layers)`,
    );
  }

  async get(userId: string) {
    const userProfile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
    });

    if (!userProfile) {
      return [];
    }

    return this.prisma.client.architecturalLayer.findMany({
      where: { userProfileId: userProfile.id },
      select: {
        layer: true,
        description: true,
        fileCount: true,
        stabilityRate: true,
        involvement: true,
      },
      orderBy: { fileCount: 'desc' },
    });
  }

  private categorizeFiles(analysisData: FileAnalysis[]) {
    const layerMap = new Map<
      string,
      {
        layer: string;
        description: string;
        files: string[];
      }
    >();

    for (const file of analysisData) {
      const matchedLayer = this.matchFileToLayer(file.filePath);

      if (!layerMap.has(matchedLayer.name)) {
        layerMap.set(matchedLayer.name, {
          layer: matchedLayer.name,
          description: matchedLayer.description,
          files: [],
        });
      }

      const layer = layerMap.get(matchedLayer.name);
      if (layer && !layer.files.includes(file.filePath)) {
        layer.files.push(file.filePath);
      }
    }

    return Array.from(layerMap.values()).map((layer) => ({
      layer: layer.layer,
      description: layer.description,
      fileCount: layer.files.length,
      stabilityRate: this.calculateStabilityRate(layer.files, analysisData),
      involvement: layer.files.length > 0 ? 100 : 0,
    }));
  }

  private matchFileToLayer(filePath: string): LayerDefinition {
    for (const layerDef of this.layerDefinitions) {
      for (const pattern of layerDef.patterns) {
        if (pattern.test(filePath)) {
          return layerDef;
        }
      }
    }

    return {
      name: 'Other',
      description: 'Miscellaneous files',
      patterns: [],
    };
  }

  private calculateStabilityRate(
    files: string[],
    analysisData: FileAnalysis[],
  ): number {
    if (files.length === 0) return 0;

    const fileCounts = new Map<string, number>();
    for (const item of analysisData) {
      fileCounts.set(item.filePath, (fileCounts.get(item.filePath) || 0) + 1);
    }

    const stableFiles = files.filter((f) => (fileCounts.get(f) || 0) <= 2);
    return Math.round((stableFiles.length / files.length) * 100);
  }
}
