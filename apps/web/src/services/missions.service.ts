import { Mission } from '@verified-prof/prisma';
import { api } from './api';

export const MissionsService = {
  async getMissions(userId: string): Promise<Mission[]> {
    const response = await api.get<Mission[]>(`/missions/${userId}`);
    return response.data;
  },
};
