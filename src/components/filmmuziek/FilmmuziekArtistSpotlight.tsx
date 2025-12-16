import React, { useState } from 'react';
import { Star, Award, Music, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export const FilmmuziekArtistSpotlight = () => {
  const [imageError, setImageError] = useState(false);
  
  const spotlight = {
    name: "John Williams",
    title: "De Meester van Hollywood",
    description: "Met meer dan 50 Oscar-nominaties en 5 overwinningen is John Williams de meest gelauwerde filmcomponist ooit. Zijn iconische scores voor Star Wars, Jaws, E.T., Jurassic Park en Harry Potter hebben generaties filmliefhebbers geraakt.",
    achievements: [
      "5 Academy Awards",
      "52 Oscar-nominaties",
      "4 Golden Globes",
      "25 Grammy Awards"
    ],
    notableWorks: ["Star Wars", "Jaws", "E.T.", "Jurassic Park", "Harry Potter", "Indiana Jones", "Schindler's List", "Superman"],
    // Fallback image that works reliably
    imageUrl: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=600&h=400&fit=crop"
  };

  return (
    <section className="py-10 bg-gradient-to-br from-amber-900/20 via-background to-amber-950/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-6 max-w-4xl mx-auto bg-card/50 rounded-xl p-6 border border-amber-500/10">
          {/* Image */}
          <div className="relative w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-amber-900/50 to-slate-900/50">
            {!imageError ? (
              <img
                src={spotlight.imageUrl}
                alt={spotlight.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-12 h-12 text-amber-400/50" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-xs font-medium uppercase tracking-wide">Componist Spotlight</span>
            </div>
            <h3 className="text-xl font-bold text-foreground">{spotlight.name}</h3>
            <p className="text-amber-400 text-sm mb-2">{spotlight.title}</p>
            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{spotlight.description}</p>

            {/* Achievements compact */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
              {spotlight.achievements.slice(0, 2).map((achievement, index) => (
                <div key={index} className="flex items-center gap-1 text-foreground/70">
                  <Award className="w-3 h-3 text-amber-400" />
                  <span className="text-xs">{achievement}</span>
                </div>
              ))}
            </div>

            {/* Notable works compact */}
            <div className="flex flex-wrap gap-1 mb-3">
              {spotlight.notableWorks.slice(0, 5).map((work) => (
                <span key={work} className="px-2 py-0.5 bg-amber-500/10 rounded text-amber-400 text-xs">
                  {work}
                </span>
              ))}
            </div>

            <Link to="/artists?search=John%20Williams">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white h-8 text-xs">
                Leer Meer
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};