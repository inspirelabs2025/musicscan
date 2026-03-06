import { Link } from 'react-router-dom';
import { Camera, Gamepad2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function CommunitySection() {
  const { data: fanwallPhotos } = useQuery({
    queryKey: ['homepage-fanwall'],
    queryFn: async () => {
      const { data } = await supabase
        .from('artist_fanwalls')
        .select('id,slug,artist_name,featured_photo_url')
        .eq('is_active', true)
        .order('total_views', { ascending: false })
        .limit(3);
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  return (
    <section className="py-14 bg-muted/50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-foreground mb-6">Community</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fanwall */}
          <Card className="overflow-hidden border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">Fanwall</h3>
              </div>
              <div className="flex gap-3 mb-4">
                {fanwallPhotos?.map((fw) => (
                  <Link
                    key={fw.id}
                    to={`/fanwall/${fw.slug}`}
                    className="flex-shrink-0"
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                      {fw.featured_photo_url ? (
                        <img
                          src={fw.featured_photo_url}
                          alt={fw.artist_name}
                          loading="lazy"
                          width={80}
                          height={80}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <span className="text-xl font-bold text-primary/60">
                            {fw.artist_name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 truncate w-20 text-center">{fw.artist_name}</p>
                  </Link>
                ))}
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/fanwall">
                  Bekijk Fanwall <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quiz */}
          <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Gamepad2 className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-foreground">Dagelijkse Challenge</h3>
                </div>
                <p className="text-muted-foreground text-sm mb-6">
                  Test je muziekkennis met de dagelijkse quiz! Verdien punten, unlock badges en bestrijd het leaderboard.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link to="/quizzen">
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  Speel nu
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
