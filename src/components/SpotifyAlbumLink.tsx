import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface SpotifyAlbumLinkProps {
  artist: string;
  album: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export const SpotifyAlbumLink: React.FC<SpotifyAlbumLinkProps> = ({
  artist,
  album,
  variant = 'outline',
  size = 'sm',
  className = ''
}) => {
  const handleSpotifySearch = () => {
    const searchQuery = encodeURIComponent(`${artist} ${album}`);
    const spotifyUrl = `https://open.spotify.com/search/${searchQuery}`;
    window.open(spotifyUrl, '_blank', 'noopener,noreferrer');
  };

  if (!artist || !album) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSpotifySearch}
      className={`${className} text-green-600 hover:text-green-700 border-green-200 hover:border-green-300 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:border-green-800 dark:hover:border-green-700 dark:hover:bg-green-950`}
      title="Open op Spotify"
    >
      <svg 
        className="w-4 h-4 mr-2" 
        viewBox="0 0 24 24" 
        fill="currentColor"
      >
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
      </svg>
      Spotify
    </Button>
  );
};