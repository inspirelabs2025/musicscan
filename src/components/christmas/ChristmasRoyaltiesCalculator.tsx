import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

const FAMOUS_CHRISTMAS_SONGS = [
  { title: 'All I Want For Christmas Is You', artist: 'Mariah Carey', yearlyStreams: 1000000000, royaltyPerStream: 0.004 },
  { title: 'Last Christmas', artist: 'Wham!', yearlyStreams: 800000000, royaltyPerStream: 0.004 },
  { title: 'Rockin\' Around The Christmas Tree', artist: 'Brenda Lee', yearlyStreams: 600000000, royaltyPerStream: 0.004 },
  { title: 'Jingle Bell Rock', artist: 'Bobby Helms', yearlyStreams: 500000000, royaltyPerStream: 0.004 },
  { title: 'It\'s Beginning to Look a Lot Like Christmas', artist: 'Michael Bublé', yearlyStreams: 400000000, royaltyPerStream: 0.004 },
];

export const ChristmasRoyaltiesCalculator = () => {
  const calculateRoyalties = (streams: number, rate: number) => {
    return (streams * rate).toLocaleString('nl-NL', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="bg-gradient-to-br from-green-900/20 to-red-900/20 border-green-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          💰 Kerst Royalties
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Geschatte verdiensten van kersthits per jaar
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {FAMOUS_CHRISTMAS_SONGS.map((song, index) => (
            <div 
              key={song.title}
              className="flex items-center justify-between p-3 bg-muted/20 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                  {index + 1}
                </Badge>
                <div>
                  <p className="font-medium text-sm">{song.title}</p>
                  <p className="text-xs text-muted-foreground">{song.artist}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-500">
                  {calculateRoyalties(song.yearlyStreams, song.royaltyPerStream)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(song.yearlyStreams)} streams
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 p-3 bg-muted/10 rounded-lg text-xs text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            Schattingen gebaseerd op Spotify streaming data en gemiddelde royalty van €0,004 per stream. 
            Werkelijke verdiensten variëren per artiest en contract.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
