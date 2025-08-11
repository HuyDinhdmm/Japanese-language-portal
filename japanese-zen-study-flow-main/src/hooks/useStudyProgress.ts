import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import type { DashboardStats } from '@/lib/types';

export const useStudyProgress = () => {
  return useQuery<DashboardStats>({
    queryKey: ['study-progress'],
    queryFn: dashboardApi.getStudyProgress,
    staleTime: 1000 * 60 * 5,
  });
}; 