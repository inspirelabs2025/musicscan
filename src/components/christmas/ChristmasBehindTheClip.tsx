import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Play, Film, Clock, Star, ChevronRight } from 'lucide-react';

interface VideoClip {
  id: string;
  title: string;
  artist: string;
  year: number;
  youtubeId: string;
  thumbnail: string;
  duration: string;
  behindTheScenes: string;
  funFacts: string[];
  budget?: string;
  director?: string;
}

const CHRISTMAS_CLIPS: VideoClip[] = [
  {
    id: '1',
    title: 'Last Christmas',
    artist: 'Wham!',
    year: 1984,
    youtubeId: 'E8gmARGvPlI',
    thumbnail: 'https://img.youtube.com/vi/E8gmARGvPlI/maxresdefault.jpg',
    duration: '4:27',
    behindTheScenes: 'De iconische videoclip werd opgenomen in het Zwitserse skiresort Saas-Fee. George Michael en Andrew Ridgeley brachten een week door in de sneeuw, samen met modellen en vrienden. De romantische sfeer en het chalet werden een symbool voor kerst in de jaren 80.',
    funFacts: [
      'De clip kostte destijds £30.000 om te maken',
      'Het chalet bestaat nog steeds en is nu een toeristische attractie',
      'De crew at elke dag fondue tijdens de opnames',
      'George Michael schreef het nummer in zijn slaapkamer bij zijn ouders'
    ],
    budget: '£30.000',
    director: 'Andy Morahan'
  },
  {
    id: '2',
    title: 'All I Want For Christmas Is You',
    artist: 'Mariah Carey',
    year: 1994,
    youtubeId: 'aAkMkVFwAoo',
    thumbnail: 'https://img.youtube.com/vi/aAkMkVFwAoo/maxresdefault.jpg',
    duration: '4:01',
    behindTheScenes: 'Mariah Carey nam de videoclip op in slechts één dag. De opnames vonden plaats in verschillende locaties, waaronder een studio met nepsneeuw en een echte kerstbomenverkoop. Mariah deed zelf haar eigen make-up en styling.',
    funFacts: [
      'De clip werd in minder dan 24 uur opgenomen',
      'Mariah draagt een vintage kerstmanpak uit de jaren 60',
      'Het nummer verdient jaarlijks $2,5 miljoen aan royalties',
      'De clip heeft meer dan 1 miljard views op YouTube'
    ],
    director: 'Mariah Carey & Larry Jordan'
  },
  {
    id: '3',
    title: 'Do They Know It\'s Christmas',
    artist: 'Band Aid',
    year: 1984,
    youtubeId: 'bjQzJAKxTrE',
    thumbnail: 'https://img.youtube.com/vi/bjQzJAKxTrE/maxresdefault.jpg',
    duration: '3:55',
    behindTheScenes: 'De hele opname, inclusief videoclip, werd in één dag gemaakt op 25 november 1984 in de SARM Studios in Londen. Bob Geldof en Midge Ure brachten de grootste Britse sterren samen voor het goede doel.',
    funFacts: [
      'Het nummer werd in slechts 24 uur geschreven en opgenomen',
      'Meer dan 40 artiesten namen deel',
      'Het bracht meer dan £8 miljoen op voor hongersnood in Ethiopië',
      'Bono\'s solo was oorspronkelijk niet gepland'
    ],
    budget: 'Gratis (iedereen werkte pro bono)',
    director: 'Nigel Dick'
  },
  {
    id: '4',
    title: 'Driving Home For Christmas',
    artist: 'Chris Rea',
    year: 1986,
    youtubeId: 'EvaCc_ys08c',
    thumbnail: 'https://img.youtube.com/vi/EvaCc_ys08c/maxresdefault.jpg',
    duration: '4:00',
    behindTheScenes: 'Chris Rea schreef dit nummer terwijl hij daadwerkelijk in een file stond op weg naar huis voor kerst. De videoclip toont authentieke beelden van sneeuwlandschappen en autorijden, wat perfect aansluit bij het nostalgische gevoel van het nummer.',
    funFacts: [
      'Het nummer is gebaseerd op een echte ervaring in een file',
      'Chris Rea had oorspronkelijk geen plannen om het uit te brengen',
      'Het duurde jaren voordat het een kersthit werd',
      'Nu een van de meest gedraaide kerstnummers in Europa'
    ],
    director: 'Onbekend'
  },
];

export const ChristmasBehindTheClip = () => {
  const [selectedClip, setSelectedClip] = useState<VideoClip | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const handleClipClick = (clip: VideoClip) => {
    setSelectedClip(clip);
    setShowVideo(false);
    setIsOpen(true);
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            🎬 Behind the Videoclip
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ontdek de verhalen achter iconische kerstvideoclips
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {CHRISTMAS_CLIPS.map((clip) => (
              <button
                key={clip.id}
                onClick={() => handleClipClick(clip)}
                className="group relative aspect-video rounded-xl overflow-hidden bg-muted/20"
              >
                <img 
                  src={clip.thumbnail} 
                  alt={clip.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${clip.youtubeId}/hqdefault.jpg`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Play Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="h-6 w-6 text-white ml-1" />
                  </div>
                </div>

                {/* Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">
                      {clip.year}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" /> {clip.duration}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-white">{clip.title}</h4>
                  <p className="text-white/80 text-sm">{clip.artist}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Film className="h-5 w-5" />
              {selectedClip?.title} - {selectedClip?.artist}
            </DialogTitle>
          </DialogHeader>
          
          {selectedClip && (
            <div className="space-y-6">
              {/* Video or Thumbnail */}
              <div className="aspect-video rounded-xl overflow-hidden bg-black">
                {showVideo ? (
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${selectedClip.youtubeId}?autoplay=1`}
                    title={selectedClip.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <button 
                    onClick={() => setShowVideo(true)}
                    className="relative w-full h-full group"
                  >
                    <img 
                      src={selectedClip.thumbnail} 
                      alt={selectedClip.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${selectedClip.youtubeId}/hqdefault.jpg`;
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="h-10 w-10 text-white ml-1" />
                      </div>
                    </div>
                  </button>
                )}
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap gap-2">
                <Badge>{selectedClip.year}</Badge>
                <Badge variant="outline">{selectedClip.duration}</Badge>
                {selectedClip.director && (
                  <Badge variant="secondary">Regisseur: {selectedClip.director}</Badge>
                )}
                {selectedClip.budget && (
                  <Badge variant="secondary">Budget: {selectedClip.budget}</Badge>
                )}
              </div>

              {/* Behind the Scenes */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Film className="h-4 w-4" /> Behind the Scenes
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {selectedClip.behindTheScenes}
                </p>
              </div>

              {/* Fun Facts */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Star className="h-4 w-4" /> Fun Facts
                </h4>
                <ul className="space-y-2">
                  {selectedClip.funFacts.map((fact, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
