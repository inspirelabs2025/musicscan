import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { MessageCircle, BookOpen, ShoppingBag, ArrowRight, Clock, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

export const FeaturedContentGrid = () => {
  const { language, tr } = useLanguage();
  const h = tr.homeUI;
  const dateLocale = language === 'nl' ? nl : enUS;

  const { data: story, isLoading: storyLoading } = useQuery({
    queryKey: ['featured-story'],
    queryFn: async () => {
      const { data } = await supabase.from('music_stories').select('*').eq('is_published', true).order('created_at', { ascending: false }).limit(1).single();
      return data;
    },
  });

  const { data: topic, isLoading: topicLoading } = useQuery({
    queryKey: ['featured-topic'],
    queryFn: async () => {
      const { data } = await supabase.from('forum_topics').select('*, profiles(display_name, avatar_url)').eq('is_featured', true).order('created_at', { ascending: false }).limit(1).single();
      return data;
    },
  });

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['featured-product'],
    queryFn: async () => {
      const { data } = await supabase.from('platform_products').select('*').eq('status', 'available').order('created_at', { ascending: false }).limit(1).single();
      return data;
    },
  });

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Featured Story */}
      <Card className="relative overflow-hidden group hover:border-primary/50 transition-all">
        {storyLoading ? (
          <div className="p-6 space-y-4"><Skeleton className="h-48 w-full" /><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full" /></div>
        ) : story ? (
          <>
            {story.artwork_url && (
              <div className="relative h-48 overflow-hidden">
                <img src={story.artwork_url} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              </div>
            )}
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="gap-1"><BookOpen className="w-3 h-3" />{h.recordAndStory}</Badge>
                <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" />{story.reading_time || 5} min</Badge>
              </div>
              <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">{story.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{story.meta_description || h.discoverStory}</p>
              <Button asChild variant="outline" className="w-full group/btn">
                <Link to={`/muziek-verhaal/${story.slug}`}>{h.readTheStory}<ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" /></Link>
              </Button>
            </CardContent>
          </>
        ) : (
          <CardContent className="p-6"><p className="text-sm text-muted-foreground">{h.noStoryAvailable}</p></CardContent>
        )}
      </Card>

      {/* Featured Forum Topic */}
      <Card className="relative overflow-hidden group hover:border-vinyl-gold/50 transition-all">
        {topicLoading ? (
          <div className="p-6 space-y-4"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-20 w-full" /></div>
        ) : topic ? (
          <>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="gap-1 bg-vinyl-gold/10 text-vinyl-gold border-vinyl-gold/20"><MessageCircle className="w-3 h-3" />{h.forumDiscussion}</Badge>
                <Badge variant="outline" className="gap-1">{topic.reply_count || 0} {h.replies}</Badge>
              </div>
              <CardTitle className="line-clamp-2 group-hover:text-vinyl-gold transition-colors">{topic.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-4 mb-4">{topic.description}</p>
              <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
                <Eye className="w-3 h-3" /><span>{topic.view_count || 0} {h.views}</span><span>•</span>
                <span>{formatDistanceToNow(new Date(topic.created_at), { addSuffix: true, locale: dateLocale })}</span>
              </div>
              <Button asChild variant="outline" className="w-full group/btn">
                <Link to={`/forum/${topic.id}`}>{h.joinDiscussion}<ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" /></Link>
              </Button>
            </CardContent>
          </>
        ) : (
          <CardContent className="p-6"><p className="text-sm text-muted-foreground">{h.noDiscussionAvailable}</p></CardContent>
        )}
      </Card>

      {/* Featured Product */}
      <Card className="relative overflow-hidden group hover:border-accent/50 transition-all">
        {productLoading ? (
          <div className="p-6 space-y-4"><Skeleton className="h-48 w-full" /><Skeleton className="h-6 w-3/4" /></div>
        ) : product ? (
          <>
            {product.image_url && (
              <div className="relative h-48 overflow-hidden bg-muted">
                <img src={product.image_url} alt={product.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
              </div>
            )}
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="gap-1 bg-accent/10 text-accent"><ShoppingBag className="w-3 h-3" />{h.shopHighlight}</Badge>
                {product.created_at && new Date(product.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && <Badge className="animate-pulse">{h.newLabel}</Badge>}
              </div>
              <CardTitle className="line-clamp-2 group-hover:text-accent transition-colors">{product.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2 mb-4"><span className="text-2xl font-bold text-primary">€{typeof product.price === 'number' ? product.price.toFixed(2) : product.price}</span></div>
              <Button asChild className="w-full group/btn">
                <Link to={`/product/${product.slug || product.id}`}>{h.viewProduct}<ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" /></Link>
              </Button>
            </CardContent>
          </>
        ) : (
          <CardContent className="p-6"><p className="text-sm text-muted-foreground">{h.noProductAvailable}</p></CardContent>
        )}
      </Card>
    </div>
  );
};
