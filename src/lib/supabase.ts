import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Check if environment variables are defined before creating the client
// This prevents issues during build processes or in environments where they might be missing
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key is missing. Please check your environment variables.');
  // Optionally, throw an error or handle this case more gracefully based on your application's needs.
  // For now, we'll continue, but the client will be created with undefined values, likely leading to errors on use.
}

export const supabase = createClient(
  supabaseUrl || 'YOUR_SUPABASE_URL',
  supabaseKey || 'YOUR_SUPABASE_PUBLIC_ANON_KEY'
);
