import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Music } from 'lucide-react';
import { motion } from 'framer-motion';

// Top kerst hits wereldwijd gebaseerd op streaming data 2014-2024
const TOP_CHRISTMAS_HITS = [
  { title: 'All I Want For Christmas Is You', artist: 'Mariah Carey', totalStreams: 16000000000, year: 1994, trend: 'up' },
  { title: 'Last Christmas', artist: 'Wham!', totalStreams: 11000000000, year: 1984, trend: 'up' },
  { title: 'Rockin\' Around The Christmas Tree', artist: 'Brenda Lee', totalStreams: 8500000000, year: 1958, trend: 'up' },
  { title: 'Jingle Bell Rock', artist: 'Bobby Helms', totalStreams: 7200000000, year: 1957, trend: 'stable' },
  { title: 'It\'s the Most Wonderful Time of the Year', artist: 'Andy Williams', totalStreams: 5800000000, year: 1963, trend: 'up' },
  { title: 'A Holly Jolly Christmas', artist: 'Burl Ives', totalStreams: 5200000000, year: 1965, trend: 'stable' },
  { title: 'It\'s Beginning to Look a Lot Like Christmas', artist: 'Michael Bublé', totalStreams: 4900000000, year: 2011, trend: 'up' },
  { title: 'Feliz Navidad', artist: 'José Feliciano', totalStreams: 4500000000, year: 1970, trend: 'stable' },
  { title: 'Santa Tell Me', artist: 'Ariana Grande', totalStreams: 4200000000, year: 2014, trend: 'up' },
  { title: 'Underneath the Tree', artist: 'Kelly Clarkson', totalStreams: 3800000000, year: 2013, trend: 'up' },
];

export const ChristmasRoyaltiesCalculator = () => {
  const formatStreams = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(0)}M`;
    return num.toLocaleString('nl-NL');
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3 text-green-500" />;
    return null;
  };

  return (
    <Card className="bg-gradient-to-br from-green-900/20 to-red-900/20 border-green-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <span className="text-2xl">🎵</span> Top 10 Kerst Hits Wereldwijd
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Meest gestreamde kerstnummers aller tijden (Spotify data 2014-2024)
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {TOP_CHRISTMAS_HITS.map((song, index) => (
            <motion.div 
              key={song.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Badge 
                  variant="outline" 
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' :
                    index === 1 ? 'bg-gray-400/20 border-gray-400 text-gray-400' :
                    index === 2 ? 'bg-orange-600/20 border-orange-600 text-orange-600' :
                    ''
                  }`}
                >
                  {index + 1}
                </Badge>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{song.title}</p>
                  <p className="text-xs text-muted-foreground">{song.artist} ({song.year})</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                <div>
                  <p className="font-bold text-foreground flex items-center gap-1 justify-end">
                    {formatStreams(song.totalStreams)}
                    {getTrendIcon(song.trend)}
                  </p>
                  <p className="text-xs text-muted-foreground">streams</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-border/50">
          <Music className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Gebaseerd op Spotify streaming cijfers. Mariah Carey's "All I Want For Christmas" blijft met afstand de meest gestreamde kersthit ooit.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
