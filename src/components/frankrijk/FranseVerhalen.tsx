import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Eye, ArrowRight, Music } from "lucide-react";
import { useFranseVerhalen } from "@/hooks/useFranseMuziek";

export const FranseVerhalen = () => {
  const navigate = useNavigate();
  const { data: verhalen, isLoading } = useFranseVerhalen();

  if (isLoading) {
    return (
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!verhalen || verhalen.length === 0) {
    return (
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nog geen Franse verhalen
            </h3>
            <p className="text-muted-foreground">
              Binnenkort beschikbaar!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              📖 Franse Album Verhalen
            </h2>
            <p className="text-muted-foreground">
              Ontdek de verhalen achter iconische Franse albums
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/muziek-verhalen')}
            className="hidden md:flex gap-2 border-[#0055A4]/30 hover:border-[#0055A4]"
          >
            Alle Verhalen
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {verhalen.slice(0, 6).map((verhaal) => {
            const frontmatter = verhaal.yaml_frontmatter as any;
            const title = frontmatter?.title || 'Onbekend Album';
            const artist = frontmatter?.artist || 'Onbekende Artiest';

            return (
              <Card
                key={verhaal.id}
                className="group cursor-pointer hover:border-[#0055A4]/50 transition-all overflow-hidden"
                onClick={() => navigate(`/plaat-verhaal/${verhaal.slug}`)}
              >
                <CardContent className="p-0">
                  {/* Image */}
                  <div className="aspect-video bg-gradient-to-br from-[#0055A4]/20 to-[#EF4135]/20 relative overflow-hidden">
                    {verhaal.album_cover_url ? (
                      <img
                        src={verhaal.album_cover_url}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 bg-[#0055A4] text-white text-xs rounded-full">
                        🇫🇷 Frans
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground group-hover:text-[#0055A4] transition-colors line-clamp-1">
                      {title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">{artist}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      {verhaal.views_count || 0} views
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Mobile Button */}
        <div className="mt-6 md:hidden">
          <Button
            variant="outline"
            onClick={() => navigate('/muziek-verhalen')}
            className="w-full gap-2 border-[#0055A4]/30"
          >
            Bekijk Alle Verhalen
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
