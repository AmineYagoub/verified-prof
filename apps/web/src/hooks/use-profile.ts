'use client';
import { useQuery } from '@tanstack/react-query';
import { ProfileService } from '../services';
import { UserProfileResponse } from '@verified-prof/shared';

export const useProfile = (
  slug: string,
  isDashboard: boolean,
  enabled = true,
) => {
  const query = useQuery<UserProfileResponse>({
    queryKey: ['userProfile', slug],
    queryFn: () => ProfileService.getCurrentProfile(slug, isDashboard),
    retry: 1,
    refetchOnWindowFocus: true,
    enabled,
  });

  return {
    data: query.data || null,
    isLoading: query.isLoading,
    error: query.error?.message || null,
  };
};
