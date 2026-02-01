import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectAppConfig, AppConfigType } from '@verified-prof/config';
import { GoogleGenAI } from '@google/genai';

export interface GeminiGenerateOptions {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  responseSchema?: Record<string, unknown>;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private ai: GoogleGenAI;
  private readonly defaultModel = 'gemini-2.5-flash';

  constructor(
    @InjectAppConfig() private readonly config: AppConfigType,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.ai = new GoogleGenAI({
      apiKey: config.gcp.studioAiKey,
    });
  }

  async generateJSON<T = unknown>(
    prompt: string,
    responseSchema: Record<string, unknown>,
    options?: GeminiGenerateOptions,
  ): Promise<T> {
    try {
      const cacheKey = `gemini:json:${this.hashPrompt(prompt)}`;
      const cached = await this.cacheManager.get<T>(cacheKey);

      if (cached) {
        this.logger.debug(`Cache hit for prompt: ${cacheKey}`);
        return cached;
      }

      const response = await this.ai.models.generateContent({
        model: options?.model || this.defaultModel,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
        },
      });

      const text = response.text;

      if (!text || text.trim().length === 0) {
        this.logger.error('Empty text response from Gemini');
        throw new Error('Empty response from Gemini');
      }

      this.logger.debug(`Gemini response: ${text}`);

      const result = JSON.parse(text) as T;

      await this.cacheManager.set(cacheKey, result, 3600000);
      this.logger.debug(`Cached response for: ${cacheKey}`);

      return result;
    } catch (error) {
      this.logger.error('Failed to generate JSON with Gemini', error);
      throw error;
    }
  }

  /**
   * Generate a hash for cache key from prompt.
   */
  private hashPrompt(prompt: string): string {
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
