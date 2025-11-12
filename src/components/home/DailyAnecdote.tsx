import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export const DailyAnecdote = () => {
  const navigate = useNavigate();
  const { data: anecdote, isLoading } = useQuery({
    queryKey: ['daily-anecdote'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('music_anecdotes')
        .select('*')
        .eq('anecdote_date', today)
        .eq('is_active', true)
        .single();

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
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (isLoading) {
    return (
      <section className="py-6 bg-gradient-to-br from-vinyl-purple/10 via-accent/5 to-background">
        <div className="container mx-auto px-4">
          <Card className="max-w-6xl mx-auto p-4 md:p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted"></div>
              <div className="flex-1">
                <div className="h-6 bg-muted rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
              </div>
              <div className="w-24 h-10 bg-muted rounded"></div>
            </div>
          </Card>
        </div>
      </section>
    );
  }

  if (!anecdote) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('nl-NL', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }).format(date);
  };

  return (
    <section className="py-6 bg-gradient-to-br from-vinyl-purple/10 via-accent/5 to-background">
      <div className="container mx-auto px-4">
        <Card className="max-w-6xl mx-auto p-4 md:p-6 border-2 border-vinyl-purple/20 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-vinyl-purple to-accent flex items-center justify-center">
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
                {anecdote.anecdote_title}
              </h2>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {anecdote.anecdote_content}
              </p>
            </div>

            {/* CTA */}
            <div className="flex-shrink-0">
              <Button
                variant="default"
                onClick={() => navigate(`/anekdotes/${anecdote.slug}`)}
                className="gap-2"
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
