import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GenerateLyricPosterParams {
  artist: string;
  song: string;
  lyrics: string;
  highlightLines: string;
  album?: string;
  releaseYear?: number;
  stylePreset?: string;
  qrLink?: string;
  userLicenseConfirmed: boolean;
  licenseType?: string;
  copyrightNotes?: string;
}

interface GenerateLyricPosterResponse {
  success: boolean;
  poster_id: string;
  poster_url: string;
  qr_code_url?: string;
  style_variants: Array<{
    style: string;
    url: string;
    label: string;
    emoji: string;
  }>;
  slug: string;
}

export const useGenerateLyricPoster = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GenerateLyricPosterParams): Promise<GenerateLyricPosterResponse> => {
      if (!params.userLicenseConfirmed) {
        throw new Error('Je moet bevestigen dat je rechten hebt op deze lyrics');
      }

      toast({
        title: '🎶 Lyric Poster Genereren',
        description: 'AI maakt je typografische poster... Dit kan 30-60 seconden duren.',
      });

      // Generate poster
      const { data: posterData, error: posterError } = await supabase.functions.invoke(
        'generate-lyric-poster',
        { body: params }
      );

      if (posterError) {
        console.error('Poster generation error:', posterError);
        throw new Error(posterError.message || 'Poster generatie mislukt');
      }

      if (!posterData?.success) {
        throw new Error('Poster generatie heeft geen resultaat opgeleverd');
      }

      toast({
        title: '🎨 Producten Aanmaken',
        description: 'Standard poster en metal print worden aangemaakt...',
      });

      // Create products
      const { data: productData, error: productError } = await supabase.functions.invoke(
        'create-lyric-poster-products',
        {
          body: {
            lyricPosterId: posterData.poster_id,
            styleVariants: posterData.style_variants || []
          }
        }
      );

      if (productError) {
        console.error('Product creation error:', productError);
        // Don't throw - poster is still created, just log the error
        toast({
          title: '⚠️ Waarschuwing',
          description: 'Poster is aangemaakt maar producten konden niet automatisch worden aangemaakt',
          variant: 'destructive'
        });
      }

      return posterData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['platform-products'] });
      queryClient.invalidateQueries({ queryKey: ['lyric-posters'] });

      toast({
        title: '✅ Lyric Poster Klaar!',
        description: `Poster gegenereerd met ${data.style_variants?.length || 0} style varianten en 2 producten aangemaakt`,
      });
    },
    onError: (error: Error) => {
      console.error('Lyric poster generation failed:', error);
      toast({
        title: '❌ Generatie Mislukt',
        description: error.message || 'Er ging iets mis bij het genereren van de poster',
        variant: 'destructive'
      });
    }
  });
};
