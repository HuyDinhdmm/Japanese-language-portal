import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Words API
export const wordsApi = {
  getAll: async (page = 1, perPage = 10, search?: string) => {
    let url = `/words?page=${page}&per_page=${perPage}`;
    if (search && search.trim() !== '') {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const res = await api.get(url);
    return {
      items: res.data.data.items,
      total: res.data.data.total,
    };
  },
  getById: (id: number) => 
    api.get(`/words/${id}`),
  create: (data: any) => 
    api.post('/words', data),
  update: (id: number, data: any) => 
    api.put(`/words/${id}`, data),
  delete: (id: number) => 
    api.delete(`/words/${id}`),
};

// Groups API
export const groupsApi = {
  getAll: async (page = 1, perPage = 10) => {
    const res = await api.get(`/groups?page=${page}&per_page=${perPage}`);
    const data = res.data?.data || {};
    return {
      items: Array.isArray(data.items) ? data.items : [],
      total: typeof data.total === 'number' ? data.total : 0,
    };
  },
  getById: (id: number) => 
    api.get(`/groups/${id}`),
  getGroupWords: (groupId: number, page = 1, perPage = 10) => 
    api.get(`/groups/${groupId}/words?page=${page}&per_page=${perPage}`),
  create: (data: any) => 
    api.post('/groups', data),
  update: (id: number, data: any) => 
    api.put(`/groups/${id}`, data),
  delete: (id: number) => 
    api.delete(`/groups/${id}`),
  removeWordFromGroup: (groupId: number, wordId: number) =>
    api.delete(`/groups/${groupId}/words/${wordId}`),
};

// Study Activities API
export const studyActivitiesApi = {
  getAll: async () => {
    const res = await api.get('/study_activities');
    return {
      activities: Array.isArray(res.data) ? res.data : (res.data.activities || []),
    };
  },
  getById: (id: number) => 
    api.get(`/study_activities/${id}`),
  getLaunchInfo: (id: number) => 
    api.get(`/study_activities/${id}/launch`),
};

// Study Sessions API
export const studySessionsApi = {
  getAll: async (page = 1, perPage = 5) => {
    const res = await api.get(`/study_sessions?page=${page}&per_page=${perPage}`);
    return {
      sessions: res.data.items || [],
      total: res.data.total || 0,
      page: res.data.page || 1,
      perPage: res.data.per_page || perPage,
    };
  },
  getById: (id: number) => 
    api.get(`/study_sessions/${id}`),
  getByActivityId: (activityId: number, page = 1, perPage = 10) => 
    api.get(`/study_sessions/activity/${activityId}?page=${page}&per_page=${perPage}`),
  getByGroupId: (groupId: number, page = 1, perPage = 10) => 
    api.get(`/study_sessions/group/${groupId}?page=${page}&per_page=${perPage}`),
  getSessionWords: (sessionId: number, page = 1, perPage = 10) => 
    api.get(`/study_sessions/${sessionId}/words?page=${page}&per_page=${perPage}`),
  create: (data: any) => 
    api.post('/study_sessions', data),
};

// Dashboard API
export const dashboardApi = {
  getLastStudySession: () => 
    api.get('/dashboard/last_session'),
  getStudyProgress: async () => {
    const res = await api.get('/dashboard/study_progress');
    return res.data;
  },
  getQuickStats: async () => {
    const res = await api.get('/dashboard/quick_stats');
    return res.data;
  },
  getPerformanceGraph: async () => {
    const res = await api.get('/dashboard/performance_graph');
    return res.data;
  },
};

export const wordProgressApi = {
  getByWordId: async (wordId: number) => {
    const res = await api.get(`/word_progress/${wordId}`);
    return res.data;
  },
  update: async (wordId: number, data: Partial<{status: string, last_studied_at: string}>) => {
    const res = await api.put(`/word_progress/${wordId}`, data);
    return res.data;
  },
  create: async (data: {word_id: number, status: string, last_studied_at?: string}) => {
    const res = await api.post('/word_progress', data);
    return res.data;
  },
  getByGroupId: async (groupId: number) => {
    try {
      const res = await api.get(`/word_progress/group/${groupId}`);
      return res.data;
    } catch (error) {
      // Return empty data if no word progress exists for this group
      return { items: [], total: 0 };
    }
  },
  getGroupStats: async (groupId: number) => {
    try {
      const res = await api.get(`/word_progress/group/${groupId}/stats`);
      return res.data;
    } catch (error) {
      // Return default stats if no data exists
      return {
        total_words: 0,
        learned_words: 0,
        learning_words: 0,
        new_words: 0,
        last_studied: null,
        progress_percentage: 0
      };
    }
  },
  getAllGroupsStats: async () => {
    try {
      const res = await api.get('/word_progress/all-groups/stats');
      return res.data;
    } catch (error) {
      // Return default stats if no data exists
      return {
        groups: [],
        overall: {
          total_words: 0,
          learned_words: 0,
          learning_words: 0,
          new_words: 0,
          overall_progress: 0
        }
      };
    }
  },
};

// Hàm gọi API sinh từ vựng theo chủ đề
export async function generateWords(thematicCategory: string, jlptLevel: string = 'N5') {
  console.log('API call - thematicCategory:', thematicCategory, 'jlptLevel:', jlptLevel);
  const requestData = { 
    thematicCategory,
    jlptLevel 
  };
  console.log('Request data:', requestData);
  
  try {
    const res = await api.post('/generate_words', requestData);
    console.log('API response:', res.data);
    return res.data;
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
}

// Hàm import từ vựng vào database
export async function importWordsToDatabase(words: any[], thematicCategory: string) {
  console.log('Importing words to database:', words, 'thematicCategory:', thematicCategory);
  
  try {
    const res = await api.post('/import_words', { 
      words,
      thematicCategory 
    });
    console.log('Import response:', res.data);
    return res.data;
  } catch (error) {
    console.error('Import error:', error);
    throw error;
  }
}

// Hàm format lại dữ liệu trả về, chỉ lấy đúng các trường cần thiết
export function formatWordList(raw: any): Array<{
  kanji: string;
  romaji: string;
  vietnamese: string;
  jlpt_level: string;
  parts: { kanji: string; romaji: string[] }[];
}> {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => ({
    kanji: item.kanji ?? '',
    romaji: item.romaji ?? '',
    vietnamese: item.vietnamese ?? '',
    jlpt_level: item.jlpt_level ?? 'N5',
    parts: Array.isArray(item.parts)
      ? item.parts.map((p: any) => ({
          kanji: p.kanji ?? '',
          romaji: Array.isArray(p.romaji) ? p.romaji : [],
        }))
      : [],
  }));
}

export default api; 