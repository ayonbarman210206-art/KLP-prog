import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  Mic, 
  RotateCcw, 
  CheckCircle, 
  Volume2, 
  Award, 
  AlertCircle, 
  ChevronRight, 
  SkipForward, 
  TrendingUp, 
  ShieldAlert,
  GraduationCap
} from 'lucide-react';
import { STUDENT_PROFILE } from '../data/studentProfile';
import { INTERVIEW_QUESTIONS } from '../data/questions';
import { InterviewQuestion, MockInterviewResult } from '../types';
import { 
  playKoreanSpeech, 
  stopKoreanSpeech, 
  KoreanSpeechRecognizer, 
  evaluateAnswer, 
  AnswerEvaluation 
} from '../utils/speech';
import { saveMockInterviewResult } from '../utils/storage';

interface MockInterviewProps {
  onSelectQuestion: (questionId: number) => void;
  onSelectTab: (tab: string) => void;
}

export const MockInterview: React.FC<MockInterviewProps> = ({
  onSelectQuestion,
  onSelectTab
}) => {
  // Setup state: 'intro' | 'interviewing' | 'completed'
  const [phase, setPhase] = useState<'intro' | 'interviewing' | 'completed'>('intro');
  const [questionCountChoice, setQuestionCountChoice] = useState<number>(10); // 5, 10, or 25
  const [selectedQuestions, setSelectedQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Interview Question Progress
  const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState<boolean>(false);
  const [isStudentRecording, setIsStudentRecording] = useState<boolean>(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [manualText, setManualText] = useState<string>('');
  const [isManualInput, setIsManualInput] = useState<boolean>(false);
  const [hasSubmittedCurrent, setHasSubmittedCurrent] = useState<boolean>(false);
  const [currentEval, setCurrentEval] = useState<AnswerEvaluation | null>(null);

  // Results aggregation
  const [answersLog, setAnswersLog] = useState<{
    questionId: number;
    score: number;
    transcript: string;
    matchedKeywords: string[];
    skipped: boolean;
  }[]>([]);

  const recognizerRef = useRef<KoreanSpeechRecognizer | null>(null);

  useEffect(() => {
    recognizerRef.current = new KoreanSpeechRecognizer();
    return () => {
      stopKoreanSpeech();
      if (recognizerRef.current) recognizerRef.current.stop();
    };
  }, []);

  const currentQ = selectedQuestions[currentIndex];

  // Start the interview session
  const handleStartInterview = () => {
    let pool = [...INTERVIEW_QUESTIONS];
    // Shuffle pool
    pool.sort(() => Math.random() - 0.5);
    const chosen = pool.slice(0, Math.min(questionCountChoice, pool.length));
    setSelectedQuestions(chosen);
    setCurrentIndex(0);
    setAnswersLog([]);
    setPhase('interviewing');
    setHasSubmittedCurrent(false);
    setCurrentEval(null);
    setCurrentTranscript('');
    setManualText('');

    // Step 1: Initial Greeting by Interviewer
    const greetingText = `안녕하십니까, ${STUDENT_PROFILE.name} 지원자님. 지금부터 건양대학교 한국어 연수 과정 모의 면접을 시작하겠습니다. 준비되시면 첫 번째 질문을 듣고 한국어로 대답해 주십시오.`;
    setIsInterviewerSpeaking(true);
    playKoreanSpeech(
      greetingText,
      1.0,
      () => setIsInterviewerSpeaking(true),
      () => {
        setIsInterviewerSpeaking(false);
        // Play first question automatically
        if (chosen.length > 0) {
          playQuestionAudio(chosen[0].koreanQuestion);
        }
      }
    );
  };

  const playQuestionAudio = (qText: string) => {
    stopKoreanSpeech();
    setIsInterviewerSpeaking(true);
    playKoreanSpeech(
      qText,
      0.95,
      () => setIsInterviewerSpeaking(true),
      () => setIsInterviewerSpeaking(false)
    );
  };

  // Start Mic
  const handleStartRecording = () => {
    if (!recognizerRef.current) return;
    setCurrentTranscript('');
    setCurrentEval(null);

    const ok = recognizerRef.current.start(
      (state) => {
        setCurrentTranscript(state.transcript);
      },
      (err) => {
        console.warn(err);
        setIsStudentRecording(false);
        setIsManualInput(true);
      },
      () => {
        setIsStudentRecording(false);
      }
    );

    if (ok) {
      setIsStudentRecording(true);
    }
  };

  // Stop Mic & Submit
  const handleStopAndEvaluate = () => {
    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }
    setIsStudentRecording(false);

    const spokenText = (currentTranscript || manualText).trim();
    if (!spokenText) {
      // Prompt user to enter or speak
      return;
    }

    const evalRes = evaluateAnswer(spokenText, currentQ.koreanAnswer, currentQ.keywords);
    setCurrentEval(evalRes);
    setHasSubmittedCurrent(true);

    // Append to log
    setAnswersLog(prev => [
      ...prev,
      {
        questionId: currentQ.id,
        score: evalRes.overallScore,
        transcript: spokenText,
        matchedKeywords: evalRes.matchedKeywords,
        skipped: false
      }
    ]);
  };

  // Skip question
  const handleSkipQuestion = () => {
    stopKoreanSpeech();
    if (recognizerRef.current) recognizerRef.current.stop();
    setIsStudentRecording(false);

    setAnswersLog(prev => [
      ...prev,
      {
        questionId: currentQ.id,
        score: 0,
        transcript: '(스킵함 / Skipped)',
        matchedKeywords: [],
        skipped: true
      }
    ]);

    goToNextOrFinish();
  };

  // Proceed to next question or complete
  const goToNextOrFinish = () => {
    stopKoreanSpeech();
    if (currentIndex + 1 < selectedQuestions.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setHasSubmittedCurrent(false);
      setCurrentEval(null);
      setCurrentTranscript('');
      setManualText('');
      setIsManualInput(false);

      // Speak next question
      setTimeout(() => {
        playQuestionAudio(selectedQuestions[nextIdx].koreanQuestion);
      }, 400);
    } else {
      finishInterview();
    }
  };

  const finishInterview = () => {
    setPhase('completed');
  };

  // On Interview Complete: calculate metrics
  const completedStats = () => {
    const total = selectedQuestions.length;
    const attempted = answersLog.filter(a => !a.skipped).length;
    const skipped = answersLog.filter(a => a.skipped).length;

    const scores = answersLog.map(a => a.score);
    const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / total) : 0;

    const strongQuestionIds = answersLog.filter(a => a.score >= 65).map(a => a.questionId);
    const weakQuestionIds = answersLog.filter(a => a.score < 60).map(a => a.questionId);

    // Save record to storage once
    const mockResult: MockInterviewResult = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      totalQuestions: total,
      attempted,
      skipped,
      avgSimilarityScore: overallScore,
      avgKeywordCoverage: Math.round(
        answersLog.reduce((acc, a) => acc + (a.matchedKeywords.length > 0 ? 70 : 0), 0) / Math.max(1, total)
      ),
      overallScore,
      strongQuestionIds,
      weakQuestionIds,
      questionScores: answersLog.map(a => ({
        questionId: a.questionId,
        score: a.score,
        transcript: a.transcript,
        matchedKeywords: a.matchedKeywords
      }))
    };

    saveMockInterviewResult(mockResult);

    return {
      total,
      attempted,
      skipped,
      overallScore,
      strongQuestionIds,
      weakQuestionIds
    };
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Intro Phase */}
      {phase === 'intro' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#0f2b5c] text-white mx-auto flex items-center justify-center shadow-lg shadow-blue-900/20">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-[#0f2b5c] font-kr">
              건양대학교 KLP 실전 모의 면접관
            </h2>
            <p className="text-slate-600 font-bn text-sm max-w-lg mx-auto">
              실제 대학교 입학 면접관과 마주하듯, 한국어 질문을 귀로 듣고 마이크로 직접 답변하는 실전 시뮬레이션입니다.
            </p>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-2 text-xs text-blue-950 font-bn">
            <div className="font-bold flex items-center gap-1.5 text-blue-900">
              <ShieldAlert className="w-4 h-4 text-blue-700" />
              <span>진행 절차 안내 (Simulation Flow):</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-700">
              <li>면접관의 한국어 인사 및 질문이 음성(TTS)으로 재생됩니다.</li>
              <li>화면의 한국어 힌트 없이 오직 귀로 질문을 파악하는 실전 감각을 기릅니다.</li>
              <li>'마이크 녹음'을 누르고 차분하게 한국어로 대답하세요.</li>
              <li>모의면접 종료 후, 정밀한 발음 및 핵심 단어 커버리지 리포트가 제공됩니다.</li>
            </ul>
          </div>

          {/* Question Count Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              면접 문항 수 선택 (Select Number of Questions):
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { count: 5, label: '5문항 (빠른 연습)', sub: '약 3~5분' },
                { count: 10, label: '10문항 (표준 모의면접)', sub: '약 7~10분' },
                { count: 25, label: '25문항 (전체 완성)', sub: '약 15~20분' }
              ].map((opt) => (
                <button
                  key={opt.count}
                  onClick={() => setQuestionCountChoice(opt.count)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    questionCountChoice === opt.count
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="text-sm font-bold">{opt.label}</div>
                  <div className={`text-[10px] mt-0.5 ${questionCountChoice === opt.count ? 'text-blue-100' : 'text-slate-400'}`}>
                    {opt.sub}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <div className="pt-2">
            <button
              onClick={handleStartInterview}
              className="w-full py-4 rounded-xl bg-[#0f2b5c] hover:bg-blue-900 text-white font-extrabold text-base shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>모의면접 시작하기 (Enter Interview Room)</span>
            </button>
          </div>
        </div>
      )}

      {/* Interviewing Phase */}
      {phase === 'interviewing' && currentQ && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Top Progress Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
                질문 {currentIndex + 1} / {selectedQuestions.length}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {currentQ.category}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              지원자: <strong>{STUDENT_PROFILE.name}</strong>
            </div>
          </div>

          {/* Virtual Interviewer Screen */}
          <div className="bg-gradient-to-br from-[#0a1e3f] to-[#0f2b5c] rounded-3xl p-6 sm:p-10 text-white text-center shadow-xl relative overflow-hidden">
            <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-blue-400/40 mx-auto flex items-center justify-center text-3xl shadow-inner mb-4">
              👨‍🏫
            </div>

            <div className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-2">
              건양대학교 KLP 입학 면접관 (Interviewer)
            </div>

            {/* Question Korean Voice & Text */}
            <div className="max-w-xl mx-auto">
              <h3 className="text-xl sm:text-2xl font-black font-kr leading-snug">
                {currentQ.koreanQuestion}
              </h3>
            </div>

            {/* Speaking Status */}
            <div className="mt-4 flex items-center justify-center gap-2">
              {isInterviewerSpeaking ? (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/40 text-xs animate-pulse">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>면접관이 질문하는 중...</span>
                </span>
              ) : (
                <button
                  onClick={() => playQuestionAudio(currentQ.koreanQuestion)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white border border-white/20 transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>질문 다시 듣기 (Replay Question)</span>
                </button>
              )}
            </div>
          </div>

          {/* Student Answer Workstation */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-700 font-kr">
                지원자 답변 구간 (Student Response Section)
              </span>
              <button
                onClick={handleSkipQuestion}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 font-semibold"
              >
                <span>스킵 (Skip)</span>
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Live Transcript Box */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 min-h-[90px] flex flex-col justify-between">
              <div className="text-xs text-slate-500 font-bold mb-1">
                실시간 인식된 답변 (Recognized Transcript):
              </div>
              <div className="text-sm font-semibold font-kr text-slate-800">
                {currentTranscript || manualText || (
                  <span className="text-slate-400 font-normal italic font-bn">
                    {isStudentRecording 
                      ? '마이크로 음성을 듣고 있습니다. 자신 있게 한국어로 대답하세요...' 
                      : '아래 "마이크로 답변하기"를 눌러 한국어로 말씀하세요.'}
                  </span>
                )}
              </div>
              {isStudentRecording && (
                <div className="flex items-center gap-1 text-[11px] text-rose-600 font-bold pt-2 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  <span>녹음 중...</span>
                </div>
              )}
            </div>

            {/* Manual input fallback option */}
            {isManualInput && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="직접 한국어 답변을 입력하세요..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm font-kr focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            )}

            {/* Recording Controls */}
            {!hasSubmittedCurrent ? (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {!isStudentRecording ? (
                  <button
                    onClick={handleStartRecording}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition-all active:scale-95"
                  >
                    <Mic className="w-4 h-4" />
                    <span>마이크로 답변하기 (Start Answer)</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopAndEvaluate}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-md transition-all active:scale-95 animate-pulse"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>답변 완료 및 제출 (Submit Answer)</span>
                  </button>
                )}

                <button
                  onClick={() => setIsManualInput(!isManualInput)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline font-bn"
                >
                  {isManualInput ? '텍스트 입력 닫기' : '마이크 문제 시 텍스트 입력'}
                </button>
              </div>
            ) : (
              /* Instant Evaluation Card for this question */
              <div className="space-y-4 pt-2">
                {currentEval && (
                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-blue-900 font-kr">
                        질문 {currentIndex + 1} 채점 결과:
                      </span>
                      <span className="text-sm font-extrabold text-blue-950">
                        {currentEval.overallScore}% ({currentEval.grade})
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-bn leading-relaxed">
                      {currentEval.feedbackBn}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={goToNextOrFinish}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all active:scale-95"
                  >
                    <span>{currentIndex + 1 < selectedQuestions.length ? '다음 질문으로 (Next Question)' : '면접 완료 및 결과 보기'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Completed Phase: Comprehensive Report */}
      {phase === 'completed' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm max-w-3xl mx-auto space-y-8">
          {(() => {
            const stats = completedStats();
            return (
              <>
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                    <Award className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 font-kr">
                    모의면접 최종 성적표 (Mock Interview Report)
                  </h2>
                  <p className="text-slate-500 text-xs font-bn">
                    {STUDENT_PROFILE.name} 님의 건양대학교 KLP 모의 면접 연습이 성공적으로 완료되었습니다.
                  </p>
                </div>

                {/* Score Meters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                    <div className="text-[11px] text-slate-500 font-semibold">총 질문 수</div>
                    <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                    <div className="text-[11px] text-slate-500 font-semibold">답변 완료</div>
                    <div className="text-2xl font-black text-emerald-600 mt-1">{stats.attempted}</div>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                    <div className="text-[11px] text-slate-500 font-semibold">스킵한 질문</div>
                    <div className="text-2xl font-black text-amber-600 mt-1">{stats.skipped}</div>
                  </div>
                  <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200 text-center">
                    <div className="text-[11px] text-blue-700 font-semibold">종합 연습 점수</div>
                    <div className="text-2xl font-black text-blue-900 mt-1">{stats.overallScore}점</div>
                  </div>
                </div>

                {/* Weak & Strong Questions List */}
                <div className="space-y-4">
                  {stats.strongQuestionIds.length > 0 && (
                    <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-2">
                      <div className="text-xs font-bold text-emerald-900 font-kr flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>우수 답변 질문 (Strong Questions - 잘 답변한 질문):</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {stats.strongQuestionIds.map(id => (
                          <span key={id} className="px-2.5 py-1 rounded-md bg-white border border-emerald-300 text-xs font-semibold text-emerald-800 font-kr">
                            Q{id}. {INTERVIEW_QUESTIONS.find(q => q.id === id)?.koreanQuestion.slice(0, 15)}...
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {stats.weakQuestionIds.length > 0 && (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2">
                      <div className="text-xs font-bold text-amber-900 font-kr flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-amber-600" />
                        <span>집중 복습 추천 질문 (Questions Recommended to Repeat):</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {stats.weakQuestionIds.map(id => {
                          const q = INTERVIEW_QUESTIONS.find(item => item.id === id);
                          if (!q) return null;
                          return (
                            <div 
                              key={id} 
                              onClick={() => {
                                onSelectQuestion(id);
                                onSelectTab('practice');
                              }}
                              className="p-2.5 rounded-lg bg-white border border-amber-200 hover:border-blue-400 cursor-pointer text-xs transition-colors"
                            >
                              <div className="font-bold text-slate-800 font-kr">Q{id}. {q.koreanQuestion}</div>
                              <div className="text-[11px] text-slate-500 font-bn mt-0.5 truncate">{q.banglaMeaning}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Accuracy & Integrity Warning */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] text-slate-600 font-bn leading-relaxed">
                  <strong>* 주의 안내:</strong> 위 점수는 학생의 발음 및 어휘 연습을 돕기 위해 브라우저 음성 엔진으로 측정한 '모의 연습 점수'입니다. 건양대학교의 공식 입학 합격 여부를 대변하지 않으며, 실제 면접에서는 단정한 태도, 정직한 인성, 성실한 한국어 학습 의지가 가장 높이 평가됩니다.
                </div>

                {/* Final Buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => setPhase('intro')}
                    className="flex-1 py-3 rounded-xl bg-[#0f2b5c] hover:bg-blue-900 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>새 모의면접 시작하기 (Practice Again)</span>
                  </button>

                  <button
                    onClick={() => onSelectTab('practice')}
                    className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>질문별 상세 학습관으로 이동</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};
