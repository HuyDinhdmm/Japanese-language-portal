import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Edit, Trash2, BookOpen, Target } from 'lucide-react';
import type { Group, Word } from '@/lib/types';
import { groupsApi } from '@/lib/api';

interface GroupStats {
  total_words: number;
  learned_words: number;
  learning_words: number;
  new_words: number;
  last_studied: string | null;
  progress_percentage: number;
}

interface GroupCardProps {
  group: Group;
  stats?: GroupStats;
  isLoading?: boolean;
  onDelete: (groupId: number) => void;
}

const JLPT_MAP = {
  N5: 'Beginner',
  N4: 'Beginner',
  N3: 'Intermediate',
  N2: 'Advanced',
  N1: 'Advanced',
};

const JLPT_ORDER = ['N5', 'N4', 'N3', 'N2', 'N1'];

const GroupCard: React.FC<GroupCardProps> = ({ group, stats, isLoading = false, onDelete }) => {
  const [words, setWords] = React.useState<Word[]>([]);
  const [loadingWords, setLoadingWords] = React.useState(false);

  React.useEffect(() => {
    let ignore = false;
    setLoadingWords(true);
    groupsApi.getGroupWords(group.id, 1, 1000).then(res => {
      if (!ignore) {
        setWords(res.data.items || []);
        setLoadingWords(false);
      }
    }).catch(() => setLoadingWords(false));
    return () => { ignore = true; };
  }, [group.id]);

  // Tính JLPT phổ biến nhất
  const mainJlpt = useMemo(() => {
    const jlptCount: Record<string, number> = {};
    words.forEach(word => {
      if (word.jlpt_level) {
        jlptCount[word.jlpt_level] = (jlptCount[word.jlpt_level] || 0) + 1;
      }
    });
    let max = 0;
    let main = 'N5';
    JLPT_ORDER.forEach(level => {
      if ((jlptCount[level] || 0) > max) {
        max = jlptCount[level];
        main = level;
      }
    });
    return main;
  }, [words]);

  // Tính loại từ phổ biến nhất
  const mainPart = useMemo(() => {
    const partCount: Record<string, number> = {};
    words.forEach(word => {
      let parts: any[] = [];
      try {
        parts = typeof word.parts === 'string' ? JSON.parse(word.parts) : word.parts;
      } catch { parts = []; }
      parts.forEach((part: any) => {
        if (typeof part === 'string') {
          partCount[part] = (partCount[part] || 0) + 1;
        } else if (part.kanji) {
          partCount[part.kanji] = (partCount[part.kanji] || 0) + 1;
        }
      });
    });
    let max = 0;
    let main = '';
    Object.entries(partCount).forEach(([k, v]) => {
      if (v > max) {
        max = v;
        main = k;
      }
    });
    return main;
  }, [words]);

  const getDifficultyColor = (jlpt: string) => {
    switch (JLPT_MAP[jlpt]) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (jlpt: string) => JLPT_MAP[jlpt] || 'Beginner';

  const formatLastStudied = (lastStudied: string | null) => {
    if (!lastStudied) return 'N/A';
    const date = new Date(lastStudied);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  // Use default stats if not provided
  const defaultStats: GroupStats = {
    total_words: 0,
    learned_words: 0,
    learning_words: 0,
    new_words: 0,
    last_studied: null,
    progress_percentage: 0
  };

  const currentStats = stats || defaultStats;

  return (
    <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-200 hover:scale-105 bg-gradient-to-br from-white to-gray-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full bg-blue-500`} />
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {group.name}
                {loadingWords ? (
                  <span className="text-xs text-gray-400">Loading...</span>
                ) : mainPart && (
                  <Badge className="bg-blue-100 text-blue-800 ml-2">{mainPart}</Badge>
                )}
              </CardTitle>
              <Badge className={getDifficultyColor(mainJlpt)} variant="secondary">
                {getDifficultyLabel(mainJlpt)}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-100">
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
              onClick={() => onDelete(group.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription className="mt-2">
          {group.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent inline" />
                ) : (
                  `${currentStats.progress_percentage}%`
                )}
              </span>
            </div>
            <Progress 
              value={isLoading ? 0 : currentStats.progress_percentage} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>
                {isLoading ? '...' : `${currentStats.learned_words} learned`}
              </span>
              <span>{isLoading ? '...' : currentStats.total_words} total</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-sm font-medium">
                  {isLoading ? '...' : currentStats.total_words}
                </div>
                <div className="text-xs text-gray-500">Words</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-sm font-medium">
                  {isLoading ? '...' : currentStats.learned_words}
                </div>
                <div className="text-xs text-gray-500">Learned</div>
              </div>
            </div>
          </div>

          {/* Learning Status */}
          {!isLoading && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium text-blue-600">{currentStats.learning_words}</div>
                <div className="text-gray-500">Learning</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-600">{currentStats.learned_words}</div>
                <div className="text-gray-500">Learned</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-600">{currentStats.new_words}</div>
                <div className="text-gray-500">New</div>
              </div>
            </div>
          )}

          {/* Last Studied */}
          <div className="text-xs text-gray-500 border-t pt-3">
            Last studied: {isLoading ? '...' : formatLastStudied(currentStats.last_studied)}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link to={`/groups/${group.id}`}>
                <BookOpen className="h-4 w-4 mr-2" />
                View Words
              </Link>
            </Button>
            <Button size="sm" className="flex-1 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600">
              Study Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupCard; 