import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const CommunityStats = () => {
  const { data: stats } = useQuery({
    queryKey: ['community-stats'],
    queryFn: async () => {
      const [scansResult, storiesResult, shopsResult] = await Promise.all([
        supabase.from('unified_scans').select('id', { count: 'exact', head: true }),
        supabase.from('music_stories').select('id', { count: 'exact', head: true }).eq('published', true),
        supabase.from('user_shops').select('id', { count: 'exact', head: true }).eq('is_active', true)
      ]);

      return {
        scans: scansResult.count || 0,
        stories: storiesResult.count || 0,
        shops: shopsResult.count || 0
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <section className="py-12 bg-gradient-to-r from-red-100/50 via-green-100/30 to-red-100/50 dark:from-red-950/20 dark:via-green-950/10 dark:to-red-950/20">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            🌟 Join {(stats?.scans ? Math.floor(stats.scans / 100) * 100 : 5000).toLocaleString()}+ Muziekliefhebbers
          </h2>
          
          <div className="flex flex-wrap justify-center gap-8 text-muted-foreground">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-foreground">
                {stats?.scans?.toLocaleString() || '10.000+'}
              </p>
              <p className="text-sm md:text-base">Albums Gescand</p>
            </div>
            
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-foreground">
                {stats?.stories?.toLocaleString() || '500+'}
              </p>
              <p className="text-sm md:text-base">Verhalen</p>
            </div>
            
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-foreground">
                {stats?.shops?.toLocaleString() || '50+'}
              </p>
              <p className="text-sm md:text-base">Actieve Shops</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
