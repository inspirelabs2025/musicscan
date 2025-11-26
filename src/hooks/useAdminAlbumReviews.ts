import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminAlbumReview {
  id: string;
  slug: string;
  artist_name: string;
  album_title: string;
  release_year?: number;
  genre?: string;
  label?: string;
  format?: string;
  title: string;
  summary: string;
  content: string;
  rating?: number;
  rating_breakdown?: Record<string, number>;
  cover_image_url?: string;
  spotify_embed_url?: string;
  youtube_embed_url?: string;
  listening_context?: string;
  recommended_for?: string;
  author_name?: string;
  is_published: boolean;
  published_at?: string;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export const useAdminAlbumReviews = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-album-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_album_reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AdminAlbumReview[];
    },
  });

  const createReview = useMutation({
    mutationFn: async (review: Partial<AdminAlbumReview>) => {
      const { data, error } = await supabase
        .from("admin_album_reviews")
        .insert(review)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-album-reviews"] });
      toast({
        title: "Review aangemaakt",
        description: "De album review is succesvol aangemaakt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij aanmaken",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateReview = useMutation({
    mutationFn: async ({ id, ...review }: Partial<AdminAlbumReview> & { id: string }) => {
      const { data, error } = await supabase
        .from("admin_album_reviews")
        .update(review)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-album-reviews"] });
      toast({
        title: "Review bijgewerkt",
        description: "De album review is succesvol bijgewerkt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij bijwerken",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("admin_album_reviews")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-album-reviews"] });
      toast({
        title: "Review verwijderd",
        description: "De album review is succesvol verwijderd.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij verwijderen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    reviews,
    isLoading,
    createReview,
    updateReview,
    deleteReview,
  };
};

export const usePublicAlbumReviews = () => {
  return useQuery({
    queryKey: ["public-album-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_album_reviews")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data as AdminAlbumReview[];
    },
  });
};

export const usePublicAlbumReview = (slug: string) => {
  return useQuery({
    queryKey: ["public-album-review", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_album_reviews")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (error) throw error;
      return data as AdminAlbumReview;
    },
    enabled: !!slug,
  });
};
