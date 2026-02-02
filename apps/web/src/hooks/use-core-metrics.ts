import { useQuery } from '@tanstack/react-query';
import { CoreMetricsService } from '../services/core-metrics.service';
import { CoreMetricsApiResponse } from '@verified-prof/shared';

export const useCoreMetrics = (userId: string | undefined) => {
  return useQuery<CoreMetricsApiResponse>({
    queryKey: ['coreMetrics', userId],
    queryFn: () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      return CoreMetricsService.getCoreMetrics(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};
