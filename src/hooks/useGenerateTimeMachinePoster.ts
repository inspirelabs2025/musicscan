import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GeneratePosterOptions {
  eventId?: string;
  eventData?: any;
  generateMetal?: boolean;
  createProducts?: boolean;
}

interface GeneratePosterResponse {
  success: boolean;
  poster_url: string;
  metal_print_url?: string;
  qr_code_url: string;
  qr_code_image: string;
  event_id: string;
  style_variants?: Array<{
    style: string;
    url: string;
    label: string;
    emoji: string;
  }>;
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

      const posterData = data as GeneratePosterResponse;

      // Create products if requested (defaults to true)
      if (options.createProducts !== false && posterData.event_id) {
        try {
          const { error: productsError } = await supabase.functions.invoke('create-time-machine-products', {
            body: { 
              eventId: posterData.event_id,
              styleVariants: posterData.style_variants || []
            }
          });

          if (productsError) {
            console.error('Failed to create products:', productsError);
            toast({
              title: 'Posters Gegenereerd',
              description: 'Posters zijn gemaakt maar producten konden niet worden aangemaakt',
              variant: 'destructive',
            });
          } else {
            console.log('✅ Products created successfully');
          }
        } catch (productError) {
          console.error('Error creating products:', productError);
        }
      }

      return posterData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['time-machine-events'] });
      queryClient.invalidateQueries({ queryKey: ['time-machine-event', data.event_id] });
      queryClient.invalidateQueries({ queryKey: ['platform-products'] });
      
      toast({
        title: '🎨 Posters & Producten Aangemaakt!',
        description: `AI heeft je Time Machine posters gegenereerd${data.style_variants?.length ? ` met ${data.style_variants.length} style varianten` : ''} en shop producten zijn aangemaakt`,
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
