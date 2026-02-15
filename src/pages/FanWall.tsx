import { useState, useRef, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Upload, Eye } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useLanguage } from "@/contexts/LanguageContext";

interface Photo {
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
  user_id: string;
  profiles: {
    user_id: string;
    first_name: string;
    avatar_url: string | null;
  } | null;
}

export default function FanWall() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userFilter = searchParams.get("user");
  const [searchQuery, setSearchQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { tr } = useLanguage();
  const f = tr.fanwall;

  const ITEMS_PER_PAGE = 20;

  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfiniteQuery({
    queryKey: ["fanwall-photos", searchQuery, formatFilter, userFilter],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from("photos")
        .select("*, profiles(user_id, first_name, avatar_url)")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .range(pageParam, pageParam + ITEMS_PER_PAGE - 1);

      if (searchQuery) {
        query = query.or(`artist.ilike.%${searchQuery}%,caption.ilike.%${searchQuery}%`);
      }

      if (formatFilter !== "all") {
        query = query.eq("format", formatFilter);
      }

      if (userFilter) {
        query = query.eq("user_id", userFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Photo[];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < ITEMS_PER_PAGE) return undefined;
      return allPages.length * ITEMS_PER_PAGE;
    },
    initialPageParam: 0,
  });

  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const photos = data?.pages.flatMap((page) => page) ?? [];

  return (
    <>
      <Helmet>
        <title>{f.metaTitle}</title>
        <meta name="description" content={f.metaDesc} />
        <link rel="canonical" href="https://www.musicscan.app/fanwall" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">{f.title}</h1>
            <p className="text-muted-foreground">{f.subtitle}</p>
          </div>

          <Card className="p-4 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={f.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={formatFilter} onValueChange={setFormatFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{f.allFormats}</SelectItem>
                  <SelectItem value="concert">Concert</SelectItem>
                  <SelectItem value="vinyl">Vinyl</SelectItem>
                  <SelectItem value="cd">CD</SelectItem>
                  <SelectItem value="cassette">Cassette</SelectItem>
                  <SelectItem value="poster">Poster</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => navigate("/upload")} className="gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </div>
          </Card>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : photos && photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <Card key={photo.id} className="group overflow-hidden hover:shadow-lg transition-all">
                  <Link to={`/photo/${photo.seo_slug}`}>
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={photo.display_url}
                        alt={photo.seo_title || "Music memory"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  </Link>
                  <div className="p-3">
                    {photo.profiles && (
                      <Link 
                        to={`/profile/${photo.profiles.user_id}`}
                        className="flex items-center gap-2 mb-2 hover:opacity-80 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={photo.profiles.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {photo.profiles.first_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">{photo.profiles.first_name}</span>
                      </Link>
                    )}
                    
                    <Link to={`/photo/${photo.seo_slug}`}>
                      <h3 className="font-semibold text-sm truncate">{photo.artist || f.unknown}</h3>
                      {photo.year && <p className="text-xs text-muted-foreground">{photo.year}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {photo.view_count > 0 && (
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {photo.view_count}
                          </span>
                        )}
                        <span>❤️ {photo.like_count}</span>
                        <span>💬 {photo.comment_count}</span>
                      </div>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">{f.noPhotos}</p>
              <Button onClick={() => navigate("/upload")}>{f.uploadFirst}</Button>
            </div>
          )}

          {hasNextPage && (
            <div ref={loadMoreRef} className="py-8 text-center">
              {isFetchingNextPage && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
