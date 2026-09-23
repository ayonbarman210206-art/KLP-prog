import React, { useState } from 'react';
import { Calendar, CheckCircle2, ArrowRight, Sparkles, Volume2, Award, Flame } from 'lucide-react';
import { INTERVIEW_QUESTIONS } from '../data/questions';
import { getTodayPractice, TodayPracticeState, markTodayQuestionCompleted, updateStreak } from '../utils/storage';
import { playKoreanSpeech, stopKoreanSpeech } from '../utils/speech';

interface TodayPracticeProps {
  onSelectQuestion: (questionId: number) => void;
  onSelectTab: (tab: string) => void;
}

export const TodayPractice: React.FC<TodayPracticeProps> = ({
  onSelectQuestion,
  onSelectTab
}) => {
  const [todayState, setTodayState] = useState<TodayPracticeState>(getTodayPractice());
  const [playingWord, setPlayingWord] = useState<string | null>(null);

  const todaysQuestions = INTERVIEW_QUESTIONS.filter(q => todayState.questionIds.includes(q.id));
  const completedCount = todayState.completedQuestionIds.length;
  const isAllDone = completedCount >= 5;

  // Extract 10 words from today's 5 questions
  const todaysWords = todaysQuestions.flatMap(q => q.keywords).slice(0, 10);

  const handlePlayWord = (korean: string) => {
    stopKoreanSpeech();
    setPlayingWord(korean);
    playKoreanSpeech(
      korean,
      0.9,
      () => setPlayingWord(korean),
      () => setPlayingWord(null),
      () => setPlayingWord(null)
    );
  };

  const handleMarkDone = (qId: number) => {
    const updated = markTodayQuestionCompleted(qId);
    setTodayState({ ...updated });
    if (updated.isCompleted) {
      updateStreak();
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-br from-[#0f2b5c] to-blue-700 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
            Daily Goal
          </span>
          <span className="text-xs text-blue-100 font-medium">
            {todayState.date} Daily Mission
          </span>
        </div>
        <h2 className="text-2xl font-black font-kr">
          오늘의 5개 핵심 질문 집중 연습
        </h2>
        <p className="text-xs text-blue-100/90 font-bn mt-1 max-w-xl">
          আজকের জন্য নির্বাচিত ৫টি গুরুত্বপূর্ণ প্রশ্ন এবং ১০টি শব্দার্থ মন দিয়ে অনুশীলন করুন। নিয়মিত দৈনিক চর্চা ইন্টারভিউয়ের ভয় দূর করে।
        </p>

        {/* Progress Bar */}
        <div className="mt-5 space-y-1.5 max-w-md">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-200">
            <span>오늘의 미션 완료율</span>
            <span>{completedCount} / 5개 완료</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Completion Trophy Card (if 5/5) */}
      {isAllDone && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-emerald-950 font-kr">
            축하합니다! 오늘의 인터뷰 연습을 모두 완료했습니다.
          </h3>
          <p className="text-xs text-emerald-800 font-bn max-w-md mx-auto">
            আজকের নির্ধারিত ৫টি প্রশ্ন সফলভাবে শেষ করে আপনার স্ট্রাইক বজায় রেখেছেন। আগামীকাল নতুন ৫টি প্রশ্ন আসবে!
          </p>
          <div className="pt-2">
            <button
              onClick={() => onSelectTab('mock')}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-xs"
            >
              실전 모의면접으로 종합 실력 테스트하기
            </button>
          </div>
        </div>
      )}

      {/* 5 Questions List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-[#0f2b5c] font-kr flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>오늘의 질문 5선 (Today's 5 Questions)</span>
        </h3>

        <div className="space-y-3">
          {todaysQuestions.map((q, idx) => {
            const isDone = todayState.completedQuestionIds.includes(q.id);
            return (
              <div
                key={q.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isDone
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-slate-50 hover:bg-blue-50/40 border-slate-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold flex items-center justify-center">
                      0{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Q{q.id}. {q.category}
                    </span>
                    {isDone && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        완료됨 ✓
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-slate-900 font-kr">
                    {q.koreanQuestion}
                  </div>
                  <div className="text-xs text-slate-600 font-bn">
                    {q.banglaMeaning}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => {
                      onSelectQuestion(q.id);
                      onSelectTab('practice');
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    <span>연습하기</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {!isDone && (
                    <button
                      onClick={() => handleMarkDone(q.id)}
                      className="p-2 rounded-xl border border-slate-300 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 text-xs font-medium"
                      title="완료로 표시"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 10 Vocabulary Quick Drill */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-[#0f2b5c] font-kr flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>오늘의 핵심 단어 10개 (Vocabulary Drill)</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {todaysWords.map((kw, i) => (
            <div
              key={i}
              onClick={() => handlePlayWord(kw.korean)}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer text-center transition-all group"
            >
              <div className="flex items-center justify-center gap-1">
                <span className="text-xs font-bold text-[#0f2b5c] font-kr group-hover:text-blue-600">
                  {kw.korean}
                </span>
                <Volume2 className={`w-3 h-3 text-slate-400 group-hover:text-blue-600 ${playingWord === kw.korean ? 'animate-pulse' : ''}`} />
              </div>
              <div className="text-[10px] text-blue-900 font-bn mt-0.5">
                {kw.banglaPronunciation}
              </div>
              <div className="text-[10px] text-slate-500 font-bn truncate mt-0.5">
                {kw.banglaMeaning}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
