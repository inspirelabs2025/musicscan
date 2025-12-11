import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Globe, Music, MapPin } from 'lucide-react';

interface CountryTradition {
  country: string;
  flag: string;
  traditions: string[];
  famousSongs: { title: string; artist: string }[];
  funFact: string;
}

const WORLD_TRADITIONS: CountryTradition[] = [
  {
    country: 'Nederland',
    flag: '🇳🇱',
    traditions: ['Sinterklaas op 5 december', 'Kerstboom versieren', 'Gourmetten met familie'],
    famousSongs: [
      { title: 'Merry Christmas Everyone', artist: 'Guus Meeuwis' },
      { title: 'Kerstmis met jou', artist: 'Jim Bakkum' },
    ],
    funFact: 'In Nederland vieren we eigenlijk twee kerstdagen!'
  },
  {
    country: 'Verenigde Staten',
    flag: '🇺🇸',
    traditions: ['Ugly Christmas Sweater parties', 'Eggnog drinken', 'Secret Santa'],
    famousSongs: [
      { title: 'All I Want For Christmas Is You', artist: 'Mariah Carey' },
      { title: 'Jingle Bell Rock', artist: 'Bobby Helms' },
    ],
    funFact: 'Amerikanen besteden gemiddeld $1000 aan kerstcadeaus!'
  },
  {
    country: 'Verenigd Koninkrijk',
    flag: '🇬🇧',
    traditions: ['Christmas Crackers', "Queen's Speech kijken", 'Mince Pies eten'],
    famousSongs: [
      { title: 'Last Christmas', artist: 'Wham!' },
      { title: 'Fairytale of New York', artist: 'The Pogues' },
    ],
    funFact: 'De UK Christmas #1 spot is een jaarlijkse strijd!'
  },
  {
    country: 'Duitsland',
    flag: '🇩🇪',
    traditions: ['Kerstmarkten bezoeken', 'Adventskalender', 'Stollen eten'],
    famousSongs: [
      { title: 'Stille Nacht', artist: 'Traditional' },
      { title: 'O Tannenbaum', artist: 'Traditional' },
    ],
    funFact: 'De kerstboom traditie komt oorspronkelijk uit Duitsland!'
  },
  {
    country: 'Zweden',
    flag: '🇸🇪',
    traditions: ['Lucia optocht op 13 december', 'Julbord (kerstbuffet)', 'Donald Duck kijken op kerstavond'],
    famousSongs: [
      { title: 'Nu tändas tusen juleljus', artist: 'Traditional' },
      { title: 'Dancing Queen (Christmas)', artist: 'ABBA' },
    ],
    funFact: 'Zweden kijkt massaal naar Donald Duck op kerstavond sinds 1959!'
  },
  {
    country: 'Australië',
    flag: '🇦🇺',
    traditions: ['Kerst op het strand', 'BBQ in plaats van diner', 'Carols by Candlelight'],
    famousSongs: [
      { title: 'Six White Boomers', artist: 'Rolf Harris' },
      { title: "Aussie Jingle Bells", artist: 'Bucko & Champs' },
    ],
    funFact: 'Het is zomer tijdens Kerst in Australië - perfect voor een stranddag!'
  },
  {
    country: 'Japan',
    flag: '🇯🇵',
    traditions: ['KFC eten op kerstavond', 'Kerstcake', 'Romantisch uitje met partner'],
    famousSongs: [
      { title: 'Christmas Eve', artist: 'Tatsuro Yamashita' },
      { title: 'Koibito ga Santa Claus', artist: 'Yumi Matsutoya' },
    ],
    funFact: 'KFC op kerstavond is zo populair dat je weken van tevoren moet reserveren!'
  },
  {
    country: 'Mexico',
    flag: '🇲🇽',
    traditions: ['Las Posadas (9 dagen feest)', 'Piñatas', 'Nochebuena viering'],
    famousSongs: [
      { title: 'Feliz Navidad', artist: 'José Feliciano' },
      { title: 'Los Peces en el Río', artist: 'Traditional' },
    ],
    funFact: 'Mexicaanse kerstviering duurt van 16 december tot 6 januari!'
  },
];

export const ChristmasWorldMap = () => {
  const [selectedCountry, setSelectedCountry] = useState<CountryTradition | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleCountryClick = (country: CountryTradition) => {
    setSelectedCountry(country);
    setIsOpen(true);
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-blue-900/20 to-green-900/20 border-blue-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            🗺️ Kerst Muziek Wereldkaart
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ontdek kersttradities en muziek van over de hele wereld
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {WORLD_TRADITIONS.map((country) => (
              <button
                key={country.country}
                onClick={() => handleCountryClick(country)}
                className="aspect-square rounded-xl bg-gradient-to-br from-blue-600/20 to-green-600/20 hover:from-blue-600/40 hover:to-green-600/40 transition-all p-4 flex flex-col items-center justify-center gap-2 hover:scale-105"
              >
                <span className="text-4xl">{country.flag}</span>
                <span className="text-sm font-medium text-center">{country.country}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              {selectedCountry?.flag} {selectedCountry?.country}
            </DialogTitle>
          </DialogHeader>
          {selectedCountry && (
            <div className="space-y-6">
              {/* Traditions */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4" /> Tradities
                </h4>
                <ul className="space-y-1">
                  {selectedCountry.traditions.map((tradition, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="text-green-500">•</span> {tradition}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Famous Songs */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Music className="h-4 w-4" /> Populaire Kerstnummers
                </h4>
                <div className="space-y-2">
                  {selectedCountry.famousSongs.map((song, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-muted/20 rounded-lg">
                      <Badge variant="outline">{i + 1}</Badge>
                      <div>
                        <p className="font-medium text-sm">{song.title}</p>
                        <p className="text-xs text-muted-foreground">{song.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fun Fact */}
              <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-lg p-4">
                <h4 className="font-semibold flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4" /> Wist je dat?
                </h4>
                <p className="text-sm text-muted-foreground">{selectedCountry.funFact}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
