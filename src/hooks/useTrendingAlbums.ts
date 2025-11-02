import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TrendingAlbum {
  id: string;
  artist: string;
  title: string;
  cover_image?: string;
  scan_count: number;
}

export const useTrendingAlbums = () => {
  return useQuery({
    queryKey: ['trending-albums'],
    queryFn: async () => {
      // Get most scanned albums from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('unified_scans')
        .select('artist, title, cover_image, discogs_id')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Count occurrences
      const albumMap = new Map<string, TrendingAlbum>();
      
      data?.forEach((scan) => {
        const key = `${scan.artist}-${scan.title}`;
        if (albumMap.has(key)) {
          const existing = albumMap.get(key)!;
          existing.scan_count++;
        } else {
          albumMap.set(key, {
            id: scan.discogs_id || key,
            artist: scan.artist,
            title: scan.title,
            cover_image: scan.cover_image,
            scan_count: 1
          });
        }
      });

      // Convert to array and sort by count
      const trending = Array.from(albumMap.values())
        .sort((a, b) => b.scan_count - a.scan_count)
        .slice(0, 6);

      return trending;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
