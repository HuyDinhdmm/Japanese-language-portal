import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { RotateCcw, CheckCircle, XCircle, Trophy, ArrowLeft, Shuffle, Lightbulb } from 'lucide-react';
import { useGroupWordsWithProgress } from '@/hooks/useGroups';

interface WordScrambleGameProps {
  groupId: number;
  sessionId?: number;
  onClose: () => void;
  studyActivityId?: number;
  onRestart?: () => void;
}

const WordScrambleGame = ({ groupId, sessionId, onClose, studyActivityId, onRestart }: WordScrambleGameProps) => {
  const { words: groupWords, isLoading } = useGroupWordsWithProgress(groupId, 1, 1000);
  const [shuffledWords, setShuffledWords] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [initialized, setInitialized] = useState(false);

  const progressKey = sessionId
    ? `scramble-progress-session-${sessionId}`
    : `scramble-progress-group-${groupId}`;

  // Khôi phục tiến trình sau khi groupWords đã sẵn sàng
  useEffect(() => {
    if (!isLoading && groupWords && groupWords.length > 0 && !initialized) {
      const saved = localStorage.getItem(progressKey);
      if (saved) {
        const progress = JSON.parse(saved);
        console.log('Khôi phục tiến trình:', progress);
        setShuffledWords(progress.shuffledWords);
        setCurrentIndex(progress.currentIndex);
        setScore(progress.score);
        setCorrectAnswers(progress.correctAnswers);
        setTotalAnswered(progress.totalAnswered);
        setGameCompleted(progress.gameCompleted);
        setUserInput('');
        setShowHint(false);
        setIsCorrect(null);
        setInitialized(true);
        console.log('Initialized: true (restored from localStorage)');
      } else {
        // Khởi tạo mới
        const normalized = groupWords.map((w: any) => ({
          id: w.id,
          japanese: w.kanji || w.japanese || '',
          romaji: w.romaji || '',
          vietnamese: w.vietnamese || '',
          difficulty: w.difficulty || 'easy',
        })).filter(w => w.romaji && w.vietnamese);
        let shuffled = [...normalized];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        if (shuffled.length > 30) {
          shuffled = shuffled.slice(0, 30);
        }
        const withScrambled = shuffled.map(word => ({
          ...word,
          scrambled: generateScrambled(word.romaji)
        }));
        setShuffledWords(withScrambled);
        setCurrentIndex(0);
        setScore(0);
        setCorrectAnswers(0);
        setTotalAnswered(0);
        setGameCompleted(false);
        setUserInput('');
        setShowHint(false);
        setIsCorrect(null);
        setInitialized(true);
        console.log('Initialized: true (new game)');
      }
    }
  }, [groupId, isLoading, groupWords, initialized]);

  // Lưu tiến trình mỗi khi state thay đổi
  useEffect(() => {
    if (shuffledWords.length > 0 && initialized) {
      const progress = {
        currentIndex,
        shuffledWords,
        score,
        correctAnswers,
        totalAnswered,
        gameCompleted,
        groupId,
        studyActivityId
      };
      localStorage.setItem(progressKey, JSON.stringify(progress));
    }
  }, [currentIndex, shuffledWords, score, correctAnswers, totalAnswered, gameCompleted, initialized, progressKey, groupId, studyActivityId]);

  function generateScrambled(romaji: string) {
    let scrambled = scrambleWord(romaji);
    while (scrambled === romaji && romaji.length > 1) {
      scrambled = scrambleWord(romaji);
    }
    return scrambled;
  }

  const scrambleWord = (word: string): string => {
    const chars = word.split('');
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
  };

  const words = shuffledWords;

  const currentWord = words[currentIndex];
  const progress = words.length > 0 ? (totalAnswered / words.length) * 100 : 0;

  const handleSubmit = () => {
    if (!currentWord) return;
    const correct = userInput.toLowerCase().trim() === currentWord.romaji.toLowerCase();
    setIsCorrect(correct);
    setTotalAnswered(prev => prev + 1);
    if (correct) {
      setCorrectAnswers(prev => prev + 1);
      const points = currentWord.difficulty === 'easy' ? 10 : currentWord.difficulty === 'medium' ? 20 : 30;
      setScore(prev => prev + points);
    }
    setTimeout(() => {
      if (currentIndex < words.length - 1) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
      } else {
        setGameCompleted(true);
      }
    }, 1500);
    setUserInput('');
    setShowHint(false);
    setIsCorrect(null);
  };

  const handleNewScramble = () => {
    if (!currentWord) return;
    let scrambled = scrambleWord(currentWord.romaji);
    while (scrambled === currentWord.romaji && currentWord.romaji.length > 1) {
      scrambled = scrambleWord(currentWord.romaji);
    }
    // setScrambledWord(scrambled);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const resetGame = () => {
    localStorage.removeItem(progressKey);
    setInitialized(false);
    setCurrentIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setTotalAnswered(0);
    setGameCompleted(false);
    setUserInput('');
    setShowHint(false);
    setIsCorrect(null);
    // Shuffle lại danh sách từ
    if (shuffledWords.length > 0) {
      const shuffledArr = [...shuffledWords];
      for (let i = shuffledArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArr[i], shuffledArr[j]] = [shuffledArr[j], shuffledArr[i]];
      }
      setShuffledWords(shuffledArr);
    }
    if (onRestart) onRestart();
  };

  if (isLoading) {
    return <div className="text-center py-10">Đang tải dữ liệu...</div>;
  }

  if (!words.length) {
    return <div className="text-center py-10">Không có từ vựng phù hợp trong group này.</div>;
  }

  if (gameCompleted) {
    const percentage = Math.round((correctAnswers / words.length) * 100);
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onClose} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </div>
        <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-blue-50">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-gray-900">Hoàn thành!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{score}</div>
                <div className="text-sm text-gray-600">Điểm số</div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{correctAnswers}/{words.length}</div>
                <div className="text-sm text-gray-600">Đúng</div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{percentage}%</div>
                <div className="text-sm text-gray-600">Tỷ lệ</div>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={resetGame} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                <RotateCcw className="h-4 w-4 mr-2" />
                Chơi lại
              </Button>
              <Button variant="outline" onClick={onClose}>
                Kết thúc
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onClose} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {currentIndex + 1}/{words.length}
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Điểm: {score}
          </Badge>
          <Button variant="outline" onClick={resetGame} className="ml-2">
            <RotateCcw className="h-4 w-4 mr-1" /> Chơi lại
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Tiến độ</span>
          <span>{isNaN(progress) ? '0%' : `${Math.round(progress)}%`}</span>
        </div>
        <Progress value={isNaN(progress) ? 0 : progress} className="h-2" />
      </div>
      <Card className="shadow-xl border-0 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <Badge className={`${getDifficultyColor(currentWord.difficulty)} border-0`}>
              {currentWord.difficulty}
            </Badge>
            <div className="space-y-2">
              <div className="text-4xl font-bold">{currentWord.japanese}</div>
              <div className="text-xl text-white/90 mt-2">{currentWord.vietnamese}</div>
            </div>
            <div className="bg-white/20 rounded-lg p-6 space-y-4">
              <div className="space-y-2">
                <h4 className="text-lg font-semibold">Sắp xếp lại các chữ cái:</h4>
                <div className="text-2xl font-mono tracking-widest bg-white/30 rounded-lg p-4">
                  {currentWord.scrambled}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleNewScramble}
                  variant="outline"
                  size="sm"
                  className="bg-white/20 border-white/50 text-white hover:bg-white/30"
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  Xáo trộn lại
                </Button>
                <Button
                  onClick={() => setShowHint(!showHint)}
                  variant="outline"
                  size="sm"
                  className="bg-white/20 border-white/50 text-white hover:bg-white/30"
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Gợi ý
                </Button>
              </div>
              {showHint && (
                <div className="bg-yellow-500/20 rounded-lg p-3 text-sm">
                  <strong>Gợi ý:</strong> Từ này có {currentWord.romaji.length} chữ cái và bắt đầu bằng "{currentWord.romaji[0]}"
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-lg border-0">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhập từ romaji đúng:
              </label>
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Nhập từ romaji..."
                className="text-lg text-center"
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            <Button 
              onClick={handleSubmit} 
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              disabled={!userInput.trim()}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Kiểm tra
            </Button>
            {isCorrect !== null && (
              <div className={`text-center p-3 rounded-lg ${
                isCorrect 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {isCorrect ? (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">Chính xác! Đáp án: {currentWord.romaji}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <XCircle className="h-5 w-5" />
                    <span className="font-semibold">Sai rồi! Đáp án đúng là: {currentWord.romaji}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white/50 backdrop-blur-sm border-0">
        <CardContent className="pt-4">
          <p className="text-center text-gray-600 text-sm">
            🎯 Nhìn nghĩa tiếng Việt và sắp xếp lại các chữ cái để tạo thành từ romaji đúng
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WordScrambleGame; 