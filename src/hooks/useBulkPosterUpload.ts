import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useBulkPosterUpload = () => {
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const { data, error } = await supabase.functions.invoke('bulk-upload-posters', {
        body: formData
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.successful} foto's succesvol geüpload naar queue`);
      if (data.errors && data.errors.length > 0) {
        toast.warning(`${data.failed} foto's gefaald`, {
          description: data.errors.slice(0, 3).join(', ')
        });
      }
    },
    onError: (error: Error) => {
      toast.error("Upload gefaald", {
        description: error.message
      });
    }
  });

  return {
    uploadPosters: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending
  };
};
