import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Eye, Heart, MessageCircle } from "lucide-react";

interface FeaturedPhoto {
  id: string;
  display_url: string;
  seo_title: string;
  seo_slug: string;
  artist: string | null;
  year: number | null;
  like_count: number;
  comment_count: number;
  view_count: number;
  format: string | null;
}

export function FeaturedPhotos() {
  const { data: photos, isLoading } = useQuery({
    queryKey: ["featured-photos"],
    queryFn: async () => {
      // Fetch directly from photos table, sorted by engagement
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("status", "published")
        .order("view_count", { ascending: false })
        .limit(8);

      if (error) throw error;
      return data as FeaturedPhoto[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading || !photos || photos.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Populaire Muziek Herinneringen</h2>
          <p className="text-muted-foreground">
            De meest bekeken en gewaardeerde foto's van onze community
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <Link key={photo.id} to={`/photo/${photo.seo_slug}`}>
              <Card className="group overflow-hidden hover:shadow-lg transition-all cursor-pointer">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={photo.display_url}
                    alt={photo.seo_title || "Music memory"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate">{photo.artist || "Onbekend"}</h3>
                  {photo.year && <p className="text-xs text-muted-foreground">{photo.year}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {photo.view_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {photo.like_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {photo.comment_count}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link 
            to="/fanwall"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8"
          >
            Bekijk alle foto's
          </Link>
        </div>
      </div>
    </section>
  );
}
