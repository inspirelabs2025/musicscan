import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SpotifyPlaylist {
  id: string;
  spotify_playlist_id: string;
  name: string;
  description?: string;
  track_count: number;
  is_public: boolean;
  image_url?: string;
  spotify_url?: string;
  owner_id?: string;
  snapshot_id?: string;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface SpotifyTrack {
  id: string;
  spotify_track_id: string;
  user_id: string;
  artist: string;
  title: string;
  album?: string;
  genre?: string;
  year?: number;
  popularity?: number;
  duration_ms?: number;
  explicit: boolean;
  preview_url?: string;
  spotify_url?: string;
  image_url?: string;
  audio_features?: any;
  playlist_id?: string;
  added_at: string;
  created_at: string;
  updated_at: string;
}

export interface SpotifyUserStat {
  id: string;
  stat_type: 'top_tracks' | 'top_artists';
  time_range: 'short_term' | 'medium_term' | 'long_term';
  spotify_id: string;
  name: string;
  data: any;
  rank_position?: number;
  created_at: string;
  updated_at: string;
}

export const useSpotifyPlaylists = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['spotify-playlists', user?.id],
    queryFn: async (): Promise<SpotifyPlaylist[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('spotify_playlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

export const useSpotifyTracks = (playlistId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['spotify-tracks', user?.id, playlistId],
    queryFn: async (): Promise<SpotifyTrack[]> => {
      if (!user) return [];

      let query = supabase
        .from('spotify_tracks')
        .select('*')
        .eq('user_id', user.id);

      if (playlistId) {
        query = query.eq('playlist_id', playlistId);
      }

      const { data, error } = await query.order('added_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

export const useSpotifyTopTracks = (timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['spotify-top-tracks', user?.id, timeRange],
    queryFn: async (): Promise<SpotifyUserStat[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('spotify_user_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('stat_type', 'top_tracks')
        .eq('time_range', timeRange)
        .order('rank_position', { ascending: true });

      if (error) throw error;
      return (data || []) as SpotifyUserStat[];
    },
    enabled: !!user,
  });
};

export const useSpotifyTopArtists = (timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['spotify-top-artists', user?.id, timeRange],
    queryFn: async (): Promise<SpotifyUserStat[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('spotify_user_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('stat_type', 'top_artists')
        .eq('time_range', timeRange)
        .order('rank_position', { ascending: true });

      if (error) throw error;
      return (data || []) as SpotifyUserStat[];
    },
    enabled: !!user,
  });
};

export const useSpotifyStats = () => {
  const { user } = useAuth();
  const { data: playlists } = useSpotifyPlaylists();
  const { data: tracks } = useSpotifyTracks();
  const { data: topTracks } = useSpotifyTopTracks();
  const { data: topArtists } = useSpotifyTopArtists();

  return useQuery({
    queryKey: ['spotify-stats', user?.id, playlists?.length, tracks?.length],
    queryFn: async () => {
      if (!tracks || !playlists) return null;

      // Calculate statistics
      const totalTracks = tracks.length;
      const totalPlaylists = playlists.length;
      
      // Extract genres from tracks
      const genres = tracks
        .filter(track => track.genre)
        .map(track => track.genre!)
        .reduce((acc, genre) => {
          acc[genre] = (acc[genre] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const topGenres = Object.entries(genres)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([genre, count]) => ({ genre, count }));

      // Extract artists
      const artists = tracks
        .map(track => track.artist)
        .reduce((acc, artist) => {
          acc[artist] = (acc[artist] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const topArtistsFromTracks = Object.entries(artists)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([artist, count]) => ({ artist, count }));

      // Calculate average track duration
      const validDurations = tracks.filter(track => track.duration_ms).map(track => track.duration_ms!);
      const avgDuration = validDurations.length > 0 
        ? validDurations.reduce((sum, duration) => sum + duration, 0) / validDurations.length 
        : 0;

      // Calculate explicit content percentage
      const explicitTracks = tracks.filter(track => track.explicit).length;
      const explicitPercentage = totalTracks > 0 ? (explicitTracks / totalTracks) * 100 : 0;

      return {
        totalTracks,
        totalPlaylists,
        topGenres,
        topArtists: topArtistsFromTracks,
        avgDurationMs: Math.round(avgDuration),
        explicitPercentage: Math.round(explicitPercentage),
        recentActivity: tracks.slice(0, 10), // Last 10 added tracks
      };
    },
    enabled: !!user && !!tracks && !!playlists,
  });
};