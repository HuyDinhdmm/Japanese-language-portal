import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RotateCcw, CheckCircle, XCircle, Trophy, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { groupsApi, wordProgressApi } from '@/lib/api';

interface Word {
  id: number;
  kanji: string;
  romaji: string;
  vietnamese: string;
  jlpt_level: string;
  parts: { kanji: string; romaji: string[] }[];
}

interface FlashcardGameProps {
  groupId: number;
  sessionId?: number;
  onClose: () => void;
  onGameComplete?: (stats: any) => void;
  studyActivityId?: number;
  onRestart?: () => void;
}

const FlashcardGame = ({ groupId, sessionId, onClose, onGameComplete, studyActivityId, onRestart }: FlashcardGameProps) => {
  const { toast } = useToast();
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const progressKey = sessionId
    ? `flashcard-progress-session-${sessionId}`
    : `flashcard-progress-group-${groupId}`;

  const currentWord = words[currentIndex];
  const progress = words.length > 0 ? (totalAnswered / words.length) * 100 : 0;

  // Khôi phục tiến trình sau khi mount (giống WordScrambleGame)
  useEffect(() => {
    if (!initialized) {
      const saved = localStorage.getItem(progressKey);
      if (saved) {
        const progress = JSON.parse(saved);
        console.log('Khôi phục tiến trình:', progress);
        setWords(progress.words || []);
        setCurrentIndex(progress.currentIndex || 0);
        setScore(progress.score || 0);
        setCorrectAnswers(progress.correctAnswers || 0);
        setTotalAnswered(progress.totalAnswered || 0);
        setGameCompleted(!!progress.gameCompleted);
        setIsFlipped(!!progress.isFlipped);
        setInitialized(true);
        setLoading(false);
        return;
      }
    }
  }, [groupId, initialized, progressKey]);

  // Lưu tiến trình mỗi khi state thay đổi (giống WordScrambleGame)
  useEffect(() => {
    if (words.length > 0 && initialized) {
      const progress = {
        currentIndex,
        words,
        score,
        correctAnswers,
        totalAnswered,
        gameCompleted,
        isFlipped,
        groupId,
        studyActivityId
      };
      localStorage.setItem(progressKey, JSON.stringify(progress));
    }
  }, [currentIndex, words, score, correctAnswers, totalAnswered, gameCompleted, isFlipped, initialized, progressKey, groupId, studyActivityId]);

  // Fetch và shuffle chỉ khi chưa initialized và không có tiến trình (giống WordScrambleGame)
  useEffect(() => {
    if (!initialized) {
      const saved = localStorage.getItem(progressKey);
      if (!saved) {
        const fetchWords = async () => {
          try {
            setLoading(true);
            const response = await groupsApi.getGroupWords(groupId, 1, 100); // Get up to 100 words
            let fetchedWords = response.data?.items || [];
            // Lấy random 30 từ
            if (fetchedWords.length > 30) {
              fetchedWords = fetchedWords.sort(() => Math.random() - 0.5).slice(0, 30);
            } else {
              // Nếu <= 30 từ, vẫn shuffle
              fetchedWords = fetchedWords.sort(() => Math.random() - 0.5);
            }
            setWords(fetchedWords);
            setCurrentIndex(0);
            setIsFlipped(false);
            setScore(0);
            setCorrectAnswers(0);
            setTotalAnswered(0);
            setGameCompleted(false);
            setInitialized(true); // Đánh dấu đã init
          } catch (error) {
            console.error('Error fetching words:', error);
            toast({
              title: "Lỗi khi tải từ vựng",
              description: "Không thể tải từ vựng từ group này.",
              variant: "destructive",
            });
          } finally {
            setLoading(false);
          }
        };
        fetchWords();
      }
    }
  }, [groupId, toast, initialized, progressKey]);

  const getDifficultyColor = (jlptLevel: string) => {
    switch (jlptLevel) {
      case 'N5': return 'bg-green-100 text-green-800';
      case 'N4': return 'bg-blue-100 text-blue-800';
      case 'N3': return 'bg-yellow-100 text-yellow-800';
      case 'N2': return 'bg-pink-100 text-pink-800';
      case 'N1': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyPoints = (jlptLevel: string) => {
    switch (jlptLevel) {
      case 'N5': return 10;
      case 'N4': return 15;
      case 'N3': return 20;
      case 'N2': return 25;
      case 'N1': return 30;
      default: return 10;
    }
  };

  const updateWordProgress = async (wordId: number, isCorrect: boolean) => {
    try {
      setUpdatingProgress(true);
      const currentStatus = isCorrect ? 'learned' : 'learning';
      await wordProgressApi.update(wordId, { status: currentStatus });
    } catch (error) {
      console.error('Error updating word progress:', error);
    } finally {
      setUpdatingProgress(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleAnswer = async (isCorrect: boolean) => {
    if (!isFlipped || !currentWord) return;

    setTotalAnswered(prev => prev + 1);
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      const points = getDifficultyPoints(currentWord.jlpt_level);
      setScore(prev => prev + points);
    }

    // Update word progress
    await updateWordProgress(currentWord.id, isCorrect);

    // Move to next card or complete game
    if (currentIndex < words.length - 1) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
      }, 500);
    } else {
      setTimeout(() => {
        setGameCompleted(true);
        const gameStats = {
          score,
          correctAnswers: isCorrect ? correctAnswers + 1 : correctAnswers,
          totalWords: words.length,
          percentage: Math.round(((isCorrect ? correctAnswers + 1 : correctAnswers) / words.length) * 100)
        };
        onGameComplete?.(gameStats);
      }, 500);
    }
  };

  const resetGame = () => {
    localStorage.removeItem(progressKey);
    setInitialized(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setScore(0);
    setCorrectAnswers(0);
    setTotalAnswered(0);
    setGameCompleted(false);
    setWords([]);
    setLoading(true);
    if (onRestart) onRestart();
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onClose} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </div>
        <Card className="shadow-lg border-0">
          <CardContent className="h-80 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="text-gray-600">Đang tải từ vựng...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onClose} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </div>
        <Card className="shadow-lg border-0">
          <CardContent className="h-80 flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-gray-600">Không có từ vựng nào trong group này.</p>
              <Button onClick={onClose}>Quay lại</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
      {/* Header */}
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

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Tiến độ</span>
          <span>{isNaN(progress) ? '0%' : `${Math.round(progress)}%`}</span>
        </div>
        <Progress value={isNaN(progress) ? 0 : progress} className="h-2" />
      </div>

      {/* Flashcard */}
      <Card 
        className={`cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-xl border-0 h-80 ${
          isFlipped ? 'bg-gradient-to-br from-green-500 to-blue-500' : 'bg-gradient-to-br from-blue-500 to-purple-500'
        }`}
        onClick={handleFlip}
      >
        <CardContent className="h-full flex flex-col justify-center items-center text-white relative p-8">
          <Badge 
            className={`absolute top-4 right-4 ${getDifficultyColor(currentWord?.jlpt_level || 'N5')} border-0`}
          >
            {currentWord?.jlpt_level || 'N5'}
          </Badge>

          {!isFlipped ? (
            <div className="text-center space-y-4">
              <div className="text-4xl font-bold mb-4">{currentWord?.kanji}</div>
              <div className="text-xl text-white/80">{currentWord?.romaji}</div>
              <div className="text-sm text-white/60 mt-8">Nhấn để xem nghĩa</div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-3xl font-bold mb-4">{currentWord?.vietnamese}</div>
              <div className="text-lg text-white/80">{currentWord?.kanji}</div>
              <div className="text-base text-white/70">({currentWord?.romaji})</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Answer Buttons */}
      {isFlipped && (
        <div className="flex gap-4 justify-center animate-fade-in">
          <Button
            onClick={() => handleAnswer(false)}
            variant="outline"
            size="lg"
            className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-300"
            disabled={updatingProgress}
          >
            <XCircle className="h-5 w-5 mr-2" />
            Không biết
          </Button>
          <Button
            onClick={() => handleAnswer(true)}
            size="lg"
            className="bg-green-500 hover:bg-green-600 text-white"
            disabled={updatingProgress}
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Biết rồi
          </Button>
        </div>
      )}

      {/* Instructions */}
      {!isFlipped && (
        <Card className="bg-white/50 backdrop-blur-sm border-0">
          <CardContent className="pt-4">
            <p className="text-center text-gray-600 text-sm">
              🎯 Nhấn vào thẻ để xem nghĩa, sau đó chọn "Biết rồi" hoặc "Không biết"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FlashcardGame; 