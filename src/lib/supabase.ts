import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const createClient = () => createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);

export const updateAiNudgeDisplayCount = async (userId: string, count: number) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .update({ ai_nudge_display_count: count })
    .eq('id', userId);
  
  if (error) {
    console.error('Error updating AI nudge display count:', error);
    throw error;
  }
  return data;
};
