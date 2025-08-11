import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

interface ImportFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedDifficulty: string;
  setSelectedDifficulty: (difficulty: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
}

const ImportFilters = ({
  searchTerm,
  setSearchTerm,
  selectedDifficulty,
  setSelectedDifficulty,
  selectedStatus,
  setSelectedStatus
}: ImportFiltersProps) => {
  const difficulties = ['All', 'N5', 'N4', 'N3', 'N2', 'N1'];
  const statuses = ['All', 'Imported', 'Duplicate', 'Error'];

  return (
    <Card className="shadow-lg border-0">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm từ vựng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả độ khó</SelectItem>
                {difficulties.slice(1).map(difficulty => (
                  <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {statuses.slice(1).map(status => (
                  <SelectItem key={status} value={status.toLowerCase()}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportFilters; 