import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Brain, BookOpen, Target, Gamepad2, Clock, Users, Play, Settings, Star, ArrowLeft, X, RefreshCw } from 'lucide-react';
import { useStudyActivities } from '@/hooks/useStudyActivities';
import { useGroups, useAllGroupsStats } from '@/hooks/useGroups';
import FlashcardGame from '@/components/FlashcardGame';
import WordScrambleGame from '@/components/WordScrambleGame';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { studySessionsApi } from '@/lib/api';

const StudyActivities = () => {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [showFlashcardGame, setShowFlashcardGame] = useState(false);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [statsLoadingState, setStatsLoading] = useState(false);
  const [showWordScrambleGame, setShowWordScrambleGame] = useState(false);
  const [selectedScrambleGroupId, setSelectedScrambleGroupId] = useState<number | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { activities, isLoading, error } = useStudyActivities();
  const { groups, isLoading: groupsLoading } = useGroups();
  const { groupsStats, isLoading: statsLoading } = useAllGroupsStats();

  const recentSessions = [
    { group: 'JLPT N5 Basics', activity: 'Learn', score: 95, date: '2 hours ago' },
    { group: 'Food & Dining', activity: 'Review', score: 87, date: '1 day ago' },
    { group: 'Travel Phrases', activity: 'Test', score: 92, date: '2 days ago' },
    { group: 'Numbers', activity: 'Practice', score: 100, date: '3 days ago' },
  ];

  const handleStartActivity = (activityId: string) => {
    if (activityId === 'flashcard-game') {
      setSelectedActivity('flashcard-game');
      setShowGroupSelector(true);
    } else if (activityId === 'word-scramble-game') {
      setSelectedActivity('word-scramble-game');
      setShowGroupSelector(true);
    } else {
      setSelectedActivity(activityId);
    }
  };

  const handleSelectGroup = async (groupId: number) => {
    console.log('handleSelectGroup called', groupId, selectedActivity);
    // Tìm activity object theo selectedActivity
    let activityObj = null;
    if (selectedActivity === 'flashcard-game') {
      activityObj = activities.find((a: any) => a.name.toLowerCase().includes('flash'));
    } else if (selectedActivity === 'word-scramble-game') {
      activityObj = activities.find((a: any) => a.name.toLowerCase().includes('scramble'));
    } else {
      activityObj = activities.find((a: any) => a.id === selectedActivity);
    }
    console.log('activityObj:', activityObj);
    if (!activityObj) {
      toast({ title: 'Không tìm thấy activity phù hợp!', variant: 'destructive' });
      console.log('Không tìm thấy activity phù hợp!');
      return;
    }

    // 1. Kiểm tra localStorage xem có tiến trình session nào cho group/activity này không
    let foundSessionId: number | null = null;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (selectedActivity === 'flashcard-game' && key.startsWith('flashcard-progress-session-')) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const progress = JSON.parse(value);
            if (progress && progress.groupId === groupId && progress.studyActivityId === activityObj.id) {
              const sessionId = parseInt(key.replace('flashcard-progress-session-', ''));
              if (!isNaN(sessionId)) {
                foundSessionId = sessionId;
                break;
              }
            }
          } catch {}
        }
      } else if (selectedActivity === 'word-scramble-game' && key.startsWith('scramble-progress-session-')) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const progress = JSON.parse(value);
            if (progress && progress.groupId === groupId && progress.studyActivityId === activityObj.id) {
              const sessionId = parseInt(key.replace('scramble-progress-session-', ''));
              if (!isNaN(sessionId)) {
                foundSessionId = sessionId;
                break;
              }
            }
          } catch {}
        }
      }
    }

    if (foundSessionId) {
      setCurrentSessionId(foundSessionId);
      console.log('Found existing sessionId in localStorage:', foundSessionId);
      if (selectedActivity === 'flashcard-game') {
        setSelectedGroupId(groupId);
        setShowGroupSelector(false);
        setShowFlashcardGame(true);
        console.log('Show FlashcardGame (resume)');
      } else if (selectedActivity === 'word-scramble-game') {
        setSelectedScrambleGroupId(groupId);
        setShowGroupSelector(false);
        setShowWordScrambleGame(true);
        console.log('Show WordScrambleGame (resume)');
      }
      return;
    }

    // 2. Nếu không có tiến trình, tạo session mới
    try {
      console.log('Gọi API tạo session với', { group_id: groupId, study_activity_id: activityObj.id });
      const sessionRes = await studySessionsApi.create({ group_id: groupId, study_activity_id: activityObj.id });
      console.log('SessionRes:', sessionRes);
      if (sessionRes && sessionRes.data && sessionRes.data.id) {
        setCurrentSessionId(sessionRes.data.id);
        console.log('Set sessionId:', sessionRes.data.id);
        // Refetch danh sách session
        queryClient.invalidateQueries({ queryKey: ['study-sessions'] });
      } else {
        toast({ title: 'Không nhận được sessionId từ server!', variant: 'destructive' });
        console.log('Không nhận được sessionId từ server!');
        return;
      }
    } catch (err) {
      toast({ title: 'Không thể tạo session mới!', description: String(err), variant: 'destructive' });
      console.log('Không thể tạo session mới!', err);
      return;
    }
    if (selectedActivity === 'flashcard-game') {
      setSelectedGroupId(groupId);
      setShowGroupSelector(false);
      setShowFlashcardGame(true);
      console.log('Show FlashcardGame');
    } else if (selectedActivity === 'word-scramble-game') {
      setSelectedScrambleGroupId(groupId);
      setShowGroupSelector(false);
      setShowWordScrambleGame(true);
      console.log('Show WordScrambleGame');
    }
  };

  const handleGameComplete = (stats: any) => {
    toast({
      title: "Hoàn thành game!",
      description: `Điểm số: ${stats.score}, Tỷ lệ đúng: ${stats.percentage}%`,
    });
  };

  const handleCloseGame = () => {
    setShowFlashcardGame(false);
    setSelectedGroupId(null);
  };

  const handleRefreshStats = () => {
    console.log('Refreshing stats in Study Activities...');
    setStatsLoading(true);
    
    // Force refetch từ server
    queryClient.refetchQueries({ queryKey: ['all-groups-stats'], exact: true });
    queryClient.refetchQueries({ queryKey: ['groups'], exact: true });
    
    // Cũng invalidate để clear cache
    queryClient.invalidateQueries({ queryKey: ['all-groups-stats'] });
    queryClient.invalidateQueries({ queryKey: ['groups'] });
    
    setTimeout(() => {
      setStatsLoading(false);
      console.log('Stats refresh completed in Study Activities');
    }, 1000);
  };

  // Auto refresh stats when component mounts
  useEffect(() => {
    handleRefreshStats();
  }, []);

  // Auto refresh when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      handleRefreshStats();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const ActivityCard = ({ activity }: { activity: any }) => {
    const isFlashcardGame = activity.name.toLowerCase().includes('flash');
    const isWordScrambleGame = activity.name.toLowerCase().includes('scramble');
    return (
      <Card 
        className="cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-105 border-0 bg-gradient-to-br from-blue-100 to-blue-200 text-gray-900 relative overflow-hidden"
        onClick={() => setSelectedActivity(activity.id)}
      >
        {activity.preview_url && (
          <img src={activity.preview_url} alt={activity.name} className="absolute top-0 right-0 w-32 h-32 object-cover opacity-10" />
        )}
        <CardHeader className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div>
              <CardTitle className="text-xl">{activity.name}</CardTitle>
              <Badge variant="secondary" className="bg-blue-200 text-blue-800 border-0 mt-1">
                {activity.focus}
              </Badge>
            </div>
          </div>
          <CardDescription className="text-gray-700">
            {activity.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{activity.average_duration} min</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Release: {activity.release_date}</span>
              </div>
            </div>
            <Button 
              variant="secondary" 
              className="w-full mt-4 bg-blue-500 text-white hover:bg-blue-600"
              onClick={(e) => {
                e.stopPropagation();
                handleStartActivity(
                  isFlashcardGame ? 'flashcard-game' : isWordScrambleGame ? 'word-scramble-game' : activity.id
                );
              }}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Activity
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const GroupSelectorCard = ({ group, onSelect }: { group: any, onSelect: (groupId: number) => void }) => {
    const stats = (groupsStats || []).find((stat: any) => stat.group_id === group.id) || {
      total_words: 0,
      learned_words: 0,
      learning_words: 0,
      new_words: 0,
      progress_percentage: 0
    };

    return (
      <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-0 bg-gradient-to-br from-white to-green-50/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{group.name}</CardTitle>
              <CardDescription>{group.description}</CardDescription>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {stats.total_words} từ
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tiến độ học tập</span>
                <span>{Math.round(stats.progress_percentage)}%</span>
              </div>
              <Progress value={stats.progress_percentage} className="h-2" />
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-bold text-green-600">{stats.learned_words}</div>
                <div className="text-gray-500">Đã học</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-yellow-600">{stats.learning_words}</div>
                <div className="text-gray-500">Đang học</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-600">{stats.new_words}</div>
                <div className="text-gray-500">Mới</div>
              </div>
            </div>

            <Button 
              onClick={() => { console.log('Chọn group', group.id); onSelect(group.id); }}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
              disabled={stats.total_words === 0}
            >
              <Gamepad2 className="h-4 w-4 mr-2" />
              {stats.total_words === 0 ? 'Không có từ vựng' : 'Chọn Group Này'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (showFlashcardGame && selectedGroupId && currentSessionId != null) {
    // Lấy activityObj cho flashcard-game
    const activityObj = activities.find((a: any) => a.name.toLowerCase().includes('flash'));
    return (
      <FlashcardGame 
        groupId={selectedGroupId}
        sessionId={currentSessionId}
        studyActivityId={activityObj?.id}
        onClose={handleCloseGame}
        onGameComplete={handleGameComplete}
        onRestart={() => { /* chỉ xóa localStorage, không tạo session mới */ }}
      />
    );
  }

  if (showWordScrambleGame && selectedScrambleGroupId && currentSessionId != null) {
    // Lấy activityObj cho word-scramble-game
    const activityObj = activities.find((a: any) => a.name.toLowerCase().includes('scramble'));
    return (
      <WordScrambleGame
        groupId={selectedScrambleGroupId}
        sessionId={currentSessionId}
        studyActivityId={activityObj?.id}
        onClose={() => {
          setShowWordScrambleGame(false);
          setSelectedScrambleGroupId(null);
        }}
        onRestart={() => { /* chỉ xóa localStorage, không tạo session mới */ }}
      />
    );
  }

  if (isLoading || groupsLoading || statsLoading || statsLoadingState) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600">Đang tải...</p>
      </div>
    </div>
  );
  
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Study Activities</h1>
          <p className="text-gray-600 mt-1">Choose your learning activity and start practicing</p>
        </div>
        <Button variant="outline" className="hover:bg-blue-50">
          <Settings className="h-4 w-4 mr-2" />
          Study Settings
        </Button>
        <Button variant="outline" className="hover:bg-blue-50" onClick={handleRefreshStats} disabled={statsLoadingState}>
          <RefreshCw className={`h-4 w-4 mr-2 ${statsLoadingState ? 'animate-spin' : ''}`} />
          Refresh Stats
        </Button>
      </div>

      {/* Activity Cards */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-600" />
          Learning Activities
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Recent Study Sessions
            </CardTitle>
            <CardDescription>Your latest learning activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSessions.map((session, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                  <div>
                    <div className="font-medium text-gray-900">{session.group}</div>
                    <div className="text-sm text-gray-600">{session.activity} • {session.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{session.score}%</div>
                    <Progress value={session.score} className="w-16 h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Start Section */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-600 to-orange-500 text-white">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Brain className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Ready to Learn?</h3>
                <p className="text-white/90 mt-1">Start with your recommended study activity based on your progress</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button 
                  variant="secondary" 
                  className="bg-white text-gray-900 hover:bg-gray-100"
                  onClick={() => setShowGroupSelector(true)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Quick Study (5 min)
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  <Target className="h-4 w-4 mr-2" />
                  Custom Session
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Group Selector Dialog */}
      <Dialog open={showGroupSelector} onOpenChange={setShowGroupSelector}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-blue-600" />
              Chọn Group Từ Vựng
            </DialogTitle>
            <DialogDescription>
              Chọn group từ vựng để bắt đầu chơi {selectedActivity === 'flashcard-game' ? 'Flashcard Game' : 'Word Scramble Game'}
            </DialogDescription>
          </DialogHeader>
          
          {groups.length === 0 ? (
            <div className="text-center space-y-4 py-8">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Chưa có group từ vựng</h3>
                <p className="text-gray-600 mt-1">Hãy import từ vựng từ trang Import để bắt đầu học</p>
              </div>
              <Button 
                onClick={() => {
                  setShowGroupSelector(false);
                  window.location.href = '/import';
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                <Play className="h-4 w-4 mr-2" />
                Import Từ Vựng
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((group) => (
                <GroupSelectorCard key={group.id} group={group} onSelect={handleSelectGroup} />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudyActivities;