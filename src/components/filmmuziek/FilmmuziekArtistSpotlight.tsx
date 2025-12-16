import React from 'react';
import { Star, Award, Film, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export const FilmmuziekArtistSpotlight = () => {
  // Featured composer: John Williams
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
    imageUrl: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800"
  };

  return (
    <section className="py-16 bg-gradient-to-br from-amber-900/30 via-slate-900/50 to-amber-950/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full mb-4">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm">Componist Spotlight</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
          {/* Image */}
          <div className="relative aspect-square lg:aspect-[4/3] rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 to-slate-900/60" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-8">
                <Film className="w-24 h-24 text-amber-400/40 mx-auto mb-4" />
                <div className="text-6xl font-bold text-white/20">JW</div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
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
            <h2 className="text-4xl font-bold text-white mb-2">{spotlight.name}</h2>
            <p className="text-amber-400 text-xl mb-4">{spotlight.title}</p>
            <p className="text-white/70 mb-6 leading-relaxed">{spotlight.description}</p>

            {/* Achievements */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {spotlight.achievements.map((achievement, index) => (
                <div key={index} className="flex items-center gap-2 text-white/80">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span>{achievement}</span>
                </div>
              ))}
            </div>

            {/* Notable works */}
            <div className="mb-6">
              <h4 className="text-white font-semibold mb-3">Iconische Werken</h4>
              <div className="flex flex-wrap gap-2">
                {spotlight.notableWorks.map((work) => (
                  <span key={work} className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm">
                    {work}
                  </span>
                ))}
              </div>
            </div>

            <Link to={`/artists?search=${encodeURIComponent(spotlight.name)}`}>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                Leer Meer
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
