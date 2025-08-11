import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Youtube } from 'lucide-react';
import { useYoutubeListening, type Question, generateQuestionFromConversation } from '../hooks/useYoutubeListening';

// Utility function để extract video ID
const extractVideoId = (url: string): string | null => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
};

const YouTubeListening: React.FC = () => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const { mondaiCount, splitTranscript, analyzeSection, loading, error } = useYoutubeListening();
  const [selectedMondai, setSelectedMondai] = useState<number | null>(null);
  const [mondaiQuestions, setMondaiQuestions] = useState<{ [sectionNum: number]: Question[] }>({});
  const [selectedOptions, setSelectedOptions] = useState<{ [questionId: number]: number | null }>({});
  const [showAnswers, setShowAnswers] = useState<{ [questionId: number]: boolean }>({});
  const [openDetails, setOpenDetails] = useState<{ [questionId: number]: boolean }>({});
  const [refreshing, setRefreshing] = useState<{ [questionId: number]: boolean }>({});

  const handleUrlSubmit = async () => {
    if (youtubeUrl.includes('youtube.com') || youtubeUrl.includes('youtu.be')) {
      setSelectedMondai(null);
      setMondaiQuestions({});
      await splitTranscript(youtubeUrl);
    }
  };

  const handleMondaiClick = async (mondaiNum: number) => {
    setSelectedMondai(mondaiNum);
    // Reset selections, answers, and detail views when switching mondai
    setSelectedOptions({});
    setShowAnswers({});
    setOpenDetails({});
    if (mondaiQuestions[mondaiNum]) return;
    const questions = await analyzeSection(youtubeUrl, mondaiNum);
    setMondaiQuestions(prev => ({ ...prev, [mondaiNum]: questions }));
  };

  const handleRefreshQuestion = async (sectionNum: number, qIdx: number, question: Question) => {
    setRefreshing(prev => ({ ...prev, [question.id]: true }));
    const newQ = await generateQuestionFromConversation(question.conversation);
    setRefreshing(prev => ({ ...prev, [question.id]: false }));
    if (newQ) {
      setMondaiQuestions(prev => {
        const arr = [...(prev[sectionNum] || [])];
        arr[qIdx] = { ...newQ, id: question.id };
        return { ...prev, [sectionNum]: arr };
      });
      setSelectedOptions(prev => ({ ...prev, [question.id]: null }));
      setShowAnswers(prev => ({ ...prev, [question.id]: false }));
      setOpenDetails(prev => ({ ...prev, [question.id]: false }));
    }
  };

  const videoId = extractVideoId(youtubeUrl);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">YouTube JLPT Listening</h1>
        <p className="text-gray-600 mt-1">Import video YouTube và luyện nghe với câu hỏi tự động</p>
      </div>
      
      <Card className="shadow-lg border-0 bg-gradient-to-br from-red-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Youtube className="h-6 w-6" />
            Import Video YouTube
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="youtube-url" className="text-sm font-medium">
              Nhập link YouTube video JLPT Listening:
            </Label>
            <Input
              id="youtube-url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="mt-2"
            />
          </div>
          <Button 
            onClick={handleUrlSubmit}
            disabled={!youtubeUrl.trim() || loading}
            className="w-full h-12 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                Đang phân tích video...
              </>
            ) : (
              <>
                <Youtube className="h-5 w-5 mr-3" />
                Phân tích video và tạo câu hỏi
              </>
            )}
          </Button>
          {loading && <div className="text-blue-600">Đang xử lý...</div>}
          {error && <div className="text-red-600">{error}</div>}
        </CardContent>
      </Card>
      
      {/* Hiển thị video YouTube embedded nếu đã nhập link và đã phân tích xong */}
      {mondaiCount > 0 && videoId && (
        <div className="my-8 flex justify-center">
          <iframe
            width="900"
            height="506"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-xl shadow-2xl"
          ></iframe>
        </div>
      )}
      
      {/* Hiển thị dãy mondai nếu có mondaiCount > 0 */}
      {mondaiCount > 0 && (
        <div className="my-6">
          <h2 className="text-xl font-bold mb-4 text-center">Chọn Mondai để xem câu hỏi:</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            {Array.from({ length: mondaiCount }).map((_, idx) => (
              <button
                key={idx + 1}
                onClick={() => handleMondaiClick(idx + 1)}
                className={`px-6 py-3 rounded-lg border-2 transition-all duration-200 ${
                  selectedMondai === idx + 1 
                    ? 'bg-red-600 text-white border-red-600 shadow-lg' 
                    : 'bg-white text-gray-800 border-gray-300 hover:border-red-400 hover:shadow-md'
                }`}
              >
                Mondai {idx + 1}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Hiển thị câu hỏi của mondai đã chọn */}
      {selectedMondai && mondaiQuestions[selectedMondai] && mondaiQuestions[selectedMondai].length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Câu hỏi Mondai {selectedMondai}</h2>
          <div className="space-y-6">
            {mondaiQuestions[selectedMondai].map((question, idx) => {
              const selected = selectedOptions[question.id] ?? null;
              const correctIdx = question.correctAnswer ? parseInt(question.correctAnswer, 10) - 1 : null;
              const show = showAnswers[question.id];
              const detailsOpen = openDetails[question.id] || false;
              return (
                <Card key={question.id || idx} className="shadow-md">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold mb-2">
                        Câu {idx + 1}: {question.question}
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          className="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 border border-gray-300 text-gray-700 transition-all"
                          onClick={() => setOpenDetails(prev => ({ ...prev, [question.id]: !detailsOpen }))}
                          type="button"
                        >
                          {detailsOpen ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                        </button>
                        {question.options.length === 4 && (
                          <button
                            className="px-2 py-1 text-xs rounded bg-blue-200 hover:bg-blue-300 border border-blue-300 text-blue-700 transition-all disabled:opacity-60"
                            onClick={() => handleRefreshQuestion(selectedMondai!, idx, question)}
                            disabled={refreshing[question.id]}
                            type="button"
                          >
                            {refreshing[question.id] ? 'Đang tạo lại...' : 'Tạo lại câu hỏi'}
                          </button>
                        )}
                      </div>
                    </div>
                    {detailsOpen && (
                      <div className="mb-4 p-3 rounded bg-gray-50 border border-gray-200 text-sm">
                        {question.introduction && (
                          <div className="mb-2">
                            <span className="font-semibold text-gray-700">Giới thiệu:</span>
                            <span className="ml-2 text-gray-900">{question.introduction}</span>
                          </div>
                        )}
                        {question.conversation && (
                          <div>
                            <span className="font-semibold text-gray-700">Hội thoại:</span>
                            <div className="ml-2 text-gray-900 whitespace-pre-line">{question.conversation}</div>
                          </div>
                        )}
                      </div>
                    )}
                    {question.options && question.options.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Các lựa chọn:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {question.options.map((option, i) => {
                            const isSelected = selected === i;
                            const isCorrect = correctIdx === i;
                            const show = showAnswers[question.id];
                            return (
                              <button
                                key={i}
                                className={`w-full px-4 py-2 rounded-lg border text-left transition-all duration-200 font-medium
                                  ${isSelected ? (isCorrect ? 'bg-green-500 text-white border-green-600' : 'bg-red-500 text-white border-red-600') : ''}
                                  ${show && isCorrect ? 'border-2 border-green-600 bg-green-100 text-green-900' : ''}
                                  ${!isSelected && !show ? 'bg-white text-gray-800 border-gray-300 hover:border-blue-400 hover:shadow-md' : ''}
                                  ${show && !isCorrect ? 'opacity-60' : ''}
                                `}
                                disabled={show}
                                onClick={() => {
                                  if (show) return;
                                  setSelectedOptions(prev => ({ ...prev, [question.id]: i }));
                                  setShowAnswers(prev => ({ ...prev, [question.id]: true }));
                                }}
                              >
                                <span className="font-bold mr-2">{i + 1}.</span> {option}
                              </button>
                            );
                          })}
                        </div>
                        {/* Feedback */}
                        {showAnswers[question.id] && (
                          <div className="mt-3">
                            {selected === correctIdx ? (
                              <span className="text-green-700 font-semibold">Đáp án đúng!</span>
                            ) : (
                              <span className="text-red-700 font-semibold">Sai, đáp án đúng là <span className="underline">{correctIdx !== null ? `${correctIdx + 1}. ${question.options[correctIdx]}` : ''}</span></span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Hiển thị thông báo khi chưa có câu hỏi */}
      {selectedMondai && (!mondaiQuestions[selectedMondai] || mondaiQuestions[selectedMondai].length === 0) && !loading && (
        <div className="mt-8 text-center text-gray-500">
          <p>Không có câu hỏi nào cho Mondai {selectedMondai}</p>
        </div>
      )}
    </div>
  );
};

export default YouTubeListening; 