import { Injectable, Logger } from '@nestjs/common';
import { TechCategory } from '@verified-prof/shared';
import { DetectedTechnology } from '../types/tech-detection.types';

@Injectable()
export class ConfigFileDetectorService {
  private readonly logger = new Logger(ConfigFileDetectorService.name);
  private readonly MAX_PACKAGE_JSON_SIZE = 1024 * 1024; // 1MB limit

  async detectFromConfigFile(file: {
    filename: string;
    content: string;
    extension: string;
  }): Promise<DetectedTechnology[]> {
    const detectedTechs: DetectedTechnology[] = [];
    const basename = file.filename.split('/').pop() || '';

    if (basename === 'package.json') {
      detectedTechs.push(...(await this.detectFromPackageJson(file)));
    } else if (basename === 'schema.prisma') {
      detectedTechs.push(...this.detectPrismaORM(file.filename));
    } else if (basename.includes('jest.config')) {
      detectedTechs.push(...this.detectJest(file.filename));
    } else if (basename.includes('vite.config')) {
      detectedTechs.push(...this.detectVite(file.filename));
    } else if (basename.includes('webpack.config')) {
      detectedTechs.push(...this.detectWebpack(file.filename));
    }

    return detectedTechs;
  }

  private async detectFromPackageJson(file: {
    filename: string;
    content: string;
    extension: string;
  }): Promise<DetectedTechnology[]> {
    const detectedTechs: DetectedTechnology[] = [];

    if (!file.content || file.content.trim().length === 0) {
      this.logger.debug(
        `Skipping package.json ${file.filename}: empty or missing content`,
      );
      return detectedTechs;
    }

    const fileSize = Buffer.byteLength(file.content, 'utf8');
    if (fileSize > this.MAX_PACKAGE_JSON_SIZE) {
      this.logger.warn(
        `Skipping package.json ${file.filename}: size (${fileSize} bytes) exceeds limit (${this.MAX_PACKAGE_JSON_SIZE} bytes)`,
      );
      return detectedTechs;
    }

    try {
      const parsed = JSON.parse(file.content);
      const allDeps = {
        ...parsed.dependencies,
        ...parsed.devDependencies,
      };

      for (const [name, version] of Object.entries(allDeps)) {
        const tech = this.mapDependencyToTech(
          name,
          version as string,
          file.filename,
        );
        if (tech) {
          detectedTechs.push(tech);
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to parse package.json: ${file.filename}`, error);
    }

    return detectedTechs;
  }

  private mapDependencyToTech(
    name: string,
    version: string,
    filePath: string,
  ): DetectedTechnology | null {
    const mapping: Record<
      string,
      { category: TechCategory; displayName?: string }
    > = {
      prisma: { category: TechCategory.ORM_ODM, displayName: 'Prisma' },
      '@prisma/client': {
        category: TechCategory.ORM_ODM,
        displayName: 'Prisma',
      },
      typeorm: { category: TechCategory.ORM_ODM, displayName: 'TypeORM' },
      mongoose: { category: TechCategory.ORM_ODM, displayName: 'Mongoose' },
      sequelize: { category: TechCategory.ORM_ODM, displayName: 'Sequelize' },
      'drizzle-orm': { category: TechCategory.ORM_ODM, displayName: 'Drizzle' },
      knex: { category: TechCategory.ORM_ODM, displayName: 'Knex' },
      mikro: { category: TechCategory.ORM_ODM, displayName: 'MikroORM' },
      '@mikro-orm/core': {
        category: TechCategory.ORM_ODM,
        displayName: 'MikroORM',
      },
      pg: { category: TechCategory.DATABASE, displayName: 'PostgreSQL' },
      postgres: { category: TechCategory.DATABASE, displayName: 'PostgreSQL' },
      mysql: { category: TechCategory.DATABASE, displayName: 'MySQL' },
      mysql2: { category: TechCategory.DATABASE, displayName: 'MySQL' },
      mongodb: { category: TechCategory.DATABASE, displayName: 'MongoDB' },
      redis: { category: TechCategory.DATABASE, displayName: 'Redis' },
      ioredis: { category: TechCategory.DATABASE, displayName: 'Redis' },
      sqlite3: { category: TechCategory.DATABASE, displayName: 'SQLite' },
      'better-sqlite3': {
        category: TechCategory.DATABASE,
        displayName: 'SQLite',
      },
      cassandra: { category: TechCategory.DATABASE, displayName: 'Cassandra' },
      elasticsearch: {
        category: TechCategory.DATABASE,
        displayName: 'Elasticsearch',
      },
      '@elastic/elasticsearch': {
        category: TechCategory.DATABASE,
        displayName: 'Elasticsearch',
      },
      '@nestjs/core': {
        category: TechCategory.BACKEND_FRAMEWORK,
        displayName: 'NestJS',
      },
      '@nestjs/common': {
        category: TechCategory.BACKEND_FRAMEWORK,
        displayName: 'NestJS',
      },
      express: {
        category: TechCategory.BACKEND_FRAMEWORK,
        displayName: 'Express',
      },
      fastify: {
        category: TechCategory.BACKEND_FRAMEWORK,
        displayName: 'Fastify',
      },
      koa: { category: TechCategory.BACKEND_FRAMEWORK, displayName: 'Koa' },
      hapi: { category: TechCategory.BACKEND_FRAMEWORK, displayName: 'Hapi' },
      '@hapi/hapi': {
        category: TechCategory.BACKEND_FRAMEWORK,
        displayName: 'Hapi',
      },
      'apollo-server': {
        category: TechCategory.BACKEND_FRAMEWORK,
        displayName: 'Apollo Server',
      },
      '@apollo/server': {
        category: TechCategory.BACKEND_FRAMEWORK,
        displayName: 'Apollo Server',
      },
      trpc: { category: TechCategory.BACKEND_FRAMEWORK, displayName: 'tRPC' },
      '@trpc/server': {
        category: TechCategory.BACKEND_FRAMEWORK,
        displayName: 'tRPC',
      },
      react: {
        category: TechCategory.FRONTEND_FRAMEWORK,
        displayName: 'React',
      },
      'react-dom': {
        category: TechCategory.FRONTEND_FRAMEWORK,
        displayName: 'React',
      },
      next: {
        category: TechCategory.FRONTEND_FRAMEWORK,
        displayName: 'Next.js',
      },
      vue: { category: TechCategory.FRONTEND_FRAMEWORK, displayName: 'Vue' },
      nuxt: { category: TechCategory.FRONTEND_FRAMEWORK, displayName: 'Nuxt' },
      '@angular/core': {
        category: TechCategory.FRONTEND_FRAMEWORK,
        displayName: 'Angular',
      },
      svelte: {
        category: TechCategory.FRONTEND_FRAMEWORK,
        displayName: 'Svelte',
      },
      solid: {
        category: TechCategory.FRONTEND_FRAMEWORK,
        displayName: 'Solid',
      },
      'solid-js': {
        category: TechCategory.FRONTEND_FRAMEWORK,
        displayName: 'Solid',
      },
      preact: {
        category: TechCategory.FRONTEND_FRAMEWORK,
        displayName: 'Preact',
      },
      qwik: { category: TechCategory.FRONTEND_FRAMEWORK, displayName: 'Qwik' },
      vite: { category: TechCategory.BUILD_TOOL, displayName: 'Vite' },
      webpack: { category: TechCategory.BUILD_TOOL, displayName: 'Webpack' },
      rollup: { category: TechCategory.BUILD_TOOL, displayName: 'Rollup' },
      esbuild: { category: TechCategory.BUILD_TOOL, displayName: 'esbuild' },
      parcel: { category: TechCategory.BUILD_TOOL, displayName: 'Parcel' },
      turbopack: {
        category: TechCategory.BUILD_TOOL,
        displayName: 'Turbopack',
      },
      '@swc/core': { category: TechCategory.BUILD_TOOL, displayName: 'SWC' },
      tsc: {
        category: TechCategory.BUILD_TOOL,
        displayName: 'TypeScript Compiler',
      },
      typescript: {
        category: TechCategory.BUILD_TOOL,
        displayName: 'TypeScript',
      },
      babel: { category: TechCategory.BUILD_TOOL, displayName: 'Babel' },
      '@babel/core': {
        category: TechCategory.BUILD_TOOL,
        displayName: 'Babel',
      },
      jest: { category: TechCategory.TESTING_FRAMEWORK, displayName: 'Jest' },
      vitest: {
        category: TechCategory.TESTING_FRAMEWORK,
        displayName: 'Vitest',
      },
      '@playwright/test': {
        category: TechCategory.TESTING_FRAMEWORK,
        displayName: 'Playwright',
      },
      playwright: {
        category: TechCategory.TESTING_FRAMEWORK,
        displayName: 'Playwright',
      },
      cypress: {
        category: TechCategory.TESTING_FRAMEWORK,
        displayName: 'Cypress',
      },
      mocha: { category: TechCategory.TESTING_FRAMEWORK, displayName: 'Mocha' },
      chai: { category: TechCategory.TESTING_FRAMEWORK, displayName: 'Chai' },
      '@testing-library/react': {
        category: TechCategory.TESTING_FRAMEWORK,
        displayName: 'React Testing Library',
      },
      '@testing-library/vue': {
        category: TechCategory.TESTING_FRAMEWORK,
        displayName: 'Vue Testing Library',
      },
      docker: {
        category: TechCategory.CONTAINER_ORCHESTRATION,
        displayName: 'Docker',
      },
      kubernetes: {
        category: TechCategory.CONTAINER_ORCHESTRATION,
        displayName: 'Kubernetes',
      },
      'docker-compose': {
        category: TechCategory.CONTAINER_ORCHESTRATION,
        displayName: 'Docker Compose',
      },
      aws: { category: TechCategory.CLOUD_SERVICE, displayName: 'AWS' },
      'aws-sdk': { category: TechCategory.CLOUD_SERVICE, displayName: 'AWS' },
      '@aws-sdk/client-s3': {
        category: TechCategory.CLOUD_SERVICE,
        displayName: 'AWS S3',
      },
      '@google-cloud/storage': {
        category: TechCategory.CLOUD_SERVICE,
        displayName: 'Google Cloud Storage',
      },
      '@azure/storage-blob': {
        category: TechCategory.CLOUD_SERVICE,
        displayName: 'Azure Blob Storage',
      },
      vercel: { category: TechCategory.CLOUD_SERVICE, displayName: 'Vercel' },
      '@vercel/node': {
        category: TechCategory.CLOUD_SERVICE,
        displayName: 'Vercel',
      },
      redux: { category: TechCategory.STATE_MANAGEMENT, displayName: 'Redux' },
      '@reduxjs/toolkit': {
        category: TechCategory.STATE_MANAGEMENT,
        displayName: 'Redux Toolkit',
      },
      zustand: {
        category: TechCategory.STATE_MANAGEMENT,
        displayName: 'Zustand',
      },
      jotai: { category: TechCategory.STATE_MANAGEMENT, displayName: 'Jotai' },
      recoil: {
        category: TechCategory.STATE_MANAGEMENT,
        displayName: 'Recoil',
      },
      mobx: { category: TechCategory.STATE_MANAGEMENT, displayName: 'MobX' },
      pinia: { category: TechCategory.STATE_MANAGEMENT, displayName: 'Pinia' },
      vuex: { category: TechCategory.STATE_MANAGEMENT, displayName: 'Vuex' },
      'next-auth': {
        category: TechCategory.AUTHENTICATION,
        displayName: 'NextAuth.js',
      },
      '@auth/core': {
        category: TechCategory.AUTHENTICATION,
        displayName: 'Auth.js',
      },
      passport: {
        category: TechCategory.AUTHENTICATION,
        displayName: 'Passport',
      },
      jsonwebtoken: {
        category: TechCategory.AUTHENTICATION,
        displayName: 'JWT',
      },
      jose: { category: TechCategory.AUTHENTICATION, displayName: 'JOSE' },
      '@clerk/nextjs': {
        category: TechCategory.AUTHENTICATION,
        displayName: 'Clerk',
      },
      '@supabase/auth-helpers-nextjs': {
        category: TechCategory.AUTHENTICATION,
        displayName: 'Supabase Auth',
      },
      axios: { category: TechCategory.API_CLIENT, displayName: 'Axios' },
      'node-fetch': {
        category: TechCategory.API_CLIENT,
        displayName: 'Node Fetch',
      },
      got: { category: TechCategory.API_CLIENT, displayName: 'Got' },
      ky: { category: TechCategory.API_CLIENT, displayName: 'Ky' },
      '@tanstack/react-query': {
        category: TechCategory.API_CLIENT,
        displayName: 'TanStack Query',
      },
      'react-query': {
        category: TechCategory.API_CLIENT,
        displayName: 'React Query',
      },
      swr: { category: TechCategory.API_CLIENT, displayName: 'SWR' },
      bullmq: { category: TechCategory.MESSAGE_QUEUE, displayName: 'BullMQ' },
      bull: { category: TechCategory.MESSAGE_QUEUE, displayName: 'Bull' },
      amqplib: {
        category: TechCategory.MESSAGE_QUEUE,
        displayName: 'RabbitMQ',
      },
      kafkajs: { category: TechCategory.MESSAGE_QUEUE, displayName: 'Kafka' },
      '@sentry/node': {
        category: TechCategory.MONITORING,
        displayName: 'Sentry',
      },
      '@sentry/nextjs': {
        category: TechCategory.MONITORING,
        displayName: 'Sentry',
      },
      '@opentelemetry/api': {
        category: TechCategory.MONITORING,
        displayName: 'OpenTelemetry',
      },
      prom: { category: TechCategory.MONITORING, displayName: 'Prometheus' },
      'prom-client': {
        category: TechCategory.MONITORING,
        displayName: 'Prometheus',
      },
    };

    const config = mapping[name];
    if (!config) return null;

    return {
      category: config.category,
      name: config.displayName || name,
      version: version.replace(/[\^~><= ]/g, ''),
      evidenceType: 'package.json',
      filePath,
      patterns: [`dependency: ${name}@${version}`],
      confidence: 50,
    };
  }

  private detectPrismaORM(filePath: string): DetectedTechnology[] {
    return [
      {
        category: TechCategory.ORM_ODM,
        name: 'Prisma',
        evidenceType: 'schema-file',
        filePath,
        patterns: ['schema.prisma file'],
        confidence: 100,
      },
    ];
  }

  private detectJest(filePath: string): DetectedTechnology[] {
    return [
      {
        category: TechCategory.TESTING_FRAMEWORK,
        name: 'Jest',
        evidenceType: 'config-file',
        filePath,
        patterns: ['jest.config file'],
        confidence: 90,
      },
    ];
  }

  private detectVite(filePath: string): DetectedTechnology[] {
    return [
      {
        category: TechCategory.BUILD_TOOL,
        name: 'Vite',
        evidenceType: 'config-file',
        filePath,
        patterns: ['vite.config file'],
        confidence: 90,
      },
    ];
  }

  private detectWebpack(filePath: string): DetectedTechnology[] {
    return [
      {
        category: TechCategory.BUILD_TOOL,
        name: 'Webpack',
        evidenceType: 'config-file',
        filePath,
        patterns: ['webpack.config file'],
        confidence: 90,
      },
    ];
  }
}
