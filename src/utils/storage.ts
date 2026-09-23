import { MockInterviewResult, PracticeAttempt, QuestionStatus } from '../types';

const STORAGE_KEYS = {
  STATUSES: 'konyang_klp_question_statuses',
  ATTEMPTS: 'konyang_klp_practice_attempts',
  MOCKS: 'konyang_klp_mock_results',
  STREAK: 'konyang_klp_streak_info',
  SETTINGS: 'konyang_klp_settings',
  TODAY: 'konyang_klp_today_practice'
};

export interface AppSettings {
  speechSpeed: number;
  slowKorean: boolean;
  hideTranslation: boolean;
  preferredDifficulty: 1 | 2 | 3;
}

export interface StreakInfo {
  currentStreak: number;
  lastPracticeDate: string;
  totalPracticeDays: number;
}

export interface TodayPracticeState {
  date: string;
  questionIds: number[];
  completedQuestionIds: number[];
  isCompleted: boolean;
}

export const getStoredStatuses = (): Record<number, QuestionStatus> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATUSES);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
};

export const saveQuestionStatus = (questionId: number, status: QuestionStatus): void => {
  try {
    const current = getStoredStatuses();
    current[questionId] = status;
    localStorage.setItem(STORAGE_KEYS.STATUSES, JSON.stringify(current));
    updateStreak();
  } catch (e) {
    console.error('Failed to save status', e);
  }
};

export const getStoredAttempts = (): PracticeAttempt[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
};

export const savePracticeAttempt = (attempt: PracticeAttempt): void => {
  try {
    const list = getStoredAttempts();
    list.unshift(attempt);
    // Keep last 100
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(list.slice(0, 100)));
    
    // Auto update status if score >= 65 to 'completed', else 'practicing'
    const currentStatus = getStoredStatuses()[attempt.questionId];
    if (attempt.similarityScore >= 65 || (attempt.matchedKeywords.length >= 2)) {
      saveQuestionStatus(attempt.questionId, 'completed');
    } else if (currentStatus !== 'completed') {
      saveQuestionStatus(attempt.questionId, 'practicing');
    }
  } catch (e) {
    console.error('Failed to save attempt', e);
  }
};

export const getStoredMocks = (): MockInterviewResult[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MOCKS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
};

export const saveMockInterviewResult = (res: MockInterviewResult): void => {
  try {
    const list = getStoredMocks();
    list.unshift(res);
    localStorage.setItem(STORAGE_KEYS.MOCKS, JSON.stringify(list.slice(0, 50)));
    updateStreak();
  } catch (e) {
    console.error('Failed to save mock result', e);
  }
};

export const getStreakInfo = (): StreakInfo => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STREAK);
    if (!raw) {
      return { currentStreak: 1, lastPracticeDate: new Date().toISOString().split('T')[0], totalPracticeDays: 1 };
    }
    return JSON.parse(raw);
  } catch (e) {
    return { currentStreak: 1, lastPracticeDate: new Date().toISOString().split('T')[0], totalPracticeDays: 1 };
  }
};

export const updateStreak = (): StreakInfo => {
  const today = new Date().toISOString().split('T')[0];
  const info = getStreakInfo();

  if (info.lastPracticeDate === today) {
    return info;
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (info.lastPracticeDate === yesterday) {
    info.currentStreak += 1;
  } else {
    info.currentStreak = 1;
  }

  info.lastPracticeDate = today;
  info.totalPracticeDays += 1;

  try {
    localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(info));
  } catch (e) {
    // ignore
  }
  return info;
};

export const getAppSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      return {
        speechSpeed: 1.0,
        slowKorean: false,
        hideTranslation: false,
        preferredDifficulty: 1
      };
    }
    return JSON.parse(raw);
  } catch (e) {
    return {
      speechSpeed: 1.0,
      slowKorean: false,
      hideTranslation: false,
      preferredDifficulty: 1
    };
  }
};

export const saveAppSettings = (settings: Partial<AppSettings>): AppSettings => {
  const current = getAppSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  } catch (e) {
    // ignore
  }
  return updated;
};

// Daily Practice Management (5 questions per day)
export const getTodayPractice = (totalQuestionsCount: number = 25): TodayPracticeState => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TODAY);
    if (raw) {
      const parsed: TodayPracticeState = JSON.parse(raw);
      if (parsed.date === today) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }

  // Generate 5 questions for today using date hash
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const selected: number[] = [];
  for (let i = 0; i < 5; i++) {
    const qId = ((dayOfYear * 3 + i * 5) % totalQuestionsCount) + 1;
    if (!selected.includes(qId)) {
      selected.push(qId);
    }
  }
  while (selected.length < 5) {
    const fallback = (selected.length + 1);
    if (!selected.includes(fallback)) selected.push(fallback);
  }

  const newState: TodayPracticeState = {
    date: today,
    questionIds: selected,
    completedQuestionIds: [],
    isCompleted: false
  };

  try {
    localStorage.setItem(STORAGE_KEYS.TODAY, JSON.stringify(newState));
  } catch (e) {
    // ignore
  }
  return newState;
};

export const markTodayQuestionCompleted = (questionId: number): TodayPracticeState => {
  const current = getTodayPractice();
  if (current.questionIds.includes(questionId) && !current.completedQuestionIds.includes(questionId)) {
    current.completedQuestionIds.push(questionId);
    if (current.completedQuestionIds.length >= current.questionIds.length) {
      current.isCompleted = true;
    }
    try {
      localStorage.setItem(STORAGE_KEYS.TODAY, JSON.stringify(current));
    } catch (e) {
      // ignore
    }
  }
  return current;
};
