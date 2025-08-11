import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Edit, Trash2, Filter, BookOpen, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWords, useWordProgress, useUpdateWordProgress } from '@/hooks/useWords';
import { handleApiError } from '@/lib/utils';
import { toast } from 'sonner';
import { CSSTransition } from 'react-transition-group';
import './WordProgressDropdown.css';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Loader2, CheckCircle2, Circle } from 'lucide-react';

// Hàm chuẩn hóa chuỗi: loại bỏ dấu, chuyển về thường
function normalizeString(str: string) {
  return str
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase();
}

const progressColors: Record<string, string> = {
  new: 'bg-gray-200 text-gray-700',
  learning: 'bg-blue-100 text-blue-800',
  learned: 'bg-green-100 text-green-800',
};

const statusOptions = [
  {
    value: 'new',
    label: 'New',
    color: 'text-gray-600',
    icon: Circle,
  },
  {
    value: 'learning',
    label: 'Learning',
    color: 'text-blue-600',
    icon: BookOpen,
  },
  {
    value: 'learned',
    label: 'Learned',
    color: 'text-green-600',
    icon: CheckCircle2,
  },
];

const DROPDOWN_WIDTH = 'w-32'; // 128px, đủ cho các trạng thái

// Helper để lấy màu JLPT
function jlptColor(level: string) {
  switch (level) {
    case 'N1': return 'bg-purple-100 text-purple-700';
    case 'N2': return 'bg-pink-100 text-pink-700';
    case 'N3': return 'bg-yellow-100 text-yellow-700';
    case 'N4': return 'bg-green-100 text-green-700';
    case 'N5': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export default function Words() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [wordToDelete, setWordToDelete] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    kanji: '',
    romaji: '',
    vietnamese: '',
    parts: '',
  });

  const {
    words,
    total,
    isLoading,
    error,
    createWord,
    updateWord,
    deleteWord,
  } = useWords(page, 10, searchTerm);

  const groups = ['All', 'Greetings', 'Verbs', 'Adjectives', 'School', 'Food', 'Travel'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createWord.mutateAsync(formData);
      toast({ description: 'Word created successfully' });
      setIsAddDialogOpen(false);
      setFormData({ kanji: '', romaji: '', vietnamese: '', parts: '' });
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteWord.mutateAsync(id);
      setWordToDelete(null); // Đóng dialog
      toast({ description: 'Word deleted successfully' });
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleConfirmDelete = () => {
    if (wordToDelete) {
      handleDelete(wordToDelete);
    }
  };

  const handleCancelDelete = () => {
    setWordToDelete(null);
  };

  const isDeletingWord = (wordId: number) => {
    return deleteWord.isPending && deleteWord.variables === wordId;
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Words</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Word
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Word</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="kanji">Kanji</Label>
                <Input
                  id="kanji"
                  value={formData.kanji}
                  onChange={(e) =>
                    setFormData({ ...formData, kanji: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="romaji">Romaji</Label>
                <Input
                  id="romaji"
                  value={formData.romaji}
                  onChange={(e) =>
                    setFormData({ ...formData, romaji: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="vietnamese">Vietnamese</Label>
                <Input
                  id="vietnamese"
                  value={formData.vietnamese}
                  onChange={(e) =>
                    setFormData({ ...formData, vietnamese: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="parts">Parts</Label>
                <Input
                  id="parts"
                  value={formData.parts}
                  onChange={(e) =>
                    setFormData({ ...formData, parts: e.target.value })
                  }
                />
              </div>
              <Button type="submit" className="w-full">
                Add Word
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search words..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Vocabulary List</CardTitle>
            <CardDescription>
              Your Japanese vocabulary collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kanji</TableHead>
                  <TableHead>Romaji</TableHead>
                  <TableHead>Vietnamese</TableHead>
                  <TableHead>Parts</TableHead>
                  <TableHead>JLPT</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {words.map((word) => (
                  <TableRow key={word.id} className="align-middle border-b hover:bg-gray-50 transition group">
                    <TableCell className="py-3 px-4 min-w-[120px]">
                      <span className="text-lg font-bold text-gray-900 leading-tight">{word.kanji}</span>
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
                    <TableCell className="py-3 px-4 min-w-[80px] text-center">
                      <span className={`inline-block rounded px-2 py-1 text-sm font-bold ${jlptColor(word.jlpt_level)}`}>{word.jlpt_level}</span>
                    </TableCell>
                    <TableCell className="py-3 px-4 min-w-[140px] text-center">
                      <WordProgressBadge wordId={word.id} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-red-100 text-red-600"
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center mt-4">
        <Button
          variant="outline"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span className="mx-4 py-2">
          Page {page} of {Math.ceil(total / 10)}
        </span>
        <Button
          variant="outline"
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= Math.ceil(total / 10)}
        >
          Next
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!wordToDelete} onOpenChange={(open) => !open && setWordToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete word</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this word? This action cannot be undone and will remove the word from all groups.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteWord.isPending}
            >
              {deleteWord.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function WordProgressBadge({ wordId }: { wordId: number }) {
  const { data: progress, isLoading } = useWordProgress(wordId);
  const updateProgress = useUpdateWordProgress();
  const [loading, setLoading] = useState(false);

  if (isLoading) return <span className="text-gray-400">...</span>;
  if (!progress) return <span className="text-gray-400">-</span>;

  const current = statusOptions.find(s => s.value === progress.status) || statusOptions[0];

  const handleStatusChange = async (status: string) => {
    if (status === progress.status) return;
    setLoading(true);
    await updateProgress.mutateAsync({ wordId, data: { status } });
    setLoading(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`transition-all duration-300 transform hover:scale-105 ${current.color} bg-white border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md px-2 py-1 h-7 ${DROPDOWN_WIDTH} justify-center`}
          style={{ minWidth: 128, maxWidth: 128 }}
          disabled={loading}
        >
          <div className="flex items-center gap-2 w-full justify-center">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <current.icon className="h-4 w-4 transition-transform duration-200" />
            )}
            <span className="font-medium text-xs truncate w-16 text-center">{current.label}</span>
            <ChevronDown className="h-3 w-3 transition-transform duration-200" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={`bg-white border shadow-lg z-50 ${DROPDOWN_WIDTH}`} style={{ minWidth: 128, maxWidth: 128 }}>
        {statusOptions.map((status) => {
          const Icon = status.icon;
          return (
            <DropdownMenuItem
              key={status.value}
              onClick={() => handleStatusChange(status.value)}
              className={`flex items-center gap-2 cursor-pointer transition-all duration-200 ${status.color} ${progress.status === status.value ? 'bg-gray-100 font-semibold' : ''} w-full justify-center`}
              style={{ minWidth: 128, maxWidth: 128 }}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate w-16 text-center">{status.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
