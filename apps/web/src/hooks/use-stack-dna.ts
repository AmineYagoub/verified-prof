import { useQuery } from '@tanstack/react-query';
import { StackDnaService } from '../services';

export const useStackDna = () => {
  return useQuery({
    queryKey: ['stack-dna'],
    queryFn: () => StackDnaService.getStackDNA(),
    staleTime: 30 * 60 * 1000,
  });
};
