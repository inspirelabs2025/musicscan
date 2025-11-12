import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Music, Clock, Eye, ChevronRight, Home } from 'lucide-react';
import { useArtistStory, useArtistStories } from '@/hooks/useArtistStories';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShareButtons } from '@/components/ShareButtons';
import { MusicGroupStructuredData } from '@/components/SEO/MusicGroupStructuredData';
import ReactMarkdown from 'react-markdown';

const ArtistDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: story, isLoading } = useArtistStory(slug || '');
  const { data: relatedStories } = useArtistStories({ 
    limit: 3,
    genre: story?.music_style?.[0]
  });

  useEffect(() => {
    if (story) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [story]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="w-full h-96 mb-8" />
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Artiest niet gevonden</h2>
          <p className="text-muted-foreground mb-6">De artiest die je zoekt bestaat niet of is niet gepubliceerd.</p>
          <button 
            onClick={() => navigate('/artists')}
            className="text-primary hover:underline"
          >
            Terug naar artiesten
          </button>
        </div>
      </div>
    );
  }

  const currentUrl = `https://www.musicscan.app/artists/${story.slug}`;
  const storyImage = story.artwork_url || 'https://www.musicscan.app/placeholder.svg';
  const storyDescription = story.biography || story.story_content.substring(0, 160);

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Artiesten', url: '/artists' },
    { name: story.artist_name, url: `/artists/${story.slug}` }
  ];

  // Filter out current story from related stories
  const filteredRelated = relatedStories?.filter(s => s.id !== story.id).slice(0, 3);

  return (
    <>
      <Helmet>
        <title>{story.meta_title || `Het Verhaal van ${story.artist_name} | MusicScan`}</title>
        <meta name="description" content={story.meta_description || storyDescription} />
        
        {/* Open Graph */}
        <meta property="og:title" content={`Het Verhaal van ${story.artist_name}`} />
        <meta property="og:description" content={storyDescription} />
        <meta property="og:image" content={storyImage} />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:type" content="article" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Het Verhaal van ${story.artist_name}`} />
        <meta name="twitter:description" content={storyDescription} />
        <meta name="twitter:image" content={storyImage} />
        
        <link rel="canonical" href={currentUrl} />
      </Helmet>

      <MusicGroupStructuredData
        name={story.artist_name}
        description={storyDescription}
        image={storyImage}
        url={currentUrl}
        genre={story.music_style || undefined}
        albums={story.notable_albums || undefined}
      />

      <div className="min-h-screen bg-background">
        {/* Breadcrumbs */}
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center gap-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.url}>
                  {index > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-muted-foreground">{crumb.name}</span>
                  ) : (
                    <button
                      onClick={() => navigate(crumb.url)}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {index === 0 && <Home className="w-4 h-4" />}
                      {crumb.name}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <section className="relative py-12 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Artist Image */}
                <div className="w-full md:w-1/3">
                  <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 shadow-2xl">
                    {story.artwork_url ? (
                      <img
                        src={story.artwork_url}
                        alt={story.artist_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-24 h-24 text-muted-foreground/20" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Artist Info */}
                <div className="flex-1">
                  <Badge className="bg-purple-500/20 text-purple-600 border-0 mb-4">
                    <Music className="w-3 h-3 mr-1" />
                    ARTIEST
                  </Badge>

                  <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                    {story.artist_name}
                  </h1>

                  {story.biography && (
                    <p className="text-lg text-muted-foreground mb-6">
                      {story.biography}
                    </p>
                  )}

                  {/* Genres */}
                  {story.music_style && story.music_style.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {story.music_style.map((genre) => (
                        <Badge key={genre} variant="secondary">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span>{story.views_count} weergaven</span>
                    </div>
                    {story.reading_time && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{story.reading_time} min lezen</span>
                      </div>
                    )}
                  </div>

                  {/* Share Buttons */}
                  <ShareButtons
                    url={currentUrl}
                    title={`Het Verhaal van ${story.artist_name}`}
                    description={storyDescription}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Story Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <article className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-foreground prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-6">
                <ReactMarkdown
                  components={{
                    h1: ({children}) => (
                      <h1 className="text-4xl font-bold mb-8 mt-8 text-foreground border-b pb-4">
                        {children}
                      </h1>
                    ),
                    h2: ({children}) => (
                      <h2 className="text-3xl font-bold mb-6 mt-12 text-foreground">
                        {children}
                      </h2>
                    ),
                    h3: ({children}) => (
                      <h3 className="text-xl font-semibold mb-4 mt-8 text-foreground">
                        {children}
                      </h3>
                    ),
                    p: ({children}) => (
                      <p className="text-muted-foreground leading-relaxed mb-6">
                        {children}
                      </p>
                    ),
                    ul: ({children}) => (
                      <ul className="list-disc list-inside mb-6 space-y-2 text-muted-foreground">
                        {children}
                      </ul>
                    ),
                    ol: ({children}) => (
                      <ol className="list-decimal list-inside mb-6 space-y-2 text-muted-foreground">
                        {children}
                      </ol>
                    ),
                    strong: ({children}) => (
                      <strong className="font-bold text-foreground">
                        {children}
                      </strong>
                    ),
                  }}
                >
                  {story.story_content}
                </ReactMarkdown>
              </article>
            </div>
          </div>
        </section>

        {/* Related Artists */}
        {filteredRelated && filteredRelated.length > 0 && (
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold mb-8">Gerelateerde Artiesten</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {filteredRelated.map((relatedStory) => (
                    <Card
                      key={relatedStory.id}
                      className="group cursor-pointer hover:shadow-xl transition-all duration-300"
                      onClick={() => navigate(`/artists/${relatedStory.slug}`)}
                    >
                      <CardContent className="p-0">
                        <div className="aspect-square overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                          {relatedStory.artwork_url ? (
                            <img
                              src={relatedStory.artwork_url}
                              alt={relatedStory.artist_name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music className="w-16 h-16 text-muted-foreground/20" />
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <h3 className="font-bold mb-2 group-hover:text-primary transition-colors">
                            {relatedStory.artist_name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {relatedStory.biography || relatedStory.story_content.substring(0, 100)}...
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default ArtistDetail;
