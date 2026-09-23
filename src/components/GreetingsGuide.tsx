import React, { useState } from 'react';
import { Volume2, BookOpen, CheckCircle, Award, Sparkles, MessageSquare } from 'lucide-react';
import { INTERVIEW_GREETINGS } from '../data/greetings';
import { playKoreanSpeech, stopKoreanSpeech } from '../utils/speech';

export const GreetingsGuide: React.FC = () => {
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);

  const handlePlayAudio = (korean: string, index: number) => {
    stopKoreanSpeech();
    setPlayingIdx(index);
    playKoreanSpeech(
      korean,
      0.9,
      () => setPlayingIdx(index),
      () => setPlayingIdx(null),
      () => setPlayingIdx(null)
    );
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800">
            면접 태도 및 에티켓
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Natural Interview Greetings & Manners
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-[#0f2b5c] font-kr">
          건양대학교 면접 필수 인사말 6가지와 사용 타이밍
        </h2>
        <p className="text-xs text-slate-500 font-bn mt-1 max-w-2xl">
          কোরিয়ান বিশ্ববিদ্যালয়ের অধ্যাপকরা শিক্ষার্থীর বিনম্র সম্ভাষণ, সঠিক শব্দচয়ন এবং শ্রদ্ধাশীল শারীরিক ভঙ্গিকে অত্যন্ত গুরুত্ব দেন। এই ৬টি সম্ভাষণ মুখস্থ করে প্রতিটি পরিস্থিতির সাথে মিলিয়ে চর্চা করুন।
        </p>
      </div>

      {/* Grid of Greetings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {INTERVIEW_GREETINGS.map((g, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Card Header: Korean & Audio */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-extrabold flex items-center justify-center">
                    0{idx + 1}
                  </span>
                  <h3 className="text-lg font-black text-[#0f2b5c] font-kr">
                    {g.korean}
                  </h3>
                </div>

                <button
                  onClick={() => handlePlayAudio(g.korean, idx)}
                  disabled={playingIdx === idx}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${playingIdx === idx ? 'animate-pulse' : ''}`} />
                  <span>{playingIdx === idx ? '재생 중' : '발음 듣기'}</span>
                </button>
              </div>

              {/* Pronunciation block */}
              <div className="space-y-1">
                <div className="text-[11px] text-slate-500 font-mono">
                  {g.romanization}
                </div>
                <div className="text-sm font-bold text-blue-900 font-bn">
                  উচ্চারণ: {g.banglaPronunciation}
                </div>
              </div>

              {/* Meaning block */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-1">
                <div className="font-semibold text-slate-800 font-bn">
                  অর্থ: {g.banglaMeaning}
                </div>
                <div className="text-[11px] text-slate-500 italic">
                  En: {g.englishMeaning}
                </div>
              </div>

              {/* When to use in Interview */}
              <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100 text-xs space-y-1">
                <div className="font-bold text-blue-900 font-kr flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>사용 타이밍 (When to use in interview):</span>
                </div>
                <p className="text-slate-700 font-bn leading-relaxed">
                  {g.whenToUse}
                </p>
              </div>
            </div>

            {/* Etiquette Tip */}
            <div className="pt-2 border-t border-slate-100 flex items-start gap-2 text-xs text-amber-900 bg-amber-50/50 p-2.5 rounded-xl">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <p className="font-bn">{g.etiquetteTip}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
