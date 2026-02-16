import React from 'react';
import { Film, Award, Music, Users } from 'lucide-react';
import { useFilmmuziekStats } from '@/hooks/useFilmmuziek';
import { useLanguage } from '@/contexts/LanguageContext';

export const FilmmuziekHero = () => {
  const { data: stats } = useFilmmuziekStats();
  const { tr } = useLanguage();
  const fm = tr.filmmuziekUI;

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Cinematic gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-slate-900 to-indigo-950">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-yellow-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-2 h-24 px-4 opacity-20">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="w-3 h-3 bg-amber-400 rounded-full" style={{ animation: `filmReel 2s ease-in-out infinite`, animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full mb-6">
          <Film className="w-5 h-5 text-amber-400" />
          <span className="text-white/90 text-sm font-medium">{fm.genreHub}</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
          {tr.filmmuziek.title.replace(' | MusicScan', '')}
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400">
            {fm.soundtracksScores}
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-10">
          {fm.heroDescription}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <Film className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-white">{stats?.totalFeiten || 50}+</div>
            <div className="text-white/60 text-sm">{fm.milestones}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <Users className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-white">{stats?.totalComposers || 80}+</div>
            <div className="text-white/60 text-sm">{fm.composers}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <Music className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-white">{stats?.subgenres || 6}</div>
            <div className="text-white/60 text-sm">{fm.subgenres}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <Award className="w-6 h-6 text-amber-300 mx-auto mb-2" />
            <div className="text-3xl font-bold text-white">95+</div>
            <div className="text-white/60 text-sm">{fm.yearsOscars}</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes filmReel {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </section>
  );
};
