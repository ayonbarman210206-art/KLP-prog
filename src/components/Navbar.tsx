import React from 'react';
import { 
  GraduationCap, 
  Mic, 
  Sparkles, 
  Flame, 
  HelpCircle, 
  BookOpen, 
  Calendar, 
  Volume2, 
  UserCheck, 
  Menu, 
  X 
} from 'lucide-react';
import { STUDENT_PROFILE } from '../data/studentProfile';
import { AppSettings } from '../utils/storage';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  streakDays: number;
  settings: AppSettings;
  onUpdateSettings: (s: Partial<AppSettings>) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  streakDays,
  settings,
  onUpdateSettings
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: '대시보드', sub: 'Dashboard', icon: UserCheck },
    { id: 'practice', label: '인터뷰 25제', sub: '25 Questions', icon: HelpCircle },
    { id: 'mock', label: '실전 모의면접', sub: 'Mock Interview', icon: Mic },
    { id: 'selfintro', label: '자기소개', sub: 'Self Introduction', icon: Sparkles },
    { id: 'greetings', label: '면접 예절', sub: 'Greetings', icon: BookOpen },
    { id: 'vocabulary', label: '어휘 사전', sub: 'Vocabulary', icon: BookOpen },
    { id: 'today', label: '오늘의 5제', sub: "Today's Practice", icon: Calendar },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Banner with University Identity & Applicant Name */}
      <div className="bg-[#0f2b5c] text-white px-4 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30">
              건양대학교 KLP
            </span>
            <span className="font-kr font-medium tracking-wide">
              Konyang University Korean Language Program
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="hidden sm:inline text-blue-200">
              지원자: <strong className="text-white">{STUDENT_PROFILE.name}</strong> ({STUDENT_PROFILE.nationality})
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Streak Indicator */}
            <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md text-[11px] font-semibold">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{streakDays}일 연속 연습</span>
            </div>

            {/* Quick Speed Control */}
            <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md text-[11px]">
              <Volume2 className="w-3 h-3 text-blue-300" />
              <span className="text-slate-300">음성 속도:</span>
              <select
                aria-label="음성 속도 선택"
                value={settings.slowKorean ? 'slow' : settings.speechSpeed.toString()}
                onChange={(e) => {
                  if (e.target.value === 'slow') {
                    onUpdateSettings({ slowKorean: true, speechSpeed: 0.65 });
                  } else {
                    onUpdateSettings({ slowKorean: false, speechSpeed: parseFloat(e.target.value) });
                  }
                }}
                className="bg-transparent text-white font-semibold focus:outline-hidden cursor-pointer border-none"
              >
                <option value="0.75" className="text-slate-900">0.75x</option>
                <option value="1.0" className="text-slate-900">1.0x (보통)</option>
                <option value="1.25" className="text-slate-900">1.25x (빠름)</option>
                <option value="slow" className="text-slate-900">Slow Korean (초급)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0f2b5c] to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-900/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-[#0f2b5c] group-hover:text-blue-600 transition-colors">
                  건양대 KLP
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded-sm bg-blue-100 text-blue-700 font-bold">
                  인터뷰
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Voice Interview Simulator
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <div className="text-left">
                    <span className="block leading-none font-kr">{item.label}</span>
                    <span className="text-[9px] text-slate-400 font-normal leading-none mt-0.5 block">{item.sub}</span>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Action Button: Launch Practice */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setActiveTab('mock')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0f2b5c] text-white text-xs font-semibold hover:bg-blue-900 transition-colors shadow-sm"
            >
              <Mic className="w-3.5 h-3.5 text-blue-300" />
              <span>모의면접 시작</span>
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="메뉴 열기"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-slate-700" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1">
          <div className="p-2 mb-2 bg-blue-50 rounded-lg text-xs text-blue-800">
            <strong>{STUDENT_PROFILE.name}</strong> 님, 환영합니다! Konyang University KLP 인터뷰 연습을 시작하세요.
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-600 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label} ({item.sub})</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
