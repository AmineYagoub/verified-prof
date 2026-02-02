import { useQuery } from '@tanstack/react-query';
import { TechStackService } from '../services/tech-stack.service';
import { TechStackDNA } from '@verified-prof/shared';

export const useTechStackDNA = (userId: string | undefined) => {
  return useQuery<TechStackDNA>({
    queryKey: ['techStackDNA', userId],
    queryFn: () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      return TechStackService.getTechStackDNA(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};
