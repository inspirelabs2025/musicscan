import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Eye, Heart, Camera, Upload } from "lucide-react";

interface ArtistFanwallCard {
  id: string;
  artist_name: string;
  slug: string;
  photo_count: number;
  total_views: number;
  total_likes: number;
  featured_photo_url: string | null;
  updated_at: string;
}

export function FeaturedPhotos() {
  const { data: artists, isLoading } = useQuery({
    queryKey: ["featured-artists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artist_fanwalls")
        .select("*")
        .eq("is_active", true)
        .gt("photo_count", 0)
        .order("updated_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data as ArtistFanwallCard[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return null;
  }

  // Create array of 3 items, fill with artists or placeholders
  const displayItems = Array.from({ length: 3 }, (_, index) => 
    artists && artists[index] ? { type: 'artist', data: artists[index] } : { type: 'placeholder', data: null }
  );

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Fanwall</h2>
          <p className="text-muted-foreground">
            De meest actieve artiesten in onze community
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayItems.map((item, index) => (
            item.type === 'artist' ? (
              <Link key={item.data.id} to={`/fanwall/${item.data.slug}`}>
                <Card className="group overflow-hidden hover:shadow-lg transition-all cursor-pointer h-full">
                  <div className="aspect-square overflow-hidden bg-muted">
                    {item.data.featured_photo_url ? (
                      <img
                        src={item.data.featured_photo_url}
                        alt={item.data.artist_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-3">{item.data.artist_name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Camera className="h-4 w-4" />
                        {item.data.photo_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {item.data.total_views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {item.data.total_likes}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ) : (
              <Card key={`placeholder-${index}`} className="border-dashed border-2 h-full opacity-60">
                <div className="aspect-square flex items-center justify-center bg-muted/30">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="p-4 text-center">
                  <p className="text-muted-foreground text-sm">Binnenkort beschikbaar</p>
                </div>
              </Card>
            )
          ))}
        </div>

        <div className="text-center mt-8">
          <Link 
            to="/fanwall"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8"
          >
            Ontdek alle Artiesten
          </Link>
        </div>
      </div>
    </section>
  );
}
