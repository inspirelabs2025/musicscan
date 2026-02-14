import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SpotifyRecentTrack {
  id: string;
  spotify_track_id: string;
  artist: string;
  title: string;
  album?: string;
  image_url?: string;
  spotify_url?: string;
  duration_ms?: number;
  played_at: string;
}

export const useSpotifyRecentlyPlayed = (limit = 20) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['spotify-recently-played', user?.id, limit],
    queryFn: async (): Promise<SpotifyRecentTrack[]> => {
      if (!user) return [];

      const { data, error } = await (supabase as any)
        .from('spotify_recently_played')
        .select('*')
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

export const useSpotifyAudioFeatures = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['spotify-audio-features', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('spotify_user_stats')
        .select('data')
        .eq('user_id', user.id)
        .eq('stat_type', 'audio_features')
        .eq('time_range', 'medium_term')
        .single();

      if (error) return null;
      return data?.data as {
        danceability: number;
        energy: number;
        valence: number;
        acousticness: number;
        instrumentalness: number;
        liveness: number;
        speechiness: number;
        tempo: number;
        sample_size: number;
      } | null;
    },
    enabled: !!user,
  });
};
