import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SpotifyNewRelease {
  id: string;
  name: string;
  artist: string;
  image_url: string | null;
  spotify_url: string;
  release_date: string;
}

export const useSpotifyNewReleases = () => {
  return useQuery({
    queryKey: ['spotify-new-releases'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('spotify-new-releases');
      
      if (error) {
        console.error('Error fetching Spotify new releases:', error);
        throw error;
      }
      
      return data.albums as SpotifyNewRelease[];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  });
};
