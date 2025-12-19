import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Mic2, Eye, ArrowRight } from "lucide-react";
import { useNederlandseSingles } from "@/hooks/useNederlandseMuziek";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function NederlandseSingles() {
  const { data: singles, isLoading } = useNederlandseSingles();

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!singles || singles.length === 0) return null;

  const displayedSingles = singles.slice(0, 12);

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-[hsl(280,70%,50%)]/10 text-[hsl(280,70%,50%)] px-4 py-2 rounded-full mb-4">
            <Mic2 className="w-4 h-4" />
            <span className="text-sm font-medium">Nederlandse Singles</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Iconische Nederlandse Singles
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            De grootste hits en verhalen achter Nederlandse singles
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {displayedSingles.map((single, index) => (
            <motion.div
              key={single.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/singles/${single.slug}`}
                className="group block relative aspect-square rounded-xl overflow-hidden bg-card border border-border hover:border-[hsl(280,70%,50%)]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[hsl(280,70%,50%)]/10"
              >
                {single.artwork_url ? (
                  <img
                    src={single.artwork_url}
                    alt={`${single.artist} - ${single.single_name}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[hsl(280,70%,50%)] to-[hsl(280,50%,30%)] flex items-center justify-center">
                    <Mic2 className="w-12 h-12 text-white/50" />
                  </div>
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <p className="text-white font-semibold text-sm truncate">{single.single_name}</p>
                  <p className="text-white/70 text-xs truncate">{single.artist}</p>
                </div>

                {/* Always visible title bar */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent group-hover:opacity-0 transition-opacity duration-300">
                  <p className="text-white text-xs font-medium truncate">{single.artist}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {singles.length > 12 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <Button asChild variant="outline" className="group">
              <Link to="/singles?country=NL">
                Bekijk alle {singles.length} singles
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
