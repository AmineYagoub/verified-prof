import { api } from './api';
import { EngineeringLeadershipScore } from '@verified-prof/shared';

export class LeadershipService {
  async getEngineeringLeadership(
    userId: string,
  ): Promise<EngineeringLeadershipScore> {
    const response = await api.get<EngineeringLeadershipScore>(
      `/leadership/${userId}`,
    );
    return response.data;
  }
}

export const leadershipService = new LeadershipService();
