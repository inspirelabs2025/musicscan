import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import ReactMarkdown from "react-markdown";
import { usePublicAlbumReview } from "@/hooks/useAdminAlbumReviews";
import { RatingDisplay } from "@/components/reviews/RatingDisplay";
import { RatingBreakdown } from "@/components/reviews/RatingBreakdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Music, Tag, ArrowLeft, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ReviewDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: review, isLoading } = usePublicAlbumReview(slug!);
  const { toast } = useToast();

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${review?.artist_name} - ${review?.album_title}`,
        text: review?.summary,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link gekopieerd",
        description: "De link is naar je klembord gekopieerd.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Music className="h-16 w-16 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-bold">Review niet gevonden</h2>
          <Link to="/reviews">
            <Button>Terug naar overzicht</Button>
          </Link>
        </div>
      </div>
    );
  }

  const canonicalUrl = `https://www.musicscan.app/reviews/${slug}/`;

  return (
    <>
      <Helmet>
        <title>{review.title} | MusicScan</title>
        <meta name="description" content={review.summary} />
        <meta property="og:title" content={review.title} />
        <meta property="og:description" content={review.summary} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={review.cover_image_url || ""} />
        <meta property="article:published_time" content={review.published_at || ""} />
        <meta property="article:author" content="MusicScan" />
        {review.genre && <meta property="article:section" content={review.genre} />}
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <article className="min-h-screen bg-background">
        {/* Back Button */}
        <div className="container mx-auto max-w-4xl px-4 pt-8">
          <Link to="/reviews">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Terug naar reviews
            </Button>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="grid md:grid-cols-[300px_1fr] gap-8 items-start">
            {/* Album Cover */}
            <div className="sticky top-8">
              <div className="aspect-square rounded-lg overflow-hidden shadow-2xl bg-muted">
                {review.cover_image_url ? (
                  <img
                    src={review.cover_image_url}
                    alt={`${review.artist_name} - ${review.album_title}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="h-24 w-24 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Rating Display */}
              {review.rating && (
                <div className="mt-6 p-4 bg-card border rounded-lg">
                  <RatingDisplay rating={review.rating} size="lg" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">{review.artist_name}</h1>
                <h2 className="text-2xl text-muted-foreground mb-4">{review.album_title}</h2>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {review.genre && (
                    <Badge variant="secondary" className="gap-1">
                      <Tag className="h-3 w-3" />
                      {review.genre}
                    </Badge>
                  )}
                  {review.format && (
                    <Badge variant="outline">{review.format.toUpperCase()}</Badge>
                  )}
                  {review.release_year && (
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      {review.release_year}
                    </Badge>
                  )}
                  {review.label && (
                    <Badge variant="outline">
                      {review.label}
                    </Badge>
                  )}
                </div>

                <p className="text-lg text-muted-foreground leading-relaxed">
                  {review.summary}
                </p>
              </div>

              {/* Rating Breakdown */}
              {review.rating_breakdown && (
                <RatingBreakdown breakdown={review.rating_breakdown} />
              )}

              {/* Listening Context */}
              {review.listening_context && (
                <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                  <p className="text-sm font-medium mb-1">Luistercontext</p>
                  <p className="text-sm text-muted-foreground">{review.listening_context}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Review Content */}
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                h2: ({ children }) => <h2 className="text-2xl font-bold mt-8 mb-4">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xl font-semibold mt-6 mb-3">{children}</h3>,
              }}
            >
              {review.content}
            </ReactMarkdown>
          </div>

          {/* Spotify Embed */}
          {review.spotify_embed_url && (
            <div className="mt-12">
              <h3 className="text-xl font-semibold mb-4">Beluister het album</h3>
              <iframe
                src={review.spotify_embed_url}
                width="100%"
                height="380"
                frameBorder="0"
                allow="encrypted-media"
                className="rounded-lg"
              />
            </div>
          )}

          {/* YouTube Embed */}
          {review.youtube_embed_url && (
            <div className="mt-12">
              <h3 className="text-xl font-semibold mb-4">Video</h3>
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={review.youtube_embed_url}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Recommended For */}
          {review.recommended_for && (
            <div className="mt-12 p-6 bg-primary/5 rounded-lg border">
              <h3 className="text-xl font-semibold mb-3">Aanrader voor</h3>
              <p className="text-muted-foreground">{review.recommended_for}</p>
            </div>
          )}

          {/* Share Button */}
          <div className="mt-12 pt-8 border-t flex justify-center">
            <Button onClick={handleShare} size="lg" className="gap-2">
              <Share2 className="h-4 w-4" />
              Deel deze review
            </Button>
          </div>
        </div>
      </article>
    </>
  );
}
