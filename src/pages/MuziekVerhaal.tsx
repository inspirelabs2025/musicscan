import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Share2, ArrowLeft, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { formatDate } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Helmet } from 'react-helmet';
import { toast } from 'sonner';

interface MusicStory {
  id: string;
  query: string;
  story_content: string;
  title: string;
  slug: string;
  views_count: number;
  created_at: string;
  updated_at: string;
}

const MuziekVerhaal = () => {
  const { slug } = useParams();
  const [hasIncrementedView, setHasIncrementedView] = useState(false);

  const { data: story, isLoading, error } = useQuery({
    queryKey: ['music-story', slug],
    queryFn: async () => {
      if (!slug) throw new Error('No slug provided');
      
      const { data, error } = await supabase
        .from('music_stories')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      return data as MusicStory;
    },
    enabled: !!slug,
  });

  // Increment view count
  useEffect(() => {
    if (story && !hasIncrementedView) {
      const incrementView = async () => {
        await supabase
          .from('music_stories')
          .update({ views_count: (story.views_count || 0) + 1 })
          .eq('id', story.id);
        setHasIncrementedView(true);
      };
      incrementView();
    }
  }, [story, hasIncrementedView]);

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: story?.title,
          text: `Ontdek ${story?.title}`,
          url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link gekopieerd naar klembord!');
    }
  };

  if (!slug) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Verhaal niet gevonden</h1>
            <p className="text-muted-foreground mb-6">
              Het opgevraagde muziekverhaal bestaat niet of is niet beschikbaar.
            </p>
            <Button onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const publishedDate = formatDate(new Date(story.created_at), 'dd MMMM yyyy', { locale: nl });

  return (
    <>
      <Helmet>
        <title>{story.title} - Muziekverhalen</title>
        <meta name={story.title} content={`Ontdek het fascinerende verhaal achter ${story.query}. Een diepgaand muziekverhaal vol interessante achtergrondinformatie.`} />
        <meta property="og:title" content={story.title} />
        <meta property="og:description" content={`Het verhaal achter ${story.query}`} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={story.title} />
        <meta name="twitter:description" content={`Het verhaal achter ${story.query}`} />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="max-w-4xl mx-auto p-4 pt-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug
            </Button>
          </div>

          <article>
            <Card className="overflow-hidden">
              <div className="p-8">
                <header className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary">Muziekverhaal</Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {story.views_count || 0}
                    </Badge>
                  </div>
                  
                  <h1 className="text-4xl font-bold mb-4 leading-tight">
                    {story.title}
                  </h1>
                  
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-muted-foreground">
                      <p>Gepubliceerd op {publishedDate}</p>
                      <p className="text-sm">Onderwerp: {story.query}</p>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      className="flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Delen
                    </Button>
                  </div>
                  
                  <Separator />
                </header>

                <div className="prose prose-lg max-w-none">
                  <ReactMarkdown>{story.story_content}</ReactMarkdown>
                </div>
              </div>
            </Card>
          </article>

          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/dashboard'}
            >
              Ontdek meer verhalen
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MuziekVerhaal;