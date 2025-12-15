import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Play, Film, Clock, Star, ChevronRight } from 'lucide-react';

interface VideoClip {
  id: string;
  title: string;
  artist: string;
  year: number;
  youtubeId: string;
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
    title: "Do They Know It's Christmas",
    artist: 'Band Aid',
    year: 1984,
    youtubeId: 'bjQzJAKxTrE',
    duration: '3:55',
    behindTheScenes: 'De hele opname, inclusief videoclip, werd in één dag gemaakt op 25 november 1984 in de SARM Studios in Londen. Bob Geldof en Midge Ure brachten de grootste Britse sterren samen voor het goede doel.',
    funFacts: [
      'Het nummer werd in slechts 24 uur geschreven en opgenomen',
      'Meer dan 40 artiesten namen deel',
      'Het bracht meer dan £8 miljoen op voor hongersnood in Ethiopië',
      "Bono's solo was oorspronkelijk niet gepland"
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
  {
    id: '5',
    title: 'Fairytale of New York',
    artist: 'The Pogues ft. Kirsty MacColl',
    year: 1987,
    youtubeId: 'j9jbdgZidu8',
    duration: '4:36',
    behindTheScenes: 'De videoclip werd opgenomen in New York City tijdens een koude decemberweek. Shane MacGowan en Kirsty MacColl brachten de rauwe emotie van het nummer perfect over in de clip, met authentieke New Yorkse locaties als achtergrond.',
    funFacts: [
      'Het nummer duurde twee jaar om te schrijven',
      'Kirsty MacColl was niet de eerste keuze voor de vrouwelijke stem',
      'De clip bevat echte NYPD politieauto\'s',
      'Regelmatig gekozen tot beste kerstnummer aller tijden in UK polls'
    ],
    director: 'Peter Dougherty'
  },
  {
    id: '6',
    title: 'Merry Christmas Everyone',
    artist: 'Shakin\' Stevens',
    year: 1985,
    youtubeId: 'ZeyHl1tQeaQ',
    duration: '3:32',
    behindTheScenes: 'De videoclip werd opgenomen in een studio met kunstsneeuw en een complete kerstdecoratie. Shakin\' Stevens staat bekend om zijn energieke performance en de clip vangt die vrolijke sfeer perfect.',
    funFacts: [
      'Het nummer was origineel geschreven voor Elvis Presley',
      'De clip werd in één dag opgenomen',
      'Shakin\' Stevens had de nummer 1 hit tijdens kerst 1985',
      'De clip kostte relatief weinig om te produceren'
    ],
    director: 'Onbekend'
  },
  {
    id: '7',
    title: 'Happy Xmas (War Is Over)',
    artist: 'John Lennon & Yoko Ono',
    year: 1971,
    youtubeId: 'yN4Uu0OlmTg',
    duration: '3:37',
    behindTheScenes: 'Het nummer werd opgenomen in oktober 1971 als protestsong tegen de Vietnamoorlog. De videoclip bevat beelden van John en Yoko samen met The Plastic Ono Band en het Harlem Community Choir.',
    funFacts: [
      'Het kinderkoor bestond uit 30 kinderen uit Harlem',
      'Het nummer werd pas na John\'s dood een jaarlijkse kersthit',
      'De "War Is Over" posters waren onderdeel van een wereldwijde campagne',
      'Phil Spector produceerde het nummer'
    ],
    budget: 'Onbekend',
    director: 'Onbekend'
  },
  {
    id: '8',
    title: 'Wonderful Christmastime',
    artist: 'Paul McCartney',
    year: 1979,
    youtubeId: 'V9BZDpni56Y',
    duration: '3:48',
    behindTheScenes: 'Paul McCartney schreef en produceerde dit nummer volledig zelf in zijn thuisstudio. De videoclip toont Paul met zijn band Wings in een feestelijke setting met veel synthesizers.',
    funFacts: [
      'McCartney speelde alle instrumenten zelf',
      'Het nummer gebruikt een van de eerste synthesizers',
      'Verdient jaarlijks meer dan $400.000 aan royalties',
      'De clip werd opgenomen in één take'
    ],
    director: 'Onbekend'
  },
  {
    id: '9',
    title: 'Rockin\' Around The Christmas Tree',
    artist: 'Brenda Lee',
    year: 1958,
    youtubeId: 'QaRFsJnskmY',
    duration: '2:05',
    behindTheScenes: 'Brenda Lee was slechts 13 jaar oud toen ze dit nummer opnam. De opname duurde minder dan een uur en werd gedaan in juli, midden in de zomer in Nashville.',
    funFacts: [
      'Brenda Lee was pas 13 tijdens de opname',
      'Het nummer werd opgenomen in de zomer',
      'Duurde 2 jaar voordat het een hit werd',
      'Nu een van de bestverkopende kerstnummers ooit'
    ],
    director: 'Onbekend'
  },
  {
    id: '10',
    title: 'Jingle Bell Rock',
    artist: 'Bobby Helms',
    year: 1957,
    youtubeId: 'Z0ajuTaHBtM',
    duration: '2:10',
    behindTheScenes: 'Bobby Helms nam dit nummer op in Nashville met de beste studiomuzikanten van die tijd. Het nummer combineert rock-and-roll met traditionele kerstmuziek, wat destijds zeer vernieuwend was.',
    funFacts: [
      'Het nummer was een van de eerste rock-and-roll kersthits',
      'Bobby Helms ontving nooit royalties door een slecht contract',
      'De gitaarriff is gebaseerd op "Rock Around The Clock"',
      'Populair geworden door de film Home Alone'
    ],
    director: 'Onbekend'
  },
  {
    id: '11',
    title: 'White Christmas',
    artist: 'Bing Crosby',
    year: 1942,
    youtubeId: 'GJSUT8Inl14',
    duration: '3:03',
    behindTheScenes: 'Bing Crosby nam dit nummer op in slechts 18 minuten. Het nummer werd geschreven door Irving Berlin en werd voor het eerst uitgevoerd in de film Holiday Inn.',
    funFacts: [
      'Bestverkopende single aller tijden met 50+ miljoen exemplaren',
      'Irving Berlin schreef het nummer in één nacht',
      'De originele opname uit 1942 was beschadigd en werd opnieuw opgenomen in 1947',
      'Het nummer won een Academy Award'
    ],
    director: 'Onbekend'
  },
  {
    id: '12',
    title: 'Santa Claus Is Comin\' To Town',
    artist: 'Bruce Springsteen',
    year: 1985,
    youtubeId: '76WFkKp8Tjs',
    duration: '4:30',
    behindTheScenes: 'Bruce Springsteen nam deze live-versie op tijdens een concert in 1975, maar het werd pas in 1985 officieel uitgebracht. De energieke performance met de E Street Band is legendarisch.',
    funFacts: [
      'Opgenomen tijdens een live concert in 1975',
      'Clarence Clemons\' saxofoonsolo is iconisch',
      'Het nummer was oorspronkelijk bedoeld als B-kant',
      'Nu een van de populairste rockkerstliedjes'
    ],
    director: 'Onbekend'
  },
  {
    id: '13',
    title: 'Let It Snow! Let It Snow! Let It Snow!',
    artist: 'Dean Martin',
    year: 1959,
    youtubeId: 'mN7LW0Y00kE',
    duration: '2:00',
    behindTheScenes: 'Dean Martin nam dit nummer op in Los Angeles, waar het ironisch genoeg nooit sneeuwt. Zijn relaxte zangstijl maakte het nummer tijdloos.',
    funFacts: [
      'Het originele nummer werd geschreven in een hittegolf',
      'Dean Martin nam het op in één sessie',
      'Het nummer gaat eigenlijk niet over kerst',
      'Vaak gebruikt in kerstfilms en commercials'
    ],
    director: 'Onbekend'
  },
  {
    id: '14',
    title: 'Santa Baby',
    artist: 'Eartha Kitt',
    year: 1953,
    youtubeId: 'jFMyF9fDKzE',
    duration: '3:23',
    behindTheScenes: 'Eartha Kitt nam dit verleidelijke kerstnummer op met haar kenmerkende ronkende stem. Het nummer was controversieel vanwege de suggestieve tekst.',
    funFacts: [
      'Het nummer werd verboden op sommige radiostations',
      'Eartha Kitt improviseerde veel van de vocale versieringen',
      'Talloze artiesten hebben het nummer gecoverd',
      'Madonna\'s versie uit 1987 is ook zeer populair'
    ],
    director: 'Onbekend'
  },
  {
    id: '15',
    title: 'Feliz Navidad',
    artist: 'José Feliciano',
    year: 1970,
    youtubeId: 'N8NcQzMQN_U',
    duration: '3:07',
    behindTheScenes: 'José Feliciano schreef dit nummer in slechts 5 minuten. Hij wilde een eenvoudig nummer maken dat zowel Engelstalige als Spaanstalige luisteraars zou aanspreken.',
    funFacts: [
      'Geschreven in 5 minuten',
      'Een van de meest gestreamde kerstnummers ter wereld',
      'José Feliciano is blind sinds zijn geboorte',
      'Het nummer is populair in meer dan 100 landen'
    ],
    director: 'Onbekend'
  },
  {
    id: '16',
    title: 'Underneath the Tree',
    artist: 'Kelly Clarkson',
    year: 2013,
    youtubeId: 'YfF10ow4YEo',
    duration: '3:40',
    behindTheScenes: 'Kelly Clarkson schreef dit nummer samen met producer Greg Kurstin. De videoclip toont Kelly in een winter wonderland setting met dansers en veel glitter.',
    funFacts: [
      'Het nummer werd in één sessie geschreven',
      'De clip bevat meer dan 100 dansers',
      'Een van de succesvolste moderne kerstnummers',
      'Kelly noemde het haar "moderne kerstklassieker"'
    ],
    director: 'Onbekend'
  },
  {
    id: '17',
    title: 'Mistletoe',
    artist: 'Justin Bieber',
    year: 2011,
    youtubeId: 'LUjn3RpkcKY',
    duration: '3:11',
    behindTheScenes: 'Justin Bieber bracht dit nummer uit als onderdeel van zijn kerstalbum "Under the Mistletoe". De videoclip toont Justin in een romantische kerstsetting.',
    funFacts: [
      'Het nummer debuteerde op nummer 11 in de Billboard Hot 100',
      'De clip werd opgenomen in Los Angeles met kunstsneeuw',
      'Het album werd nummer 1 in de VS',
      'Justin was 17 jaar oud tijdens de release'
    ],
    director: 'Roman White'
  },
  {
    id: '18',
    title: "It's The Most Wonderful Time Of The Year",
    artist: 'Andy Williams',
    year: 1963,
    youtubeId: 'gFtb3EtjEic',
    duration: '2:32',
    behindTheScenes: 'Andy Williams nam dit nummer op voor zijn kerstalbum. Zijn warme stem en de orkestrale arrangement maakten het tot een instant klassieker.',
    funFacts: [
      'Het nummer werd oorspronkelijk geschreven voor een reclamespotje',
      'Andy Williams had zijn eigen kerstshow op TV',
      'Het nummer duurde decennia voordat het populair werd',
      'Nu een van de meest gebruikte kerstnummers in commercials'
    ],
    director: 'Onbekend'
  },
  {
    id: '19',
    title: 'Christmas (Baby Please Come Home)',
    artist: 'Darlene Love',
    year: 1963,
    youtubeId: 'UV8x7H3DD8Y',
    duration: '2:47',
    behindTheScenes: 'Geproduceerd door Phil Spector met zijn beroemde "Wall of Sound" techniek. Darlene Love leverde een van de krachtigste vocale prestaties in de kerstmuziekgeschiedenis.',
    funFacts: [
      'Onderdeel van Phil Spector\'s "A Christmas Gift for You" album',
      'Darlene Love zong het 21 jaar lang bij David Letterman',
      'Het nummer flopte bij de eerste release',
      'Nu beschouwd als een van de beste kerstnummers ooit'
    ],
    director: 'Onbekend'
  },
  {
    id: '20',
    title: "It's Beginning to Look a Lot Like Christmas",
    artist: 'Michael Bublé',
    year: 2011,
    youtubeId: 'QJ5DOWPGxwg',
    duration: '3:26',
    behindTheScenes: 'Michael Bublé nam deze cover op voor zijn succesvolle kerstalbum "Christmas". De clip toont Michael in een klassieke kerstsetting.',
    funFacts: [
      'Michael\'s kerstalbum is het bestverkopende kerstalbum van de 2010s',
      'Het originele nummer is uit 1951',
      'De clip werd opgenomen in Vancouver, Canada',
      'Michael\'s versie overtrof het origineel in populariteit'
    ],
    director: 'Onbekend'
  },
  {
    id: '21',
    title: 'Winter Wonderland',
    artist: 'Tony Bennett',
    year: 1968,
    youtubeId: 'u8tS0aPITNw',
    duration: '2:14',
    behindTheScenes: 'Tony Bennett bracht talloze versies van dit klassieker uit gedurende zijn carrière. Zijn warme jazzy interpretatie is een favoriet geworden.',
    funFacts: [
      'Het originele nummer is uit 1934',
      'Het nummer gaat over Central Park in New York',
      'Tony Bennett zong het samen met Lady Gaga in 2014',
      'Een van de meest gecoverde kerstnummers'
    ],
    director: 'Onbekend'
  },
  {
    id: '22',
    title: 'All I Want for Christmas Is My Two Front Teeth',
    artist: 'Spike Jones',
    year: 1948,
    youtubeId: 'WqfE2Do6GqE',
    duration: '2:15',
    behindTheScenes: 'Dit grappige nummer werd geïnspireerd door een onderwijzer die zag hoeveel kinderen hun voortanden misten tijdens de kerst.',
    funFacts: [
      'Geschreven door een muziekleraar',
      'Het nummer bereikte nummer 1 in de VS',
      'Spike Jones was bekend om zijn komische nummers',
      'Nog steeds populair bij kinderen'
    ],
    director: 'Onbekend'
  },
  {
    id: '23',
    title: 'Have Yourself a Merry Little Christmas',
    artist: 'Judy Garland',
    year: 1944,
    youtubeId: 'jLcyTCuB8lw',
    duration: '3:25',
    behindTheScenes: 'Judy Garland zong dit nummer voor het eerst in de film "Meet Me in St. Louis". De oorspronkelijke tekst was zo triest dat ze vroeg om wijzigingen.',
    funFacts: [
      'De originele tekst was veel somberder',
      'Judy Garland weigerde de originele versie te zingen',
      'Frank Sinatra veranderde later nog meer tekst',
      'Een van de meest emotionele kerstnummers'
    ],
    director: 'Vincente Minnelli'
  },
  {
    id: '24',
    title: 'Blue Christmas',
    artist: 'Elvis Presley',
    year: 1957,
    youtubeId: 'bViUKShNnfw',
    duration: '2:08',
    behindTheScenes: 'Elvis nam dit nummer op tijdens een sessie in september 1957. Zijn versie werd een kersthit ondanks dat hij het niet als single uitbracht.',
    funFacts: [
      'Elvis nam het op in één take',
      'Het nummer was oorspronkelijk een countrynummer',
      'De "Blue Christmas" uithaal is iconisch',
      'Populair geworden door Elvis\' kerstspecial van 1968'
    ],
    director: 'Onbekend'
  }
];

export const ChristmasBehindTheClip = () => {
  const [selectedClip, setSelectedClip] = useState<VideoClip | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const handleClipClick = (clip: VideoClip) => {
    setSelectedClip(clip);
    setShowVideo(false);
    setIsOpen(true);
  };

  const displayedClips = showAll ? CHRISTMAS_CLIPS : CHRISTMAS_CLIPS.slice(0, 8);

  const getThumbnail = (youtubeId: string) => `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

  return (
    <>
      <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            🎬 Behind the Videoclip
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ontdek de verhalen achter {CHRISTMAS_CLIPS.length} iconische kerstvideoclips
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayedClips.map((clip) => (
              <button
                key={clip.id}
                onClick={() => handleClipClick(clip)}
                className="group relative aspect-video rounded-xl overflow-hidden bg-muted/20"
              >
                <img 
                  src={getThumbnail(clip.youtubeId)} 
                  alt={`${clip.title} - ${clip.artist}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Play Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="h-5 w-5 text-white ml-0.5" />
                  </div>
                </div>

                {/* Info */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      {clip.year}
                    </Badge>
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      <Clock className="h-2.5 w-2.5 mr-0.5" /> {clip.duration}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-white text-sm line-clamp-1">{clip.title}</h4>
                  <p className="text-white/80 text-xs line-clamp-1">{clip.artist}</p>
                </div>
              </button>
            ))}
          </div>

          {!showAll && CHRISTMAS_CLIPS.length > 8 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAll(true)}
                className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1 mx-auto"
              >
                Toon alle {CHRISTMAS_CLIPS.length} videoclips
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {showAll && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAll(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-medium"
              >
                Toon minder
              </button>
            </div>
          )}
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
                      src={getThumbnail(selectedClip.youtubeId)} 
                      alt={selectedClip.title}
                      className="w-full h-full object-cover"
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
                {selectedClip.director && selectedClip.director !== 'Onbekend' && (
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
