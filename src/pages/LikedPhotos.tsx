import { useNavigate } from "react-router-dom";
import { useLikedPhotos } from "@/hooks/usePhotoLike";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ArrowLeft, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export default function LikedPhotos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: likedPhotos, isLoading } = useLikedPhotos();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 max-w-md text-center">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Login Vereist</h2>
          <p className="text-muted-foreground mb-6">Log in om je gelikte foto's te bekijken</p>
          <Button onClick={() => navigate("/auth")} className="w-full">Inloggen</Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gelikte Foto's | MusicScan FanWall</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/fanwall")}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Terug naar FanWall
              </Button>
              <div className="flex items-center gap-3 mb-2">
                <Heart className="h-8 w-8 text-primary fill-current" />
                <h1 className="text-4xl font-bold">Gelikte Foto's</h1>
              </div>
              <p className="text-muted-foreground">
                Je collectie van favoriete muziek herinneringen
              </p>
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : likedPhotos && likedPhotos.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  {likedPhotos.length} foto{likedPhotos.length !== 1 ? "'s" : ""} geliked
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {likedPhotos.map((like: any) => {
                    const photo = like.photos;
                    if (!photo) return null;

                    return (
                      <Card key={like.id} className="group overflow-hidden hover:shadow-lg transition-all">
                        <Link to={`/photo/${photo.seo_slug}`}>
                          <div className="aspect-square overflow-hidden">
                            <img
                              src={photo.display_url}
                              alt={photo.seo_title || "Muziek herinnering"}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <div className="p-3">
                            <h3 className="font-semibold text-sm truncate">
                              {photo.artist || "Onbekend"}
                            </h3>
                            {photo.year && (
                              <p className="text-xs text-muted-foreground">{photo.year}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              {photo.view_count > 0 && (
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {photo.view_count}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3 fill-current" />
                                {photo.like_count || 0}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Geliked op {format(new Date(like.created_at), "d MMM yyyy", { locale: nl })}
                            </p>
                          </div>
                        </Link>
                      </Card>
                    );
                  })}
                </div>
              </>
            ) : (
              <Card className="p-12 text-center">
                <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold mb-2">Nog geen gelikte foto's</h2>
                <p className="text-muted-foreground mb-6">
                  Ontdek de FanWall en like je favoriete muziek herinneringen
                </p>
                <Button onClick={() => navigate("/fanwall")}>
                  Ontdek FanWall
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
