import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Music, Calendar, Disc } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';

interface Album {
  id: string;
  artist: string;
  title: string;
  label?: string;
  year?: number;
  created_at: string;
  media_type: 'cd' | 'vinyl';
  image_url?: string;
}

const useLatestAlbums = () => {
  return useQuery({
    queryKey: ['latest-albums'],
    queryFn: async () => {
      const { data: cdData, error: cdError } = await supabase
        .from('cd_scan')
        .select('id, artist, title, label, year, created_at, front_image')
        .not('artist', 'is', null)
        .not('title', 'is', null)
        .order('created_at', { ascending: false })
        .limit(3);
      if (cdError) throw cdError;

      const { data: vinylData, error: vinylError } = await supabase
        .from('vinyl2_scan')
        .select('id, artist, title, label, year, created_at, catalog_image')
        .not('artist', 'is', null)
        .not('title', 'is', null)
        .order('created_at', { ascending: false })
        .limit(3);
      if (vinylError) throw vinylError;

      const cdAlbums: Album[] = (cdData || []).map(item => ({ id: item.id, artist: item.artist, title: item.title, label: item.label, year: item.year, created_at: item.created_at, media_type: 'cd' as const, image_url: item.front_image }));
      const vinylAlbums: Album[] = (vinylData || []).map(item => ({ id: item.id, artist: item.artist, title: item.title, label: item.label, year: item.year, created_at: item.created_at, media_type: 'vinyl' as const, image_url: item.catalog_image }));

      return [...cdAlbums, ...vinylAlbums].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);
    },
    staleTime: 2 * 60 * 1000,
  });
};

const AlbumCard: React.FC<{ album: Album; language: string }> = ({ album, language }) => {
  const uploadDate = new Date(album.created_at).toLocaleDateString(language === 'nl' ? 'nl-NL' : 'en-US', { day: 'numeric', month: 'short' });
  const mediaIcon = album.media_type === 'vinyl' ? <Disc className="w-3.5 h-3.5" /> : <Music className="w-3.5 h-3.5" />;

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="w-full aspect-square mb-2 bg-muted rounded-md overflow-hidden">
          {album.image_url ? (
            <img src={album.image_url} alt={`${album.artist} - ${album.title}`} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              {mediaIcon}
            </div>
          )}
        </div>
        <p className="text-sm font-medium truncate">{album.title}</p>
        <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
        <div className="flex items-center justify-between mt-1.5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{uploadDate}</div>
          <div className="flex items-center gap-1">{mediaIcon}<span className="capitalize">{album.media_type}</span></div>
        </div>
      </CardContent>
    </Card>
  );
};

export const LatestAlbumsSection: React.FC = () => {
  const { data: albums, isLoading } = useLatestAlbums();
  const { tr, language } = useLanguage();
  const d = tr.dashboardUI;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Music className="w-4 h-4 text-primary" />
          {d.newestUploads}
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!albums || albums.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Music className="w-4 h-4 text-primary" />
        {d.newestUploads}
      </h2>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {albums.map((album) => <AlbumCard key={album.id} album={album} language={language} />)}
      </div>
    </div>
  );
};
