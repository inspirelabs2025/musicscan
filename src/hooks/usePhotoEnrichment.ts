import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EnrichRequest {
  image_url: string;
  caption?: string;
  artist?: string;
  album?: string;
  venue?: string;
  city?: string;
  country?: string;
  event_date?: string;
}

interface EnrichResponse {
  tags: string[];
  seo_title: string;
  seo_description: string;
  slug_suggestion: string;
  canonical_url: string;
  safety: {
    is_safe: boolean;
    concerns: string[];
  };
  inferred_data?: {
    artist?: string;
    confidence?: number;
  };
}

export const usePhotoEnrichment = () => {
  return useMutation({
    mutationFn: async (request: EnrichRequest): Promise<EnrichResponse> => {
      const { data, error } = await supabase.functions.invoke('ai-enrich-photo', {
        body: request,
      });

      if (error) throw error;
      return data as EnrichResponse;
    },
  });
};
