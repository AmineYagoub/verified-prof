import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'libs/prisma/schema.prisma',
  migrations: {
    path: 'libs/prisma/migrations',
    seed: 'node libs/prisma/src/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
