import { TimeMachineEvent } from '@/hooks/useTimeMachineEvents';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause } from 'lucide-react';
import { useState } from 'react';

interface InteractiveSetlistProps {
  event: TimeMachineEvent;
}

export function InteractiveSetlist({ event }: InteractiveSetlistProps) {
  const [playingTrack, setPlayingTrack] = useState<number | null>(null);
  const setlist = event.setlist || [];

  if (!Array.isArray(setlist) || setlist.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center py-8">
            Geen setlist beschikbaar voor dit event.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handlePlayToggle = (index: number) => {
    setPlayingTrack(playingTrack === index ? null : index);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Music className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Setlist</h2>
          <p className="text-sm text-muted-foreground">
            {setlist.length} nummers gespeeld die nacht
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {setlist.map((track: any, index: number) => (
          <Card 
            key={index}
            className="hover:border-primary/50 transition-colors"
          >
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-2xl font-bold text-primary/60 w-8">
                    {track.position || index + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      {track.title}
                    </h3>
                    {track.duration && (
                      <p className="text-sm text-muted-foreground">
                        {track.duration}
                      </p>
                    )}
                  </div>
                </div>

                {track.audio_url && (
                  <Button
                    size="icon"
                    variant={playingTrack === index ? 'default' : 'outline'}
                    onClick={() => handlePlayToggle(index)}
                  >
                    {playingTrack === index ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>

              {/* Audio Player (simplified, in real app would use proper audio element) */}
              {track.audio_url && playingTrack === index && (
                <div className="mt-3 pt-3 border-t border-border">
                  <audio 
                    controls 
                    autoPlay 
                    className="w-full"
                    src={track.audio_url}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
