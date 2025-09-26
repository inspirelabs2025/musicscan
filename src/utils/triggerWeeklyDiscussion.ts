import { supabase } from "@/integrations/supabase/client";

export const triggerWeeklyDiscussion = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('weekly-forum-discussions', {
      body: { trigger: 'manual' }
    });

    if (error) {
      console.error('Error triggering weekly discussion:', error);
      throw error;
    }

    console.log('Weekly discussion created:', data);
    return data;
  } catch (error) {
    console.error('Failed to trigger weekly discussion:', error);
    throw error;
  }
};