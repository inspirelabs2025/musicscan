import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Disc, ChevronLeft, ChevronRight, Music } from "lucide-react";
import { useFranseReleases, useFranseGenres } from "@/hooks/useFranseMuziek";
import { cn } from "@/lib/utils";

export const FranseReleases = () => {
  const navigate = useNavigate();
  const { data: releases, isLoading } = useFranseReleases();
  const { data: genres } = useFranseGenres();
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const itemsPerPage = 8;

  const filteredReleases = selectedGenre
    ? releases?.filter(r => r.genre?.toLowerCase().includes(selectedGenre.toLowerCase()))
    : releases;

  const totalPages = Math.ceil((filteredReleases?.length || 0) / itemsPerPage);
  const paginatedReleases = filteredReleases?.slice(
    page * itemsPerPage,
    (page + 1) * itemsPerPage
  );

  if (isLoading) {
    return (
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            💿 Franse Releases
          </h2>
          <p className="text-muted-foreground">
            Ontdek releases uit Frankrijk
          </p>
        </div>

        {/* Genre Filter */}
        {genres && genres.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              onClick={() => {
                setSelectedGenre(null);
                setPage(0);
              }}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm transition-all",
                selectedGenre === null
                  ? "bg-[#0055A4] text-white"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              Alle
            </button>
            {genres.slice(0, 8).map(({ genre }) => (
              <button
                key={genre}
                onClick={() => {
                  setSelectedGenre(genre);
                  setPage(0);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm transition-all",
                  selectedGenre === genre
                    ? "bg-[#0055A4] text-white"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}
              >
                {genre}
              </button>
            ))}
          </div>
        )}

        {/* Releases Grid */}
        {paginatedReleases && paginatedReleases.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {paginatedReleases.map((release) => (
                <Card
                  key={release.id}
                  className="group cursor-pointer hover:border-[#0055A4]/50 transition-all overflow-hidden"
                >
                  <CardContent className="p-0">
                    <div className="aspect-square bg-gradient-to-br from-[#0055A4]/20 to-[#EF4135]/20 relative">
                      {release.front_image ? (
                        <img
                          src={release.front_image}
                          alt={release.title || 'Release'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Disc className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      {release.year && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                          {release.year}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-foreground text-sm line-clamp-1 group-hover:text-[#0055A4] transition-colors">
                        {release.title || 'Onbekend'}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {release.artist || 'Onbekende Artiest'}
                      </p>
                      {release.genre && (
                        <div className="flex items-center gap-1 mt-1">
                          <Music className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{release.genre}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Pagina {page + 1} van {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Disc className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Geen releases gevonden
            </h3>
            <p className="text-muted-foreground">
              {selectedGenre ? `Geen ${selectedGenre} releases beschikbaar` : 'Binnenkort beschikbaar!'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
