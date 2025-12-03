import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SpotifyNewRelease {
  id: string;
  name: string;
  artist: string;
  image_url: string | null;
  spotify_url: string;
  release_date: string;
  slug: string | null;
}

export const useSpotifyNewReleases = () => {
  return useQuery({
    queryKey: ['spotify-new-releases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spotify_new_releases_processed')
        .select('id, artist, album_name, image_url, spotify_url, release_date, slug')
        .not('slug', 'is', null)
        .order('release_date', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('Error fetching Spotify new releases:', error);
        throw error;
      }
      
      // Map database columns to interface
      return (data || []).map(item => ({
        id: item.id,
        name: item.album_name,
        artist: item.artist,
        image_url: item.image_url,
        spotify_url: item.spotify_url,
        release_date: item.release_date,
        slug: item.slug
      })) as SpotifyNewRelease[];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes (data comes from DB, refreshed by cron)
    refetchOnWindowFocus: false,
    retry: 2,
  });
};
