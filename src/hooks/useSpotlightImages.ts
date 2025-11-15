import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SpotlightImage {
  id: string;
  spotlight_id: string | null;
  image_url: string;
  image_source: "ai" | "discogs" | "upload";
  title: string | null;
  context: string | null;
  insertion_point: string | null;
  discogs_release_id: number | null;
  display_order: number | null;
  is_inserted: boolean | null;
  created_at: string | null;
}

export const useSpotlightImages = (spotlightId?: string) => {
  return useQuery({
    queryKey: ["spotlight-images", spotlightId],
    queryFn: async () => {
      if (!spotlightId) return [];

      const { data, error } = await supabase
        .from("spotlight_images")
        .select("*")
        .eq("spotlight_id", spotlightId)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching spotlight images:", error);
        throw error;
      }

      return data as SpotlightImage[];
    },
    enabled: !!spotlightId,
  });
};

export const useUploadSpotlightImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      spotlightId,
      title,
      context,
    }: {
      file: File;
      spotlightId: string;
      title?: string;
      context?: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("spotlightId", spotlightId);
      if (title) formData.append("title", title);
      if (context) formData.append("context", context);

      const { data, error } = await supabase.functions.invoke(
        "upload-spotlight-image",
        {
          body: formData,
        }
      );

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data.image;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["spotlight-images", variables.spotlightId],
      });
      toast.success("Afbeelding succesvol geüpload");
    },
    onError: (error: Error) => {
      console.error("Upload error:", error);
      toast.error(`Upload mislukt: ${error.message}`);
    },
  });
};

export const useFetchDiscogsImages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      spotlightId,
      discogsId,
    }: {
      spotlightId: string;
      discogsId: number;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        "fetch-discogs-images",
        {
          body: { spotlightId, discogsId },
        }
      );

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data.images;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["spotlight-images", variables.spotlightId],
      });
      toast.success(`${data.length} Discogs afbeeldingen opgehaald`);
    },
    onError: (error: Error) => {
      console.error("Discogs fetch error:", error);
      toast.error(`Discogs fout: ${error.message}`);
    },
  });
};

export const useDeleteSpotlightImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ imageId, spotlightId }: { imageId: string; spotlightId: string }) => {
      const { error } = await supabase
        .from("spotlight_images")
        .delete()
        .eq("id", imageId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["spotlight-images", variables.spotlightId],
      });
      toast.success("Afbeelding verwijderd");
    },
    onError: (error: Error) => {
      console.error("Delete error:", error);
      toast.error("Verwijderen mislukt");
    },
  });
};
