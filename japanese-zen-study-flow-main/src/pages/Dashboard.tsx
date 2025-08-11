import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Book, Users, Clock, TrendingUp, Play, Award, Calendar, Target, PieChart as PieChartIcon, Download, Headphones } from 'lucide-react';
import { useDashboardStats, useDashboardProgress, useDashboardPerformance } from '@/hooks/useDashboard';
import { useWords } from '@/hooks/useWords';
import { Link } from 'react-router-dom';

const JLPT_COLORS = {
  N5: '#3B82F6',
  N4: '#10B981',
  N3: '#F59E0B',
  N2: '#EF4444',
  N1: '#8B5CF6',
};

const Dashboard = () => {
  const { data: stats, isLoading: loadingStats } = useDashboardStats() as { data?: { total_words: number, total_groups: number }, isLoading: boolean };
  const { data: progress, isLoading: loadingProgress } = useDashboardProgress() as { data?: { total_sessions: number, average_score: number }, isLoading: boolean };
  const { data: performance, isLoading: loadingPerformance } = useDashboardPerformance() as { data?: Array<{ date: string, sessions_count: number, average_score?: number }>, isLoading: boolean };
  const { words } = useWords(1, 1000, '');
  const jlptLevels = ['N5', 'N4', 'N3', 'N2', 'N1'];
  const jlptCounts = React.useMemo(() => {
    const counts = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
    words.forEach(w => {
      if (jlptLevels.includes(w.jlpt_level)) counts[w.jlpt_level]++;
    });
    return counts;
  }, [words]);
  const totalJLPT = jlptLevels.reduce((sum, lvl) => sum + jlptCounts[lvl], 0);
  const jlptDistribution = jlptLevels.map(lvl => ({
    name: lvl,
    value: totalJLPT ? Math.round((jlptCounts[lvl] / totalJLPT) * 100) : 0,
    color: JLPT_COLORS[lvl],
  }));

  if (loadingStats || loadingProgress || loadingPerformance) return <div>Loading...</div>;
  if (!stats || !progress || !performance) return <div>No data</div>;

  const difficultyDistribution = [
    { name: 'Beginner', value: 45, color: '#10B981' },
    { name: 'Intermediate', value: 35, color: '#F59E0B' },
    { name: 'Advanced', value: 20, color: '#EF4444' },
  ]; // TODO: lấy từ backend nếu có

  const recentActivities = [];

  const StatCard = ({ title, value, icon: Icon, subtitle, trend }: any) => (
    <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 bg-gradient-to-br from-white to-blue-50/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className="h-4 w-4 text-blue-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            <span className="text-xs text-green-600">+{trend}% from last week</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your Japanese learning progress</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl">
          <Play className="h-4 w-4 mr-2" />
          Start Study Session
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Words"
          value={stats.total_words}
          icon={Book}
          subtitle="Vocabulary learned"
        />
        <StatCard
          title="Word Groups"
          value={stats.total_groups}
          icon={Users}
          subtitle="Study categories"
        />
        <StatCard
          title="Total Sessions"
          value={progress.total_sessions}
          icon={Award}
          subtitle="Total study sessions"
        />
        <StatCard
          title="Average Score"
          value={progress.average_score}
          icon={TrendingUp}
          subtitle="Avg. session score"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 bg-gradient-to-br from-white to-green-50/30 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Import Words</CardTitle>
            <Download className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600 mb-3">Import vocabulary from various sources</p>
            <Link to="/import">
              <Button variant="outline" size="sm" className="w-full border-green-300 text-green-700 hover:bg-green-50">
                Go to Import
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 bg-gradient-to-br from-white to-purple-50/30 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">YouTube Listening</CardTitle>
            <Headphones className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600 mb-3">Practice listening with YouTube videos</p>
            <Link to="/youtube-listening">
              <Button variant="outline" size="sm" className="w-full border-purple-300 text-purple-700 hover:bg-purple-50">
                Start Listening
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* JLPT Level Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Graph */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              Learning Performance
            </CardTitle>
            <CardDescription>Monthly activity breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={performance}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                  }} 
                />
                <Line type="monotone" dataKey="sessions_count" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }} />
                {/* Nếu backend trả về average_score thì có thể thêm dòng này: */}
                {/* <Line type="monotone" dataKey="average_score" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }} /> */}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* JLPT Level Distribution */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-blue-600" />
              JLPT Level Distribution
            </CardTitle>
            <CardDescription>Word distribution by JLPT level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={jlptDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {jlptDistribution.map((entry, index) => (
                    <Cell key={`cell-jlpt-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {jlptDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
