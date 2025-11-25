import { Link } from 'react-router-dom';
import { usePublicAlbumReviews } from '@/hooks/useAdminAlbumReviews';
import { AlbumReviewCard } from '@/components/reviews/AlbumReviewCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Star } from 'lucide-react';

export const ReviewsSpotlight = () => {
  const { data: reviews, isLoading } = usePublicAlbumReviews();

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
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

  return (
    <section className="py-16 bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            <Star className="inline-block w-10 h-10 mr-3 text-vinyl-gold" />
            Album Reviews
          </h2>
          <p className="text-xl text-muted-foreground">
            Onze nieuwste platenrecensies
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredReviews.map((review) => (
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
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center mt-8">
          <Link 
            to="/reviews"
            className="inline-flex items-center gap-2 text-lg font-semibold text-primary hover:underline"
          >
            Bekijk Alle Reviews →
          </Link>
        </div>
      </div>
    </section>
  );
};
