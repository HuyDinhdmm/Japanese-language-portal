import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Plus, Edit, Trash2, Users, BookOpen, GripVertical, Target, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGroups, useAllGroupsStats } from '@/hooks/useGroups';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import GroupCard from '@/components/GroupCard';
import { Dialog as ConfirmDialog, DialogContent as ConfirmDialogContent, DialogHeader as ConfirmDialogHeader, DialogTitle as ConfirmDialogTitle, DialogDescription as ConfirmDialogDescription, DialogTrigger as ConfirmDialogTrigger } from '@/components/ui/dialog';

const Groups = () => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { groups, isLoading, error, deleteGroup } = useGroups();
  const { stats: overallStats, groupsStats, isLoading: statsLoading } = useAllGroupsStats();
  const queryClient = useQueryClient();
  const [statsLoadingState, setStatsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<number | null>(null);

  console.log('Groups component - overallStats:', overallStats);
  console.log('Groups component - groupsStats:', groupsStats);
  console.log('Groups component - groups:', groups);
  console.log('Groups component - statsLoading:', statsLoading);

  const handleAddGroup = () => {
    toast({
      title: "Group created",
      description: "New vocabulary group has been created.",
    });
    setIsAddDialogOpen(false);
  };

  const handleDeleteGroup = (groupId: number) => {
    setGroupToDelete(groupId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteGroup = async () => {
    if (groupToDelete !== null) {
      try {
        await deleteGroup.mutateAsync(groupToDelete);
        toast({
          title: 'Group deleted',
          description: 'The vocabulary group has been removed.',
          variant: 'destructive',
        });
      } catch (err: any) {
        toast({
          title: 'Delete failed',
          description: err?.message || 'Failed to delete group.',
          variant: 'destructive',
        });
      }
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
    }
  };

  const handleRefreshStats = () => {
    console.log('Refreshing stats...');
    setStatsLoading(true);
    
    // Force refetch từ server
    queryClient.refetchQueries({ queryKey: ['all-groups-stats'], exact: true });
    queryClient.refetchQueries({ queryKey: ['groups'], exact: true });
    queryClient.refetchQueries({ queryKey: ['group-stats'], exact: true });
    
    // Cũng invalidate để clear cache
    queryClient.invalidateQueries({ queryKey: ['all-groups-stats'] });
    queryClient.invalidateQueries({ queryKey: ['groups'] });
    queryClient.invalidateQueries({ queryKey: ['group-stats'] });
    
    setTimeout(() => {
      setStatsLoading(false);
      console.log('Stats refresh completed');
    }, 1000);
  };

  const getProgressPercentage = (learned: number, total: number) => {
    return Math.round((learned / total) * 100);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    handleRefreshStats();
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      handleRefreshStats();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  if (isLoading || statsLoading || statsLoadingState) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading groups and statistics...</p>
      </div>
    </div>
  );
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Groups Management</h1>
          <p className="text-gray-600 mt-1">Organize your vocabulary into study groups</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefreshStats}
            disabled={statsLoadingState}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${statsLoadingState ? 'animate-spin' : ''}`} />
            Refresh Stats
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl">
                <Plus className="h-4 w-4 mr-2" />
                Create New Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>
                  Create a new vocabulary group to organize your learning.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input id="groupName" placeholder="e.g., JLPT N4 Vocabulary" />
                </div>
                <div>
                  <Label htmlFor="groupDescription">Description</Label>
                  <Textarea id="groupDescription" placeholder="Brief description of this group" />
                </div>
                <div>
                  <Label htmlFor="groupColor">Theme Color</Label>
                  <div className="flex gap-2 mt-2">
                    {['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'].map(color => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full ${color} border-2 border-gray-200 hover:border-gray-400 transition-colors`}
                      />
                    ))}
                  </div>
                </div>
                <Button onClick={handleAddGroup} className="w-full">
                  Create Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => {
          const groupStats = groupsStats?.find(stat => stat.group_id === group.id);
          console.log(`Group ${group.name} (ID: ${group.id}):`, {
            group,
            groupStats,
            statsLoading: statsLoadingState
          });
          return (
            <GroupCard 
              key={group.id} 
              group={group} 
              stats={groupStats}
              isLoading={statsLoadingState}
              onDelete={() => handleDeleteGroup(group.id)}
            />
          );
        })}
      </div>

      {/* Summary Card */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Group Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            console.log('Summary Card - overallStats:', overallStats);
            console.log('Summary Card - statsLoading:', statsLoadingState);
            return null;
          })()}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{groups.length}</div>
              <div className="text-sm text-gray-600">Total Groups</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {statsLoadingState ? (
                  <Loader2 className="h-6 w-6 animate-spin inline" />
                ) : (
                  overallStats?.total_words || 0
                )}
              </div>
              <div className="text-sm text-gray-600">Total Words</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {statsLoadingState ? (
                  <Loader2 className="h-6 w-6 animate-spin inline" />
                ) : (
                  overallStats?.learned_words || 0
                )}
              </div>
              <div className="text-sm text-gray-600">Words Learned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {statsLoadingState ? (
                  <Loader2 className="h-6 w-6 animate-spin inline" />
                ) : (
                  `${overallStats?.overall_progress || 0}%`
                )}
              </div>
              <div className="text-sm text-gray-600">Overall Progress</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <ConfirmDialogContent>
          <ConfirmDialogHeader>
            <ConfirmDialogTitle>Delete Group?</ConfirmDialogTitle>
            <ConfirmDialogDescription>
              Are you sure you want to delete this group? This action cannot be undone.
            </ConfirmDialogDescription>
          </ConfirmDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteGroup}>
              Delete
            </Button>
          </div>
        </ConfirmDialogContent>
      </ConfirmDialog>
    </div>
  );
};

export default Groups;
