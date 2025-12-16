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
    <section className="py-16 bg-gradient-to-br from-amber-900/30 via-background to-amber-950/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-full mb-4">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm font-medium">Componist Spotlight</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
          {/* Image */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-amber-900/50 to-slate-900/50">
            {!imageError ? (
              <img
                src={spotlight.imageUrl}
                alt={spotlight.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-24 h-24 text-amber-400/50" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex flex-wrap gap-2">
                {spotlight.notableWorks.slice(0, 4).map((work) => (
                  <span key={work} className="px-3 py-1 bg-white/10 backdrop-blur rounded-full text-white text-sm">
                    {work}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <h2 className="text-4xl font-bold text-foreground mb-2">{spotlight.name}</h2>
            <p className="text-amber-400 text-xl mb-4">{spotlight.title}</p>
            <p className="text-muted-foreground mb-6 leading-relaxed">{spotlight.description}</p>

            {/* Achievements */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {spotlight.achievements.map((achievement, index) => (
                <div key={index} className="flex items-center gap-2 text-foreground/80">
                  <Award className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <span className="text-sm">{achievement}</span>
                </div>
              ))}
            </div>

            {/* Notable works */}
            <div className="mb-6">
              <h4 className="text-foreground font-semibold mb-3">Iconische Werken</h4>
              <div className="flex flex-wrap gap-2">
                {spotlight.notableWorks.map((work) => (
                  <span key={work} className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm">
                    {work}
                  </span>
                ))}
              </div>
            </div>

            <Link to="/artists?search=John%20Williams">
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                Meer over John Williams
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};