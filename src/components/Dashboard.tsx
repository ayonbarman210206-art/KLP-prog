import React from 'react';
import { 
  Award, 
  CheckCircle2, 
  Flame, 
  ArrowRight, 
  Mic, 
  Shuffle, 
  Calendar, 
  ShieldAlert, 
  Users, 
  Compass, 
  TrendingUp,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { STUDENT_PROFILE, UNIVERSITY_INFO } from '../data/studentProfile';
import { INTERVIEW_QUESTIONS } from '../data/questions';
import { getStoredStatuses, getStoredMocks, getStoredAttempts, StreakInfo } from '../utils/storage';

interface DashboardProps {
  onSelectTab: (tab: string) => void;
  onSelectQuestion: (questionId: number) => void;
  streakInfo: StreakInfo;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectTab,
  onSelectQuestion,
  streakInfo
}) => {
  const statuses = getStoredStatuses();
  const attempts = getStoredAttempts();
  const mocks = getStoredMocks();

  const totalQuestions = INTERVIEW_QUESTIONS.length; // 25
  const completedCount = Object.values(statuses).filter(s => s === 'completed').length;
  const practicingCount = Object.values(statuses).filter(s => s === 'practicing').length;
  const completionPercentage = Math.round((completedCount / totalQuestions) * 100);

  // Average practice score from recent attempts
  const averageScore = attempts.length > 0
    ? Math.round(attempts.slice(0, 20).reduce((acc, a) => acc + a.similarityScore, 0) / Math.min(20, attempts.length))
    : 0;

  // Identify weak questions (attempted but low score or still 'practicing' or lowest score)
  const weakQuestions = INTERVIEW_QUESTIONS.filter(q => {
    const qAttempts = attempts.filter(a => a.questionId === q.id);
    if (qAttempts.length === 0) return false;
    const latestScore = qAttempts[0].similarityScore;
    return latestScore < 60;
  }).slice(0, 3);

  // Determine next question to practice
  const firstUnfinished = INTERVIEW_QUESTIONS.find(q => statuses[q.id] !== 'completed') || INTERVIEW_QUESTIONS[0];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Profile & University Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a1e3f] via-[#0f2b5c] to-[#1d4ed8] text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />
        <div className="absolute right-10 bottom-0 opacity-10 text-white pointer-events-none hidden md:block font-black text-8xl font-kr">
          건양대
        </div>

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-semibold">
              Konyang University KLP Interview Prep
            </span>
            <span className="px-2.5 py-1 rounded-full bg-blue-400/20 text-blue-200 border border-blue-400/30 text-xs font-medium">
              논산 창의융합캠퍼스 & 대전 메디컬캠퍼스
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {STUDENT_PROFILE.name} 님의 합격 인터뷰 훈련관
            </h1>
            <p className="text-blue-100/90 text-sm sm:text-base mt-1 font-medium font-bn">
              কন্যং ইউনিভার্সিটি কেএলপি (KLP) অ্যাডমিশন ইন্টারভিউ প্রস্তুতি প্ল্যাটফর্ম — স্পিচ রিকগনিশন, সঠিক উচ্চারণ ও মক টেস্ট।
            </p>
          </div>

          {/* Applicant & Family Summary Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-3.5">
              <div className="text-[11px] text-blue-200 font-medium">지원자 프로필 (Applicant)</div>
              <div className="text-sm font-bold text-white mt-0.5">{STUDENT_PROFILE.name}</div>
              <div className="text-xs text-slate-200 font-bn">জাতীয়তা: {STUDENT_PROFILE.nationality} (বাংলাদেশী)</div>
            </div>

            <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-3.5">
              <div className="text-[11px] text-blue-200 font-medium">지원 대학 및 과정 (Target)</div>
              <div className="text-sm font-bold text-white mt-0.5">건양대학교 (Konyang Univ.)</div>
              <div className="text-xs text-slate-200 font-bn">কোরিয়ান ল্যাঙ্গুয়েজ প্রোগ্রাম (KLP)</div>
            </div>

            <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-3.5 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-blue-200 font-medium">가족 정보 (Family of 4)</span>
                <Users className="w-3.5 h-3.5 text-blue-200" />
              </div>
              <div className="text-xs font-semibold text-white mt-0.5">
                아버지(사업가) · 어머니(선생님) · 남동생(학생)
              </div>
              <div className="text-[11px] text-slate-200 font-bn">বাবা (ব্যবসায়ী), মা (শিক্ষিকা), ছোট ভাই (ছাত্র)</div>
            </div>
          </div>

          {/* Primary Quick CTA Buttons */}
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => {
                onSelectQuestion(firstUnfinished.id);
                onSelectTab('practice');
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm shadow-md transition-all active:scale-98"
            >
              <span>이어 연습하기 (Continue Practice)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onSelectTab('mock')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-semibold text-sm transition-all active:scale-98"
            >
              <Mic className="w-4 h-4 text-blue-300" />
              <span>실전 모의면접 (Mock Interview)</span>
            </button>

            <button
              onClick={() => onSelectTab('selfintro')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-medium text-sm transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>자기소개 3가지 버전 (Self-Intro)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Accuracy & Integrity Disclaimer */}
      <div className="flex items-start gap-3 bg-blue-50/80 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 leading-relaxed">
        <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-blue-950 font-kr block mb-0.5">
            건양대학교 KLP 면접 연습 안내 (Practice Purpose Disclaimer)
          </span>
          <p className="text-slate-700 font-bn">
            এই প্ল্যাটফর্মের সমস্ত প্রশ্ন ও দিকনির্দেশনা কোরিয়ান বিশ্ববিদ্যালয় KLP ইন্টারভিউ নির্দেশিকার কাঠামোর ভিত্তিতে অয়ন বর্মন রূপো (AYON BARMAN RUPO)-এর কন্যং ইউনিভার্সিটির ভর্তির জন্য বিশেষভাবে তৈরি করা হয়েছে। এটি অফিসিয়াল বিশ্ববিদ্যালয় কর্তৃপক্ষের আনুষ্ঠানিক প্রশ্নপত্র নয়; বরং শিক্ষার্থী যেন আত্মবিশ্বাসের সাথে কোরিয়ান ভাষা, সঠিক উচ্চারণ, পারিবারিক তথ্য এবং উপস্থিত বুদ্ধি প্রদর্শন করতে পারে তার প্রস্তুতিমূলক প্ল্যাটফর্ম।
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Progress Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>완료한 질문</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {completedCount} <span className="text-sm font-normal text-slate-500">/ {totalQuestions}제</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium font-bn">
            অগ্রগতি: {completionPercentage}% সম্পন্ন
          </div>
        </div>

        {/* Streak Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>연속 연습일</span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            {streakInfo.currentStreak} <span className="text-sm font-normal text-slate-500">일째</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 font-medium font-bn">
            মোট প্র্যাকটিস সেশন: {streakInfo.totalPracticeDays} দিন
          </div>
        </div>

        {/* Mock Interview Count */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>모의면접 횟수</span>
            <Award className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-900">
            {mocks.length} <span className="text-sm font-normal text-slate-500">회 완료</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 font-medium font-bn">
            {mocks.length > 0 ? `সর্বশেষ স্কোর: ${mocks[0].overallScore}점` : 'এখনো মক টেস্ট দেওয়া হয়নি'}
          </div>
        </div>

        {/* Average Practice Score */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>평균 발음/유사도</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600">
            {averageScore > 0 ? `${averageScore}점` : '-'}
          </div>
          <div className="text-[11px] text-slate-500 mt-3 font-medium font-bn">
            {attempts.length > 0 ? `মোট ${attempts.length} বার ভয়েস রেকর্ড করা হয়েছে` : 'ভয়েস দিয়ে উত্তর রেকর্ড করুন'}
          </div>
        </div>
      </div>

      {/* Three Feature Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Today's Practice Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-200/80 p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider mb-2">
              <Calendar className="w-4 h-4" />
              <span>Today's Daily Challenge</span>
            </div>
            <h3 className="text-base font-extrabold text-[#0f2b5c] font-kr">
              오늘의 5개 핵심 질문 연습
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-bn">
              প্রতিদিন মাত্র ৫টি নির্ধারিত প্রশ্ন ও ১০টি শব্দার্থ ভয়েসে প্র্যাকটিস করে আপনার আত্মবিশ্বাস বাড়িয়ে নিন।
            </p>
          </div>
          <button
            onClick={() => onSelectTab('today')}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
          >
            <span>오늘의 5제 시작하기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Greetings & Etiquette Card */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-2xl border border-emerald-200/80 p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-2">
              <BookOpen className="w-4 h-4" />
              <span>Interview Manners & Etiquette</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 font-kr">
              면접 필수 인사말 6가지
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-bn">
              안녕하십니까, 감사합니다, 잘 부탁드립니다 등 ইন্টারভিউ রুমে প্রবেশ থেকে প্রস্থান পর্যন্ত মার্জিত আচরণ ও সম্ভাষণ।
            </p>
          </div>
          <button
            onClick={() => onSelectTab('greetings')}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors shadow-xs"
          >
            <span>인사말 및 예절 학습하기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Random Quick Practice Card */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-2xl border border-amber-200/80 p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider mb-2">
              <Shuffle className="w-4 h-4" />
              <span>Random Drill</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 font-kr">
              랜덤 돌발 질문 훈련
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-bn">
              অপ্রত্যাশিত প্রশ্ন মোকাবেলার ক্ষমতা তৈরিতে ২৫টি প্রশ্ন থেকে কম্পিউটার দৈবচয়নে একটি করে প্রশ্ন করবে।
            </p>
          </div>
          <button
            onClick={() => {
              const randomId = Math.floor(Math.random() * 25) + 1;
              onSelectQuestion(randomId);
              onSelectTab('practice');
            }}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors shadow-xs"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>랜덤 질문 풀기</span>
          </button>
        </div>
      </div>

      {/* Weak Questions Alert & Recommendation */}
      {weakQuestions.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-3">
            <TrendingUp className="w-4 h-4" />
            <span>집중 복습 추천 질문 (Recommended to Repeat)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {weakQuestions.map((q) => (
              <div 
                key={q.id}
                onClick={() => {
                  onSelectQuestion(q.id);
                  onSelectTab('practice');
                }}
                className="bg-white p-3 rounded-xl border border-amber-200 hover:border-amber-400 cursor-pointer transition-all hover:shadow-xs group"
              >
                <div className="text-[11px] font-bold text-amber-600">Question {q.id}</div>
                <div className="text-xs font-semibold text-slate-800 font-kr truncate group-hover:text-blue-600">
                  {q.koreanQuestion}
                </div>
                <div className="text-[11px] text-slate-500 font-bn mt-1 truncate">
                  {q.banglaMeaning}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All 25 Questions Quick Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 font-kr">
              건양대학교 KLP 인터뷰 질문 25제 전체 보기
            </h2>
            <p className="text-xs text-slate-500 font-bn">
              সবগুলো প্রশ্নের স্ট্যাটাস: ⚪ শুরু হয়নি &nbsp;|&nbsp; 🟡 অনুশীলনরত &nbsp;|&nbsp; 🟢 সম্পন্ন
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">
              완료: {completedCount} / 25
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {INTERVIEW_QUESTIONS.map((q) => {
            const status = statuses[q.id] || 'not_started';
            const statusBadge = 
              status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
              status === 'practicing' ? 'bg-amber-50 text-amber-700 border-amber-300' :
              'bg-slate-50 text-slate-600 border-slate-200';

            const statusDot = 
              status === 'completed' ? '🟢' :
              status === 'practicing' ? '🟡' : '⚪';

            return (
              <div
                key={q.id}
                onClick={() => {
                  onSelectQuestion(q.id);
                  onSelectTab('practice');
                }}
                className={`p-3 rounded-xl border ${statusBadge} hover:scale-[1.02] cursor-pointer transition-all hover:shadow-xs flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                    <span>Q{q.id.toString().padStart(2, '0')}</span>
                    <span>{statusDot}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 font-kr line-clamp-2">
                    {q.koreanQuestion}
                  </div>
                </div>
                <div className="text-[10px] text-slate-600 font-bn mt-2 line-clamp-1">
                  {q.banglaMeaning}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
