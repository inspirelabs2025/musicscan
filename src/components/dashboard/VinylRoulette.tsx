import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Disc, Play, Shuffle, ExternalLink, Music } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotifyAlbumLink } from '@/components/SpotifyAlbumLink';
import { UnifiedAlbum } from '@/hooks/useUnifiedAlbums';

interface VinylRouletteProps {
  albums: UnifiedAlbum[];
}

export const VinylRoulette = ({ albums }: VinylRouletteProps) => {
  const [selectedAlbum, setSelectedAlbum] = useState<UnifiedAlbum | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinCount, setSpinCount] = useState(0);

  const spinTheWheel = () => {
    if (!albums || albums.length === 0) return;
    
    setIsSpinning(true);
    setSelectedAlbum(null);
    
    // Simulate spinning animation
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * albums.length);
      const selected = albums[randomIndex];
      setSelectedAlbum(selected);
      setIsSpinning(false);
      setSpinCount(prev => prev + 1);
    }, 2000);
  };

  const getMotivationalMessage = () => {
    const messages = [
      "🎵 Het universum heeft gesproken!",
      "✨ Je muzikale lot is bepaald!",
      "🎯 Perfect voor dit moment!",
      "🌟 Een uitstekende keuze van het lot!",
      "🎪 De roulette heeft beslist!",
      "🎭 Laat de muziek je leiden!",
      "🔮 De kristallen bol van de muziek!"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getAlbumRecommendation = (album: UnifiedAlbum) => {
    const baseRecommendations = [
      `🌅 Perfect voor een ochtend luistersessie`,
      `🌙 Ideaal voor avondontspanning`,
      `☕ Geweldig bij een kopje koffie`,
      `🍷 Perfect voor een glas wijn`,
      `🏃‍♂️ Motiverend voor je workout`,
      `📚 Uitstekende achtergrondmuziek`,
      `🎨 Inspirerend voor creatieve momenten`,
      `🚗 Perfect voor je volgende roadtrip`
    ];
    
    const sourceSpecific = album.source === 'spotify' 
      ? [`🎧 Stream direct vanaf Spotify`, `🎵 Beluister nu via Spotify`]
      : [`📀 Tijd om de fysieke versie op te zetten`, `💿 Een perfecte plaat voor je draaitafel`];
    
    const allRecommendations = [...baseRecommendations, ...sourceSpecific];
    return allRecommendations[Math.floor(Math.random() * allRecommendations.length)];
  };

  if (!albums || albums.length === 0) {
    return (
      <Card className="border-2 hover:border-vinyl-purple/50 transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Disc className="w-5 h-5 text-vinyl-purple" />
            🎰 Vinyl Roulette
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">
            Voeg albums toe aan je collectie om de roulette te gebruiken!
          </p>
          <Button asChild>
            <Link to="/scanner">
              <Play className="w-4 h-4 mr-2" />
              Start Scannen
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 hover:border-vinyl-purple/50 transition-all duration-300 bg-gradient-to-br from-background via-vinyl-purple/5 to-background">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Disc className="w-5 h-5 text-vinyl-purple" />
            🎰 Vinyl Roulette
          </div>
          <Badge variant="secondary">
            {albums.length} albums
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Roulette Wheel */}
        <div className="text-center">
          <motion.div
            animate={isSpinning ? { rotate: 360 * 5 } : { rotate: 0 }}
            transition={isSpinning ? { 
              duration: 2, 
              ease: "easeOut" 
            } : { duration: 0 }}
            className="w-24 h-24 mx-auto mb-4"
          >
            <div className="w-full h-full bg-gradient-to-br from-vinyl-purple via-primary to-vinyl-gold rounded-full flex items-center justify-center shadow-lg">
              <Disc className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          <Button
            onClick={spinTheWheel}
            disabled={isSpinning}
            className="bg-gradient-to-r from-vinyl-purple to-vinyl-gold hover:shadow-lg"
          >
            {isSpinning ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                </motion.div>
                Draaien...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Draai de Roulette!
              </>
            )}
          </Button>
        </div>

        {/* Selected Album */}
        <AnimatePresence>
          {selectedAlbum && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-accent/10 rounded-lg p-4 text-center space-y-3"
            >
              <div className="text-sm text-vinyl-gold font-medium">
                {getMotivationalMessage()}
              </div>
              
              <div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h4 className="font-bold text-lg">{selectedAlbum.title}</h4>
                  <Badge variant={selectedAlbum.source === 'spotify' ? 'default' : 'secondary'} className="text-xs">
                    {selectedAlbum.source === 'spotify' ? (
                      <><Music className="w-3 h-3 mr-1" />Spotify</>
                    ) : (
                      <><Disc className="w-3 h-3 mr-1" />Gescand</>
                    )}
                  </Badge>
                </div>
                <p className="text-vinyl-purple font-medium">{selectedAlbum.artist}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  {selectedAlbum.year && (
                    <Badge variant="outline">{selectedAlbum.year}</Badge>
                  )}
                  {selectedAlbum.genre && (
                    <Badge variant="outline">{selectedAlbum.genre}</Badge>
                  )}
                </div>
              </div>

              <div className="text-xs text-muted-foreground italic">
                {getAlbumRecommendation(selectedAlbum)}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  asChild 
                  size="sm" 
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <Link to="/my-collection">
                    <Music className="w-3 h-3" />
                    In Collectie
                  </Link>
                </Button>
                
                {selectedAlbum.source === 'spotify' ? (
                  <SpotifyAlbumLink
                    artist={selectedAlbum.artist}
                    album={selectedAlbum.album_name || selectedAlbum.title}
                    audioLinks={{ spotify: selectedAlbum.spotify_url }}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  />
                ) : selectedAlbum.discogs_id ? (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <a 
                      href={`https://www.discogs.com/release/${selectedAlbum.discogs_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Discogs
                    </a>
                  </Button>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        {spinCount > 0 && (
          <div className="text-center pt-4 border-t border-accent/20">
            <p className="text-xs text-muted-foreground">
              🎯 Je hebt {spinCount} keer gedraaid vandaag
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};