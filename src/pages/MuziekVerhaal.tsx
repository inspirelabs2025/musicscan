import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, Share2, Eye, Music, BookOpen, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useSEO } from '@/hooks/useSEO';
import { ArticleStructuredData } from '@/components/SEO/StructuredData';
import { BreadcrumbNavigation } from '@/components/SEO/BreadcrumbNavigation';
import { ReviewSchema, FAQSchema } from '@/components/SEO/ReviewSchema';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from 'date-fns';
import { nl } from 'date-fns/locale';

interface MusicStory {
  id: string;
  query: string;
  story_content: string;
  title: string;
  slug: string;
  views_count: number;
  created_at: string;
  updated_at: string;
  // New fields from database update
  yaml_frontmatter?: any;
  social_post?: string;
  reading_time?: number;
  word_count?: number;
  meta_title?: string;
  meta_description?: string;
  artist?: string;
  single_name?: string;
  year?: number;
  label?: string;
  catalog?: string;
  album?: string;
  genre?: string;
  styles?: string[];
  tags?: string[];
  is_published: boolean;
  user_id: string;
  artwork_url?: string;
}

export const MuziekVerhaal: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [story, setStory] = useState<MusicStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [hasIncrementedView, setHasIncrementedView] = useState(false);
  const { toast } = useToast();

  // Enhanced SEO setup
  const seoDescription = story?.story_content 
    ? story.story_content.slice(0, 160).replace(/[#*]/g, '')
    : `Ontdek het fascinerende verhaal van ${story?.query || 'muziek'}. Een AI-gegenereerd muziekverhaal vol interessante achtergrondinformatie en verhalen.`;
  
  const seoKeywords = [
    story?.query,
    'muziekverhaal',
    'music story',
    'AI verhaal',
    'muziekgeschiedenis',
    'album verhaal',
    'muziek informatie'
  ].filter(Boolean).join(', ');

  useSEO({
    title: story?.title ? `${story.title} | Muziekverhalen` : 'Muziekverhaal | MusicScan',
    description: seoDescription,
    keywords: seoKeywords,
    type: 'article',
    canonicalUrl: `https://www.musicscan.app/muziek-verhaal/${slug}`
  });

  useEffect(() => {
    const fetchStory = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('music_stories')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .single();

        if (error) throw error;

        if (!data) {
          setNotFound(true);
          return;
        }

        setStory(data as MusicStory);

      } catch (error) {
        console.error('Error fetching story:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [slug]);

  // Increment view count and fetch artwork if missing
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
      
      // Fetch artwork if missing
      if (!story.artwork_url && (story.artist || story.query)) {
        const fetchArtwork = async () => {
          try {
            const response = await supabase.functions.invoke('fetch-album-artwork', {
              body: {
                artist: story.artist || story.query.split(',')[1]?.trim() || story.query.split(' ')[0],
                title: story.single_name || story.query.split(',')[0]?.trim() || story.query,
                media_type: 'single',
                item_id: story.id,
                item_type: 'music_stories'
              }
            });
            
            if (response.data?.success && response.data?.artwork_url) {
              setStory(prev => prev ? { ...prev, artwork_url: response.data.artwork_url } : null);
            }
          } catch (error) {
            console.log('Error fetching artwork:', error);
          }
        };
        fetchArtwork();
      }
    }
  }, [story, hasIncrementedView]);

  const handleShare = async () => {
    const shareData = {
      title: story?.title || 'Muziekverhaal',
      text: `Ontdek dit fascinerende muziekverhaal: ${story?.title}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`);
      toast({
        title: "Link gekopieerd!",
        description: "De link is naar je klembord gekopieerd.",
      });
    }
  };

  if (!slug) {
    navigate('/dashboard');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="relative container mx-auto px-4 py-8">
          <div className="animate-pulse max-w-4xl mx-auto">
            {/* Header Skeleton */}
            <div className="h-6 bg-muted rounded mb-4 w-32"></div>
            <div className="h-16 bg-gradient-to-r from-vinyl-gold/20 to-primary/20 rounded-xl mb-8"></div>
            
            {/* Content Skeleton */}
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50">
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-2/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="space-y-3 mt-8">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 flex items-center justify-center">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="relative text-center max-w-md mx-auto px-4">
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-8 border border-border/50">
            <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <h1 className="text-2xl font-bold mb-4">Verhaal niet gevonden</h1>
            <p className="text-muted-foreground mb-6">
              Het muziekverhaal dat je zoekt bestaat niet of is niet meer beschikbaar.
            </p>
            <Button onClick={() => navigate('/dashboard')} size="lg" className="group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Terug naar dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Muziekverhalen', url: '/dashboard' },
    { name: story.title, url: `/muziek-verhaal/${slug}` }
  ];

  const publishedDate = formatDate(new Date(story.created_at), 'dd MMMM yyyy', { locale: nl });
  const readingTime = Math.ceil(story.story_content.length / 1000); // Approximate reading time

  // Generate FAQ questions based on story content
  const faqQuestions = [
    {
      question: `Wat is het verhaal achter ${story.artist && story.single_name ? `${story.artist} - ${story.single_name}` : story.query}?`,
      answer: story.story_content.slice(0, 300).replace(/[#*]/g, '') + '...'
    },
    {
      question: `Wie is ${story.artist || story.query.split(',')[0]?.trim() || story.query}?`,
      answer: `Ontdek alles over ${story.artist || story.query} in dit AI-gegenereerde muziekverhaal. Lees over de achtergrond, betekenis en impact van deze muziek.`
    }
  ];

  return (
    <>
      <ArticleStructuredData
        title={story.title}
        description={seoDescription}
        publishDate={story.created_at}
        author="MusicScan AI"
        image={story.artwork_url}
        artist={story.artist}
        album={story.album}
        genre={story.genre}
      />
      
      <ReviewSchema
        itemName={story.artist && story.single_name ? `${story.artist} - ${story.single_name}` : story.title}
        artist={story.artist || story.query.split(',')[1]?.trim() || story.query.split(' ')[0] || 'Various Artists'}
        reviewBody={story.story_content}
        rating={4.3}
        datePublished={story.created_at}
        reviewUrl={`https://www.musicscan.app/muziek-verhaal/${story.slug}`}
        imageUrl={story.artwork_url}
        itemType="MusicRecording"
      />
      
      <FAQSchema questions={faqQuestions} />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        {/* Floating Musical Notes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Music className="absolute top-20 left-[10%] w-6 h-6 text-vinyl-gold/20 animate-float" style={{ animationDelay: '0s' }} />
          <BookOpen className="absolute top-40 right-[15%] w-4 h-4 text-primary/20 animate-float" style={{ animationDelay: '2s' }} />
          <Sparkles className="absolute bottom-40 left-[20%] w-5 h-5 text-vinyl-gold/30 animate-float" style={{ animationDelay: '4s' }} />
        </div>

        <div className="relative container mx-auto px-4 py-8 max-w-4xl">
          <BreadcrumbNavigation items={breadcrumbs} />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-6 hover:bg-primary/10 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Terug
          </Button>

          {/* Hero Section */}
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-gradient-vinyl opacity-20 rounded-3xl blur-xl"></div>
            <div className="relative bg-card/80 backdrop-blur-sm rounded-3xl border border-border/50 p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Album Cover */}
                {story.artwork_url && (
                  <div className="lg:col-span-1">
                    <div className="aspect-square bg-gradient-to-br from-muted/30 to-muted/60 rounded-2xl overflow-hidden">
                      <img
                        src={story.artwork_url}
                        alt={`${story.artist || story.query} artwork`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
                
                <div className={story.artwork_url ? "lg:col-span-2" : "lg:col-span-3"}>
                  {/* Header Badges */}
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Badge 
                      variant="secondary" 
                      className="bg-vinyl-gold/20 text-vinyl-gold border-vinyl-gold/30 hover:bg-vinyl-gold/30 transition-colors"
                    >
                      <BookOpen className="w-3 h-3 mr-1" />
                      MUZIEKVERHAAL
                    </Badge>
                    <Badge variant="outline" className="border-primary/30 hover:bg-primary/10 transition-colors">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Verhaal
                    </Badge>
                    <Badge variant="outline" className="border-muted-foreground/30">
                      <Calendar className="w-3 h-3 mr-1" />
                      {publishedDate}
                    </Badge>
                    <Badge variant="outline" className="border-muted-foreground/30">
                      <Clock className="w-3 h-3 mr-1" />
                      {story.reading_time || readingTime} min leestijd
                    </Badge>
                    <Badge variant="outline" className="border-muted-foreground/30">
                      <Eye className="w-3 h-3 mr-1" />
                      {story.views_count || 0} views
                    </Badge>
                  </div>

                  {/* Main Title */}
                  <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    {story.title}
                  </h1>
                  
                  {/* Query/Topic */}
                  <div className="text-xl md:text-2xl text-muted-foreground mb-8 font-medium">
                    <span className="text-primary">Onderwerp:</span>
                    <span className="mx-3 text-vinyl-gold">•</span>
                    <span>{story.artist && story.single_name ? `${story.artist} - ${story.single_name}` : story.query}</span>
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Gepubliceerd op {publishedDate}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleShare}
                      className="h-auto p-0 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      Delen
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <article className="relative">
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-8 md:p-12">
              <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-foreground/90 prose-p:leading-relaxed prose-strong:text-foreground prose-blockquote:border-l-primary prose-blockquote:text-foreground/80 prose-code:bg-muted prose-code:text-foreground prose-code:px-2 prose-code:py-1 prose-code:rounded">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-3xl font-bold mt-12 mb-6 first:mt-0 bg-gradient-to-r from-primary to-vinyl-gold bg-clip-text text-transparent">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-semibold mt-10 mb-5 text-foreground flex items-center gap-3">
                        <Music className="w-6 h-6 text-vinyl-gold flex-shrink-0" />
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl font-medium mt-8 mb-4 text-foreground">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-6 leading-relaxed text-foreground/90 text-lg">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-none pl-0 mb-6 space-y-2">
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => (
                      <li className="flex items-start gap-3 text-foreground/90">
                        <span className="w-2 h-2 bg-vinyl-gold rounded-full mt-3 flex-shrink-0"></span>
                        <span>{children}</span>
                      </li>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-6 mb-6 space-y-2 text-foreground/90">
                        {children}
                      </ol>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-primary pl-6 my-8 italic text-foreground/80 bg-card/30 py-4 rounded-r-lg">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-6 text-sm">
                        {children}
                      </pre>
                    ),
                  }}
                >
                  {story.story_content}
                </ReactMarkdown>
              </div>
            </div>
          </article>

          {/* Navigation */}
          <div className="mt-12 text-center">
            <div className="bg-card/30 backdrop-blur-sm rounded-2xl border border-border/30 p-6">
              <p className="text-muted-foreground mb-4">Wil je meer muziekverhalen ontdekken?</p>
              <Button 
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-primary to-vinyl-gold hover:from-primary/90 hover:to-vinyl-gold/90 transition-all duration-300"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Ontdek meer verhalen
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MuziekVerhaal;