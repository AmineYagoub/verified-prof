import { api } from './api';
import { TechStackDNA } from '@verified-prof/shared';

export class TechStackService {
  static async getTechStackDNA(userId: string): Promise<TechStackDNA> {
    const response = await api.get<TechStackDNA>(`/tech-stack/${userId}`);
    return response.data;
  }

  static async generateTechStackDNA(userId: string): Promise<TechStackDNA> {
    const response = await api.get<TechStackDNA>(
      `/tech-stack/${userId}/generate`,
    );
    return response.data;
  }
}
