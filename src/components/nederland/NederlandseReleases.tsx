import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Disc, Filter, Calendar, ChevronLeft, ChevronRight, Music } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNederlandseReleases, useNederlandseGenres } from "@/hooks/useNederlandseMuziek";

export function NederlandseReleases() {
  const { data: releases, isLoading } = useNederlandseReleases();
  const { data: genres } = useNederlandseGenres();
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("year-desc");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 12;

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Nederlandse Releases</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Filter and sort releases
  let filteredReleases = releases || [];
  
  if (selectedGenre !== "all") {
    filteredReleases = filteredReleases.filter(r => 
      r.genre?.toLowerCase().includes(selectedGenre.toLowerCase())
    );
  }

  filteredReleases = [...filteredReleases].sort((a, b) => {
    switch (sortBy) {
      case "year-desc":
        return (b.year || 0) - (a.year || 0);
      case "year-asc":
        return (a.year || 0) - (b.year || 0);
      case "artist":
        return a.artist.localeCompare(b.artist);
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(filteredReleases.length / itemsPerPage);
  const paginatedReleases = filteredReleases.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  // Get decade stats
  const decadeStats = (releases || []).reduce((acc, r) => {
    if (r.year) {
      const decade = Math.floor(r.year / 10) * 10;
      acc[decade] = (acc[decade] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Nederlandse{" "}
            <span className="text-[hsl(24,100%,50%)]">Releases</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {filteredReleases.length} releases uit Nederland in onze collectie
          </p>
        </motion.div>

        {/* Decade pills */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {Object.entries(decadeStats)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([decade, count]) => (
              <Badge
                key={decade}
                variant="outline"
                className="cursor-default"
              >
                {decade}s: {count}
              </Badge>
            ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4 mb-8"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alle genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle genres</SelectItem>
                {genres?.map(genre => (
                  <SelectItem key={genre.name} value={genre.name}>
                    {genre.name} ({genre.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sorteren" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="year-desc">Nieuwste eerst</SelectItem>
                <SelectItem value="year-asc">Oudste eerst</SelectItem>
                <SelectItem value="artist">Artiest A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Releases grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {paginatedReleases.map((release, index) => (
            <motion.div
              key={release.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/release/${release.id}`}>
                <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-[hsl(24,100%,50%)]/30">
                  <div className="relative aspect-square">
                    {release.cover_url ? (
                      <img
                        src={release.cover_url}
                        alt={`${release.artist} - ${release.title}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[hsl(24,100%,50%)] to-[hsl(211,100%,35%)] flex items-center justify-center">
                        <Disc className="w-12 h-12 text-white/50" />
                      </div>
                    )}
                    
                    {/* Year badge */}
                    {release.year && (
                      <div className="absolute bottom-2 right-2">
                        <Badge className="bg-black/70 text-white text-xs">
                          {release.year}
                        </Badge>
                      </div>
                    )}

                    {/* Dutch flag */}
                    <div className="absolute top-2 left-2 text-lg">🇳🇱</div>
                  </div>
                  <div className="p-2">
                    <h3 className="font-medium text-sm line-clamp-1 group-hover:text-[hsl(24,100%,50%)] transition-colors">
                      {release.title}
                    </h3>
                    <p className="text-muted-foreground text-xs line-clamp-1">
                      {release.artist}
                    </p>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex justify-center items-center gap-4 mt-8"
          >
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Pagina {currentPage + 1} van {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}

        {/* View all link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <Link 
            to="/releases?country=Netherlands"
            className="inline-flex items-center gap-2 text-[hsl(24,100%,50%)] hover:text-[hsl(24,100%,40%)] font-medium"
          >
            Bekijk alle {releases?.length || 0} releases
            <Music className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
