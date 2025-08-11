import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, Calendar as CalendarIcon, TrendingUp, Award, Eye, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useStudySessions } from '@/hooks/useStudySessions';

const StudySessions = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [page, setPage] = useState(1);

  // Lấy dữ liệu sessions từ backend
  const { sessions, total, isLoading, error, perPage } = useStudySessions(page, 5);

  const weeklyStats = {
    totalSessions: 12,
    totalTime: 145,
    averageScore: 91,
    wordsLearned: 23
  };

  const getActivityColor = (activity: string) => {
    switch (activity) {
      case 'Learn': return 'bg-blue-100 text-blue-800';
      case 'Review': return 'bg-green-100 text-green-800';
      case 'Test': return 'bg-orange-100 text-orange-800';
      case 'Practice': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Lọc session theo ngày được chọn
  const filteredSessions = selectedDate
    ? sessions.filter((session) => {
        if (!session.created_at) return false;
        const sessionDate = new Date(session.created_at);
        return (
          sessionDate.getFullYear() === selectedDate.getFullYear() &&
          sessionDate.getMonth() === selectedDate.getMonth() &&
          sessionDate.getDate() === selectedDate.getDate()
        );
      })
    : sessions;

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Study Sessions</h1>
          <p className="text-gray-600 mt-1">Track your learning progress and session history</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="hover:bg-blue-50">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" className="hover:bg-green-50">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Sessions</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{weeklyStats.totalSessions}</div>
            <p className="text-xs text-gray-600 mt-1">This week</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Study Time</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatDuration(weeklyStats.totalTime)}</div>
            <p className="text-xs text-gray-600 mt-1">Total time</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{weeklyStats.averageScore}%</div>
            <p className="text-xs text-gray-600 mt-1">Performance</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Words Learned</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{weeklyStats.wordsLearned}</div>
            <p className="text-xs text-gray-600 mt-1">New vocabulary</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              Study Calendar
            </CardTitle>
            <CardDescription>Select a date to view sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-xl shadow bg-white p-2 border border-gray-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sessions History */}
        <Card className="lg:col-span-3 shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              Session History
            </CardTitle>
            <CardDescription>
              Your recent study sessions and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Activity ID</TableHead>
                    <TableHead>Group ID</TableHead>
                    <TableHead>Session ID</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => (
                    <TableRow key={session.id} className="hover:bg-blue-50/30 transition-colors">
                      <TableCell>{session.created_at}</TableCell>
                      <TableCell>{session.study_activity_id}</TableCell>
                      <TableCell>{session.group_id}</TableCell>
                      <TableCell>{session.id}</TableCell>
                      <TableCell>{session.created_at}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-600 to-orange-500 text-white">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold">{total}</div>
              <div className="text-white/90">Total Sessions</div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                {Math.round(sessions.reduce((acc, session) => acc + session.score, 0) / sessions.length)}%
              </div>
              <div className="text-white/90">Average Score</div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                {sessions.reduce((acc, session) => acc + session.newWordsLearned, 0)}
              </div>
              <div className="text-white/90">Words Learned</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex justify-end items-center gap-4 mt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Prev
        </Button>
        <span>Page {page} / {Math.ceil(total / perPage)}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= Math.ceil(total / perPage)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default StudySessions;
