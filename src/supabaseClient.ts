import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Ensure that environment variables are defined. If not, throw an error.
if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is not defined in environment variables.');
}
if (!supabaseKey) {
  throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY is not defined in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
