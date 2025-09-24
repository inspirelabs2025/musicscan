import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SpotifyAlbumLinkProps {
  artist: string;
  album: string;
  audioLinks?: any; // From blog post frontmatter
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export const SpotifyAlbumLink: React.FC<SpotifyAlbumLinkProps> = ({
  artist,
  album,
  audioLinks,
  variant = 'outline',
  size = 'sm',
  className = ''
}) => {
  const [spotifyUrl, setSpotifyUrl] = useState<string | null>(null);
  const [linkType, setLinkType] = useState<'album' | 'artist' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    findSpotifyUrl();
  }, [artist, album, audioLinks]);

  const findSpotifyUrl = async () => {
    // First check if there's already a direct Spotify link in audio_links
    if (audioLinks && typeof audioLinks === 'object') {
      for (const [key, value] of Object.entries(audioLinks)) {
        if (typeof value === 'string' && value.includes('spotify.com/album/')) {
          setSpotifyUrl(value);
          setLinkType('album');
          return;
        }
      }
    }

    // If no direct link found, search using Spotify API
    if (!artist || !album) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('spotify-album-search', {
        body: { artist, album }
      });

      if (error) {
        console.error('Spotify search error:', error);
        return;
      }

      if (data?.success) {
        if (data?.albumUrl) {
          setSpotifyUrl(data.albumUrl);
          setLinkType('album');
        } else if (data?.artistUrl) {
          setSpotifyUrl(data.artistUrl);
          setLinkType('artist');
        }
      }
    } catch (error) {
      console.error('Failed to search Spotify:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpotifyClick = () => {
    if (spotifyUrl) {
      window.open(spotifyUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Fallback to artist search if no direct URL found
      const searchQuery = encodeURIComponent(artist);
      const fallbackUrl = `https://open.spotify.com/search/${searchQuery}`;
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Zoeken...';
    if (linkType === 'album') return 'Spotify';
    if (linkType === 'artist') return `${artist} op Spotify`;
    return 'Zoek op Spotify';
  };

  const getTooltipText = () => {
    if (linkType === 'album') return "Open album op Spotify";
    if (linkType === 'artist') return `Open ${artist} op Spotify`;
    return "Zoek op Spotify";
  };

  if (!artist || !album) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSpotifyClick}
      disabled={isLoading}
      className={`${className} text-green-600 hover:text-green-700 border-green-200 hover:border-green-300 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:border-green-800 dark:hover:border-green-700 dark:hover:bg-green-950`}
      title={getTooltipText()}
    >
      <svg 
        className="w-4 h-4 mr-2" 
        viewBox="0 0 24 24" 
        fill="currentColor"
      >
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
      </svg>
      {getButtonText()}
    </Button>
  );
};