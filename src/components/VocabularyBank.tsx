import React, { useState } from 'react';
import { Volume2, Search, BookOpen, Sparkles, Filter } from 'lucide-react';
import { INTERVIEW_QUESTIONS } from '../data/questions';
import { Keyword } from '../types';
import { playKoreanSpeech, stopKoreanSpeech } from '../utils/speech';

export const VocabularyBank: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [playingWord, setPlayingWord] = useState<string | null>(null);

  // Collect all unique keywords
  const allKeywords: { keyword: Keyword; questionTopic: string }[] = [];
  const seenKorean = new Set<string>();

  INTERVIEW_QUESTIONS.forEach(q => {
    q.keywords.forEach(kw => {
      if (!seenKorean.has(kw.korean)) {
        seenKorean.add(kw.korean);
        allKeywords.push({ keyword: kw, questionTopic: q.category });
      }
    });
  });

  const categories = ['All', ...Array.from(new Set(allKeywords.map(k => k.questionTopic)))];

  const filtered = allKeywords.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.questionTopic === selectedCategory;
    const matchesSearch = 
      item.keyword.korean.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.keyword.romanization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.keyword.banglaMeaning.includes(searchTerm) ||
      item.keyword.banglaPronunciation.includes(searchTerm) ||
      item.keyword.englishMeaning.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePlayWord = (word: string) => {
    stopKoreanSpeech();
    setPlayingWord(word);
    playKoreanSpeech(
      word,
      0.85,
      () => setPlayingWord(word),
      () => setPlayingWord(null),
      () => setPlayingWord(null)
    );
  };

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800">
                핵심 단어장 ({allKeywords.length}단어)
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Essential Korean Interview Vocabulary
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0f2b5c] font-kr mt-1">
              건양대학교 KLP 면접 필수 어휘 사전
            </h2>
            <p className="text-xs text-slate-500 font-bn mt-0.5">
              ইন্টারভিউয়ের প্রশ্ন ও উত্তরে ব্যবহৃত গুরুত্বপূর্ণ শব্দার্থগুলো অডিও সহকারে বারবার শুনে আয়ত্ত করুন।
            </p>
          </div>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="단어 검색 (Search in Korean, English, or Bangla)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {categories.slice(0, 5).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vocabulary Flashcard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item, idx) => (
          <div
            key={idx}
            onClick={() => handlePlayWord(item.keyword.korean)}
            className="group bg-white hover:bg-blue-50/40 border border-slate-200 hover:border-blue-300 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {item.questionTopic}
                </span>
                <button 
                  className="p-1.5 rounded-lg text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-100 transition-colors"
                  aria-label="발음 듣기"
                >
                  <Volume2 className={`w-4 h-4 ${playingWord === item.keyword.korean ? 'text-blue-600 animate-pulse' : ''}`} />
                </button>
              </div>

              <div className="text-lg font-black text-[#0f2b5c] font-kr group-hover:text-blue-700 transition-colors">
                {item.keyword.korean}
              </div>

              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                {item.keyword.romanization}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
              <div className="text-xs font-bold text-blue-900 font-bn">
                উচ্চারণ: {item.keyword.banglaPronunciation}
              </div>
              <div className="text-xs font-semibold text-slate-800 font-bn">
                বাংলা অর্থ: {item.keyword.banglaMeaning}
              </div>
              <div className="text-[11px] text-slate-500 italic">
                En: {item.keyword.englishMeaning}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm font-bn">
          কোনো শব্দ খুঁজে পাওয়া যায়নি। অন্য শব্দ লিখে সার্চ করুন।
        </div>
      )}
    </div>
  );
};
