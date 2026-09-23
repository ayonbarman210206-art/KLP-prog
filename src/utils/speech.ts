import { Keyword } from '../types';

// Speech Synthesis (TTS)
export const isSpeechSynthesisSupported = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

let currentUtterance: SpeechSynthesisUtterance | null = null;

export const playKoreanSpeech = (
  text: string,
  speed: number = 1.0,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): boolean => {
  if (!isSpeechSynthesisSupported()) {
    onError?.('Speech Synthesis is not supported in this browser.');
    return false;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any currently playing audio

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = Math.max(0.5, Math.min(2.0, speed));
    utterance.pitch = 1.0;

    // Pick best available Korean voice if available
    const voices = window.speechSynthesis.getVoices();
    const koreanVoice = voices.find(v => v.lang.includes('ko') || v.lang.includes('KR'));
    if (koreanVoice) {
      utterance.voice = koreanVoice;
    }

    utterance.onstart = () => onStart?.();
    utterance.onend = () => {
      currentUtterance = null;
      onEnd?.();
    };
    utterance.onerror = (e) => {
      currentUtterance = null;
      onError?.(e);
    };

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (error) {
    onError?.(error);
    return false;
  }
};

export const stopKoreanSpeech = (): void => {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
};

// Speech Recognition (STT)
export interface SpeechRecognitionResultState {
  transcript: string;
  isFinal: boolean;
  error?: string;
}

export const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  const win = window as any;
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
};

export class KoreanSpeechRecognizer {
  private recognition: any = null;
  private isListening: boolean = false;
  private onResultCallback: ((state: SpeechRecognitionResultState) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onEndCallback: (() => void) | null = null;

  constructor() {
    if (isSpeechRecognitionSupported()) {
      const win = window as any;
      const SpeechRecognitionConstructor = win.SpeechRecognition || win.webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionConstructor();
      this.recognition.lang = 'ko-KR';
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece;
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        const combined = (finalTranscript || interimTranscript).trim();
        if (this.onResultCallback && combined) {
          this.onResultCallback({
            transcript: combined,
            isFinal: Boolean(finalTranscript && !interimTranscript)
          });
        }
      };

      this.recognition.onerror = (event: any) => {
        let msg = 'Speech recognition error';
        if (event.error === 'not-allowed') {
          msg = 'মাইক্রোফোনের অনুমতি দেওয়া হয়নি (Microphone permission denied). অনুগ্রহ করে ব্রাউজার সেটিংসে মাইক্রোফোন অ্যাক্সেস চালু করুন।';
        } else if (event.error === 'no-speech') {
          msg = 'কোনো শব্দ শোনা যায়নি (No speech detected). আবার স্পষ্ট করে বলুন।';
        } else if (event.error === 'network') {
          msg = 'ইন্টারনেট সংযোগ যাচাই করুন (Network error in voice recognition).';
        } else {
          msg = `ভয়েস ত্রুটি: ${event.error || 'অজানা ত্রুটি'}`;
        }
        this.onErrorCallback?.(msg);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.onEndCallback?.();
      };
    }
  }

  public start(
    onResult: (state: SpeechRecognitionResultState) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): boolean {
    if (!this.recognition) {
      onError('আপনার ব্রাউজারে স্পিচ রিকগনিশন (SpeechRecognition) ফিচারটি সরাসরি সমর্থিত নয়। ক্রোম (Google Chrome) ব্রাউজার ব্যবহার করুন অথবা নিচে লিখে উত্তর দিন।');
      return false;
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onEndCallback = onEnd;

    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (e) {
      // If already started, restart
      try {
        this.recognition.stop();
        setTimeout(() => {
          this.recognition.start();
          this.isListening = true;
        }, 100);
        return true;
      } catch (err: any) {
        onError(`স্পিচ চালু করা যায়নি: ${err?.message || 'অনুগ্রহ করে আবার চেষ্টা করুন'}`);
        return false;
      }
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.isListening = false;
    }
  }

  public getStatus(): boolean {
    return this.isListening;
  }
}

// Answer Similarity & Keyword Evaluator
export interface AnswerEvaluation {
  similarityScore: number;       // 0 to 100
  keywordScore: number;          // 0 to 100
  overallScore: number;          // 0 to 100
  matchedKeywords: string[];
  missedKeywords: string[];
  feedbackBn: string;
  feedbackEn: string;
  grade: 'Excellent' | 'Good' | 'Needs Practice';
}

// Clean and normalize Korean text by removing spaces and punctuation
const normalizeKorean = (text: string): string => {
  return text
    .replace(/[.,?!~'"·]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();
};

export const evaluateAnswer = (
  userTranscript: string,
  modelAnswer: string,
  keywords: Keyword[]
): AnswerEvaluation => {
  if (!userTranscript || userTranscript.trim().length === 0) {
    return {
      similarityScore: 0,
      keywordScore: 0,
      overallScore: 0,
      matchedKeywords: [],
      missedKeywords: keywords.map(k => k.korean),
      feedbackBn: 'কোনো উত্তর রেকর্ড হয়নি। অনুগ্রহ করে মাইক্রোফোন অন করে আবার বলুন।',
      feedbackEn: 'No answer was recorded. Please speak clearly using the microphone.',
      grade: 'Needs Practice'
    };
  }

  const cleanUser = normalizeKorean(userTranscript);
  const cleanModel = normalizeKorean(modelAnswer);

  // 1. Keyword coverage check
  const matchedKeywords: string[] = [];
  const missedKeywords: string[] = [];

  keywords.forEach(kw => {
    const cleanKw = normalizeKorean(kw.korean);
    if (cleanUser.includes(cleanKw)) {
      matchedKeywords.push(kw.korean);
    } else {
      // Check partial/root match if keyword is 2+ chars
      let partialMatch = false;
      if (cleanKw.length >= 2) {
        const root = cleanKw.slice(0, 2);
        if (cleanUser.includes(root)) {
          matchedKeywords.push(kw.korean);
          partialMatch = true;
        }
      }
      if (!partialMatch) {
        missedKeywords.push(kw.korean);
      }
    }
  });

  const keywordScore = keywords.length > 0 
    ? Math.round((matchedKeywords.length / keywords.length) * 100)
    : 100;

  // 2. Character bi-gram overlap similarity
  const getBigrams = (str: string): Set<string> => {
    const bigrams = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.slice(i, i + 2));
    }
    return bigrams;
  };

  const userBigrams = getBigrams(cleanUser);
  const modelBigrams = getBigrams(cleanModel);

  let intersectionCount = 0;
  userBigrams.forEach(bg => {
    if (modelBigrams.has(bg)) {
      intersectionCount++;
    }
  });

  const totalPossible = Math.max(1, Math.min(modelBigrams.size, userBigrams.size));
  const rawSimilarity = Math.round((intersectionCount / totalPossible) * 100);
  const similarityScore = Math.min(100, Math.max(0, rawSimilarity));

  // 3. Combined Overall Score (Weighted: 50% keyword coverage, 50% phrase similarity)
  const overallScore = Math.round(keywordScore * 0.5 + similarityScore * 0.5);

  let grade: 'Excellent' | 'Good' | 'Needs Practice' = 'Needs Practice';
  let feedbackBn = '';
  let feedbackEn = '';

  if (overallScore >= 75) {
    grade = 'Excellent';
    feedbackBn = `অসাধারণ প্রস্তুতি! প্রয়োজনীয় মূল শব্দগুলোর (${matchedKeywords.length}/${keywords.length}) অধিকাংশই আপনি নির্ভুলভাবে উচ্চারণ করেছেন। ইন্টারভিউতে এভাবেই আত্মবিশ্বাসের সাথে উত্তর দিন।`;
    feedbackEn = `Excellent practice! You accurately pronounced most key vocabulary (${matchedKeywords.length}/${keywords.length}). Speak with this confidence in the real interview!`;
  } else if (overallScore >= 45) {
    grade = 'Good';
    feedbackBn = `ভালো প্রচেষ্টা! আপনার মূল বক্তব্য স্পষ্ট হয়েছে। বাদ পড়া শব্দগুলো (${missedKeywords.slice(0, 3).join(', ')}) অন্তর্ভুক্ত করে আরও একবার অনুশীলন করুন।`;
    feedbackEn = `Good attempt! The main idea was conveyed. Try repeating with the missed keywords (${missedKeywords.slice(0, 3).join(', ')}).`;
  } else {
    grade = 'Needs Practice';
    feedbackBn = `আরও কিছুটা অনুশীলনের প্রয়োজন। মডেল অ্যান্সারটি 'Listen' বাটনে ক্লিক করে ২-৩ বার শুনুন এবং বাংলা উচ্চারণ দেখে আবার বলুন।`;
    feedbackEn = `Needs more practice. Listen to the model answer 2-3 times, check the pronunciation guide, and try speaking again.`;
  }

  return {
    similarityScore,
    keywordScore,
    overallScore,
    matchedKeywords,
    missedKeywords,
    feedbackBn,
    feedbackEn,
    grade
  };
};
