import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { PrismaPg } from '@prisma/adapter-pg';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@verified-prof/prisma';
import { getEnvSafely } from '@verified-prof/config';

const connectionString = getEnvSafely('DATABASE_URL');
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  advanced: {
    cookiePrefix: 'verified-prof',
    generateId: () => crypto.randomUUID(),
  },
  socialProviders: {
    github: {
      clientId: getEnvSafely('GITHUB_CLIENT_ID'),
      clientSecret: getEnvSafely('GITHUB_CLIENT_SECRET'),
      enabled: true,
      authorizationParams: {
        scopes: ['read:user', 'user:email', 'user:read', 'repo', 'read:org'],
      },
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['github'],
    },
  },
  user: {
    additionalFields: {
      githubUsername: {
        type: 'string',
        required: false,
        unique: true,
      },
      githubId: {
        type: 'number',
        required: false,
        unique: true,
      },
    },
  },
});
