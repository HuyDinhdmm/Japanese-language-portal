import { useQuery } from '@tanstack/react-query';
import { studyActivitiesApi } from '@/lib/api';

export const useStudyActivities = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['study-activities'],
    queryFn: () => studyActivitiesApi.getAll(),
  });

  console.log('activities from API:', data);

  return {
    activities: data?.activities || [],
    total: data?.activities?.length || 0,
    isLoading,
    error,
  };
}; 