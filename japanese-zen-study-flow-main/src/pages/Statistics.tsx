import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Calendar, Award, Target, Download } from 'lucide-react';
import { useWords } from '@/hooks/useWords';

const JLPT_COLORS = {
  N5: '#3B82F6',
  N4: '#10B981',
  N3: '#F59E0B',
  N2: '#EF4444',
  N1: '#8B5CF6',
};

const Statistics = () => {
  const [timeRange, setTimeRange] = useState('week');

  // Mock data
  const progressData = [
    { date: 'Mon', learned: 12, reviewed: 25, tested: 8 },
    { date: 'Tue', learned: 15, reviewed: 30, tested: 12 },
    { date: 'Wed', learned: 8, reviewed: 18, tested: 6 },
    { date: 'Thu', learned: 20, reviewed: 35, tested: 15 },
    { date: 'Fri', learned: 18, reviewed: 28, tested: 10 },
    { date: 'Sat', learned: 25, reviewed: 40, tested: 18 },
    { date: 'Sun', learned: 14, reviewed: 22, tested: 9 },
  ];

  const performanceData = [
    { month: 'Jan', score: 78, accuracy: 82, consistency: 85 },
    { month: 'Feb', score: 82, accuracy: 85, consistency: 88 },
    { month: 'Mar', score: 85, accuracy: 88, consistency: 90 },
    { month: 'Apr', score: 88, accuracy: 90, consistency: 92 },
    { month: 'May', score: 90, accuracy: 92, consistency: 89 },
    { month: 'Jun', score: 92, accuracy: 94, consistency: 94 },
  ];

  const groupDistribution = [
    { name: 'JLPT N5', value: 35, color: '#3B82F6' },
    { name: 'Food & Dining', value: 20, color: '#10B981' },
    { name: 'Travel', value: 18, color: '#F59E0B' },
    { name: 'Business', value: 15, color: '#EF4444' },
    { name: 'Numbers', value: 12, color: '#8B5CF6' },
  ];

  const difficultyProgress = [
    { level: 'Beginner', words: 145, learned: 123, percentage: 85 },
    { level: 'Intermediate', words: 89, learned: 56, percentage: 63 },
    { level: 'Advanced', words: 67, learned: 23, percentage: 34 },
  ];

  const activityData = [
    { activity: 'Learn', sessions: 45, avgScore: 88, totalTime: 180 },
    { activity: 'Review', sessions: 62, avgScore: 92, totalTime: 210 },
    { activity: 'Test', sessions: 23, avgScore: 85, totalTime: 145 },
    { activity: 'Practice', sessions: 34, avgScore: 94, totalTime: 98 },
  ];

  const weeklyGoals = [
    { week: 'Week 1', target: 50, achieved: 48 },
    { week: 'Week 2', target: 55, achieved: 58 },
    { week: 'Week 3', target: 60, achieved: 52 },
    { week: 'Week 4', target: 65, achieved: 67 },
  ];

  const { words } = useWords(1, 1000, '');
  const jlptLevels = ['N5', 'N4', 'N3', 'N2', 'N1'];
  const jlptCounts = useMemo(() => {
    const counts: Record<string, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistics & Reports</h1>
          <p className="text-gray-600 mt-1">Analyze your learning progress and performance</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="hover:bg-blue-50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Top Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Progress */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Daily Learning Progress
            </CardTitle>
            <CardDescription>Words learned, reviewed, and tested this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={progressData}>
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
                <Area type="monotone" dataKey="learned" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="reviewed" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="tested" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Trends */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Performance Trends
            </CardTitle>
            <CardDescription>Score, accuracy, and consistency over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" />
                <YAxis domain={[70, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                  }} 
                />
                <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }} />
                <Line type="monotone" dataKey="accuracy" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }} />
                <Line type="monotone" dataKey="consistency" stroke="#F59E0B" strokeWidth={3} dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Group Distribution */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-purple-600" />
              Study Groups
            </CardTitle>
            <CardDescription>Distribution of studied words by group</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={groupDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {groupDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {groupDistribution.map((item) => (
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

        {/* Difficulty Progress */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              Difficulty Levels
            </CardTitle>
            <CardDescription>Progress across difficulty levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {difficultyProgress.map((level) => (
                <div key={level.level} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{level.level}</span>
                    <span className="text-sm text-gray-600">{level.learned}/{level.words}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-600" 
                      style={{ width: `${level.percentage}%` }}
                    />
                  </div>
                  <div className="text-right text-sm font-medium text-orange-600">
                    {level.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Goals */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-pink-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-pink-600" />
              Weekly Goals
            </CardTitle>
            <CardDescription>Target vs achieved words per week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyGoals}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                  }} 
                />
                <Bar dataKey="target" fill="#E5E7EB" radius={4} />
                <Bar dataKey="achieved" fill="#EC4899" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Performance */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Activity Performance
          </CardTitle>
          <CardDescription>Breakdown of performance by activity type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {activityData.map((activity) => (
              <div key={activity.activity} className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border">
                <div className="text-center space-y-2">
                  <div className="text-lg font-bold text-gray-900">{activity.activity}</div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-blue-600">{activity.sessions}</div>
                    <div className="text-xs text-gray-600">Sessions</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-lg font-semibold text-green-600">{activity.avgScore}%</div>
                    <div className="text-xs text-gray-600">Avg Score</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-purple-600">{activity.totalTime}m</div>
                    <div className="text-xs text-gray-600">Total Time</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
  );
};

export default Statistics;
