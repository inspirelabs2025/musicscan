import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, Eye, Music, BookOpen, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useSEO } from '@/hooks/useSEO';
import { BreadcrumbNavigation } from '@/components/SEO/BreadcrumbNavigation';
import { ReviewSchema, FAQSchema } from '@/components/SEO/ReviewSchema';
import { MusicRecordingStructuredData } from '@/components/SEO/MusicRecordingStructuredData';
import { useToast } from '@/hooks/use-toast';
import { ShareButtons } from '@/components/ShareButtons';
import { Helmet } from 'react-helmet';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Single {
  id: string;
  query: string;
  story_content: string;
  title: string;
  slug: string;
  views_count: number;
  created_at: string;
  updated_at: string;
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
  genre?: string;
  styles?: string[];
  tags?: string[];
  is_published: boolean;
  user_id: string;
  artwork_url?: string;
}

export default function SingleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [single, setSingle] = useState<Single | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [hasIncrementedView, setHasIncrementedView] = useState(false);
  const { toast } = useToast();

  const currentUrl = `https://www.musicscan.app/singles/${slug}`;
  const singleImage = single?.artwork_url || 'https://www.musicscan.app/placeholder.svg';
  const singleDescription = single?.meta_description || single?.story_content?.slice(0, 160).replace(/[#*]/g, '') || 'Ontdek het verhaal achter deze iconische single';

  const seoKeywords = [
    single?.artist,
    single?.single_name,
    single?.genre,
    'single',
    'muziek verhaal',
    ...(single?.tags || [])
  ].filter(Boolean).join(', ');

  useSEO({
    title: single?.meta_title || `${single?.artist} - ${single?.single_name} | Single Verhaal | MusicScan`,
    description: singleDescription,
    keywords: seoKeywords,
    image: singleImage,
    type: 'music.song',
    canonicalUrl: currentUrl
  });

  useEffect(() => {
    const fetchSingle = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('music_stories')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .not('single_name', 'is', null)
          .single();

        if (error) throw error;

        if (!data) {
          setNotFound(true);
          return;
        }

        setSingle(data as Single);

      } catch (error) {
        console.error('Error fetching single:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSingle();
  }, [slug]);

  useEffect(() => {
    if (single && !hasIncrementedView) {
      const incrementView = async () => {
        await supabase
          .from('music_stories')
          .update({ views_count: (single.views_count || 0) + 1 })
          .eq('id', single.id);
        setHasIncrementedView(true);
      };
      incrementView();
      
      if (!single.artwork_url && (single.artist || single.query)) {
        const fetchArtwork = async () => {
          try {
            const response = await supabase.functions.invoke('fetch-album-artwork', {
              body: {
                artist: single.artist || single.query.split(',')[1]?.trim() || single.query.split(' ')[0],
                title: single.single_name || single.query.split(',')[0]?.trim() || single.query,
                media_type: 'single',
                item_id: single.id,
                item_type: 'music_stories'
              }
            });
            
            if (response.data?.success && response.data?.artwork_url) {
              setSingle(prev => prev ? { ...prev, artwork_url: response.data.artwork_url } : null);
            }
          } catch (error) {
            console.log('Error fetching artwork:', error);
          }
        };
        fetchArtwork();
      }
    }
  }, [single, hasIncrementedView]);

  if (!slug) {
    navigate('/singles');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative container mx-auto px-4 py-8">
          <div className="animate-pulse max-w-4xl mx-auto">
            <div className="h-6 bg-muted rounded mb-4 w-32"></div>
            <div className="h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl mb-8"></div>
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

  if (notFound || !single) {
    return (
      <>
        <Helmet>
          <title>Single niet gevonden | MusicScan</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 flex items-center justify-center">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="relative text-center max-w-md mx-auto px-4">
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-8 border border-border/50">
              <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <h1 className="text-2xl font-bold mb-4">Single niet gevonden</h1>
              <p className="text-muted-foreground mb-6">
                De single die je zoekt bestaat niet of is niet meer beschikbaar.
              </p>
              <Button onClick={() => navigate('/singles')} size="lg" className="group">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Terug naar singles
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Singles', url: '/singles' },
    { name: `${single.artist} - ${single.single_name}`, url: `/singles/${slug}` }
  ];

  const publishedDate = format(new Date(single.created_at), 'dd MMMM yyyy', { locale: nl });
  const readingTime = single.reading_time || Math.ceil(single.story_content.length / 1000);

  const faqQuestions = [
    {
      question: `Wat is het verhaal achter ${single.artist} - ${single.single_name}?`,
      answer: single.story_content.slice(0, 300).replace(/[#*]/g, '') + '...'
    },
    {
      question: `Wie is ${single.artist}?`,
      answer: `Ontdek alles over ${single.artist} in dit muziekverhaal. Lees over de achtergrond, betekenis en impact van deze single.`
    }
  ];

  return (
    <>
      <Helmet>
        <meta property="og:type" content="music.song" />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:title" content={single?.meta_title || `${single.artist} - ${single.single_name}`} />
        <meta property="og:description" content={singleDescription} />
        <meta property="og:image" content={singleImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`${single.artist} - ${single.single_name}`} />
        
        <meta property="music:musician" content={single?.artist} />
        {single?.year && <meta property="music:release_date" content={single.year.toString()} />}
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={single?.meta_title || `${single.artist} - ${single.single_name}`} />
        <meta name="twitter:description" content={singleDescription} />
        <meta name="twitter:image" content={singleImage} />
        {single?.reading_time && <meta name="twitter:label1" content="Leestijd" />}
        {single?.reading_time && <meta name="twitter:data1" content={`${single.reading_time} min`} />}
        {single?.views_count && <meta name="twitter:label2" content="Views" />}
        {single?.views_count && <meta name="twitter:data2" content={single.views_count.toString()} />}
      </Helmet>
      
      <MusicRecordingStructuredData
        name={`${single.artist} - ${single.single_name}`}
        artist={single.artist}
        description={singleDescription}
        image={single.artwork_url}
        url={currentUrl}
        datePublished={single.created_at}
        genre={single.genre}
        recordLabel={single.label}
      />
      
      <ReviewSchema
        itemName={`${single.artist} - ${single.single_name}`}
        artist={single.artist}
        reviewBody={single.story_content}
        rating={4.3}
        datePublished={single.created_at}
        reviewUrl={currentUrl}
        imageUrl={single.artwork_url}
        itemType="MusicRecording"
      />
      
      <FAQSchema questions={faqQuestions} />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Music className="absolute top-20 left-[10%] w-6 h-6 text-blue-500/20 animate-float" style={{ animationDelay: '0s' }} />
          <BookOpen className="absolute top-40 right-[15%] w-4 h-4 text-purple-500/20 animate-float" style={{ animationDelay: '2s' }} />
          <Sparkles className="absolute bottom-40 left-[20%] w-5 h-5 text-pink-500/30 animate-float" style={{ animationDelay: '4s' }} />
        </div>

        <div className="relative container mx-auto px-4 py-8 max-w-4xl">
          <BreadcrumbNavigation items={breadcrumbs} />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/singles')}
            className="mb-6 hover:bg-primary/10 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Terug naar singles
          </Button>

          <div className="relative mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl"></div>
            <div className="relative bg-card/80 backdrop-blur-sm rounded-3xl border border-border/50 p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {single.artwork_url && (
                  <div className="lg:col-span-1">
                    <div className="aspect-square bg-gradient-to-br from-muted/30 to-muted/60 rounded-2xl overflow-hidden">
                      <img
                        src={single.artwork_url}
                        alt={`${single.artist} - ${single.single_name}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
                
                <div className={single.artwork_url ? "lg:col-span-2" : "lg:col-span-3"}>
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Badge 
                      variant="secondary" 
                      className="bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                    >
                      <Music className="w-3 h-3 mr-1" />
                      SINGLE
                    </Badge>
                    <Badge variant="outline" className="border-primary/30 hover:bg-primary/10 transition-colors">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Digitaal Verhaal
                    </Badge>
                    <Badge variant="outline" className="border-muted-foreground/30">
                      <Calendar className="w-3 h-3 mr-1" />
                      {publishedDate}
                    </Badge>
                    <Badge variant="outline" className="border-muted-foreground/30">
                      <Clock className="w-3 h-3 mr-1" />
                      {readingTime} min leestijd
                    </Badge>
                    <Badge variant="outline" className="border-muted-foreground/30">
                      <Eye className="w-3 h-3 mr-1" />
                      {single.views_count || 0} views
                    </Badge>
                  </div>

                  <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    {single.artist} - {single.single_name}
                  </h1>
                  
                  {single.year && (
                    <div className="text-xl text-muted-foreground mb-8 font-medium">
                      <span className="text-primary">Release jaar:</span>
                      <span className="mx-3 text-blue-500">•</span>
                      <span>{single.year}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Gepubliceerd op {publishedDate}
                    </span>
                    <ShareButtons 
                      url={currentUrl}
                      title={`${single.artist} - ${single.single_name}`}
                      description={singleDescription}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <article className="relative">
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-8 md:p-12">
              <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-foreground/90 prose-p:leading-relaxed prose-strong:text-foreground prose-blockquote:border-l-primary prose-blockquote:text-foreground/80 prose-code:bg-muted prose-code:text-foreground prose-code:px-2 prose-code:py-1 prose-code:rounded">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-3xl font-bold mt-12 mb-6 first:mt-0 bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-semibold mt-10 mb-5 text-foreground flex items-center gap-3">
                        <Music className="w-6 h-6 text-blue-500 flex-shrink-0" />
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
                        <span className="text-blue-500 mt-1 flex-shrink-0">▸</span>
                        <span>{children}</span>
                      </li>
                    ),
                  }}
                >
                  {single.story_content}
                </ReactMarkdown>
              </div>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
