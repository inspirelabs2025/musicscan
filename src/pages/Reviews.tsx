import { useState } from "react";
import { Helmet } from "react-helmet";
import { usePublicAlbumReviews } from "@/hooks/useAdminAlbumReviews";
import { AlbumReviewCard } from "@/components/reviews/AlbumReviewCard";
import { Button } from "@/components/ui/button";
import { Music2, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Reviews() {
  const { data: reviews, isLoading } = usePublicAlbumReviews();
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");

  const genres = Array.from(new Set(reviews?.map(r => r.genre).filter(Boolean)));
  const formats = Array.from(new Set(reviews?.map(r => r.format).filter(Boolean)));

  const filteredReviews = reviews?.filter(review => {
    if (genreFilter !== "all" && review.genre !== genreFilter) return false;
    if (formatFilter !== "all" && review.format !== formatFilter) return false;
    return true;
  });

  return (
    <>
      <Helmet>
        <title>Album Reviews - Muziek Recensies | MusicScan</title>
        <meta name="description" content="Ontdek eerlijke en diepgaande album reviews van nieuwe releases en klassiekers. Van singles tot LP's, alle genres gerecenseerd." />
        <meta property="og:title" content="Album Reviews - MusicScan" />
        <meta property="og:description" content="Ontdek eerlijke en diepgaande album reviews van nieuwe releases en klassiekers." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.musicscan.app/reviews/" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-primary/10 to-background py-6 px-4">
          <div className="container mx-auto max-w-6xl text-center space-y-2">
            <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full">
              <Music2 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Album Reviews</h1>
          </div>
        </div>

        {/* Filters */}
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filter op:</span>
            </div>
            
            <Select value={genreFilter} onValueChange={setGenreFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle genres</SelectItem>
                {genres.map(genre => (
                  <SelectItem key={genre} value={genre!}>{genre}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={formatFilter} onValueChange={setFormatFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle formats</SelectItem>
                {formats.map(format => (
                  <SelectItem key={format} value={format!}>
                    {format?.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(genreFilter !== "all" || formatFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setGenreFilter("all");
                  setFormatFilter("all");
                }}
              >
                Reset filters
              </Button>
            )}
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="container mx-auto max-w-6xl px-4 pb-16">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredReviews && filteredReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReviews.map(review => (
                <AlbumReviewCard key={review.id} {...review} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Music2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Geen reviews gevonden</h3>
              <p className="text-muted-foreground">
                Probeer een ander filter of kom later terug voor nieuwe reviews.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
