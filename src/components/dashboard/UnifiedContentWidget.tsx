import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Newspaper, BookOpen, Music2, ArrowRight, Clock, Sparkles, Music } from 'lucide-react';
import { useSpotifyNewReleases } from '@/hooks/useSpotifyNewReleases';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface UnifiedContentItem {
  id: string;
  type: 'release' | 'news' | 'album-story' | 'single-story';
  title: string;
  subtitle?: string;
  date: string;
  image?: string;
  link: string;
  isExternal?: boolean;
  badge: { label: string; className: string; };
}

const useUnifiedContent = () => {
  return useQuery({
    queryKey: ['unified-content'],
    queryFn: async () => {
      const [newsRes, userBlogsRes, musicStoriesRes] = await Promise.all([
        supabase.from('news_blog_posts').select('id, title, summary, slug, published_at, source, image_url').order('published_at', { ascending: false }).limit(5),
        supabase.from('blog_posts').select('id, slug, yaml_frontmatter, published_at, album_type').eq('is_published', true).order('published_at', { ascending: false }).limit(5),
        supabase.from('music_stories').select('id, title, slug, created_at, artist_name, single_name, artwork_url').eq('is_published', true).order('created_at', { ascending: false }).limit(5)
      ]);
      return { newsBlogs: newsRes.data || [], userBlogs: userBlogsRes.data || [], musicStories: musicStoriesRes.data || [] };
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const UnifiedContentWidget = () => {
  const [showAll, setShowAll] = useState(false);
  const { data: spotifyReleases = [], isLoading: l1 } = useSpotifyNewReleases();
  const { data: unifiedData, isLoading: l2 } = useUnifiedContent();
  const { tr, language } = useLanguage();
  const d = tr.dashboardUI;

  const transformToUnifiedItems = (spotifyReleases: any[], newsBlogs: any[], userBlogs: any[], musicStories: any[]): UnifiedContentItem[] => {
    const items: UnifiedContentItem[] = [];
    spotifyReleases.slice(0, 3).forEach((r) => items.push({ id: `release-${r.id}`, type: 'release', title: r.name, subtitle: r.artist, date: r.release_date, image: r.image_url, link: r.spotify_url, isExternal: true, badge: { label: d.spotifyLabel, className: 'bg-green-500 text-white' } }));
    newsBlogs.forEach((p: any) => items.push({ id: `news-${p.id}`, type: 'news', title: p.title, subtitle: p.source, date: p.published_at, image: p.image_url, link: `/nieuws/${p.slug}`, badge: { label: d.newsLabel, className: 'bg-blue-500 text-white' } }));
    userBlogs.forEach((p: any) => items.push({ id: `album-${p.id}`, type: 'album-story', title: `${p.yaml_frontmatter?.artist || d.unknownArtistFallback} - ${p.yaml_frontmatter?.title || d.albumFallback}`, date: p.published_at, link: `/plaat-verhaal/${p.slug}`, badge: { label: d.albumLabel, className: 'bg-purple-500 text-white' } }));
    musicStories.forEach((s: any) => items.push({ id: `single-${s.id}`, type: 'single-story', title: s.single_name ? `${s.artist_name} - ${s.single_name}` : s.title, date: s.created_at, image: s.artwork_url, link: `/muziek-verhaal/${s.slug}`, badge: { label: d.singleLabel, className: 'bg-amber-500 text-white' } }));
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString(language === 'nl' ? 'nl-NL' : 'en-US', { day: 'numeric', month: 'short' });

  if (l1 || l2) return <Card className="border-2"><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary animate-pulse" />{d.discoverAndLearn}</CardTitle></CardHeader><CardContent><div className="space-y-3">{[1,2,3,4,5,6].map(i => <div key={i} className="flex gap-3 p-3 border rounded-lg"><Skeleton className="w-16 h-16 rounded-lg" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>)}</div></CardContent></Card>;

  const items = transformToUnifiedItems(spotifyReleases, unifiedData?.newsBlogs || [], unifiedData?.userBlogs || [], unifiedData?.musicStories || []);
  const itemsToShow = showAll ? items : items.slice(0, 6);

  return (
    <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
      <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary animate-pulse" />{d.discoverAndLearn}</CardTitle></CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <div className="space-y-3">
            {itemsToShow.map((item) => {
              const content = (
                <div className="flex gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors group border border-transparent hover:border-primary/20">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex-shrink-0 overflow-hidden">
                    {item.image ? <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="w-full h-full flex items-center justify-center">{item.type === 'release' ? <Music className="w-8 h-8 text-green-500" /> : item.type === 'news' ? <Newspaper className="w-8 h-8 text-blue-500" /> : <BookOpen className="w-8 h-8 text-purple-500" />}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge className={`mb-1 text-xs ${item.badge.className}`}>{item.badge.label}</Badge>
                    <p className="font-medium line-clamp-1 group-hover:text-primary transition-colors">{item.title}</p>
                    {item.subtitle && <p className="text-sm text-muted-foreground line-clamp-1">{item.subtitle}</p>}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="w-3 h-3" /><span>{formatDate(item.date)}</span></div>
                  </div>
                </div>
              );
              return item.isExternal ? <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer">{content}</a> : <Link key={item.id} to={item.link}>{content}</Link>;
            })}
            {items.length > 6 && <Button onClick={() => setShowAll(!showAll)} variant="outline" className="w-full">{showAll ? d.showLess : d.showMore.replace('{count}', String(items.length - 6))}</Button>}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button asChild size="sm" variant="outline"><Link to="/nieuws"><Newspaper className="w-4 h-4 mr-2" />{d.news}<ArrowRight className="w-4 h-4 ml-2" /></Link></Button>
              <Button asChild size="sm" variant="outline"><Link to="/verhalen"><BookOpen className="w-4 h-4 mr-2" />{d.stories}<ArrowRight className="w-4 h-4 ml-2" /></Link></Button>
            </div>
          </div>
        ) : <div className="text-center py-6"><Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" /><p className="text-sm text-muted-foreground">{d.noContentAvailable}</p></div>}
      </CardContent>
    </Card>
  );
};
