import React, { useState } from 'react';
import ImportForm from '@/components/ImportForm';
import ImportFilters from '@/components/ImportFilters';
import ImportResults from '@/components/ImportResults';
import ImportStats from '@/components/ImportStats';

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

const Import = () => {
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Dữ liệu import thực tế từ backend
  const [importedWords, setImportedWords] = useState<any[]>([]);
  const [thematicCategory, setThematicCategory] = useState<string>('');

  // Filter imported words
  const filteredWords = importedWords.filter(word => {
    const matchesSearch =
      (word.kanji && word.kanji.includes(searchTerm)) ||
      (word.romaji && word.romaji.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (word.vietnamese && word.vietnamese.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDifficulty = selectedDifficulty === 'all' || word.jlpt_level === selectedDifficulty;
    
    // For now, all imported words have status 'Imported'
    const matchesStatus = selectedStatus === 'all' || 'imported' === selectedStatus;
    
    return matchesSearch && matchesDifficulty && matchesStatus;
  });

  // Khi import xong sẽ nhận dữ liệu đã format từ backend
  const handleImportComplete = (words: any[], category: string) => {
    console.log('Import page received words:', words);
    console.log('Import page received category:', category);
    console.log('Number of words:', words.length);
    setImportedWords(words);
    setThematicCategory(category);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Import Từ Vựng</h1>
        <p className="text-gray-600 mt-1">Import từ vựng theo chủ đề một cách nhanh chóng</p>
      </div>

      {/* Import Form */}
      <ImportForm onImportComplete={handleImportComplete} />

      {/* Filter and Search */}
      {importedWords.length > 0 && (
        <ImportFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedDifficulty={selectedDifficulty}
          setSelectedDifficulty={setSelectedDifficulty}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
        />
      )}

      {/* Import Results */}
      {importedWords.length > 0 && (
        <ImportResults
          words={importedWords}
          filteredWords={filteredWords}
          thematicCategory={thematicCategory}
        />
      )}

      {/* Summary Stats */}
      {/* Có thể bổ sung ImportStats nếu muốn thống kê */}
    </div>
  );
};

export default Import; 