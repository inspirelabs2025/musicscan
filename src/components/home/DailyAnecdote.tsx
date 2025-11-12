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
      <section className="py-12 bg-gradient-to-br from-vinyl-purple/10 via-accent/5 to-background">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto p-8 animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-muted rounded w-full mb-2"></div>
            <div className="h-4 bg-muted rounded w-full mb-2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
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
    <section className="py-12 bg-gradient-to-br from-vinyl-purple/10 via-accent/5 to-background">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto p-8 md:p-12 border-2 border-vinyl-purple/20 shadow-xl hover:shadow-2xl transition-shadow duration-300">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-vinyl-purple to-accent flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span>{formatDate(anecdote.anecdote_date)}</span>
                <Badge variant="outline" className="ml-2">
                  {anecdote.subject_type}
                </Badge>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {anecdote.anecdote_title}
              </h2>
              {anecdote.subject_details && (
                <p className="text-lg text-muted-foreground">
                  {anecdote.subject_details.artist && (
                    <span className="font-medium text-vinyl-purple">
                      {anecdote.subject_details.artist}
                    </span>
                  )}
                  {anecdote.subject_details.title && anecdote.subject_details.artist && ' - '}
                  {anecdote.subject_details.title}
                  {anecdote.subject_details.year && (
                    <span className="text-muted-foreground ml-2">
                      ({anecdote.subject_details.year})
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Content Preview */}
          <div className="prose prose-lg max-w-none text-foreground/90 leading-relaxed mb-4">
            <p>{anecdote.anecdote_content}</p>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-border flex-wrap gap-4">
            <Button
              variant="default"
              onClick={() => navigate(`/anekdotes/${anecdote.slug}`)}
              className="gap-2"
            >
              Lees het volledige verhaal
              <ArrowRight className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/anekdotes')}
              className="text-primary hover:text-primary/80"
            >
              Alle anekdotes →
            </Button>
          </div>

          {/* Source Reference */}
          {anecdote.source_reference && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground italic">
                Bron: {anecdote.source_reference}
              </p>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
};
