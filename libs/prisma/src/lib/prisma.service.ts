import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../generated/client';

function getEnvSafely(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private adapter: PrismaPg;
  public client: PrismaClient;

  constructor() {
    const connectionString = getEnvSafely('DATABASE_URL');
    this.pool = new Pool({ connectionString });
    this.adapter = new PrismaPg(this.pool);
    this.client = new PrismaClient({ adapter: this.adapter });
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
    await this.pool.end();
  }

  get $() {
    return this.client;
  }

  get user() {
    return this.client.user;
  }

  async $connect() {
    return this.client.$connect();
  }

  async $disconnect() {
    return this.client.$disconnect();
  }
}
