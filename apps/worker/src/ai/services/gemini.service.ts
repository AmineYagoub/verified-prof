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
}

export interface GeminiResponse {
  text: string;
  finishReason: string;
  safetyRatings?: Array<{
    category: string;
    probability: string;
  }>;
  usage?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private vertexAI: VertexAI;
  private readonly defaultModel = 'gemini-1.5-flash-002';

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
   * Generate content using Gemini model.
   * Uses Vertex AI for production-grade reliability and quota management.
   */
  async generateContent(
    prompt: string,
    options?: GeminiGenerateOptions,
  ): Promise<GeminiResponse> {
    try {
      const model = this.vertexAI.getGenerativeModel({
        model: options?.model || this.defaultModel,
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxOutputTokens ?? 2048,
          topP: options?.topP ?? 0.95,
          topK: options?.topK ?? 40,
          stopSequences: options?.stopSequences,
        },
      });

      const request: GenerateContentRequest = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      };

      const response = await model.generateContent(request);
      const candidate = response.response.candidates?.[0];

      if (!candidate) {
        throw new Error('No response generated from Gemini');
      }

      const text = candidate.content.parts.map((part) => part.text).join('');

      return {
        text,
        finishReason: candidate.finishReason || 'UNKNOWN',
        safetyRatings: candidate.safetyRatings?.map((rating) => ({
          category: rating.category,
          probability: rating.probability,
        })),
        usage: response.response.usageMetadata
          ? {
              promptTokens: response.response.usageMetadata.promptTokenCount,
              candidatesTokens:
                response.response.usageMetadata.candidatesTokenCount,
              totalTokens: response.response.usageMetadata.totalTokenCount,
            }
          : undefined,
      };
    } catch (error) {
      this.logger.error('Failed to generate content with Gemini', error);
      throw error;
    }
  }

  /**
   * Generate JSON content with structured output.
   * Ideal for achievement extraction, skill inference, etc.
   * Caches responses for 1 hour to reduce API costs.
   */
  async generateJSON<T = unknown>(
    prompt: string,
    options?: GeminiGenerateOptions,
  ): Promise<T> {
    try {
      const cacheKey = `gemini:json:${this.hashPrompt(prompt)}`;
      const cached = await this.cacheManager.get<T>(cacheKey);

      if (cached) {
        this.logger.debug(`Cache hit for prompt: ${cacheKey}`);
        return cached;
      }

      const response = await this.generateContent(
        `${prompt}\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no explanations, just JSON.`,
        options,
      );

      const cleaned = response.text
        .trim()
        .replace(/^```json\n?/, '')
        .replace(/\n?```$/, '');

      const result = JSON.parse(cleaned) as T;

      await this.cacheManager.set(cacheKey, result, 3600000);
      this.logger.debug(`Cached response for: ${cacheKey}`);

      return result;
    } catch (error) {
      this.logger.error('Failed to parse JSON response from Gemini', error);
      throw new Error('Invalid JSON response from AI');
    }
  }

  /**
   * Generate content with streaming (for future real-time features).
   */
  async *generateContentStream(
    prompt: string,
    options?: GeminiGenerateOptions,
  ): AsyncGenerator<string> {
    try {
      const model = this.vertexAI.getGenerativeModel({
        model: options?.model || this.defaultModel,
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxOutputTokens ?? 2048,
          topP: options?.topP ?? 0.95,
          topK: options?.topK ?? 40,
        },
      });

      const request: GenerateContentRequest = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      };

      const streamingResult = await model.generateContentStream(request);

      for await (const chunk of streamingResult.stream) {
        const text = chunk.candidates?.[0]?.content.parts
          .map((part) => part.text)
          .join('');
        if (text) {
          yield text;
        }
      }
    } catch (error) {
      this.logger.error('Failed to stream content from Gemini', error);
      throw error;
    }
  }

  /**
   * Count tokens in a prompt (for cost estimation).
   */
  async countTokens(prompt: string): Promise<number> {
    try {
      const model = this.vertexAI.getGenerativeModel({
        model: this.defaultModel,
      });

      const request = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      };

      const result = await model.countTokens(request);
      return result.totalTokens || 0;
    } catch (error) {
      this.logger.error('Failed to count tokens', error);
      return 0;
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
