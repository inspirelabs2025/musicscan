import { motion } from "framer-motion";
import { Disc, Music, Users, BookOpen, Flag, Mic2 } from "lucide-react";
import { useNederlandseStats } from "@/hooks/useNederlandseMuziek";
import { useLanguage } from "@/contexts/LanguageContext";

export function NederlandHero() {
  const { data: stats } = useNederlandseStats();
  const { tr } = useLanguage();
  const ch = tr.countryHubUI;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[hsl(24,100%,45%)] via-[hsl(24,80%,55%)] to-[hsl(211,100%,40%)] py-20 md:py-32">
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-20 left-10 text-white/20">
          <Disc className="w-32 h-32" />
        </motion.div>
        <motion.div animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }} transition={{ duration: 6, repeat: Infinity }} className="absolute bottom-20 right-10 text-white/20">
          <Music className="w-24 h-24" />
        </motion.div>
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-1/2 right-1/4 text-white/10">
          <Flag className="w-40 h-40" />
        </motion.div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center max-w-4xl mx-auto">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="inline-block mb-6">
            <span className="text-6xl md:text-8xl drop-shadow-lg">🇳🇱</span>
          </motion.div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            {ch.nlTitle}{" "}
            <span className="text-[hsl(45,100%,60%)]" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
              {ch.nlTitleAccent}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white mb-10 max-w-2xl mx-auto font-medium" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>
            {ch.nlSubtitle}
          </p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 max-w-3xl mx-auto">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 md:p-5 border border-white shadow-lg">
              <div className="flex justify-center mb-2"><BookOpen className="w-5 h-5 md:w-7 md:h-7 text-[hsl(24,100%,45%)]" /></div>
              <div className="text-xl md:text-3xl font-bold text-[hsl(24,100%,45%)]">{stats?.totalVerhalen || 0}</div>
              <div className="text-xs md:text-sm text-gray-600">{ch.albums}</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 md:p-5 border border-white shadow-lg">
              <div className="flex justify-center mb-2"><Mic2 className="w-5 h-5 md:w-7 md:h-7 text-[hsl(280,70%,50%)]" /></div>
              <div className="text-xl md:text-3xl font-bold text-[hsl(280,70%,50%)]">{stats?.totalSingles || 0}</div>
              <div className="text-xs md:text-sm text-gray-600">{ch.singles}</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 md:p-5 border border-white shadow-lg">
              <div className="flex justify-center mb-2"><Users className="w-5 h-5 md:w-7 md:h-7 text-[hsl(211,100%,40%)]" /></div>
              <div className="text-xl md:text-3xl font-bold text-[hsl(211,100%,40%)]">{stats?.totalArtiesten || 0}</div>
              <div className="text-xs md:text-sm text-gray-600">{ch.artists}</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 md:p-5 border border-white shadow-lg">
              <div className="flex justify-center mb-2"><Disc className="w-5 h-5 md:w-7 md:h-7 text-[hsl(45,100%,40%)]" /></div>
              <div className="text-xl md:text-3xl font-bold text-[hsl(45,100%,40%)]">{stats?.totalReleases || 0}</div>
              <div className="text-xs md:text-sm text-gray-600">{ch.collections}</div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" className="w-full">
          <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" className="fill-background" />
        </svg>
      </div>
    </section>
  );
}
