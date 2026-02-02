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
    origin: getEnvSafely('ALLOWED_ORIGINS')?.split(','),
    vcsProvider: process.env['DEFAULT_VCS_PROVIDER'],
  },
  github: {
    clientId: getEnvSafely('GITHUB_CLIENT_ID'),
    clientSecret: getEnvSafely('GITHUB_CLIENT_SECRET'),
    redirectUrl: getEnvSafely('GITHUB_REDIRECT_URL'),
  },
  analyzer: {
    protocol: process.env['ANALYZER_PROTOCOL'] || 'http',
    host: process.env['ANALYZER_HOST'] || '127.0.0.1',
    port: Number(process.env['ANALYZER_PORT']) || 4200,
    get url() {
      return `${this.protocol}://${this.host}:${this.port}`;
    },
  },
  gcp: {
    projectId: getEnvSafely('GOOGLE_PROJECT_ID'),
    region: process.env['GOOGLE_PROJECT_REGION'] || 'us-central1',
    bucketName: getEnvSafely('GOOGLE_BUCKET_NAME'),
    keyFilename: getEnvSafely('GOOGLE_APPLICATION_CREDENTIALS'),
    studioAiKey: getEnvSafely('GOOGLE_AI_STUDIO_API_KEY'),
  },
}));

export type AppConfigType = ConfigType<typeof appConfig>;
export const InjectAppConfig = () => Inject(appConfig.KEY);
