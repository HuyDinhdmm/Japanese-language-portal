import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wordsApi, wordProgressApi } from '@/lib/api';
import type { Word, WordProgress } from '@/lib/types';

export const useWords = (page = 1, perPage = 10, searchTerm = '') => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['words', page, perPage, searchTerm],
    queryFn: () => wordsApi.getAll(page, perPage, searchTerm),
  });

  const createWord = useMutation({
    mutationFn: (newWord: Omit<Word, 'id'>) => wordsApi.create(newWord),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['words'] });
    },
  });

  const updateWord = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Word> }) =>
      wordsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['words'] });
    },
  });

  const deleteWord = useMutation({
    mutationFn: (id: number) => wordsApi.delete(id),
    onSuccess: (_, deletedId) => {
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['words'] });
        queryClient.refetchQueries({ queryKey: ['groups'] });
        queryClient.refetchQueries({ queryKey: ['group-words'] });
        queryClient.refetchQueries({ queryKey: ['word-progress'] });
        queryClient.refetchQueries({ queryKey: ['group-stats'] });
        queryClient.refetchQueries({ queryKey: ['all-groups-stats'] });
        queryClient.refetchQueries({ queryKey: ['word-progress', deletedId] });
        
        queryClient.invalidateQueries({ queryKey: ['words'] });
        queryClient.invalidateQueries({ queryKey: ['groups'] });
        queryClient.invalidateQueries({ queryKey: ['group-words'] });
        queryClient.invalidateQueries({ queryKey: ['word-progress'] });
        queryClient.invalidateQueries({ queryKey: ['group-stats'] });
        queryClient.invalidateQueries({ queryKey: ['all-groups-stats'] });
        queryClient.invalidateQueries({ queryKey: ['word-progress', deletedId] });
      }, 100);
    },
  });

  console.log('words:', data?.items || []);
  console.log('filteredWords:', data?.items || []);

  return {
    words: data?.items || [],
    total: data?.total || 0,
    isLoading,
    error,
    createWord,
    updateWord,
    deleteWord,
  };
};

export const useWordProgress = (wordId: number) => {
  return useQuery<WordProgress | null>({
    queryKey: ['word-progress', wordId],
    queryFn: async () => {
      try {
        return await wordProgressApi.getByWordId(wordId);
      } catch {
        return null;
      }
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateWordProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ wordId, data }: { wordId: number; data: Partial<{status: string, last_studied_at: string}> }) =>
      wordProgressApi.update(wordId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['word-progress'] });
    },
  });
}; 