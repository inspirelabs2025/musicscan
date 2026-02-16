import React, { useState } from 'react';
import { Star, Award, Music } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const FilmmuziekArtistSpotlight = () => {
  const [imageError, setImageError] = useState(false);
  const { tr } = useLanguage();
  const fm = tr.filmmuziekUI;

  const spotlight = {
    name: "Hans Zimmer",
    title: fm.theModernMaster,
    description: fm.spotlightDescription,
    achievements: ["2 Academy Awards", "4 Grammy Awards", "200+ filmscores", "Golden Globe"],
    notableWorks: ["Inception", "Interstellar", "The Dark Knight", "Gladiator", "Dune", "The Lion King", "Pirates of the Caribbean"],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Hans-Zimmer-profile.jpg/250px-Hans-Zimmer-profile.jpg"
  };

  return (
    <section className="py-8 bg-gradient-to-r from-amber-950/20 via-background to-amber-950/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-5 max-w-3xl mx-auto bg-card/30 rounded-xl p-5 border border-amber-500/10">
          <div className="relative w-28 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
            {!imageError ? (
              <img src={spotlight.imageUrl} alt={spotlight.name} className="w-full h-full object-cover" onError={() => setImageError(true)} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-10 h-10 text-amber-400/50" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-3 h-3 text-amber-400" />
              <span className="text-amber-400 text-xs font-medium uppercase tracking-wide">{fm.spotlight}</span>
            </div>
            <h3 className="text-lg font-bold text-foreground">{spotlight.name}</h3>
            <p className="text-muted-foreground text-xs mb-2 line-clamp-2">{spotlight.description}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
              {spotlight.achievements.slice(0, 3).map((achievement, index) => (
                <div key={index} className="flex items-center gap-1 text-foreground/70">
                  <Award className="w-3 h-3 text-amber-400" />
                  <span className="text-xs">{achievement}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {spotlight.notableWorks.slice(0, 4).map((work) => (
                <span key={work} className="px-2 py-0.5 bg-amber-500/10 rounded text-amber-400 text-xs">{work}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
