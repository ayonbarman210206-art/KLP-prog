export type QuestionStatus = 'not_started' | 'practicing' | 'completed';

export type DifficultyLevel = 1 | 2 | 3; // 1: Beginner, 2: Practice, 3: Real Interview

export interface Keyword {
  korean: string;
  romanization: string;
  banglaPronunciation: string;
  banglaMeaning: string;
  englishMeaning: string;
}

export interface InterviewQuestion {
  id: number;
  category: string;
  topicTitle: string;
  koreanQuestion: string;
  romanization: string;
  banglaPronunciation: string;
  banglaMeaning: string;
  englishMeaning: string;
  koreanAnswer: string;
  answerRomanization: string;
  answerBanglaPronunciation: string;
  answerBanglaMeaning: string;
  answerEnglishMeaning: string;
  keywords: Keyword[];
  interviewTip?: string;
}

export interface InterviewGreeting {
  korean: string;
  romanization: string;
  banglaPronunciation: string;
  banglaMeaning: string;
  englishMeaning: string;
  whenToUse: string;
  etiquetteTip: string;
}

export interface SelfIntroVersion {
  id: 'short' | 'standard' | 'advanced';
  title: string;
  duration: string;
  targetTimeSeconds: number;
  koreanText: string;
  romanization: string;
  banglaPronunciation: string;
  banglaMeaning: string;
  englishMeaning: string;
  tips: string[];
}

export interface PracticeAttempt {
  questionId: number;
  date: string;
  userTranscript: string;
  similarityScore: number;
  matchedKeywords: string[];
  missedKeywords: string[];
  durationSeconds: number;
}

export interface MockInterviewResult {
  id: string;
  date: string;
  totalQuestions: number;
  attempted: number;
  skipped: number;
  avgSimilarityScore: number;
  avgKeywordCoverage: number;
  overallScore: number;
  strongQuestionIds: number[];
  weakQuestionIds: number[];
  questionScores: {
    questionId: number;
    score: number;
    transcript: string;
    matchedKeywords: string[];
  }[];
}

export interface StudentProfile {
  name: string;
  nationality: string;
  targetUniversity: string;
  targetProgram: string;
  family: {
    count: number;
    members: {
      relation: string;
      occupation: string;
      koreanRelation: string;
      koreanOccupation: string;
    }[];
  };
}
