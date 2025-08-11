import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-quick-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/quick_stats');
      return res.data;
    }
  });
}

export function useDashboardProgress() {
  return useQuery({
    queryKey: ['dashboard-study-progress'],
    queryFn: async () => {
      const res = await api.get('/dashboard/study_progress');
      return res.data;
    }
  });
}

export function useDashboardPerformance() {
  return useQuery({
    queryKey: ['dashboard-performance-graph'],
    queryFn: async () => {
      const res = await api.get('/dashboard/performance_graph');
      return res.data;
    }
  });
} 