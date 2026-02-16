import { Music, Users, BookOpen, Disc } from "lucide-react";
import { useFranseStats } from "@/hooks/useFranseMuziek";
import { useLanguage } from "@/contexts/LanguageContext";

export const FrankrijkHero = () => {
  const { data: stats, isLoading } = useFranseStats();
  const { tr } = useLanguage();
  const ch = tr.countryHubUI;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0055A4] via-background to-[#EF4135] py-16 md:py-24">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-8xl">🇫🇷</div>
        <div className="absolute bottom-10 right-10 text-6xl rotate-12">🎵</div>
        <div className="absolute top-1/2 left-1/4 text-4xl">🗼</div>
        <div className="absolute top-1/3 right-1/4 text-5xl">🎹</div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-background/20 backdrop-blur-sm mb-6">
            <span className="text-5xl">🇫🇷</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            {ch.frTitle} <span className="text-[#0055A4]">{ch.frTitleAccent}</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {ch.frSubtitle}
          </p>

          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto">
            <div className="bg-background/30 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-border/50">
              <div className="flex justify-center mb-2"><Disc className="h-6 w-6 text-[#0055A4]" /></div>
              <div className="text-2xl md:text-3xl font-bold text-foreground">{isLoading ? "..." : stats?.releases || 0}</div>
              <div className="text-sm text-muted-foreground">{ch.releases}</div>
            </div>
            <div className="bg-background/30 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-border/50">
              <div className="flex justify-center mb-2"><Users className="h-6 w-6 text-white" /></div>
              <div className="text-2xl md:text-3xl font-bold text-foreground">{isLoading ? "..." : stats?.artiesten || 0}</div>
              <div className="text-sm text-muted-foreground">{ch.artists}</div>
            </div>
            <div className="bg-background/30 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-border/50">
              <div className="flex justify-center mb-2"><BookOpen className="h-6 w-6 text-[#EF4135]" /></div>
              <div className="text-2xl md:text-3xl font-bold text-foreground">{isLoading ? "..." : stats?.verhalen || 0}</div>
              <div className="text-sm text-muted-foreground">{ch.stories}</div>
            </div>
          </div>

          <div className="mt-12 flex justify-center gap-4">
            <span className="px-4 py-2 bg-[#0055A4]/20 rounded-full text-sm text-foreground border border-[#0055A4]/30">Chanson Française</span>
            <span className="px-4 py-2 bg-background/20 rounded-full text-sm text-foreground border border-border/30">French House</span>
            <span className="px-4 py-2 bg-[#EF4135]/20 rounded-full text-sm text-foreground border border-[#EF4135]/30">Yé-yé</span>
          </div>
        </div>
      </div>
    </section>
  );
};
