-- This script will be executed when you run `supabase start` or `supabase db reset`
-- insert into public.profiles (id, email) values ('c4e1f7d2-0b1a-4f5a-9d2b-1a2c3d4e5f6a', 'test@example.com');

DO $$
BEGIN
    -- Users table for authentication
    -- Managed by Supabase Auth, no need to create directly if using default setup.

    -- Profiles table (stores additional user data)
    CREATE TABLE IF NOT EXISTS public.profiles (
        id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
        email text UNIQUE NOT NULL,
        username text UNIQUE,
        avatar_url text,
        full_name text,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL,
        ai_nudge_display_count integer DEFAULT 0
    );

    -- Set up Row Level Security (RLS)
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    -- Policies for RLS
    -- Allow public read access (e.g., for user profiles)
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
    CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
    FOR SELECT USING (true);

    -- Allow authenticated users to insert a profile (during signup)
    DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
    CREATE POLICY "Users can insert their own profile." ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

    -- Allow authenticated users to update their own profile
    DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
    CREATE POLICY "Users can update own profile." ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

    -- Projects table
    CREATE TABLE IF NOT EXISTS public.projects (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
        name text NOT NULL,
        description text,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
        -- Add other project-related fields here
    );

    ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
    -- Users can view their own projects
    DROP POLICY IF EXISTS "Users can view own projects." ON public.projects;
    CREATE POLICY "Users can view own projects." ON public.projects
    FOR SELECT USING (auth.uid() = user_id);
    -- Users can create projects
    DROP POLICY IF EXISTS "Users can create projects." ON public.projects;
    CREATE POLICY "Users can create projects." ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    -- Users can update their own projects
    DROP POLICY IF EXISTS "Users can update own projects." ON public.projects;
    CREATE POLICY "Users can update own projects." ON public.projects
    FOR UPDATE USING (auth.uid() = user_id);
    -- Users can delete their own projects
    DROP POLICY IF EXISTS "Users can delete own projects." ON public.projects;
    CREATE POLICY "Users can delete own projects." ON public.projects
    FOR DELETE USING (auth.uid() = user_id);

    -- Example: Add some initial data if tables are empty
    -- IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'test@example.com') THEN
    --    INSERT INTO public.profiles (id, email, username, full_name) VALUES
    --    ('c4e1f7d2-0b1a-4f5a-9d2b-1a2c3d4e5f6a', 'test@example.com', 'testuser', 'Test User');
    -- END IF;

    -- Trigger to update 'updated_at' column automatically
    CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
    CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
    CREATE TRIGGER set_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

END
$$;
