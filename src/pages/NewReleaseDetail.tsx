import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BreadcrumbNavigation } from "@/components/SEO/BreadcrumbNavigation";
import { useNewReleaseDetail } from "@/hooks/useNewReleaseDetail";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import { Music2, ExternalLink, BookOpen, ShoppingBag, Calendar, Disc3, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NewReleaseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: release, isLoading, error } = useNewReleaseDetail(slug);
  const { tr, language } = useLanguage();
  const dp = tr.detailPageUI;
  const dateFnsLocale = language === 'nl' ? nl : enUS;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !release) {
    return (
      <>
        <Helmet>
          <title>{dp.releaseNotFoundTitle} | MusicScan</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Disc3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">{dp.releaseNotFoundTitle}</h1>
            <p className="text-muted-foreground mb-4">{dp.releaseNotFoundDesc}</p>
            <Button asChild>
              <Link to="/releases">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {dp.backToReleases}
              </Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  const releaseDate = release.release_date 
    ? format(new Date(release.release_date), "d MMMM yyyy", { locale: dateFnsLocale })
    : dp.unknownDate;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicAlbum",
    "name": release.album_name,
    "byArtist": { "@type": "MusicGroup", "name": release.artist },
    "datePublished": release.release_date,
    "image": release.image_url,
    "url": `https://www.musicscan.app/new-release/${release.slug}`
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${release.artist} - ${release.album_name} | ${dp.newRelease} | MusicScan`}</title>
        <meta name="description" content={`${release.album_name} - ${release.artist}. ${dp.releasedOn} ${releaseDate}.`} />
        <meta property="og:title" content={`${release.artist} - ${release.album_name} | ${dp.newRelease}`} />
        <meta property="og:description" content={`${dp.newRelease}: ${release.artist} - ${release.album_name}`} />
        <meta property="og:image" content={release.image_url || ""} />
        <meta property="og:type" content="music.album" />
        <meta property="og:url" content={`https://www.musicscan.app/new-release/${release.slug}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={`https://www.musicscan.app/new-release/${release.slug}`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <BreadcrumbNavigation className="max-w-4xl mx-auto px-4 pt-4" />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/releases">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {dp.backToReleases}
          </Link>
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="relative">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted shadow-xl">
              {release.image_url ? (
                <img src={release.image_url} alt={`${release.album_name} by ${release.artist}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music2 className="w-24 h-24 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <Badge className="absolute top-4 left-4 bg-green-500 text-white">{dp.newRelease}</Badge>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{release.album_name}</h1>
              <p className="text-xl text-muted-foreground">{release.artist}</p>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{dp.releasedOn} {releaseDate}</span>
            </div>

            <div className="space-y-3">
              {release.spotify_url && (
                <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                  <a href={release.spotify_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {dp.listenOnSpotify}
                  </a>
                </Button>
              )}
              {release.blog_id && (
                <Button variant="outline" asChild className="w-full">
                  <Link to={`/plaat-verhaal/${release.blog_id}`}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    {dp.readAlbumStory}
                  </Link>
                </Button>
              )}
              {release.product_id && (
                <Button variant="outline" asChild className="w-full">
                  <Link to={`/product/${release.product_id}`}>
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    {dp.viewMerch}
                  </Link>
                </Button>
              )}
            </div>

            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-3">{dp.status}</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={release.status === 'completed' ? 'default' : 'secondary'}>
                    {release.status === 'completed' ? `✓ ${dp.processed}` : release.status}
                  </Badge>
                  {release.discogs_id && (
                    <Badge variant="outline"><Disc3 className="w-3 h-3 mr-1" />{dp.discogsLinked}</Badge>
                  )}
                  {release.product_id && (
                    <Badge variant="outline"><ShoppingBag className="w-3 h-3 mr-1" />{dp.merchAvailable}</Badge>
                  )}
                  {release.blog_id && (
                    <Badge variant="outline"><BookOpen className="w-3 h-3 mr-1" />{dp.storyAvailable}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}