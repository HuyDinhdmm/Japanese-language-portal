import { useMutation, useQueryClient } from '@tanstack/react-query';
import { wordProgressApi } from '@/lib/api';

export const useWordProgress = () => {
  const queryClient = useQueryClient();

  const updateWordProgress = useMutation({
    mutationFn: ({ wordId, data }: { wordId: number; data: { status: string; last_studied_at?: string } }) =>
      wordProgressApi.update(wordId, data),
    onSuccess: (_, { wordId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['word-progress'] });
      queryClient.invalidateQueries({ queryKey: ['group-words'] });
      queryClient.invalidateQueries({ queryKey: ['words'] });
      queryClient.invalidateQueries({ queryKey: ['all-groups-stats'] });
    },
  });

  const createWordProgress = useMutation({
    mutationFn: (data: { word_id: number; status: string; last_studied_at?: string }) =>
      wordProgressApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['word-progress'] });
      queryClient.invalidateQueries({ queryKey: ['group-words'] });
      queryClient.invalidateQueries({ queryKey: ['all-groups-stats'] });
    },
  });

  return {
    updateWordProgress,
    createWordProgress,
  };
}; 