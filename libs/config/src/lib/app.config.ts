import { Inject } from '@nestjs/common';
import { type ConfigType, registerAs } from '@nestjs/config';

export const APP_CONFIG_REGISTER_KEY = 'VerifiedProfConfig';

/**
 * Retrieves the value of an environment variable safely.
 * @param envKey - The key of the environment variable.
 * @returns The value of the environment variable.
 * @throws Error if the environment variable is missing.
 */
export const getEnvSafely = (envKey: string) => {
  const envVal = process.env[envKey];
  if (!envVal && process.env['NODE_ENV'] === 'production') {
    throw new Error(`Missing env variable ${envKey}!`);
  }
  return envVal ?? '';
};

export const appConfig = registerAs(APP_CONFIG_REGISTER_KEY, () => ({
  app: {
    appBaseUrl: getEnvSafely('APP_BASE_URL'),
    origin: getEnvSafely('ALLOWED_ORIGINS')?.split(','),
  },
  github: {
    clientId: getEnvSafely('GITHUB_CLIENT_ID'),
    clientSecret: getEnvSafely('GITHUB_CLIENT_SECRET'),
    redirectUrl: getEnvSafely('GITHUB_REDIRECT_URL'),
  },
  analysis: {
    protocol: process.env['ANALYSIS_PROTOCOL'] || 'http',
    host: process.env['ANALYSIS_HOST'] || '127.0.0.1',
    port: Number(process.env['ANALYSIS_PORT']) || 3030,
    get url() {
      return `${this.protocol}://${this.host}:${this.port}`;
    },
  },
}));

export type AppConfigType = ConfigType<typeof appConfig>;
export const InjectAppConfig = () => Inject(appConfig.KEY);
