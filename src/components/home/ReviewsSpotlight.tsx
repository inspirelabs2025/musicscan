import { Link } from 'react-router-dom';
import { usePublicAlbumReviews } from '@/hooks/useAdminAlbumReviews';
import { AlbumReviewCard } from '@/components/reviews/AlbumReviewCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Star, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

export const ReviewsSpotlight = () => {
  const isMobile = useIsMobile();
  const { data: reviews, isLoading } = usePublicAlbumReviews();

  if (isLoading) {
    return (
      <section className={isMobile ? "py-8 bg-gradient-to-br from-background to-muted/30" : "py-16 bg-gradient-to-br from-background to-muted/30"}>
        <div className="container mx-auto px-4">
          <div className={isMobile ? "text-center mb-6" : "text-center mb-12"}>
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!reviews || reviews.length === 0) {
    return null;
  }

  // Show only first 3 reviews
  const featuredReviews = reviews.slice(0, 3);

  const renderReviewCard = (review: any) => (
    <AlbumReviewCard
      key={review.id}
      slug={review.slug}
      artist_name={review.artist_name}
      album_title={review.album_title}
      genre={review.genre}
      format={review.format}
      release_year={review.release_year}
      summary={review.summary}
      rating={review.rating}
      cover_image_url={review.cover_image_url}
    />
  );

  return (
    <section className={isMobile ? "py-8 bg-gradient-to-br from-background to-muted/30" : "py-16 bg-gradient-to-br from-background to-muted/30"}>
      <div className="container mx-auto px-4">
        <div className={isMobile ? "text-center mb-6" : "text-center mb-12"}>
          <h2 className={isMobile ? "text-2xl font-bold mb-2" : "text-4xl font-bold mb-4"}>
            <Star className={isMobile ? "inline-block w-6 h-6 mr-2 text-vinyl-gold" : "inline-block w-10 h-10 mr-3 text-vinyl-gold"} />
            Album Reviews
          </h2>
          {!isMobile && (
            <p className="text-xl text-muted-foreground">
              Onze nieuwste platenrecensies
            </p>
          )}
        </div>

        {isMobile ? (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2">
              {featuredReviews.map((review) => (
                <CarouselItem key={review.id} className="pl-2 basis-[80%]">
                  {renderReviewCard(review)}
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredReviews.map((review) => renderReviewCard(review))}
          </div>
        )}

        {/* View All Link */}
        <div className="text-center mt-6">
          <Button asChild variant="outline" size={isMobile ? "default" : "lg"}>
            <Link to="/reviews">
              Meer Reviews
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
