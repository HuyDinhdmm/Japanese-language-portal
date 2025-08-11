export interface Word {
  id: number;
  kanji: string;
  romaji: string;
  vietnamese: string;
  parts: string | any;
  jlpt_level?: string;
}

export interface Group {
  id: number;
  name: string;
  description: string;
  words_count: number;
}

export interface StudyActivity {
  id: number;
  name: string;
  url: string;
  preview_url: string;
  description: string;
  release_date: string;
  average_duration: number;
  focus: string;
}

export interface StudySession {
  id: number;
  group_id: number;
  study_activity_id: number;
  created_at: string;
}

export interface DashboardStats {
  last_session: StudySession;
  study_progress: {
    total_words: number;
    learned_words: number;
    progress_percentage: number;
  };
  quick_stats: {
    total_sessions: number;
    total_activities: number;
    total_groups: number;
  };
  performance: {
    dates: string[];
    scores: number[];
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}

export interface WordProgress {
  id: number;
  word_id: number;
  status: 'new' | 'learning' | 'learned';
  last_studied_at: string;
} 