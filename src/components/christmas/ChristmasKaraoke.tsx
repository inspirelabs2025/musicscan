import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, Play, Pause, Music } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface KaraokeSong {
  id: string;
  artist: string;
  song_title: string;
  lyrics_lines: { time: number; text: string }[] | null;
  language: string;
}

const DEFAULT_SONGS: KaraokeSong[] = [
  {
    id: '1',
    artist: 'Wham!',
    song_title: 'Last Christmas',
    language: 'en',
    lyrics_lines: [
      { time: 0, text: '🎵 Last Christmas, I gave you my heart' },
      { time: 4, text: 'But the very next day you gave it away' },
      { time: 8, text: 'This year, to save me from tears' },
      { time: 12, text: "I'll give it to someone special" },
      { time: 16, text: '🎵 Last Christmas, I gave you my heart' },
      { time: 20, text: 'But the very next day you gave it away' },
      { time: 24, text: 'This year, to save me from tears' },
      { time: 28, text: "I'll give it to someone special" },
      { time: 32, text: '🎤 Once bitten and twice shy' },
      { time: 36, text: 'I keep my distance, but you still catch my eye' },
    ]
  },
  {
    id: '2',
    artist: 'Mariah Carey',
    song_title: 'All I Want For Christmas Is You',
    language: 'en',
    lyrics_lines: [
      { time: 0, text: "🎵 I don't want a lot for Christmas" },
      { time: 4, text: 'There is just one thing I need' },
      { time: 8, text: "I don't care about the presents" },
      { time: 12, text: 'Underneath the Christmas tree' },
      { time: 16, text: "🎵 I just want you for my own" },
      { time: 20, text: 'More than you could ever know' },
      { time: 24, text: 'Make my wish come true' },
      { time: 28, text: 'All I want for Christmas is you' },
    ]
  },
  {
    id: '3',
    artist: 'Band Aid',
    song_title: "Do They Know It's Christmas",
    language: 'en',
    lyrics_lines: [
      { time: 0, text: "🎵 It's Christmas time, there's no need to be afraid" },
      { time: 4, text: 'At Christmas time, we let in light and we banish shade' },
      { time: 8, text: 'And in our world of plenty we can spread a smile of joy' },
      { time: 12, text: 'Throw your arms around the world at Christmas time' },
    ]
  },
];

export const ChristmasKaraoke = () => {
  const [songs, setSongs] = useState<KaraokeSong[]>(DEFAULT_SONGS);
  const [selectedSong, setSelectedSong] = useState<KaraokeSong | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  useEffect(() => {
    fetchKaraokeSongs();
  }, []);

  const fetchKaraokeSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('christmas_karaoke_lyrics')
        .select('*');

      if (data && data.length > 0) {
        setSongs(data.map(song => ({
          ...song,
          lyrics_lines: song.lyrics_lines as { time: number; text: string }[] | null
        })));
      }
    } catch (error) {
      console.error('Failed to fetch karaoke songs:', error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && selectedSong?.lyrics_lines) {
      interval = setInterval(() => {
        setCurrentLineIndex(prev => {
          if (prev >= (selectedSong.lyrics_lines?.length || 0) - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, selectedSong]);

  const handleSongSelect = (song: KaraokeSong) => {
    setSelectedSong(song);
    setCurrentLineIndex(0);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (!selectedSong) return;
    setIsPlaying(!isPlaying);
  };

  return (
    <Card className="bg-gradient-to-br from-pink-900/20 to-purple-900/20 border-pink-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          🎤 Kerst Karaoke
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Zing mee met de bekendste kersthits!
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {selectedSong ? (
          <div className="space-y-4">
            {/* Now Singing */}
            <div className="bg-gradient-to-r from-pink-600/20 to-purple-600/20 rounded-xl p-6 text-center">
              <Badge variant="secondary" className="mb-2">
                <Mic className="h-3 w-3 mr-1" /> Nu aan het zingen
              </Badge>
              <h3 className="text-xl font-bold">{selectedSong.song_title}</h3>
              <p className="text-muted-foreground">{selectedSong.artist}</p>
            </div>

            {/* Lyrics Display */}
            <div className="bg-black/40 rounded-xl p-6 min-h-[200px] flex flex-col items-center justify-center">
              {selectedSong.lyrics_lines && selectedSong.lyrics_lines.length > 0 ? (
                <div className="text-center space-y-4">
                  {currentLineIndex > 0 && (
                    <p className="text-muted-foreground text-sm opacity-50">
                      {selectedSong.lyrics_lines[currentLineIndex - 1]?.text}
                    </p>
                  )}
                  <p className={`text-2xl font-bold transition-all ${isPlaying ? 'text-yellow-400 scale-105' : 'text-white'}`}>
                    {selectedSong.lyrics_lines[currentLineIndex]?.text}
                  </p>
                  {currentLineIndex < selectedSong.lyrics_lines.length - 1 && (
                    <p className="text-muted-foreground text-sm opacity-50">
                      {selectedSong.lyrics_lines[currentLineIndex + 1]?.text}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Geen lyrics beschikbaar</p>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={togglePlay}
                className="w-14 h-14 rounded-full"
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
              </Button>
              <Button variant="outline" onClick={() => setSelectedSong(null)}>
                Kies ander nummer
              </Button>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {songs.map((song) => (
                <button
                  key={song.id}
                  onClick={() => handleSongSelect(song)}
                  className="w-full p-4 rounded-lg bg-muted/20 hover:bg-muted/40 transition-all text-left flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                    <Music className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{song.song_title}</p>
                    <p className="text-sm text-muted-foreground">{song.artist}</p>
                  </div>
                  <Badge variant="outline">{song.language?.toUpperCase() || 'EN'}</Badge>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
