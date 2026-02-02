import { api } from './api';
import { CoreMetricsApiResponse } from '@verified-prof/shared';

export class CoreMetricsService {
  static async getCoreMetrics(userId: string): Promise<CoreMetricsApiResponse> {
    const response = await api.get<CoreMetricsApiResponse>(
      `/profile/${userId}/core-metrics`,
    );
    return response.data;
  }
}
