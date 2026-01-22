import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { PrismaPg } from '@prisma/adapter-pg';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '../../../prisma/src/generated';
import { encrypt } from './encrypt';

const getEnvSafely = (envKey: string) => {
  const envVal = process.env[envKey];
  if (!envVal && process.env['NODE_ENV'] === 'production') {
    throw new Error(`Missing env variable ${envKey}!`);
  }
  return envVal ?? '';
};

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
  databaseHooks: {
    account: {
      create: {
        async before(account) {
          const withEncryptedTokens = { ...account };
          if (account.accessToken) {
            const encryptedAccessToken = encrypt(
              account.accessToken,
              account.userId,
            );
            withEncryptedTokens.accessToken = encryptedAccessToken;
          }
          if (account.refreshToken) {
            const encryptedRefreshToken = encrypt(
              account.refreshToken,
              account.userId,
            );
            withEncryptedTokens.refreshToken = encryptedRefreshToken;
          }
          return {
            data: withEncryptedTokens,
          };
        },
      },
    },
  },
});
