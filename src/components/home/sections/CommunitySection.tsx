import { Link } from 'react-router-dom';
import { Camera, Gamepad2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { optimizeImageUrl } from '@/lib/image-utils';

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
    <section className="py-10 md:py-16 bg-background px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Community</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl bg-card border border-border p-4 md:p-6 shadow-md">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Camera className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-foreground text-sm md:text-base">Fanwall</h3>
            </div>
            <div className="flex gap-2.5 md:gap-3 mb-3 md:mb-4">
              {fanwallPhotos?.map((fw) => (
                <Link key={fw.id} to={`/fanwall/${fw.slug}`} className="flex-shrink-0 min-h-[44px]">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-muted shadow-sm border border-border">
                    {fw.featured_photo_url ? (
                      <img
                        src={optimizeImageUrl(fw.featured_photo_url!, { width: 80, height: 80 })}
                        alt={`${fw.artist_name} fanwall foto`}
                        loading="lazy"
                        decoding="async"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary/60">
                          {fw.artist_name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 truncate w-16 md:w-20 text-center">{fw.artist_name}</p>
                </Link>
              ))}
            </div>
            <Button asChild variant="outline" size="sm" className="min-h-[44px]">
              <Link to="/fanwall">
                Bekijk Fanwall <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>

          <div className="rounded-xl bg-card border border-border p-4 md:p-6 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <Gamepad2 className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground text-sm md:text-base">Dagelijkse Challenge</h3>
              </div>
              <p className="text-muted-foreground text-xs md:text-sm mb-4 md:mb-6">
                Test je muziekkennis met de dagelijkse quiz! Verdien punten, unlock badges en bestrijd het leaderboard.
              </p>
            </div>
            <Button asChild className="w-full min-h-[44px]">
              <Link to="/quizzen">
                <Gamepad2 className="w-4 h-4 mr-2" />
                Speel nu
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
