import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useAlbumsWithBlogs } from "./useAlbumsWithBlogs";
import { useSpotifyTracks } from "./useSpotifyData";

export interface UnifiedAlbum {
  id: string;
  artist: string;
  title: string;
  year?: number;
  genre?: string;
  discogs_id?: number;
  created_at: string;
  condition_grade?: string;
  estimated_value?: number;
  source: 'scanned' | 'spotify';
  spotify_url?: string;
  image_url?: string;
  spotify_track_id?: string;
  album_name?: string; // For Spotify tracks that are part of an album
}

export const useUnifiedAlbums = () => {
  const { user } = useAuth();
  const { data: albumsWithBlogs, isLoading: blogsLoading } = useAlbumsWithBlogs();
  const { data: spotifyTracks, isLoading: spotifyLoading } = useSpotifyTracks();

  return useQuery({
    queryKey: ["unified-albums", user?.id, albumsWithBlogs?.length, spotifyTracks?.length],
    queryFn: async (): Promise<UnifiedAlbum[]> => {
      const unified: UnifiedAlbum[] = [];

      // Add scanned albums (with blogs)
      if (albumsWithBlogs) {
        const scannedAlbums = albumsWithBlogs.map(album => ({
          ...album,
          source: 'scanned' as const,
        }));
        unified.push(...scannedAlbums);
      }

      // Add Spotify tracks (transform to album format)
      if (spotifyTracks) {
        const spotifyAlbums = spotifyTracks.map(track => ({
          id: track.spotify_track_id,
          artist: track.artist,
          title: track.album || track.title, // Use album name if available, otherwise track title
          year: track.year,
          genre: track.genre,
          created_at: track.added_at,
          source: 'spotify' as const,
          spotify_url: track.spotify_url,
          image_url: track.image_url,
          spotify_track_id: track.spotify_track_id,
          album_name: track.album,
        }));
        unified.push(...spotifyAlbums);
      }

      // Sort by created_at/added_at (most recent first)
      return unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !blogsLoading && !spotifyLoading,
  });
};