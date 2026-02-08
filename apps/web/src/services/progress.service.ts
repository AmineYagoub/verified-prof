import { api } from './api';
import { JobTracking } from '../types';

export class ProgressService {
  static async getProgress(): Promise<JobTracking> {
    const response = await api.get<JobTracking>('/progress');
    return response.data;
  }
}
