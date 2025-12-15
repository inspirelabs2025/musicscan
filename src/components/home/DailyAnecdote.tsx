import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';

export const DailyAnecdote = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: anecdote, isLoading } = useQuery({
    queryKey: ['daily-anecdote'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('music_anecdotes')
        .select('*')
        .eq('anecdote_date', today)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Increment view count if anecdote exists
      if (data) {
        await supabase
          .from('music_anecdotes')
          .update({ views_count: (data.views_count || 0) + 1 })
          .eq('id', data.id);
      }

      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <section className={isMobile ? "py-4" : "py-6 bg-gradient-to-br from-red-50/40 via-green-50/25 to-background dark:from-red-950/15 dark:via-green-950/10 dark:to-background"}>
        <div className="container mx-auto px-4">
          <Card className={isMobile ? "p-3 animate-pulse" : "max-w-6xl mx-auto p-4 md:p-6 animate-pulse"}>
            <div className="flex items-center gap-3">
              <div className={isMobile ? "w-10 h-10 rounded-full bg-muted" : "w-12 h-12 rounded-full bg-muted"}></div>
              <div className="flex-1">
                <div className="h-5 bg-muted rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    );
  }

  if (!anecdote) {
    return null;
  }

  // Mobile compact version
  if (isMobile) {
    return (
      <section className="py-4">
        <div className="container mx-auto px-4">
            <Card 
              className="p-3 border border-red-500/20 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/anekdotes/${anecdote.slug}`)}
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-green-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-foreground">Anekdote</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {anecdote.subject_type}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {anecdote.anecdote_title}
                </p>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </div>
          </Card>
        </div>
      </section>
    );
  }

  // Desktop version
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('nl-NL', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }).format(date);
  };

  return (
    <section className="py-6 bg-gradient-to-br from-red-50/40 via-green-50/25 to-background dark:from-red-950/15 dark:via-green-950/10 dark:to-background">
      <div className="container mx-auto px-4">
        <Card className="max-w-6xl mx-auto p-4 md:p-6 border-2 border-red-500/20 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-green-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-muted-foreground mb-1">
                <span>{formatDate(anecdote.anecdote_date)}</span>
                <Badge variant="outline" className="text-xs">
                  {anecdote.subject_type}
                </Badge>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                Anekdote
              </h2>
              <p className="text-sm text-muted-foreground line-clamp-2">
                <span className="font-semibold">{anecdote.anecdote_title}:</span> {anecdote.anecdote_content}
              </p>
            </div>

            {/* CTA */}
            <div className="flex-shrink-0">
              <Button
                variant="default"
                onClick={() => navigate(`/anekdotes/${anecdote.slug}`)}
                className="gap-2 bg-gradient-to-r from-red-600 to-green-600 hover:opacity-90"
              >
                Lees meer
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};