import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectAppConfig, AppConfigType } from '@verified-prof/config';
import { VertexAI, GenerateContentRequest } from '@google-cloud/vertexai';

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
  private vertexAI: VertexAI;
  private readonly defaultModel = 'gemini-2.5-flash';

  constructor(
    @InjectAppConfig() private readonly config: AppConfigType,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.vertexAI = new VertexAI({
      project: config.gcp.projectId,
      location: config.gcp.region,
    });
  }

  /**
   * Generate JSON content with structured output using Gemini's native JSON Schema support.
   * This guarantees syntactically valid JSON matching the provided schema.
   * Ideal for achievement extraction, skill inference, etc.
   * Caches responses for 1 hour to reduce API costs.
   */
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

      const model = this.vertexAI.getGenerativeModel({
        model: options?.model || this.defaultModel,
        generationConfig: {
          //   temperature: options?.temperature ?? 0.7,
          //   maxOutputTokens: options?.maxOutputTokens ?? 2048,
          //   topP: options?.topP ?? 0.95,
          //   topK: options?.topK ?? 40,
          //   stopSequences: options?.stopSequences,
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
        },
      });

      const request: GenerateContentRequest = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      };

      const response = await model.generateContent(request);
      const candidate = response.response.candidates?.[0];

      if (!candidate) {
        this.logger.error('No candidate in Gemini response');
        throw new Error('No response generated from Gemini');
      }

      if (
        candidate.finishReason === 'SAFETY' ||
        candidate.finishReason === 'RECITATION'
      ) {
        this.logger.warn(
          `Content blocked by Gemini: ${candidate.finishReason}`,
        );
        throw new Error(`Content blocked: ${candidate.finishReason}`);
      }

      const text = candidate.content?.parts?.map((part) => part.text).join('');

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
