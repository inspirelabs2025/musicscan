import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

declare global {
  interface CustomJwtClaims {
    // Add custom claims here if you have any
    // example: app_role?: string
  }

  interface UserMetadata {
    // Add custom user metadata properties here
    // example: full_name?: string
    has_used_ai?: boolean; // Added for the AI Nudge feature
  }
}

// You can also define your database schema type to get better type safety
// import { Database } from '@/types/supabase'
// export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
