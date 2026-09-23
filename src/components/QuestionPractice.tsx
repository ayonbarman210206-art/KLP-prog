import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  Mic, 
  Square, 
  RotateCcw, 
  CheckCircle, 
  Shuffle, 
  Eye, 
  EyeOff, 
  Brain, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Award, 
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
  List,
  Edit3
} from 'lucide-react';
import { INTERVIEW_QUESTIONS } from '../data/questions';
import { InterviewQuestion, Keyword, QuestionStatus, DifficultyLevel } from '../types';
import { 
  playKoreanSpeech, 
  stopKoreanSpeech, 
  KoreanSpeechRecognizer, 
  evaluateAnswer, 
  AnswerEvaluation, 
  isSpeechRecognitionSupported 
} from '../utils/speech';
import { 
  getStoredStatuses, 
  saveQuestionStatus, 
  savePracticeAttempt, 
  AppSettings,
  markTodayQuestionCompleted 
} from '../utils/storage';

interface QuestionPracticeProps {
  currentQuestionId: number;
  onSelectQuestion: (id: number) => void;
  settings: AppSettings;
  onUpdateSettings: (s: Partial<AppSettings>) => void;
}

export const QuestionPractice: React.FC<QuestionPracticeProps> = ({
  currentQuestionId,
  onSelectQuestion,
  settings,
  onUpdateSettings
}) => {
  const currentQuestion = INTERVIEW_QUESTIONS.find(q => q.id === currentQuestionId) || INTERVIEW_QUESTIONS[0];

  // States
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(settings.preferredDifficulty || 1);
  const [activePracticeTab, setActivePracticeTab] = useState<'model' | 'record'>('model');
  const [hideTranslation, setHideTranslation] = useState<boolean>(settings.hideTranslation);
  const [memoryMode, setMemoryMode] = useState<boolean>(false);
  const [memoryStep, setMemoryStep] = useState<number>(1); // 1: Question, 2: Reveal Answer, 3: Reveal Vocab & Meaning
  const [isQuestionListOpen, setIsQuestionListOpen] = useState<boolean>(false);

  // Audio / TTS state
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [activeSpeechSpeed, setActiveSpeechSpeed] = useState<number>(settings.speechSpeed || 1.0);
  const [slowKoreanMode, setSlowKoreanMode] = useState<boolean>(settings.slowKorean || false);

  // Speech Recognition & Recording states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recognizedTranscript, setRecognizedTranscript] = useState<string>('');
  const [manualInputFallback, setManualInputFallback] = useState<string>('');
  const [isManualInputActive, setIsManualInputActive] = useState<boolean>(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);

  // Statuses
  const [statuses, setStatuses] = useState<Record<number, QuestionStatus>>(getStoredStatuses());
  const recognizerRef = useRef<KoreanSpeechRecognizer | null>(null);

  // Initialize Speech Recognizer
  useEffect(() => {
    recognizerRef.current = new KoreanSpeechRecognizer();
    return () => {
      stopKoreanSpeech();
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
    };
  }, []);

  // Reset state when question changes
  useEffect(() => {
    stopKoreanSpeech();
    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }
    setIsRecording(false);
    setRecognizedTranscript('');
    setManualInputFallback('');
    setRecordingError(null);
    setEvaluation(null);
    setMemoryStep(1);
    setStatuses(getStoredStatuses());
  }, [currentQuestionId]);

  // Audio helper
  const handlePlayKorean = (text: string, speedOverride?: number) => {
    stopKoreanSpeech();
    setIsPlayingAudio(true);
    const speed = speedOverride !== undefined ? speedOverride : (slowKoreanMode ? 0.65 : activeSpeechSpeed);
    playKoreanSpeech(
      text,
      speed,
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false),
      (err) => {
        setIsPlayingAudio(false);
        console.warn('Audio playback error', err);
      }
    );
  };

  // Start Voice Recording
  const handleStartRecording = () => {
    if (!recognizerRef.current) return;
    setRecordingError(null);
    setRecognizedTranscript('');
    setEvaluation(null);

    const started = recognizerRef.current.start(
      (state) => {
        setRecognizedTranscript(state.transcript);
      },
      (errorMsg) => {
        setRecordingError(errorMsg);
        setIsRecording(false);
      },
      () => {
        setIsRecording(false);
      }
    );

    if (started) {
      setIsRecording(true);
      setActivePracticeTab('record');
    }
  };

  // Stop Recording and Evaluate
  const handleStopRecording = () => {
    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }
    setIsRecording(false);

    const textToEvaluate = (recognizedTranscript || manualInputFallback).trim();
    if (textToEvaluate) {
      const evalResult = evaluateAnswer(textToEvaluate, currentQuestion.koreanAnswer, currentQuestion.keywords);
      setEvaluation(evalResult);

      // Save attempt & update status
      savePracticeAttempt({
        questionId: currentQuestion.id,
        date: new Date().toISOString(),
        userTranscript: textToEvaluate,
        similarityScore: evalResult.overallScore,
        matchedKeywords: evalResult.matchedKeywords,
        missedKeywords: evalResult.missedKeywords,
        durationSeconds: 15
      });
      markTodayQuestionCompleted(currentQuestion.id);
      setStatuses(getStoredStatuses());
    }
  };

  // Manual fallback evaluate
  const handleManualEvaluate = () => {
    if (!manualInputFallback.trim()) return;
    const evalResult = evaluateAnswer(manualInputFallback.trim(), currentQuestion.koreanAnswer, currentQuestion.keywords);
    setEvaluation(evalResult);
    savePracticeAttempt({
      questionId: currentQuestion.id,
      date: new Date().toISOString(),
      userTranscript: manualInputFallback.trim(),
      similarityScore: evalResult.overallScore,
      matchedKeywords: evalResult.matchedKeywords,
      missedKeywords: evalResult.missedKeywords,
      durationSeconds: 20
    });
    markTodayQuestionCompleted(currentQuestion.id);
    setStatuses(getStoredStatuses());
  };

  // Random Question Handler (no immediate repeat)
  const handleRandomQuestion = () => {
    const available = INTERVIEW_QUESTIONS.filter(q => q.id !== currentQuestion.id);
    const randomPick = available[Math.floor(Math.random() * available.length)];
    onSelectQuestion(randomPick.id);
  };

  // Navigation handlers
  const handlePrevQuestion = () => {
    const prevId = currentQuestion.id === 1 ? INTERVIEW_QUESTIONS.length : currentQuestion.id - 1;
    onSelectQuestion(prevId);
  };

  const handleNextQuestion = () => {
    const nextId = currentQuestion.id === INTERVIEW_QUESTIONS.length ? 1 : currentQuestion.id + 1;
    onSelectQuestion(nextId);
  };

  const toggleStatus = (targetStatus: QuestionStatus) => {
    saveQuestionStatus(currentQuestion.id, targetStatus);
    setStatuses(getStoredStatuses());
  };

  const currentStatus = statuses[currentQuestion.id] || 'not_started';

  return (
    <div className="space-y-6 pb-16">
      {/* Top Toolbar: Question Nav, Difficulty, Memory Mode */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Left: Previous, Question Picker, Next */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevQuestion}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="이전 질문 (Previous)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsQuestionListOpen(!isQuestionListOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold transition-colors"
          >
            <List className="w-4 h-4 text-blue-600" />
            <span>질문 {currentQuestion.id} / 25제</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-200/70 text-blue-800">
              {currentStatus === 'completed' ? '🟢 완료' : currentStatus === 'practicing' ? '🟡 연습중' : '⚪ 미시작'}
            </span>
          </button>

          <button
            onClick={handleNextQuestion}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="다음 질문 (Next)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleRandomQuestion}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            title="랜덤 질문 (Random Question)"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">랜덤</span>
          </button>
        </div>

        {/* Middle & Right: Difficulty, Translation Toggle, Memory Mode */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Difficulty Level Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => {
                setDifficulty(1);
                onUpdateSettings({ preferredDifficulty: 1 });
              }}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                difficulty === 1 ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              1단계: 초급
            </button>
            <button
              onClick={() => {
                setDifficulty(2);
                onUpdateSettings({ preferredDifficulty: 2 });
              }}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                difficulty === 2 ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              2단계: 연습
            </button>
            <button
              onClick={() => {
                setDifficulty(3);
                onUpdateSettings({ preferredDifficulty: 3 });
              }}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                difficulty === 3 ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              3단계: 실전
            </button>
          </div>

          {/* Hide Translation Button */}
          <button
            onClick={() => {
              const newVal = !hideTranslation;
              setHideTranslation(newVal);
              onUpdateSettings({ hideTranslation: newVal });
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              hideTranslation 
                ? 'bg-amber-50 text-amber-800 border-amber-300' 
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title="বাংলা অনুবাদ আড়াল করুন / দেখুন"
          >
            {hideTranslation ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{hideTranslation ? '번역 숨김' : '번역 보기'}</span>
          </button>

          {/* Memory Mode Toggle */}
          <button
            onClick={() => {
              setMemoryMode(!memoryMode);
              setMemoryStep(1);
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              memoryMode
                ? 'bg-purple-50 text-purple-700 border-purple-300 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-purple-600" />
            <span>암기 모드 (Memory)</span>
          </button>
        </div>
      </div>

      {/* Question Selector Modal/Drawer */}
      {isQuestionListOpen && (
        <div className="bg-white rounded-2xl border border-blue-200 p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 font-kr">
              건양대학교 KLP 25개 질문 목록 바로가기
            </span>
            <button
              onClick={() => setIsQuestionListOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              닫기 ✕
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
            {INTERVIEW_QUESTIONS.map(q => {
              const qStatus = statuses[q.id] || 'not_started';
              const isSelected = q.id === currentQuestion.id;
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    onSelectQuestion(q.id);
                    setIsQuestionListOpen(false);
                  }}
                  className={`p-2 rounded-xl text-left border text-xs transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span>Q{q.id}</span>
                    <span>{qStatus === 'completed' ? '🟢' : qStatus === 'practicing' ? '🟡' : '⚪'}</span>
                  </div>
                  <div className="truncate font-kr mt-1">
                    {q.koreanQuestion}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Question Display Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Category & Topic Title Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0f2b5c] text-white">
              Q{currentQuestion.id.toString().padStart(2, '0')}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {currentQuestion.category}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {currentQuestion.topicTitle}
            </span>
          </div>

          {/* Audio Controls for Question */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePlayKorean(currentQuestion.koreanQuestion)}
              disabled={isPlayingAudio}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isPlayingAudio 
                  ? 'bg-blue-200 text-blue-800 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs active:scale-98'
              }`}
            >
              <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
              <span>{isPlayingAudio ? '재생 중...' : '질문 듣기 (Listen)'}</span>
            </button>

            {/* Speed Quick Selector */}
            <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-1 text-[11px] font-semibold text-slate-600">
              <button 
                onClick={() => {
                  setSlowKoreanMode(false);
                  setActiveSpeechSpeed(0.75);
                }}
                className={`px-2 py-0.5 rounded-md ${activeSpeechSpeed === 0.75 && !slowKoreanMode ? 'bg-white text-blue-700 shadow-xs' : ''}`}
              >
                0.75x
              </button>
              <button 
                onClick={() => {
                  setSlowKoreanMode(false);
                  setActiveSpeechSpeed(1.0);
                }}
                className={`px-2 py-0.5 rounded-md ${activeSpeechSpeed === 1.0 && !slowKoreanMode ? 'bg-white text-blue-700 shadow-xs' : ''}`}
              >
                1.0x
              </button>
              <button 
                onClick={() => {
                  setSlowKoreanMode(false);
                  setActiveSpeechSpeed(1.25);
                }}
                className={`px-2 py-0.5 rounded-md ${activeSpeechSpeed === 1.25 && !slowKoreanMode ? 'bg-white text-blue-700 shadow-xs' : ''}`}
              >
                1.25x
              </button>
              <button 
                onClick={() => setSlowKoreanMode(!slowKoreanMode)}
                className={`px-2 py-0.5 rounded-md ${slowKoreanMode ? 'bg-amber-100 text-amber-800 font-bold' : ''}`}
                title="천천히 발음 (Slow Korean for beginners)"
              >
                Slow
              </button>
            </div>
          </div>
        </div>

        {/* Korean Question Text (A) */}
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Korean Question (면접관 질문)
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0f2b5c] font-kr leading-snug">
            {currentQuestion.koreanQuestion}
          </h2>
        </div>

        {/* Pronunciation & Meaning Sections (Levels & Translation Mode) */}
        {difficulty !== 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* English Pronunciation & Romanization (B) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
              <div className="text-[11px] font-bold text-slate-500">
                English Pronunciation / Romanization
              </div>
              <div className="text-sm font-semibold text-slate-800">
                {currentQuestion.romanization}
              </div>
            </div>

            {/* Authentic Bangla Pronunciation (C) */}
            {!hideTranslation && (
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 space-y-1">
                <div className="text-[11px] font-bold text-blue-700 font-bn">
                  সহজ বাংলা উচ্চারণ (Phonetic Korean in Bangla)
                </div>
                <div className="text-sm font-bold text-blue-950 font-bn">
                  {currentQuestion.banglaPronunciation}
                </div>
              </div>
            )}

            {/* Bangla Meaning (D) */}
            {!hideTranslation && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-1 md:col-span-2">
                <div className="text-[11px] font-bold text-emerald-800 font-bn">
                  প্রশ্নের বাংলা অর্থ (Bangla Meaning)
                </div>
                <div className="text-sm font-semibold text-emerald-950 font-bn">
                  {currentQuestion.banglaMeaning}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  <strong>English:</strong> {currentQuestion.englishMeaning}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Level 3 Notice */}
        {difficulty === 3 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 font-bn flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>실전 인터뷰 모드 (Level 3):</strong> 실제 대학 면접과 동일하게 한국어 질문 음성에만 집중하여 답변하세요. 발음 및 의미 힌트는 숨겨져 있습니다.
            </span>
          </div>
        )}

        {/* Memory Mode Stepper (if active) */}
        {memoryMode && (
          <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900 font-kr">
                🧠 암기 훈련 단계 (Memory Step: {memoryStep} / 3)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMemoryStep(Math.min(3, memoryStep + 1))}
                  disabled={memoryStep >= 3}
                  className="px-3 py-1 rounded-lg bg-purple-600 text-white text-xs font-bold disabled:opacity-50"
                >
                  {memoryStep === 1 ? '1단계: 모범답변 보기' : memoryStep === 2 ? '2단계: 어휘 및 해석 보기' : '완료'}
                </button>
                <button
                  onClick={() => setMemoryStep(1)}
                  className="p-1 rounded-lg text-purple-700 hover:bg-purple-100"
                  title="처음부터 다시"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-xs text-purple-800 font-bn">
              {memoryStep === 1 && "질문만 보고 머릿속으로 한국어 답변을 말해보세요. 준비되면 '모범답변 보기'를 누르세요."}
              {memoryStep === 2 && "모범 답변과 자신의 답변을 비교해보고, 발음을 확인하세요."}
              {memoryStep === 3 && "주요 어휘와 의미까지 완벽히 숙지했는지 최종 확인하세요."}
            </p>
          </div>
        )}
      </div>

      {/* Interactive Tabs: Mode A (Model Answer) vs Mode B (My Voice Answer) */}
      <div className="space-y-4">
        <div className="flex items-center border-b border-slate-200">
          <button
            onClick={() => setActivePracticeTab('model')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-bold transition-all ${
              activePracticeTab === 'model'
                ? 'border-blue-600 text-blue-700 bg-blue-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>MODE A: 모범 답변 (Model Answer)</span>
          </button>

          <button
            onClick={() => setActivePracticeTab('record')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-bold transition-all ${
              activePracticeTab === 'record'
                ? 'border-blue-600 text-blue-700 bg-blue-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mic className="w-4 h-4 text-rose-500" />
            <span>MODE B: 내 답변 녹음 & 평가 (My Answer)</span>
          </button>
        </div>

        {/* Tab Content A: Model Answer */}
        {activePracticeTab === 'model' && (!memoryMode || memoryStep >= 2) && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                  Suggested Korean Model Answer (권장 답변)
                </span>
                <span className="text-xs text-slate-500 font-bn">
                  কন্যং বিশ্ববিদ্যালয় ইন্টারভিউয়ের জন্য বিনম্র ও স্পষ্ট উত্তর
                </span>
              </div>

              {/* Speak Answer Button (P) */}
              <button
                onClick={() => handlePlayKorean(currentQuestion.koreanAnswer)}
                disabled={isPlayingAudio}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <Volume2 className="w-4 h-4" />
                <span>답변 발음 듣기 (Speak Answer)</span>
              </button>
            </div>

            {/* Korean Answer Text (F) */}
            <div className="bg-blue-50/40 rounded-xl p-4 border border-blue-100">
              <div className="text-lg sm:text-xl font-extrabold text-[#0f2b5c] font-kr leading-relaxed">
                {currentQuestion.koreanAnswer}
              </div>
            </div>

            {/* Pronunciation & Translations (G, H, I, J) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="text-[11px] font-bold text-slate-500 mb-1">
                  Answer Romanization (영어 발음)
                </div>
                <div className="text-xs font-medium text-slate-700 leading-relaxed">
                  {currentQuestion.answerRomanization}
                </div>
              </div>

              {!hideTranslation && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4">
                  <div className="text-[11px] font-bold text-blue-700 font-bn mb-1">
                    উত্তরটির সহজ বাংলা উচ্চারণ (Bangla Pronunciation)
                  </div>
                  <div className="text-xs font-bold text-blue-950 font-bn leading-relaxed">
                    {currentQuestion.answerBanglaPronunciation}
                  </div>
                </div>
              )}

              {!hideTranslation && (
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 md:col-span-2 space-y-1.5">
                  <div className="text-[11px] font-bold text-emerald-800 font-bn">
                    উত্তরটির বাংলা ভাবার্থ (Bangla Meaning)
                  </div>
                  <div className="text-sm font-semibold text-emerald-950 font-bn leading-relaxed">
                    {currentQuestion.answerBanglaMeaning}
                  </div>
                  <div className="text-xs text-slate-600 pt-1 border-t border-emerald-100">
                    <strong>English Meaning:</strong> {currentQuestion.answerEnglishMeaning}
                  </div>
                </div>
              )}
            </div>

            {/* Important Vocabulary Chips (K, L, M, N) */}
            {(!memoryMode || memoryStep >= 3) && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider font-kr flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>핵심 어휘 (Essential Keywords — Click to Listen)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-bn">
                    শব্দটিতে ক্লিক করলে উচ্চারণ শুনতে পাবেন
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentQuestion.keywords.map((kw, idx) => (
                    <div
                      key={idx}
                      onClick={() => handlePlayKorean(kw.korean, 0.85)}
                      className="group bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 rounded-xl p-3 cursor-pointer transition-all hover:shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-[#0f2b5c] font-kr group-hover:text-blue-600 transition-colors">
                          {kw.korean}
                        </span>
                        <Volume2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {kw.romanization}
                      </div>
                      <div className="text-xs font-bold text-blue-900 font-bn mt-1">
                        উচ্চারণ: {kw.banglaPronunciation}
                      </div>
                      <div className="text-xs text-slate-700 font-bn mt-0.5">
                        অর্থ: {kw.banglaMeaning}
                      </div>
                      <div className="text-[10px] text-slate-500 italic mt-0.5">
                        En: {kw.englishMeaning}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interview Tip Banner */}
            {currentQuestion.interviewTip && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-kr block text-amber-950 mb-0.5">면접 합격 팁 (Admission Tip):</strong>
                  <p className="text-amber-900 font-bn">{currentQuestion.interviewTip}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content B: Voice Answer Recording & Live Evaluation */}
        {activePracticeTab === 'record' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-[#0f2b5c] font-kr">
                  음성 녹음 및 발음 유사도 평가 (Voice Recording & Evaluation)
                </h3>
                <p className="text-xs text-slate-500 font-bn">
                  মাইক্রোফোনে ক্লিক করে কোরিয়ান ভাষায় উত্তর দিন। আপনার বলা শব্দগুলো সরাসরি টেক্সটে রূপান্তর হবে।
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleStatus('completed')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    currentStatus === 'completed'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{currentStatus === 'completed' ? '완료됨 (Completed)' : '완료로 표시'}</span>
                </button>
              </div>
            </div>

            {/* Recording Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4 bg-slate-50 rounded-2xl border border-slate-200">
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 group"
                >
                  <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>답변 녹음 시작 (Start Recording)</span>
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-md transition-all active:scale-95 animate-pulse"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>녹음 완료 및 평가 (Stop & Evaluate)</span>
                </button>
              )}

              {/* Retry button */}
              {(recognizedTranscript || manualInputFallback || evaluation) && !isRecording && (
                <button
                  onClick={() => {
                    setRecognizedTranscript('');
                    setManualInputFallback('');
                    setEvaluation(null);
                    setRecordingError(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>다시 연습 (Practice Again)</span>
                </button>
              )}
            </div>

            {/* Recording Error or Fallback Note */}
            {recordingError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 space-y-2">
                <div className="flex items-center gap-2 font-bold font-kr">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>음성 인식 알림 (Voice Recognition Notice)</span>
                </div>
                <p className="font-bn leading-relaxed">{recordingError}</p>
                <div className="pt-1">
                  <button
                    onClick={() => setIsManualInputActive(!isManualInputActive)}
                    className="text-blue-700 font-bold underline font-bn"
                  >
                    직접 텍스트로 입력하여 유사도 측정하기 (텍스트 입력 열기)
                  </button>
                </div>
              </div>
            )}

            {/* Live Recognized Transcript Display (S) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>당신의 답변 (Your Recognized Answer in Korean)</span>
                {isRecording && (
                  <span className="flex items-center gap-1.5 text-rose-600 font-semibold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-600" />
                    마이크 인식 중...
                  </span>
                )}
              </div>

              <div className="min-h-[70px] bg-white rounded-lg p-3 border border-slate-200 text-base font-medium font-kr text-slate-900">
                {recognizedTranscript || (
                  <span className="text-slate-400 text-sm italic font-bn">
                    {isRecording 
                      ? 'এখন স্পষ্ট কণ্ঠে কোরিয়ান ভাষায় বলুন...' 
                      : 'এখনো কোনো উত্তর রেকর্ড করা হয়নি। উপরের "답변 녹음 시작" বাটনে চাপ দিন।'}
                  </span>
                )}
              </div>

              {/* Manual Input Fallback Drawer */}
              {isManualInputActive && (
                <div className="pt-2 space-y-2 border-t border-slate-200">
                  <label className="block text-xs font-bold text-slate-700">
                    수동 텍스트 입력 (Manual Korean Input / Typing Fallback):
                  </label>
                  <textarea
                    rows={3}
                    value={manualInputFallback}
                    onChange={(e) => setManualInputFallback(e.target.value)}
                    placeholder="여기에 한국어 답변을 직접 입력해 보세요... (예: 한국은 우수한 교육 환경을 갖춘 나라입니다...)"
                    className="w-full p-3 rounded-xl border border-slate-300 text-sm font-kr focus:border-blue-500 focus:outline-hidden"
                  />
                  <button
                    onClick={handleManualEvaluate}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
                  >
                    직접 입력한 답변 평가하기
                  </button>
                </div>
              )}
            </div>

            {/* Answer Comparison & Evaluation Report (T) */}
            {evaluation && (
              <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl border border-blue-200 p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    <h4 className="text-base font-extrabold text-[#0f2b5c] font-kr">
                      답변 분석 및 피드백 (Evaluation Report)
                    </h4>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                    evaluation.grade === 'Excellent' ? 'bg-emerald-100 text-emerald-800' :
                    evaluation.grade === 'Good' ? 'bg-blue-100 text-blue-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {evaluation.grade === 'Excellent' ? '🌟 최우수 (Excellent)' :
                     evaluation.grade === 'Good' ? '👍 우수 (Good)' : '💪 연습 필요 (Needs Practice)'}
                  </span>
                </div>

                {/* Score Meters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs text-center">
                    <div className="text-xs text-slate-500 font-semibold">종합 점수 (Overall)</div>
                    <div className="text-2xl font-black text-blue-900 mt-1">
                      {evaluation.overallScore}%
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs text-center">
                    <div className="text-xs text-slate-500 font-semibold">핵심 어휘 일치 (Keywords)</div>
                    <div className="text-2xl font-black text-emerald-600 mt-1">
                      {evaluation.matchedKeywords.length} / {currentQuestion.keywords.length}
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs text-center">
                    <div className="text-xs text-slate-500 font-semibold">문장 유사도 (Similarity)</div>
                    <div className="text-2xl font-black text-indigo-600 mt-1">
                      {evaluation.similarityScore}%
                    </div>
                  </div>
                </div>

                {/* Keyword Analysis Chips */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700">발음된 핵심 어휘 매칭 (Keyword Matching):</div>
                  <div className="flex flex-wrap gap-2">
                    {currentQuestion.keywords.map((kw, i) => {
                      const isMatched = evaluation.matchedKeywords.includes(kw.korean);
                      return (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold font-kr ${
                            isMatched
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-500 line-through'
                          }`}
                        >
                          {isMatched ? '✓' : '✗'} {kw.korean} ({kw.banglaPronunciation})
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Constructive Bangla & English Feedback */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-900 font-kr">멘토 피드백 (Mentor Feedback):</div>
                  <p className="text-sm font-semibold text-blue-950 font-bn leading-relaxed">
                    {evaluation.feedbackBn}
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed italic">
                    {evaluation.feedbackEn}
                  </p>
                </div>

                {/* Practice Again & Next Actions */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={handleStartRecording}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>다시 녹음하기 (Practice Again)</span>
                  </button>

                  <button
                    onClick={handleNextQuestion}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    <span>다음 질문으로 (Next Question)</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
