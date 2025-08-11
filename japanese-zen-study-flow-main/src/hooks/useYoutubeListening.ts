import { useState } from 'react';

export interface Question {
  id: number;
  introduction: string;
  conversation: string;
  question: string;
  options: string[];
  correctAnswer?: string;
}

export interface Mondai {
  id: number;
  title: string;
  description?: string;
  questions: Question[];
  startTime: string;
  endTime: string;
}

export interface VideoData {
  title: string;
  url: string;
  videoId: string;
  duration: string;
  level: string;
  mondais: Mondai[];
  totalQuestions: number;
}

// Utility function để gọi API với error handling
const apiCall = async (endpoint: string, body: any, contentType: string = 'application/json') => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body: contentType === 'application/json' ? JSON.stringify(body) : body,
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${await response.text()}`);
  }
  
  return response;
};

// Utility function để extract video ID
const extractVideoId = (url: string): string => {
  const videoIdMatch = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return videoIdMatch ? videoIdMatch[1] : '';
};

// Parse text backend trả về thành mảng Question
export function parseQuestionsFromText(text: string): Question[] {
  const questionBlocks = text.split(/<question>/g).slice(1);
  const questions: Question[] = [];
  
  questionBlocks.forEach((block, idx) => {
    const endIdx = block.indexOf('</question>');
    const content = endIdx !== -1 ? block.slice(0, endIdx) : block;
    
    // Improved field extraction with better error handling
    const getField = (label: string): string => {
      if (label === 'Conversation') {
        const match = content.match(
          /Conversation:\s*([\s\S]*?)(?=\n\s*Question:)/m
        );
        return match ? match[1].trim() : '';
      } else {
        try {
          const pattern = new RegExp(
            `${label}:\\s*([\\s\\S]*?)(?=\\n?\\s*(?:Introduction|Conversation|Question|Options):|<\/question>|$)`,
            'm'
          );
          const match = content.match(pattern);
          return match ? match[1].trim() : '';
        } catch (error) {
          console.warn(`Error parsing field ${label}:`, error);
          return '';
        }
      }
    };
    
    const introduction = getField('Introduction');
    const conversation = getField('Conversation');
    const questionText = getField('Question');
    
    // Improved options parsing
    const optionsMatch = content.match(/Options:\s*([\s\S]*)/m);
    let options: string[] = [];
    if (optionsMatch) {
      // Split lines, filter only lines that look like options, and stop at CorrectAnswer or any non-option line
      const lines = optionsMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      options = [];
      for (const line of lines) {
        if (/^CorrectAnswer:/i.test(line)) break;
        if (/^[1-4]\./.test(line) || /^[1-4]$/.test(line)) {
          options.push(line.replace(/^[1-4]\.?\s*/, '').trim());
        }
        // Only allow up to 4 options
        if (options.length === 4) break;
      }
    }
    
    // CorrectAnswer parsing
    const correctAnswerMatch = content.match(/CorrectAnswer:\s*([1-4])/);
    let correctAnswer: string | undefined = undefined;
    if (correctAnswerMatch) {
      correctAnswer = correctAnswerMatch[1];
    }
    
    // Only add valid questions
    if (questionText && questionText.length > 0) {
      // Nếu là câu hỏi 3 option
      if (options.length === 3) {
        let intro = introduction;
        // Nếu introduction chứa '番', chỉ lấy phần sau ký tự '番'
        const pos = intro.indexOf('番');
        if (pos !== -1 && pos + 1 < intro.length) {
          intro = intro.slice(pos + 1).trim();
        }
        questions.push({
          id: questions.length + 1,
          introduction: intro,
          conversation: '',
          question: questionText,
          options,
          correctAnswer,
        });
      } else {
        questions.push({
          id: questions.length + 1,
          introduction,
          conversation,
          question: questionText,
          options,
          correctAnswer,
        });
      }
      
      console.log(`Parsed question ${questions.length}:`, { 
        introduction: introduction.substring(0, 50) + '...', 
        conversation: conversation.substring(0, 50) + '...', 
        questionText: questionText.substring(0, 50) + '...', 
        optionsCount: options.length 
      });
    }
  });
  
  return questions;
}

export function useYoutubeListening(options?: { setSectionFiles?: (files: string[]) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [mondaiCount, setMondaiCount] = useState<number>(0);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Hàm gọi backend để lấy transcript, split, structure, index và trả về dữ liệu
  const analyzeYoutubeVideo = async (youtubeUrl: string, sectionNums?: number[]) => {
    setLoading(true);
    setError(null);
    setVideoData(null);
    
    try {
      // 1. Lấy transcript
      await apiCall('/api/listening/get_transcript', youtubeUrl, 'text/plain');
      
      // 2. Split transcript
      const splitResponse = await apiCall('/api/listening/split_transcript', { youtube_url: youtubeUrl });
      const splitData = await splitResponse.json();
      
      const validSections = (splitData.sections_saved || []).filter((f: string) => /_section\d+\.txt$/.test(f));
      console.log('Valid sections found:', validSections.length);
      
      // 3. Structure từng section và index
      const mondais: Mondai[] = [];
      let totalQuestions = 0;
      
      for (let i = 0; i < validSections.length; i++) {
        const sectionNum = i + 1;
        console.log(`Processing section ${sectionNum}/${validSections.length}`);
        
        try {
          // Structure section
          const structureResponse = await apiCall('/api/listening/structure_section', { 
            youtube_url: youtubeUrl, 
            section_num: sectionNum 
          });
          const structureData = await structureResponse.json();
          
          // Index questions (fire and forget)
          apiCall('/api/listening/index_questions', { 
            youtube_url: youtubeUrl, 
            section_num: sectionNum 
          }).catch(err => console.warn(`Index questions failed for section ${sectionNum}:`, err));
          
          // Parse questions từ structureData.content
          const questions: Question[] = parseQuestionsFromText(structureData.content);
          
          mondais.push({
            id: sectionNum,
            title: `Mondai ${sectionNum}`,
            description: `Section ${sectionNum} questions`,
            questions,
            startTime: '',
            endTime: '',
          });
          
          totalQuestions += questions.length;
          console.log(`Section ${sectionNum} completed: ${questions.length} questions`);
          
        } catch (sectionError) {
          console.error(`Failed to process section ${sectionNum}:`, sectionError);
          // Continue with other sections instead of failing completely
        }
      }
      
      console.log(`Total mondais processed: ${mondais.length}, Total questions: ${totalQuestions}`);
      
      const videoId = extractVideoId(youtubeUrl);
      setVideoData({
        title: 'YouTube JLPT Listening',
        url: youtubeUrl,
        videoId,
        duration: '',
        level: '',
        mondais,
        totalQuestions,
      });
      
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi không xác định';
      setError(errorMessage);
      console.error('YouTube analysis failed:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Chỉ split transcript, trả về số mondai (section)
  const splitTranscript = async (youtubeUrl: string) => {
    setLoading(true);
    setError(null);
    setMondaiCount(0);
    setQuestions([]);
    
    try {
      // 1. Lấy transcript
      await apiCall('/api/listening/get_transcript', youtubeUrl, 'text/plain');
      
      // 2. Split transcript
      const response = await apiCall('/api/listening/split_transcript', { youtube_url: youtubeUrl });
      const data = await response.json();
      
      // Lọc chỉ lấy các file section thực sự tồn tại và đúng định dạng
      const sectionNums = (data.sections_saved || [])
        .map((f: string) => {
          const match = f.match(/_section(\d+)\.txt$/);
          return match ? parseInt(match[1], 10) : null;
        })
        .filter((n) => n !== null);
      
      const maxSection = sectionNums.length > 0 ? Math.max(...sectionNums) : 0;
      setMondaiCount(maxSection);
      
      if (options?.setSectionFiles) {
        options.setSectionFiles(data.sections_saved || []);
      }
      
      console.log(`Split transcript completed: ${maxSection} sections found`);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi không xác định';
      setError(errorMessage);
      console.error('Split transcript failed:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Khi chọn mondai, gửi section cho LLM, trả về câu hỏi/options
  const analyzeSection = async (youtubeUrl: string, sectionNum: number): Promise<Question[]> => {
    setLoading(true);
    setError(null);
    setQuestions([]);
    
    try {
      // Structure section
      const response = await apiCall('/api/listening/structure_section', { 
        youtube_url: youtubeUrl, 
        section_num: sectionNum 
      });
      const structureData = await response.json();
      
      // Index questions (fire and forget)
      apiCall('/api/listening/index_questions', { 
        youtube_url: youtubeUrl, 
        section_num: sectionNum 
      }).catch(err => console.warn(`Index questions failed for section ${sectionNum}:`, err));
      
      // Parse questions từ structureData.content
      const questions: Question[] = parseQuestionsFromText(structureData.content);
      setQuestions(questions);
      
      console.log(`Section ${sectionNum} analysis completed: ${questions.length} questions`);
      return questions;
      
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi không xác định';
      setError(errorMessage);
      console.error(`Section ${sectionNum} analysis failed:`, errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { 
    loading, 
    error, 
    videoData, 
    analyzeYoutubeVideo, 
    mondaiCount, 
    questions, 
    splitTranscript, 
    analyzeSection, 
    isProcessing: loading 
  };
}

export async function generateQuestionFromConversation(conversation: string): Promise<Question | null> {
  try {
    const resp = await fetch('/api/listening/generate_question_from_conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation }),
    });
    if (!resp.ok) throw new Error(await resp.text());
    const data = await resp.json();
    if (!data.success || !data.question) return null;
    const q = data.question;
    // Chuẩn hóa về Question interface
    return {
      id: 1,
      introduction: q.Introduction || '',
      conversation: q.Conversation || '',
      question: q.Question || '',
      options: q.Options || [],
      correctAnswer: q.CorrectAnswer || undefined,
    };
  } catch (err) {
    console.error('generateQuestionFromConversation error:', err);
    return null;
  }
} 