import { api } from './api';

export interface WorkerHealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  version?: string;
}

export class WorkerService {
  /**
   * Check worker health/status
   */
  static async getHealth(): Promise<WorkerHealthResponse> {
    const response = await api.get<WorkerHealthResponse>('/health');
    return response.data;
  }
}
