import React, { useState } from 'react';
import { Volume2, Mic, RotateCcw, Clock, Sparkles, CheckCircle, Square, Award } from 'lucide-react';
import { SELF_INTRO_VERSIONS } from '../data/selfIntro';
import { STUDENT_PROFILE } from '../data/studentProfile';
import { playKoreanSpeech, stopKoreanSpeech, KoreanSpeechRecognizer } from '../utils/speech';

export const SelfIntroSection: React.FC = () => {
  const [selectedId, setSelectedId] = useState<'short' | 'standard' | 'advanced'>('standard');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0);

  // Student recording
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedText, setRecordedText] = useState<string>('');
  const recognizerRef = React.useRef<KoreanSpeechRecognizer | null>(null);

  const activeIntro = SELF_INTRO_VERSIONS.find(v => v.id === selectedId) || SELF_INTRO_VERSIONS[1];

  React.useEffect(() => {
    recognizerRef.current = new KoreanSpeechRecognizer();
    return () => {
      stopKoreanSpeech();
      if (recognizerRef.current) recognizerRef.current.stop();
    };
  }, []);

  const handlePlayAudio = () => {
    stopKoreanSpeech();
    setIsPlaying(true);
    playKoreanSpeech(
      activeIntro.koreanText,
      speechSpeed,
      () => setIsPlaying(true),
      () => setIsPlaying(false),
      () => setIsPlaying(false)
    );
  };

  const handleStartRecording = () => {
    if (!recognizerRef.current) return;
    setRecordedText('');
    const ok = recognizerRef.current.start(
      (state) => setRecordedText(state.transcript),
      (err) => console.warn(err),
      () => setIsRecording(false)
    );
    if (ok) setIsRecording(true);
  };

  const handleStopRecording = () => {
    if (recognizerRef.current) recognizerRef.current.stop();
    setIsRecording(false);
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Title Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-800">
                맞춤형 자기소개
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Personalized for {STUDENT_PROFILE.name}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0f2b5c] font-kr mt-1">
              건양대학교 KLP 맞춤 자기소개 3가지 버전
            </h2>
            <p className="text-xs text-slate-500 font-bn mt-0.5">
              পরিস্থিতি অনুযায়ী ২০-৩০ সেকেন্ড, ৪০-৬০ সেকেন্ড অথবা ৬০-৯০ সেকেন্ডের আদর্শ আত্মপরিচয় নির্বাচন করে মুখস্থ করুন।
            </p>
          </div>

          {/* Version Selector Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            {SELF_INTRO_VERSIONS.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  stopKoreanSpeech();
                  setSelectedId(v.id);
                  setRecordedText('');
                }}
                className={`px-3 py-2 rounded-lg transition-all ${
                  selectedId === v.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {v.id === 'short' ? '초급 (20초)' : v.id === 'standard' ? '표준 (50초)' : '고급 (75초)'}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Intro Detail Card */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-slate-800 font-kr">
                {activeIntro.title}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                예상 소요: {activeIntro.duration}
              </span>
            </div>

            {/* Audio Controls */}
            <div className="flex items-center gap-2">
              <select
                value={speechSpeed}
                onChange={(e) => setSpeechSpeed(parseFloat(e.target.value))}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700"
              >
                <option value="0.75">0.75x</option>
                <option value="0.85">0.85x</option>
                <option value="1.0">1.0x (표준)</option>
              </select>

              <button
                onClick={handlePlayAudio}
                disabled={isPlaying}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
                <span>{isPlaying ? '재생 중...' : '음성 듣기 (Listen)'}</span>
              </button>
            </div>
          </div>

          {/* Korean Script */}
          <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100">
            <div className="text-base sm:text-lg font-extrabold text-[#0f2b5c] font-kr leading-relaxed">
              {activeIntro.koreanText}
            </div>
          </div>

          {/* Romanization & Bangla Pronunciation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-[11px] font-bold text-slate-500 mb-1">
                English Romanization
              </div>
              <div className="text-xs text-slate-700 font-medium leading-relaxed">
                {activeIntro.romanization}
              </div>
            </div>

            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4">
              <div className="text-[11px] font-bold text-blue-700 font-bn mb-1">
                সহজ বাংলা উচ্চারণ (Phonetic Bangla)
              </div>
              <div className="text-xs font-bold text-blue-950 font-bn leading-relaxed">
                {activeIntro.banglaPronunciation}
              </div>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 md:col-span-2 space-y-1">
              <div className="text-[11px] font-bold text-emerald-800 font-bn">
                বাংলা অর্থ (Bangla Translation)
              </div>
              <div className="text-sm font-semibold text-emerald-950 font-bn leading-relaxed">
                {activeIntro.banglaMeaning}
              </div>
              <div className="text-xs text-slate-500 pt-1 border-t border-emerald-100">
                <strong>English Meaning:</strong> {activeIntro.englishMeaning}
              </div>
            </div>
          </div>

          {/* Presentation Tips */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2 text-xs">
            <div className="font-bold text-amber-900 font-kr flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>면접관 앞 발표 팁 (Delivery Etiquette):</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-700 font-bn">
              {activeIntro.tips.map((t, idx) => (
                <li key={idx}>{t}</li>
              ))}
            </ul>
          </div>

          {/* Practice Recording Section for this version */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 font-kr">
                직접 말하며 녹음 연습하기 (Practice Speaking)
              </span>
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>녹음 시작</span>
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold animate-pulse"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>녹음 멈추기</span>
                </button>
              )}
            </div>

            <div className="bg-white rounded-lg p-3 border border-slate-200 min-h-[60px] text-xs font-kr text-slate-800">
              {recordedText || (
                <span className="text-slate-400 font-bn">
                  {isRecording ? '말씀하세요... 인식 중입니다.' : '녹음 시작을 누르고 위 자기소개를 또박또박 읽어보세요.'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
