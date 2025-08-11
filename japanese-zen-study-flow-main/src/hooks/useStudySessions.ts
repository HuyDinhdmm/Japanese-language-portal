import { useQuery } from '@tanstack/react-query';
import { studySessionsApi } from '@/lib/api';

export const useStudySessions = (page = 1, perPage = 5) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['study-sessions', page, perPage],
    queryFn: () => studySessionsApi.getAll(page, perPage),
  });

  return {
    sessions: data?.sessions || [],
    total: data?.total || 0,
    page: data?.page || page,
    perPage: data?.perPage || perPage,
    isLoading,
    error,
  };
}; 