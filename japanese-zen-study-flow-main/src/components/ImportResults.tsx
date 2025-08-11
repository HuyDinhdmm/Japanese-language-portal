import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { importWordsToDatabase } from '@/lib/api';

interface WordPart {
  kanji: string;
  romaji: string[];
}

interface ImportResultsProps {
  words: Array<{
    kanji: string;
    romaji: string;
    vietnamese: string;
    jlpt_level: string;
    parts: WordPart[];
  }>;
  filteredWords: Array<{
    kanji: string;
    romaji: string;
    vietnamese: string;
    jlpt_level: string;
    parts: WordPart[];
  }>;
  thematicCategory: string;
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'N5': return 'bg-blue-100 text-blue-800';
    case 'N4': return 'bg-green-100 text-green-800';
    case 'N3': return 'bg-yellow-100 text-yellow-800';
    case 'N2': return 'bg-pink-100 text-pink-800';
    case 'N1': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const ImportResults = ({ words, filteredWords, thematicCategory }: ImportResultsProps) => {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);

  console.log('ImportResults - words:', words);
  console.log('ImportResults - filteredWords:', filteredWords);
  console.log('ImportResults - thematicCategory:', thematicCategory);

  const handleConfirmImport = async () => {
    setIsImporting(true);
    try {
      console.log('Starting import to database...');
      const result = await importWordsToDatabase(words, thematicCategory);
      console.log('Import result:', result);
      
      toast({
        title: "Import thành công!",
        description: `Đã thêm ${result.imported_words.length} từ vựng mới vào database và tạo group "${thematicCategory}".`,
      });
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: "Lỗi khi import",
        description: "Không thể import từ vựng vào database.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Kết quả Import ({filteredWords.length} từ)
            </CardTitle>
            <CardDescription>
              Xem lại và xác nhận các từ vựng được import
            </CardDescription>
          </div>
          <Button 
            onClick={handleConfirmImport}
            disabled={isImporting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang import...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Import vào Database
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kanji</TableHead>
                <TableHead>Romaji</TableHead>
                <TableHead>Tiếng Việt</TableHead>
                <TableHead>JLPT</TableHead>
                <TableHead>Phân tách</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWords.map((word, idx) => (
                <TableRow key={idx} className="hover:bg-blue-50/30">
                  <TableCell className="font-medium text-lg">{word.kanji}</TableCell>
                  <TableCell className="font-mono text-blue-600">{word.romaji}</TableCell>
                  <TableCell>{word.vietnamese}</TableCell>
                  <TableCell>
                    <Badge className={getDifficultyColor(word.jlpt_level)}>
                      {word.jlpt_level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {Array.isArray(word.parts) && word.parts.length > 0 ? (
                      <ul className="list-disc ml-4">
                        {word.parts.map((part, i) => (
                          <li key={i}>
                            <span className="font-bold">{part.kanji}</span>: {part.romaji.join(', ')}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400">Không có</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportResults; 