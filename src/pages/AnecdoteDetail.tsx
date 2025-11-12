import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAnecdote, useRelatedAnecdotes } from '@/hooks/useAnecdotes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BreadcrumbNavigation } from '@/components/SEO/BreadcrumbNavigation';
import { ArticleStructuredData } from '@/components/SEO/StructuredData';
import { ShareButtons } from '@/components/ShareButtons';
import { Calendar, Eye, BookOpen, ArrowLeft, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

export default function AnecdoteDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: anecdote, isLoading } = useAnecdote(slug!);
  const { data: relatedAnecdotes } = useRelatedAnecdotes(
    anecdote?.id || '',
    anecdote?.subject_type || '',
    anecdote?.subject_name || ''
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!anecdote) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">Anekdote niet gevonden</p>
            <Button onClick={() => navigate('/anekdotes')} className="mt-4">
              Terug naar overzicht
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pageUrl = `https://www.musicscan.app/anekdotes/${slug}`;

  return (
    <>
      <Helmet>
        <title>{anecdote.meta_title}</title>
        <meta name="description" content={anecdote.meta_description} />
        <meta name="keywords" content={`${anecdote.subject_type}, ${anecdote.subject_name}, muziek anekdote, muziekgeschiedenis`} />
        <link rel="canonical" href={pageUrl} />

        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={anecdote.meta_title} />
        <meta property="og:description" content={anecdote.meta_description} />
        
        {/* Article metadata */}
        <meta property="article:published_time" content={anecdote.anecdote_date} />
        <meta property="article:section" content={anecdote.subject_type} />
        <meta property="article:tag" content={anecdote.subject_name} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={anecdote.meta_title} />
        <meta name="twitter:description" content={anecdote.meta_description} />
      </Helmet>

      <ArticleStructuredData
        title={anecdote.anecdote_title}
        description={anecdote.meta_description}
        publishDate={anecdote.anecdote_date}
        author="MusicScan AI"
      />

      <div className="min-h-screen bg-background">
        <BreadcrumbNavigation
          items={[
            { name: 'Home', url: '/' },
            { name: 'Anekdotes', url: '/anekdotes' },
            { name: anecdote.anecdote_title, url: `/anekdotes/${slug}` },
          ]}
        />

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/anekdotes')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug naar overzicht
          </Button>

          {/* Hero Section */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Badge variant="outline">
                  {anecdote.subject_type}
                </Badge>
                <Badge variant="secondary">
                  {anecdote.subject_name}
                </Badge>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {anecdote.anecdote_title}
              </h1>

              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap mb-6">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(anecdote.anecdote_date), 'd MMMM yyyy', { locale: nl })}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {anecdote.views_count || 0} weergaven
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {anecdote.reading_time || 1} min leestijd
                </div>
              </div>

              {anecdote.subject_details && (
                <div className="bg-muted p-4 rounded-lg mb-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {anecdote.subject_details.artist && (
                      <div>
                        <div className="font-semibold">Artiest</div>
                        <div className="text-muted-foreground">{anecdote.subject_details.artist}</div>
                      </div>
                    )}
                    {anecdote.subject_details.title && (
                      <div>
                        <div className="font-semibold">Titel</div>
                        <div className="text-muted-foreground">{anecdote.subject_details.title}</div>
                      </div>
                    )}
                    {anecdote.subject_details.year && (
                      <div>
                        <div className="font-semibold">Jaar</div>
                        <div className="text-muted-foreground">{anecdote.subject_details.year}</div>
                      </div>
                    )}
                    {anecdote.subject_details.genre && (
                      <div>
                        <div className="font-semibold">Genre</div>
                        <div className="text-muted-foreground">{anecdote.subject_details.genre}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <ShareButtons url={pageUrl} title={anecdote.anecdote_title} />
            </CardContent>
          </Card>

          {/* Extended Content */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => (
                      <h2 className="flex items-center gap-2 text-2xl font-bold mt-8 mb-4">
                        <TrendingUp className="w-6 h-6 text-primary" />
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl font-semibold mt-6 mb-3">{children}</h3>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-primary pl-4 italic my-4">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {anecdote.extended_content || anecdote.anecdote_content}
                </ReactMarkdown>
              </div>

              {anecdote.source_reference && (
                <div className="mt-8 p-4 bg-muted rounded-lg text-sm">
                  <strong>Bron:</strong> {anecdote.source_reference}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Anecdotes */}
          {relatedAnecdotes && relatedAnecdotes.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" />
                Gerelateerde Anekdotes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedAnecdotes.map((related) => (
                  <Card
                    key={related.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/anekdotes/${related.slug}`)}
                  >
                    <CardContent className="pt-6">
                      <Badge variant="outline" className="mb-2">
                        {related.subject_type}
                      </Badge>
                      <h3 className="font-semibold mb-2 line-clamp-2">
                        {related.anecdote_title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {related.anecdote_content.substring(0, 100)}...
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="text-center mt-6">
                <Button variant="outline" onClick={() => navigate('/anekdotes')}>
                  Bekijk alle anekdotes
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
