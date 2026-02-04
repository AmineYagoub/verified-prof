import { useQuery } from '@tanstack/react-query';
import { leadershipService } from '@verified-prof/web/services';

export const useEngineeringLeadership = (userId: string) => {
  return useQuery({
    queryKey: ['engineering-leadership', userId],
    queryFn: () => leadershipService.getEngineeringLeadership(userId),
    enabled: !!userId,
  });
};
