'use client';
import { useQuery } from '@tanstack/react-query';
import { ProgressService } from '../services/progress.service';
import { JobStatus, JobTracking } from '../types';

const POLL_INTERVAL = 3000;

export const useJobProgress = () => {
  const query = useQuery<JobTracking>({
    queryKey: ['jobProgress'],
    queryFn: () => ProgressService.getProgress(),
    refetchInterval(query) {
      const status = query.state.data?.status;
      return status === JobStatus.COMPLETED || status === JobStatus.FAILED
        ? false
        : POLL_INTERVAL;
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    data: query.data || null,
    isLoading: query.isLoading,
    error: query.error?.message || null,
    isCompleted: query.data?.status === JobStatus.COMPLETED,
  };
};
