'use client';

import { useQuery } from '@tanstack/react-query';
import { WorkerService } from '../services';

// Query keys
export const workerKeys = {
  health: ['worker', 'health'] as const,
};

/**
 * Hook to check worker health/status
 */
export function useWorkerHealth(enabled = true) {
  return useQuery({
    queryKey: workerKeys.health,
    queryFn: () => WorkerService.getHealth(),
    enabled,
    refetchInterval: 30000, // Check every 30 seconds
    retry: 2,
  });
}
