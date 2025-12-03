import React from 'react';
import { Music, Disc3, Radio, Users } from 'lucide-react';
import { useDanceHouseStats } from '@/hooks/useDanceHouseMuziek';

export const DanceHouseHero = () => {
  const { data: stats } = useDanceHouseStats();

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-900 via-purple-900 to-pink-900">
        {/* Animated pulse circles */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        {/* Sound wave bars */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-1 h-32 px-4 opacity-30">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="w-2 bg-gradient-to-t from-cyan-400 to-purple-400 rounded-t"
              style={{
                height: `${Math.random() * 80 + 20}%`,
                animation: `soundwave 0.8s ease-in-out infinite`,
                animationDelay: `${i * 0.05}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full mb-6">
          <Disc3 className="w-5 h-5 text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />
          <span className="text-white/90 text-sm font-medium">Dance/House Genre Hub</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
          Dance & House
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
            Muziek
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-10">
          Van Chicago's underground clubs tot wereldwijde festivals. Ontdek de geschiedenis, 
          artiesten en verhalen van elektronische dansmuziek.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <Music className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-white">{stats?.totalFeiten || 50}+</div>
            <div className="text-white/60 text-sm">Muziekfeiten</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-white">{stats?.totalArtists || 100}+</div>
            <div className="text-white/60 text-sm">Artiesten</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <Disc3 className="w-6 h-6 text-pink-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-white">{stats?.subgenres || 6}</div>
            <div className="text-white/60 text-sm">Subgenres</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <Radio className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-white">40+</div>
            <div className="text-white/60 text-sm">Jaar geschiedenis</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes soundwave {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </section>
  );
};
