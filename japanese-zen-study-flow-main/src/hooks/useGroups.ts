import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi, wordProgressApi } from '@/lib/api';
import type { Group, Word } from '@/lib/types';

export const useGroups = (page = 1, perPage = 10) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['groups', page, perPage],
    queryFn: () => groupsApi.getAll(page, perPage),
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const createGroup = useMutation({
    mutationFn: (newGroup: Omit<Group, 'id' | 'words_count'>) => 
      groupsApi.create(newGroup),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  const updateGroup = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Group> }) =>
      groupsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  const deleteGroup = useMutation({
    mutationFn: (id: number) => groupsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  return {
    groups: data?.items || [],
    total: data?.total || 0,
    isLoading,
    error,
    createGroup,
    updateGroup,
    deleteGroup,
  };
};

export const useGroupWords = (groupId: number, page = 1, perPage = 10) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['group-words', groupId, page, perPage],
    queryFn: () => groupsApi.getGroupWords(groupId, page, perPage),
  });

  return {
    words: data?.data.items || [],
    total: data?.data.total || 0,
    isLoading,
    error,
  };
};

export const useGroupById = (groupId: number) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => groupsApi.getById(groupId),
    enabled: !!groupId,
  });

  return {
    group: data?.data,
    isLoading,
    error,
  };
};

export const useGroupWordsWithProgress = (groupId: number, page = 1, perPage = 10) => {
  const queryClient = useQueryClient();
  
  const { data: wordsData, isLoading: wordsLoading, error: wordsError } = useQuery({
    queryKey: ['group-words', groupId, page, perPage],
    queryFn: () => groupsApi.getGroupWords(groupId, page, perPage),
    enabled: !!groupId,
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ['word-progress', groupId],
    queryFn: () => wordProgressApi.getByGroupId(groupId),
    enabled: !!groupId,
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const removeWordFromGroup = useMutation({
    mutationFn: ({ groupId, wordId }: { groupId: number; wordId: number }) =>
      groupsApi.removeWordFromGroup(groupId, wordId),
    onSuccess: () => {
      // Invalidate và refetch dữ liệu group words
      queryClient.invalidateQueries({ queryKey: ['group-words', groupId] });
      // Invalidate group stats
      queryClient.invalidateQueries({ queryKey: ['group-stats', groupId] });
      // Invalidate all groups stats
      queryClient.invalidateQueries({ queryKey: ['all-groups-stats'] });
      // Invalidate groups list để cập nhật words_count
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  const words = wordsData?.data.items || [];
  const progressMap = new Map();
  
  if (progressData?.items) {
    progressData.items.forEach((progress: any) => {
      progressMap.set(progress.word_id, progress);
    });
  }

  // Combine words with their progress
  const wordsWithProgress = words.map((word: Word) => ({
    ...word,
    progress: progressMap.get(word.id) || { status: 'new', last_studied_at: null, id: null }
  }));

  return {
    words: wordsWithProgress,
    total: wordsData?.data.total || 0,
    isLoading: wordsLoading || progressLoading,
    error: wordsError,
    removeWordFromGroup,
  };
};

export const useGroupStats = (groupId: number) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['group-stats', groupId],
    queryFn: () => wordProgressApi.getGroupStats(groupId),
    enabled: !!groupId,
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  return {
    stats: data || {
      total_words: 0,
      learned_words: 0,
      learning_words: 0,
      new_words: 0,
      last_studied: null,
      progress_percentage: 0
    },
    isLoading,
    error,
  };
};

export const useAllGroupsStats = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['all-groups-stats'],
    queryFn: () => wordProgressApi.getAllGroupsStats(),
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  console.log('useAllGroupsStats data:', data);
  console.log('useAllGroupsStats data?.groups:', data?.groups);

  return {
    stats: data?.overall || {
      total_words: 0,
      learned_words: 0,
      learning_words: 0,
      new_words: 0,
      overall_progress: 0
    },
    groupsStats: data?.groups || [],
    isLoading,
    error,
  };
}; 