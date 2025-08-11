import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface ImportedWord {
  id: number;
  japanese: string;
  romaji: string;
  vietnamese: string;
  group: string;
  difficulty: string;
  status: string;
  source: string;
}

interface ImportStatsProps {
  words: ImportedWord[];
}

const ImportStats = ({ words }: ImportStatsProps) => {
  return (
    <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-blue-50">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {words.filter(w => w.status === 'imported').length}
            </div>
            <div className="text-sm text-gray-600">Từ mới</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {words.filter(w => w.status === 'duplicate').length}
            </div>
            <div className="text-sm text-gray-600">Trùng lặp</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {words.filter(w => w.status === 'error').length}
            </div>
            <div className="text-sm text-gray-600">Lỗi</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{words.length}</div>
            <div className="text-sm text-gray-600">Tổng cộng</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportStats; 