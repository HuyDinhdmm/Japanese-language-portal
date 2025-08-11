import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, ArrowLeft, Edit, Trash2, Volume2, CheckCircle, Clock, ChevronDown, BookOpen, Loader2, CheckCircle2, Circle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGroupById, useGroupWordsWithProgress } from '@/hooks/useGroups';
import { useWordProgress } from '@/hooks/useWordProgress';

const GroupDetails = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [wordToDelete, setWordToDelete] = useState<number | null>(null);

  const { group, isLoading: groupLoading, error: groupError } = useGroupById(Number(groupId));
  const { words, total, isLoading: wordsLoading, removeWordFromGroup } = useGroupWordsWithProgress(Number(groupId), page, perPage);
  const { createWordProgress, updateWordProgress } = useWordProgress();

  const statusOptions = [
    { value: 'new', label: 'New', icon: Circle, color: 'text-gray-500' },
    { value: 'learning', label: 'Learning', icon: Clock, color: 'text-yellow-600' },
    { value: 'learned', label: 'Learned', icon: CheckCircle2, color: 'text-green-600' },
  ];

  const filteredWords = words.filter(word => 
    word.kanji.includes(searchTerm) || 
    word.romaji.toLowerCase().includes(searchTerm.toLowerCase()) ||
    word.vietnamese.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = async (wordId: number, newStatus: string) => {
    try {
      const statusLabel = statusOptions.find(s => s.value === newStatus)?.label;
      
      // Check if word progress exists, if not create it
      const word = words.find(w => w.id === wordId);
      if (word && (!word.progress || !word.progress.id)) {
        await createWordProgress.mutateAsync({
          word_id: wordId,
          status: newStatus,
          last_studied_at: new Date().toISOString()
        });
      } else {
        await updateWordProgress.mutateAsync({
          wordId,
          data: {
            status: newStatus,
            last_studied_at: new Date().toISOString()
          }
        });
      }

      toast({
        title: `Status updated to ${statusLabel}!`,
        description: "Word status has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating word status:', error);
      toast({
        title: "Error updating status",
        description: "Failed to update word status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWord = async (wordId: number) => {
    try {
      await removeWordFromGroup.mutateAsync({
        groupId: Number(groupId),
        wordId: wordId
      });
      
      setWordToDelete(null); // Đóng dialog
      toast({
        title: "Word removed",
        description: "The word has been removed from this group successfully.",
      });
    } catch (error) {
      console.error('Error removing word from group:', error);
      toast({
        title: "Error removing word",
        description: "Failed to remove word from group. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmDelete = () => {
    if (wordToDelete) {
      handleDeleteWord(wordToDelete);
    }
  };

  const handleCancelDelete = () => {
    setWordToDelete(null);
  };

  const isDeletingWord = (wordId: number) => {
    return removeWordFromGroup.isPending && removeWordFromGroup.variables?.wordId === wordId;
  };

  const getStatusConfig = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  const getDifficultyColor = (wordsCount: number) => {
    if (wordsCount <= 20) return 'bg-green-100 text-green-800';
    if (wordsCount <= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getDifficultyLabel = (wordsCount: number) => {
    if (wordsCount <= 20) return 'Beginner';
    if (wordsCount <= 50) return 'Intermediate';
    return 'Advanced';
  };

  if (groupLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (groupError || !group) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Group not found</h1>
          <Link to="/groups" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            ← Back to Groups
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link 
          to="/groups"
          className="text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={getDifficultyColor(group.words_count)}>
              {getDifficultyLabel(group.words_count)}
            </Badge>
            <span className="text-sm text-gray-500">
              {group.words_count} words in this group
            </span>
          </div>
          {group.description && (
            <p className="text-gray-600 mt-1">{group.description}</p>
          )}
        </div>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search words in this group..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Words Table */}
      {wordsLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Vocabulary List
            </CardTitle>
            <CardDescription>
              Words in {group.name} ({filteredWords.length} words)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredWords.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No words found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search terms.' : 'This group doesn\'t have any words yet.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Japanese</TableHead>
                    <TableHead>Romaji</TableHead>
                    <TableHead>Vietnamese</TableHead>
                    <TableHead>Parts</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWords.map((word) => {
                    const statusConfig = getStatusConfig(word.progress?.status || 'new');
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <TableRow key={word.id} className="align-middle border-b hover:bg-gray-50 transition group">
                        <TableCell className="py-3 px-4 min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-900 leading-tight">{word.kanji}</span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-blue-100">
                              <Volume2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4 min-w-[140px]">
                          <span className="text-base font-semibold text-blue-800">{word.romaji}</span>
                        </TableCell>
                        <TableCell className="py-3 px-4 min-w-[160px]">
                          <span className="text-base text-gray-700">{word.vietnamese}</span>
                        </TableCell>
                        <TableCell className="py-3 px-4 min-w-[140px]">
                          <Badge variant="outline">
                            <span className="text-base">
                              {(() => {
                                try {
                                  const parts = JSON.parse(word.parts);
                                  return parts.map((part: any) => `${part.kanji} (${part.romaji.join(', ')})`).join(' ');
                                } catch {
                                  return word.parts;
                                }
                              })()}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-4 min-w-[140px] text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`transition-all duration-300 transform hover:scale-105 ${statusConfig.color} bg-white border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md px-2 py-1 h-7 w-32 justify-center`}
                                disabled={updateWordProgress.isPending}
                              >
                                <div className="flex items-center gap-2 w-full justify-center">
                                  <StatusIcon className="h-4 w-4 transition-transform duration-200" />
                                  <span className="font-medium text-xs truncate w-16 text-center">{statusConfig.label}</span>
                                  <ChevronDown className="h-3 w-3 transition-transform duration-200" />
                                </div>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-32 bg-white border shadow-lg z-50">
                              {statusOptions.map((status) => {
                                const Icon = status.icon;
                                return (
                                  <DropdownMenuItem
                                    key={status.value}
                                    onClick={() => handleStatusChange(word.id, status.value)}
                                    className={`flex items-center gap-2 cursor-pointer transition-all duration-200 ${status.color} ${
                                      (word.progress?.status || 'new') === status.value ? 'bg-gray-100 font-semibold' : ''
                                    } w-full justify-center`}
                                  >
                                    <Icon className="h-4 w-4" />
                                    <span className="truncate w-16 text-center">{status.label}</span>
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="hover:bg-blue-100 hover:scale-110 transition-all duration-200"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="hover:bg-red-100 text-red-600 hover:scale-110 transition-all duration-200"
                              onClick={() => setWordToDelete(word.id)}
                              disabled={isDeletingWord(word.id)}
                            >
                              {isDeletingWord(word.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      <div className="flex justify-center mt-4">
        <Button
          variant="outline"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span className="mx-4 py-2">
          Page {page} of {Math.ceil(total / perPage)}
        </span>
        <Button
          variant="outline"
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= Math.ceil(total / perPage)}
        >
          Next
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!wordToDelete} onOpenChange={(open) => !open && setWordToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove word from group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this word from the group? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={removeWordFromGroup.isPending}
            >
              {removeWordFromGroup.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GroupDetails; 