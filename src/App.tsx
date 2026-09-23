import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { QuestionPractice } from './components/QuestionPractice';
import { MockInterview } from './components/MockInterview';
import { SelfIntroSection } from './components/SelfIntroSection';
import { GreetingsGuide } from './components/GreetingsGuide';
import { VocabularyBank } from './components/VocabularyBank';
import { TodayPractice } from './components/TodayPractice';
import { STUDENT_PROFILE, UNIVERSITY_INFO } from './data/studentProfile';
import { getAppSettings, saveAppSettings, getStreakInfo, updateStreak, AppSettings, StreakInfo } from './utils/storage';
import { ShieldCheck, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedQuestionId, setSelectedQuestionId] = useState<number>(1);
  const [settings, setSettings] = useState<AppSettings>(getAppSettings());
  const [streakInfo, setStreakInfo] = useState<StreakInfo>(getStreakInfo());

  useEffect(() => {
    const updated = updateStreak();
    setStreakInfo(updated);
  }, []);

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = saveAppSettings(newSettings);
    setSettings(updated);
  };

  const handleSelectQuestion = (qId: number) => {
    setSelectedQuestionId(qId);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Sticky Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        streakDays={streakInfo.currentStreak}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            onSelectTab={setActiveTab}
            onSelectQuestion={handleSelectQuestion}
            streakInfo={streakInfo}
          />
        )}

        {activeTab === 'practice' && (
          <QuestionPractice
            currentQuestionId={selectedQuestionId}
            onSelectQuestion={handleSelectQuestion}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {activeTab === 'mock' && (
          <MockInterview
            onSelectQuestion={handleSelectQuestion}
            onSelectTab={setActiveTab}
          />
        )}

        {activeTab === 'selfintro' && (
          <SelfIntroSection />
        )}

        {activeTab === 'greetings' && (
          <GreetingsGuide />
        )}

        {activeTab === 'vocabulary' && (
          <VocabularyBank />
        )}

        {activeTab === 'today' && (
          <TodayPractice
            onSelectQuestion={handleSelectQuestion}
            onSelectTab={setActiveTab}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#0a1e3f] text-slate-300 border-t border-slate-800 text-xs py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="text-center md:text-left space-y-1">
              <div className="text-white font-black text-sm tracking-tight font-kr">
                건양대학교 한국어 연수 과정(KLP) 인터뷰 훈련관
              </div>
              <p className="text-slate-400 text-xs">
                Konyang University Korean Language Program Voice Interview Practice Platform
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">
                지원자: <strong className="text-white">{STUDENT_PROFILE.name}</strong> ({STUDENT_PROFILE.nationality})
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                건양대학교 입학 준비
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <p className="font-bn">
              {UNIVERSITY_INFO.disclaimer}
            </p>
            <p className="flex items-center gap-1 text-slate-400">
              <span>Personalized for Korean Admission</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
