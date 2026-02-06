import { Injectable } from '@nestjs/common';
import { TechCategory } from '@verified-prof/shared';
import { DetectedTechnology } from '../tech-stack/types/tech-detection.types';
import { TreeSitterService } from './tree-sitter.service';
import * as QUERIES from '../tech-stack/tech-detection.queries';

/**
 * AST-based code detector for identifying technologies from code patterns.
 * Uses the unified TreeSitterService for all parsing operations.
 */
@Injectable()
export class AstCodeDetectorService {
  constructor(private readonly treeSitter: TreeSitterService) {}

  async detectFromCode(file: {
    filename: string;
    content: string;
    extension: string;
  }): Promise<DetectedTechnology[]> {
    const detectedTechs: DetectedTechnology[] = [];

    detectedTechs.push(...(await this.detectORMUsageWithAST(file)));
    detectedTechs.push(...(await this.detectFrameworksWithAST(file)));
    detectedTechs.push(...(await this.detectDatabaseClientsWithAST(file)));

    return detectedTechs;
  }

  private async detectORMUsageWithAST(file: {
    filename: string;
    content: string;
    extension: string;
  }): Promise<DetectedTechnology[]> {
    const detectedTechs: DetectedTechnology[] = [];

    const prismaCaptures = this.treeSitter.parseAndQuery(
      file.content,
      file.filename,
      QUERIES.PRISMA_QUERY,
    );
    if (prismaCaptures.length > 0) {
      detectedTechs.push({
        category: TechCategory.ORM_ODM,
        name: 'Prisma',
        evidenceType: 'ast-analysis',
        filePath: file.filename,
        patterns: this.extractPatterns(prismaCaptures, [
          ['prisma.operation', 'CRUD operations'],
          ['prisma.transaction', 'transactions'],
          ['prisma.raw', 'raw queries'],
        ]),
        confidence: 95,
      });
    }

    const typeormCaptures = this.treeSitter.parseAndQuery(
      file.content,
      file.filename,
      QUERIES.TYPEORM_QUERY,
    );
    if (typeormCaptures.length > 0) {
      detectedTechs.push({
        category: TechCategory.ORM_ODM,
        name: 'TypeORM',
        evidenceType: 'ast-analysis',
        filePath: file.filename,
        patterns: this.extractPatterns(typeormCaptures, [
          ['typeorm.entity', 'entity decorators'],
          ['typeorm.column', 'column decorators'],
          ['typeorm.relation', 'relationships'],
          ['typeorm.repository', 'repository pattern'],
        ]),
        confidence: 95,
      });
    }

    const mongooseCaptures = this.treeSitter.parseAndQuery(
      file.content,
      file.filename,
      QUERIES.MONGOOSE_QUERY,
    );
    if (mongooseCaptures.length > 0) {
      detectedTechs.push({
        category: TechCategory.ORM_ODM,
        name: 'Mongoose',
        evidenceType: 'ast-analysis',
        filePath: file.filename,
        patterns: this.extractPatterns(mongooseCaptures, [
          ['mongoose.model', 'model definitions'],
          ['mongoose.schema', 'schemas'],
          ['mongoose.query', 'query operations'],
        ]),
        confidence: 95,
      });
    }

    const sequelizeCaptures = this.treeSitter.parseAndQuery(
      file.content,
      file.filename,
      QUERIES.SEQUELIZE_QUERY,
    );
    if (sequelizeCaptures.length > 0) {
      detectedTechs.push({
        category: TechCategory.ORM_ODM,
        name: 'Sequelize',
        evidenceType: 'ast-analysis',
        filePath: file.filename,
        patterns: this.extractPatterns(sequelizeCaptures, [
          ['sequelize.define', 'model definitions'],
          ['sequelize.association', 'associations'],
        ]),
        confidence: 95,
      });
    }

    const drizzleCaptures = this.treeSitter.parseAndQuery(
      file.content,
      file.filename,
      QUERIES.DRIZZLE_QUERY,
    );
    if (drizzleCaptures.length > 0) {
      detectedTechs.push({
        category: TechCategory.ORM_ODM,
        name: 'Drizzle',
        evidenceType: 'ast-analysis',
        filePath: file.filename,
        patterns: this.extractPatterns(drizzleCaptures, [
          ['drizzle.table', 'table definitions'],
          ['drizzle.column', 'column types'],
        ]),
        confidence: 95,
      });
    }

    return detectedTechs;
  }

  private async detectFrameworksWithAST(file: {
    filename: string;
    content: string;
    extension: string;
  }): Promise<DetectedTechnology[]> {
    const detectedTechs: DetectedTechnology[] = [];

    const nestjsCaptures = this.treeSitter.parseAndQuery(
      file.content,
      file.filename,
      QUERIES.NESTJS_QUERY,
    );
    if (nestjsCaptures.length > 0) {
      detectedTechs.push({
        category: TechCategory.BACKEND_FRAMEWORK,
        name: 'NestJS',
        evidenceType: 'ast-analysis',
        filePath: file.filename,
        patterns: this.extractPatterns(nestjsCaptures, [
          ['nestjs.controller', 'controllers'],
          ['nestjs.injectable', 'services'],
          ['nestjs.module', 'modules'],
          ['nestjs.route', 'route handlers'],
        ]),
        confidence: 95,
      });
    }

    const reactCaptures = this.treeSitter.parseAndQuery(
      file.content,
      file.filename,
      QUERIES.REACT_QUERY,
    );
    if (reactCaptures.length > 0) {
      detectedTechs.push({
        category: TechCategory.FRONTEND_FRAMEWORK,
        name: 'React',
        evidenceType: 'ast-analysis',
        filePath: file.filename,
        patterns: this.extractPatterns(reactCaptures, [
          ['react.usestate', 'useState'],
          ['react.useeffect', 'useEffect'],
          ['react.usecallback', 'useCallback'],
          ['react.usememo', 'useMemo'],
          ['react.jsx', 'JSX'],
        ]),
        confidence: 95,
      });
    }

    const expressCaptures = this.treeSitter.parseAndQuery(
      file.content,
      file.filename,
      QUERIES.EXPRESS_QUERY,
    );
    if (expressCaptures.length > 0) {
      detectedTechs.push({
        category: TechCategory.BACKEND_FRAMEWORK,
        name: 'Express',
        evidenceType: 'ast-analysis',
        filePath: file.filename,
        patterns: this.extractPatterns(expressCaptures, [
          ['express.route', 'route handlers'],
          ['express.middleware', 'middleware'],
          ['express.listen', 'server setup'],
        ]),
        confidence: 95,
      });
    }

    return detectedTechs;
  }

  private async detectDatabaseClientsWithAST(file: {
    filename: string;
    content: string;
    extension: string;
  }): Promise<DetectedTechnology[]> {
    const detectedTechs: DetectedTechnology[] = [];

    const postgresCaptures = this.treeSitter.parseAndQuery(
      file.content,
      file.filename,
      QUERIES.POSTGRESQL_QUERY,
    );
    if (postgresCaptures.length > 0) {
      detectedTechs.push({
        category: TechCategory.DATABASE,
        name: 'PostgreSQL',
        evidenceType: 'ast-analysis',
        filePath: file.filename,
        patterns: this.extractPatterns(postgresCaptures, [
          ['postgres.pool', 'connection pooling'],
          ['postgres.client', 'client connections'],
          ['postgres.query', 'query operations'],
        ]),
        confidence: 95,
      });
    }

    const mongodbCaptures = this.treeSitter.parseAndQuery(
      file.content,
      file.filename,
      QUERIES.MONGODB_QUERY,
    );
    if (mongodbCaptures.length > 0) {
      detectedTechs.push({
        category: TechCategory.DATABASE,
        name: 'MongoDB',
        evidenceType: 'ast-analysis',
        filePath: file.filename,
        patterns: this.extractPatterns(mongodbCaptures, [
          ['mongodb.connect', 'connection'],
          ['mongodb.operation', 'CRUD operations'],
        ]),
        confidence: 95,
      });
    }

    const redisCaptures = this.treeSitter.parseAndQuery(
      file.content,
      file.filename,
      QUERIES.REDIS_QUERY,
    );
    if (redisCaptures.length > 0) {
      detectedTechs.push({
        category: TechCategory.DATABASE,
        name: 'Redis',
        evidenceType: 'ast-analysis',
        filePath: file.filename,
        patterns: this.extractPatterns(redisCaptures, [
          ['redis.client', 'client setup'],
          ['redis.operation', 'cache operations'],
        ]),
        confidence: 95,
      });
    }

    const mysqlCaptures = this.treeSitter.parseAndQuery(
      file.content,
      file.filename,
      QUERIES.MYSQL_QUERY,
    );
    if (mysqlCaptures.length > 0) {
      detectedTechs.push({
        category: TechCategory.DATABASE,
        name: 'MySQL',
        evidenceType: 'ast-analysis',
        filePath: file.filename,
        patterns: this.extractPatterns(mysqlCaptures, [
          ['mysql.connection', 'connections'],
          ['mysql.query', 'query operations'],
        ]),
        confidence: 95,
      });
    }

    return detectedTechs;
  }

  /**
   * Extract unique patterns from capture results
   */
  private extractPatterns(
    captures: Array<{ name: string; node: { text: string } }>,
    mapping: Array<[string, string]>,
  ): string[] {
    const patterns: string[] = [];
    for (const [captureName, pattern] of mapping) {
      if (captures.some((c) => c.name === captureName)) {
        patterns.push(pattern);
      }
    }
    return [...new Set(patterns)];
  }
}
