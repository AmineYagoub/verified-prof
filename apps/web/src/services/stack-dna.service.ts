import { StackDNA } from '@verified-prof/shared';
import { api } from './api';

export class StackDnaService {
  static async getStackDNA(): Promise<StackDNA> {
    const response = await api.get<StackDNA>('/lang-skills/stack-dna');
    return response.data;
  }
}
