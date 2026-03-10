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
  const mediaIcon = album.media_type === 'vinyl' ? <Disc className="w-4 h-4" /> : <Music className="w-4 h-4" />;
  const mediaColor = album.media_type === 'vinyl' ? 'text-vinyl-purple' : 'text-vinyl-gold';

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-vinyl-purple/30 hover-scale animate-fade-in bg-gradient-to-br from-card via-card to-accent/5">
      <CardContent className="p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-vinyl-purple/5 via-transparent to-vinyl-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative z-10">
          <div className="w-full aspect-square mb-3 bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden group-hover:scale-105 transition-all duration-300">
            {album.image_url ? (
              <img src={album.image_url} alt={`${album.artist} - ${album.title}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-vinyl-purple/20 to-vinyl-gold/20">{mediaIcon}</div>
            )}
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground/90 group-hover:text-vinyl-purple transition-colors line-clamp-1">{album.title}</div>
            <div className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors line-clamp-1">{album.artist}</div>
            {album.year && <div className="text-xs text-muted-foreground">{album.year}</div>}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="w-3 h-3" /><span>{uploadDate}</span></div>
              <div className={`flex items-center gap-1 text-xs ${mediaColor}`}>{mediaIcon}<span className="capitalize">{album.media_type}</span></div>
            </div>
          </div>
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
      <section className="py-12 bg-gradient-to-r from-accent/5 via-background to-accent/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Music className="w-6 h-6 text-vinyl-purple" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-vinyl-purple to-vinyl-gold bg-clip-text text-transparent">{d.newestUploads}</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
            {[...Array(6)].map((_, i) => <div key={i}><Skeleton className="h-[200px] w-full rounded-lg" /></div>)}
          </div>
        </div>
      </section>
    );
  }

  if (!albums || albums.length === 0) return null;

  return (
    <section className="py-12 bg-gradient-to-r from-accent/5 via-background to-accent/5 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-1/4 animate-pulse">🎵</div>
        <div className="absolute top-20 right-1/4 animate-pulse delay-300">🎶</div>
        <div className="absolute bottom-20 left-1/3 animate-pulse delay-600">♪</div>
        <div className="absolute bottom-10 right-1/3 animate-pulse delay-900">♫</div>
      </div>
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Music className="w-6 h-6 text-vinyl-purple animate-pulse" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-vinyl-purple to-vinyl-gold bg-clip-text text-transparent">{d.newestUploads}</h2>
            <Disc className="w-6 h-6 text-vinyl-gold animate-pulse delay-300" />
          </div>
          <p className="text-muted-foreground">{d.discoverLatestAlbums}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
          {albums.map((album) => <AlbumCard key={album.id} album={album} language={language} />)}
        </div>
        <div className="text-center mt-6 animate-fade-in delay-300">
          <p className="text-sm text-muted-foreground">{d.addYourCollection}</p>
        </div>
      </div>
    </section>
  );
};
