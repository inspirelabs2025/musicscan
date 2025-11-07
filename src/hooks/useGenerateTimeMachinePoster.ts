import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GeneratePosterOptions {
  eventId?: string;
  eventData?: any;
  generateMetal?: boolean;
}

interface GeneratePosterResponse {
  success: boolean;
  poster_url: string;
  metal_print_url?: string;
  qr_code_url: string;
  qr_code_image: string;
  event_id: string;
}

export const useGenerateTimeMachinePoster = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options: GeneratePosterOptions) => {
      toast({
        title: 'AI Poster Generation Gestart',
        description: 'Dit kan 30-60 seconden duren...',
      });

      const { data, error } = await supabase.functions.invoke('generate-time-machine-poster', {
        body: {
          eventId: options.eventId,
          eventData: options.eventData,
          generateMetal: options.generateMetal ?? true
        }
      });

      if (error) throw error;
      return data as GeneratePosterResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['time-machine-events'] });
      queryClient.invalidateQueries({ queryKey: ['time-machine-event', data.event_id] });
      
      toast({
        title: '🎨 Posters Gegenereerd!',
        description: 'AI heeft je Time Machine poster(s) succesvol aangemaakt',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Generatie Mislukt',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
