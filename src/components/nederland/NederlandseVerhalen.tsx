import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BookOpen, Eye, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNederlandseVerhalen } from "@/hooks/useNederlandseMuziek";

export function NederlandseVerhalen() {
  const { data: verhalen, isLoading } = useNederlandseVerhalen();

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Nederlandse Album Verhalen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!verhalen || verhalen.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Nederlandse Album{" "}
            <span className="text-[hsl(211,100%,35%)]">Verhalen</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Diepgaande verhalen achter iconische Nederlandse albums en singles
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {verhalen.slice(0, 6).map((verhaal, index) => (
            <motion.div
              key={verhaal.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={`/plaat-verhaal/${verhaal.slug}`}>
                <Card className="group h-full overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-[hsl(211,100%,35%)]/30">
                  {/* Album Cover */}
                  <div className="relative aspect-square overflow-hidden">
                    {verhaal.album_cover_url || verhaal.yaml_frontmatter?.coverImage ? (
                      <img
                        src={verhaal.album_cover_url || verhaal.yaml_frontmatter?.coverImage}
                        alt={verhaal.yaml_frontmatter?.title || 'Album cover'}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[hsl(24,100%,50%)] to-[hsl(211,100%,35%)] flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-white/50" />
                      </div>
                    )}
                    
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white rounded-full p-3">
                          <BookOpen className="w-6 h-6 text-[hsl(211,100%,35%)]" />
                        </div>
                      </div>
                    </div>

                    {/* Dutch badge */}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-[hsl(24,100%,50%)] hover:bg-[hsl(24,100%,45%)]">
                        🇳🇱 Nederlands
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-lg line-clamp-1 group-hover:text-[hsl(211,100%,35%)] transition-colors">
                      {verhaal.yaml_frontmatter?.title || 'Album verhaal'}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-2">
                      {verhaal.yaml_frontmatter?.artist}
                      {verhaal.yaml_frontmatter?.year && ` • ${verhaal.yaml_frontmatter.year}`}
                    </p>
                    {verhaal.yaml_frontmatter?.genre && (
                      <Badge variant="outline" className="text-xs">
                        {verhaal.yaml_frontmatter.genre}
                      </Badge>
                    )}
                    {verhaal.views_count > 0 && (
                      <div className="flex items-center gap-1 text-muted-foreground text-xs mt-2">
                        <Eye className="w-3 h-3" />
                        {verhaal.views_count.toLocaleString()} views
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {verhalen.length > 6 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Button asChild variant="outline" size="lg" className="border-[hsl(211,100%,35%)] text-[hsl(211,100%,35%)] hover:bg-[hsl(211,100%,35%)] hover:text-white">
              <Link to="/verhalen?country=netherlands">
                Bekijk alle {verhalen.length} Nederlandse verhalen
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
