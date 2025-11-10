import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Music2, Calendar } from "lucide-react";
import ReactMarkdown from "react-markdown";

export const DailyAnecdote = () => {
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
                <Music2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(anecdote.anecdote_date)}</span>
                <span className="ml-2 px-2 py-1 bg-vinyl-purple/10 text-vinyl-purple rounded-md text-xs font-medium">
                  {anecdote.subject_type}
                </span>
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

          {/* Content */}
          <div className="prose prose-lg max-w-none text-foreground/90 leading-relaxed">
            <ReactMarkdown>{anecdote.anecdote_content}</ReactMarkdown>
          </div>

          {/* Source Reference */}
          {anecdote.source_reference && (
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground italic">
                Bron: {anecdote.source_reference}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-vinyl-purple">Dagelijkse Muziek Anekdote</span>
              <span className="mx-2">•</span>
              <span>{anecdote.views_count || 0} weergaven</span>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};
