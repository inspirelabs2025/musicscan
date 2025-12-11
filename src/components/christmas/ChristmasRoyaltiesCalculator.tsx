import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Music, TrendingUp } from 'lucide-react';

const FAMOUS_CHRISTMAS_SONGS = [
  { title: 'All I Want For Christmas Is You', artist: 'Mariah Carey', yearlyStreams: 1000000000, royaltyPerStream: 0.004 },
  { title: 'Last Christmas', artist: 'Wham!', yearlyStreams: 800000000, royaltyPerStream: 0.004 },
  { title: 'Rockin\' Around The Christmas Tree', artist: 'Brenda Lee', yearlyStreams: 600000000, royaltyPerStream: 0.004 },
  { title: 'Jingle Bell Rock', artist: 'Bobby Helms', yearlyStreams: 500000000, royaltyPerStream: 0.004 },
  { title: 'It\'s Beginning to Look a Lot Like Christmas', artist: 'Michael Bublé', yearlyStreams: 400000000, royaltyPerStream: 0.004 },
];

export const ChristmasRoyaltiesCalculator = () => {
  const [customStreams, setCustomStreams] = useState(1000000);
  const [royaltyRate, setRoyaltyRate] = useState([0.004]);

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
          💰 Kerst Royalties Calculator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Hoeveel verdienen artiesten met kersthits?
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Famous Songs */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Top Kerst Verdiensten (per jaar)
          </h3>
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
        </div>

        {/* Custom Calculator */}
        <div className="border-t pt-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4" /> Bereken Zelf
          </h3>
          
          <div className="space-y-2">
            <Label>Aantal Streams</Label>
            <Input
              type="number"
              value={customStreams}
              onChange={(e) => setCustomStreams(Number(e.target.value))}
              className="bg-background/50"
            />
            <p className="text-xs text-muted-foreground">
              {formatNumber(customStreams)} streams
            </p>
          </div>

          <div className="space-y-2">
            <Label>Royalty per Stream: €{royaltyRate[0].toFixed(4)}</Label>
            <Slider
              value={royaltyRate}
              onValueChange={setRoyaltyRate}
              min={0.001}
              max={0.01}
              step={0.0005}
              className="py-4"
            />
            <p className="text-xs text-muted-foreground">
              Spotify betaalt gemiddeld €0.003-0.005 per stream
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-600/20 to-red-600/20 rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Geschatte Royalties</p>
            <p className="text-4xl font-bold text-green-500">
              {calculateRoyalties(customStreams, royaltyRate[0])}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
