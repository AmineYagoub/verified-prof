import { useQuery } from '@tanstack/react-query';
import { MissionsService } from '../services/missions.service';
import { Mission } from '@verified-prof/prisma';

export const useMissions = (userId: string | undefined) => {
  return useQuery<Mission[]>({
    queryKey: ['missions', userId],
    queryFn: () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      return MissionsService.getMissions(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};
