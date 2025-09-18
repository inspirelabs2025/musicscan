import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Star, ThumbsUp, Edit2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, Avatar as AvatarComponent, AvatarFallback } from '@/components/ui/avatar';

interface Review {
  id: string;
  rating: number;
  review_title?: string;
  review_content?: string;
  helpful_votes: number;
  created_at: string;
  user_id: string;
  profiles?: {
    first_name: string;
  } | null;
}

interface ReviewsSectionProps {
  blogPostId: string;
}

export function ReviewsSection({ blogPostId }: ReviewsSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [rating, setRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_reviews')
        .select('*')
        .eq('blog_post_id', blogPostId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReviews(data || []);
      
      // Find user's review if logged in
      if (user) {
        const userReviewData = data?.find(r => r.user_id === user.id);
        setUserReview(userReviewData || null);
        if (userReviewData) {
          setRating(userReviewData.rating);
          setReviewTitle(userReviewData.review_title || '');
          setReviewContent(userReviewData.review_content || '');
        }
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [blogPostId, user]);

  const handleSubmitReview = async () => {
    if (!user) {
      toast({
        title: "Inloggen vereist",
        description: "Je moet ingelogd zijn om een review te plaatsen.",
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Beoordeling vereist",
        description: "Selecteer een sterrenrating.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewData = {
        blog_post_id: blogPostId,
        user_id: user.id,
        rating,
        review_title: reviewTitle.trim() || null,
        review_content: reviewContent.trim() || null,
      };

      if (userReview) {
        // Update existing review
        const { error } = await supabase
          .from('blog_reviews')
          .update(reviewData)
          .eq('id', userReview.id);

        if (error) throw error;

        toast({
          title: "Review bijgewerkt",
          description: "Je review is succesvol bijgewerkt.",
        });
      } else {
        // Create new review
        const { error } = await supabase
          .from('blog_reviews')
          .insert(reviewData);

        if (error) throw error;

        toast({
          title: "Review geplaatst",
          description: "Je review is succesvol geplaatst.",
        });
      }

      setIsEditing(false);
      await loadReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het opslaan van je review.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;

    try {
      const { error } = await supabase
        .from('blog_reviews')
        .delete()
        .eq('id', userReview.id);

      if (error) throw error;

      toast({
        title: "Review verwijderd",
        description: "Je review is succesvol verwijderd.",
      });

      setRating(0);
      setReviewTitle('');
      setReviewContent('');
      setUserReview(null);
      setIsEditing(false);
      await loadReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verwijderen van je review.",
        variant: "destructive",
      });
    }
  };

  const StarRating = ({ 
    value, 
    onChange, 
    readonly = false, 
    size = 'default' 
  }: { 
    value: number; 
    onChange?: (rating: number) => void; 
    readonly?: boolean;
    size?: 'sm' | 'default';
  }) => {
    const iconSize = size === 'sm' ? 16 : 20;
    
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={iconSize}
            className={`${
              star <= (readonly ? value : (hoveredStar || value))
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground'
            } ${!readonly ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHoveredStar(star)}
            onMouseLeave={() => !readonly && setHoveredStar(0)}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reviews laden...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reviews Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Reviews ({reviews.length})</span>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <StarRating value={averageRating} readonly />
                <span className="text-sm text-muted-foreground">
                  {averageRating.toFixed(1)} van 5
                </span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* User Review Form */}
          {user && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/20">
              <h4 className="font-medium mb-3">
                {userReview ? 'Je review' : 'Schrijf een review'}
              </h4>
              
              {(!userReview || isEditing) ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Beoordeling</label>
                    <StarRating value={rating} onChange={setRating} />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Titel (optioneel)</label>
                    <Input
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="Korte samenvatting van je mening..."
                      maxLength={100}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Review (optioneel)</label>
                    <Textarea
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      placeholder="Deel je gedachten over dit album..."
                      rows={4}
                      maxLength={500}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSubmitReview} 
                      disabled={isSubmitting || rating === 0}
                    >
                      {isSubmitting ? 'Opslaan...' : (userReview ? 'Bijwerken' : 'Review plaatsen')}
                    </Button>
                    {isEditing && (
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Annuleren
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <StarRating value={userReview.rating} readonly />
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit2 size={16} className="mr-1" />
                        Bewerken
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeleteReview}
                      >
                        <Trash2 size={16} className="mr-1" />
                        Verwijderen
                      </Button>
                    </div>
                  </div>
                  {userReview.review_title && (
                    <h5 className="font-medium">{userReview.review_title}</h5>
                  )}
                  {userReview.review_content && (
                    <p className="text-sm text-muted-foreground">{userReview.review_content}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(userReview.created_at).toLocaleDateString('nl-NL')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Other Reviews */}
          <div className="space-y-4">
            {reviews.filter(r => r.user_id !== user?.id).map((review) => (
              <div key={review.id} className="border-b pb-4 last:border-b-0">
                <div className="flex items-start gap-3">
                  <AvatarComponent className="w-8 h-8">
                    <AvatarFallback>
                      {review.profiles?.first_name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </AvatarComponent>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {review.profiles?.first_name || 'Anoniem'}
                      </span>
                      <StarRating value={review.rating} readonly size="sm" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString('nl-NL')}
                      </span>
                    </div>
                    {review.review_title && (
                      <h5 className="font-medium text-sm mb-1">{review.review_title}</h5>
                    )}
                    {review.review_content && (
                      <p className="text-sm text-muted-foreground mb-2">{review.review_content}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 text-xs"
                      >
                        <ThumbsUp size={12} className="mr-1" />
                        Nuttig ({review.helpful_votes})
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {reviews.filter(r => r.user_id !== user?.id).length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nog geen reviews. Wees de eerste!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
