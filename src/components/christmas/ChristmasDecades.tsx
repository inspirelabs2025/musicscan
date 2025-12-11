import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Music, Star } from 'lucide-react';

interface DecadeSongs {
  decade: string;
  years: string;
  color: string;
  emoji: string;
  songs: { title: string; artist: string; year: number; highlight?: boolean }[];
  fact: string;
}

const DECADES: DecadeSongs[] = [
  {
    decade: '1940s',
    years: '1940-1949',
    color: 'from-amber-600 to-yellow-600',
    emoji: '📻',
    songs: [
      { title: 'White Christmas', artist: 'Bing Crosby', year: 1942, highlight: true },
      { title: 'Have Yourself a Merry Little Christmas', artist: 'Judy Garland', year: 1944 },
      { title: 'The Christmas Song', artist: 'Nat King Cole', year: 1946 },
    ],
    fact: 'White Christmas is het best verkochte single aller tijden!'
  },
  {
    decade: '1950s',
    years: '1950-1959',
    color: 'from-pink-600 to-rose-600',
    emoji: '🎸',
    songs: [
      { title: "Rockin' Around the Christmas Tree", artist: 'Brenda Lee', year: 1958, highlight: true },
      { title: 'Jingle Bell Rock', artist: 'Bobby Helms', year: 1957 },
      { title: 'Blue Christmas', artist: 'Elvis Presley', year: 1957 },
    ],
    fact: 'Rock & roll bracht een nieuwe energie naar kerstmuziek!'
  },
  {
    decade: '1960s',
    years: '1960-1969',
    color: 'from-purple-600 to-violet-600',
    emoji: '☮️',
    songs: [
      { title: "It's the Most Wonderful Time", artist: 'Andy Williams', year: 1963, highlight: true },
      { title: 'A Holly Jolly Christmas', artist: 'Burl Ives', year: 1965 },
      { title: 'Happy Xmas (War Is Over)', artist: 'John Lennon', year: 1971 },
    ],
    fact: 'De Sixties brachten ons klassiekers die nog steeds gedraaid worden!'
  },
  {
    decade: '1970s',
    years: '1970-1979',
    color: 'from-orange-600 to-amber-600',
    emoji: '🕺',
    songs: [
      { title: 'Merry Xmas Everybody', artist: 'Slade', year: 1973, highlight: true },
      { title: 'I Wish It Could Be Christmas Everyday', artist: 'Wizzard', year: 1973 },
      { title: 'Happy Xmas (War Is Over)', artist: 'John Lennon', year: 1971 },
    ],
    fact: 'Glam rock domineerde de Britse kerstcharts!'
  },
  {
    decade: '1980s',
    years: '1980-1989',
    color: 'from-cyan-600 to-blue-600',
    emoji: '📼',
    songs: [
      { title: 'Last Christmas', artist: 'Wham!', year: 1984, highlight: true },
      { title: "Do They Know It's Christmas", artist: 'Band Aid', year: 1984 },
      { title: 'Fairytale of New York', artist: 'The Pogues', year: 1987 },
    ],
    fact: 'Band Aid bracht artiesten samen voor het goede doel!'
  },
  {
    decade: '1990s',
    years: '1990-1999',
    color: 'from-green-600 to-emerald-600',
    emoji: '💿',
    songs: [
      { title: 'All I Want For Christmas Is You', artist: 'Mariah Carey', year: 1994, highlight: true },
      { title: "Underneath the Tree", artist: 'Kelly Clarkson', year: 2013 },
      { title: '2 Become 1', artist: 'Spice Girls', year: 1996 },
    ],
    fact: 'Mariah Carey werd de Queen of Christmas!'
  },
  {
    decade: '2000s',
    years: '2000-2009',
    color: 'from-red-600 to-rose-600',
    emoji: '📱',
    songs: [
      { title: "It's Christmas Time", artist: 'Michael Bublé', year: 2003, highlight: true },
      { title: 'Driving Home For Christmas', artist: 'Chris Rea', year: 1986 },
      { title: 'Santa Tell Me', artist: 'Ariana Grande', year: 2014 },
    ],
    fact: 'Crooners maakten een comeback met jazzy kerst albums!'
  },
  {
    decade: '2010s',
    years: '2010-2019',
    color: 'from-indigo-600 to-purple-600',
    emoji: '🎧',
    songs: [
      { title: 'Santa Tell Me', artist: 'Ariana Grande', year: 2014, highlight: true },
      { title: 'Christmas Tree Farm', artist: 'Taylor Swift', year: 2019 },
      { title: 'Underneath the Tree', artist: 'Kelly Clarkson', year: 2013 },
    ],
    fact: 'Streaming zorgde voor een kerst muziek revival!'
  },
];

export const ChristmasDecades = () => {
  const [selectedDecade, setSelectedDecade] = useState<DecadeSongs>(DECADES[4]); // 1980s default

  return (
    <Card className="bg-gradient-to-br from-indigo-900/20 to-pink-900/20 border-indigo-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          ⏰ Kerst Door de Decennia
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Reis door de tijd met kerstmuziek van 1940 tot nu
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Decade Selector */}
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {DECADES.map((decade) => (
              <Button
                key={decade.decade}
                variant={selectedDecade.decade === decade.decade ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDecade(decade)}
                className={`shrink-0 ${
                  selectedDecade.decade === decade.decade 
                    ? `bg-gradient-to-r ${decade.color}` 
                    : ''
                }`}
              >
                {decade.emoji} {decade.decade}
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Selected Decade Content */}
        <div className={`rounded-xl bg-gradient-to-br ${selectedDecade.color} p-6`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{selectedDecade.emoji}</span>
            <div>
              <h3 className="text-2xl font-bold text-white">{selectedDecade.decade}</h3>
              <p className="text-white/80 text-sm">{selectedDecade.years}</p>
            </div>
          </div>

          <div className="space-y-3">
            {selectedDecade.songs.map((song, index) => (
              <div 
                key={song.title}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  song.highlight ? 'bg-white/20' : 'bg-white/10'
                }`}
              >
                <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                  {index + 1}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white flex items-center gap-2">
                    {song.title}
                    {song.highlight && <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />}
                  </p>
                  <p className="text-white/70 text-sm truncate">{song.artist} • {song.year}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-white/10 rounded-lg">
            <p className="text-white/90 text-sm flex items-start gap-2">
              <Clock className="h-4 w-4 mt-0.5 shrink-0" />
              {selectedDecade.fact}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
