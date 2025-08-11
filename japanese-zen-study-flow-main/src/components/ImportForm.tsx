import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateWords, formatWordList } from '@/lib/api';

interface ImportFormProps {
  onImportComplete: (words: any[], thematicCategory: string) => void;
}

const ImportForm = ({ onImportComplete }: ImportFormProps) => {
  const { toast } = useToast();
  const [importText, setImportText] = useState('');
  const [jlptLevel, setJlptLevel] = useState('N5');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImport = async () => {
    if (!importText.trim()) {
      toast({
        title: "Vui lòng nhập chủ đề từ vựng",
        description: "Hãy nhập tên chủ đề hoặc bộ từ vựng bạn muốn import.",
        variant: "destructive",
      });
      return;
    }
    setIsProcessing(true);
    try {
      console.log('Sending request with:', { thematicCategory: importText, jlptLevel: jlptLevel });
      const raw = await generateWords(importText, jlptLevel);
      console.log('Received response:', raw);
      const formatted = formatWordList(raw);
      console.log('Formatted words:', formatted);
      toast({
        title: "Import thành công!",
        description: `Đã import từ vựng chủ đề: ${importText} (JLPT ${jlptLevel})`,
      });
      setImportText('');
      onImportComplete(formatted, importText);
    } catch (err) {
      console.error('Import error:', err);
      toast({
        title: "Lỗi khi import từ vựng",
        description: "Không thể sinh từ vựng từ chủ đề này.",
        variant: "destructive",
      });
    }
    setIsProcessing(false);
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-r from-white to-blue-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-600" />
          Import Từ Vựng
        </CardTitle>
        <CardDescription>
          Nhập tên chủ đề hoặc bộ từ vựng để import tự động
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="importTopic">Chủ đề từ vựng</Label>
              <Input
                id="importTopic"
                placeholder="VD: JLPT N5 Vocabulary, Food & Dining, Travel Phrases..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="jlptLevel">JLPT Level</Label>
              <Select value={jlptLevel} onValueChange={setJlptLevel}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Chọn level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="N5">N5 - Cơ bản</SelectItem>
                  <SelectItem value="N4">N4 - Sơ cấp</SelectItem>
                  <SelectItem value="N3">N3 - Trung cấp</SelectItem>
                  <SelectItem value="N2">N2 - Trung cao cấp</SelectItem>
                  <SelectItem value="N1">N1 - Cao cấp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleImport}
              disabled={isProcessing}
              className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          </div>

          {/* Quick Import Suggestions */}
          <div>
            <Label>Gợi ý chủ đề phổ biến:</Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {['JLPT N5 Basic', 'Food & Dining', 'Travel Phrases', 'Business Japanese', 'Family Terms'].map(topic => (
                <Button
                  key={topic}
                  variant="outline"
                  size="sm"
                  onClick={() => setImportText(topic)}
                  className="text-sm hover:bg-blue-50"
                >
                  {topic}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportForm; 