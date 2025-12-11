import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, VolumeX, Radio, SkipForward } from 'lucide-react';

const CHRISTMAS_STATIONS = [
  { 
    id: 'christmas-classics',
    name: 'Kerst Klassiekers',
    genre: 'Classic',
    url: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    description: 'Tijdloze kersthits',
    emoji: '🎄'
  },
  { 
    id: 'christmas-pop',
    name: 'Christmas Pop',
    genre: 'Pop',
    url: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    description: 'Moderne kerstpop',
    emoji: '🎅'
  },
  { 
    id: 'smooth-christmas',
    name: 'Smooth Christmas',
    genre: 'Jazz',
    url: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    description: 'Relaxte kerst jazz',
    emoji: '🎷'
  },
  { 
    id: 'christmas-rock',
    name: 'Christmas Rock',
    genre: 'Rock',
    url: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    description: 'Kerst met een rockend randje',
    emoji: '🎸'
  },
];

export const ChristmasRadioStream = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([0.7]);
  const [isMuted, setIsMuted] = useState(false);
  const [currentStation, setCurrentStation] = useState(CHRISTMAS_STATIONS[0]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(currentStation.url);
      audioRef.current.volume = volume[0];
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  const changeStation = (station: typeof CHRISTMAS_STATIONS[0]) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setCurrentStation(station);
    setIsPlaying(false);
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume[0];
    }
    if (newVolume[0] > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const nextStation = () => {
    const currentIndex = CHRISTMAS_STATIONS.findIndex(s => s.id === currentStation.id);
    const nextIndex = (currentIndex + 1) % CHRISTMAS_STATIONS.length;
    changeStation(CHRISTMAS_STATIONS[nextIndex]);
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-red-900/20 border-purple-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          📻 Kerst Radio
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          24/7 kerstmuziek streams
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Now Playing */}
        <div className="bg-gradient-to-r from-red-600/20 to-green-600/20 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-green-500 flex items-center justify-center text-3xl ${isPlaying ? 'animate-pulse' : ''}`}>
              {currentStation.emoji}
            </div>
            <div className="flex-1">
              <Badge variant="secondary" className="mb-1">
                <Radio className="h-3 w-3 mr-1" /> {isPlaying ? 'Nu Live' : 'Gestopt'}
              </Badge>
              <h3 className="text-xl font-bold">{currentStation.name}</h3>
              <p className="text-sm text-muted-foreground">{currentStation.description}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 mt-6">
            <Button
              size="lg"
              onClick={togglePlay}
              className="w-14 h-14 rounded-full"
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
            </Button>
            
            <Button size="icon" variant="outline" onClick={nextStation}>
              <SkipForward className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 flex-1">
              <Button size="icon" variant="ghost" onClick={toggleMute}>
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Slider
                value={isMuted ? [0] : volume}
                onValueChange={handleVolumeChange}
                max={1}
                step={0.01}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Station List */}
        <div className="grid grid-cols-2 gap-3">
          {CHRISTMAS_STATIONS.map((station) => (
            <button
              key={station.id}
              onClick={() => changeStation(station)}
              className={`p-4 rounded-lg text-left transition-all ${
                currentStation.id === station.id
                  ? 'bg-primary/20 ring-2 ring-primary'
                  : 'bg-muted/20 hover:bg-muted/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{station.emoji}</span>
                <div>
                  <p className="font-medium text-sm">{station.name}</p>
                  <p className="text-xs text-muted-foreground">{station.genre}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
