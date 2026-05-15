-- ============================================================
-- A. Spotify tokens → separate private table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_spotify_tokens (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  spotify_refresh_token text NOT NULL,
  spotify_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_spotify_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own spotify tokens"
  ON public.user_spotify_tokens FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spotify tokens"
  ON public.user_spotify_tokens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spotify tokens"
  ON public.user_spotify_tokens FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spotify tokens"
  ON public.user_spotify_tokens FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_user_spotify_tokens_updated_at
BEFORE UPDATE ON public.user_spotify_tokens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing tokens
INSERT INTO public.user_spotify_tokens (user_id, spotify_refresh_token, spotify_email)
SELECT user_id, spotify_refresh_token, spotify_email
FROM public.profiles
WHERE spotify_refresh_token IS NOT NULL
ON CONFLICT (user_id) DO UPDATE
  SET spotify_refresh_token = EXCLUDED.spotify_refresh_token,
      spotify_email = EXCLUDED.spotify_email;

-- Remove sensitive columns from public profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS spotify_refresh_token;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS spotify_email;

-- ============================================================
-- B. facebook_content_queue: admin-only management
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage content queue" ON public.facebook_content_queue;

CREATE POLICY "Admins can manage content queue"
  ON public.facebook_content_queue FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================
-- C. facebook_auto_post_settings: admin-only management
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage auto-post settings" ON public.facebook_auto_post_settings;

CREATE POLICY "Admins can manage auto-post settings"
  ON public.facebook_auto_post_settings FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================
-- D. discogs_release_statistics: keep public read, admin writes only
-- ============================================================
DROP POLICY IF EXISTS "Allow anonymous insert access" ON public.discogs_release_statistics;
DROP POLICY IF EXISTS "Allow anonymous update access" ON public.discogs_release_statistics;

CREATE POLICY "Admins can insert release statistics"
  ON public.discogs_release_statistics FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update release statistics"
  ON public.discogs_release_statistics FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================
-- E. curated_artists: admin-only management
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can manage curated artists" ON public.curated_artists;

CREATE POLICY "Admins can manage curated artists"
  ON public.curated_artists FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================
-- F. tecdoc_matches: keep public read, admin writes only
-- ============================================================
DROP POLICY IF EXISTS "Allow anonymous TecDoc inserts" ON public.tecdoc_matches;
DROP POLICY IF EXISTS "Allow anonymous TecDoc updates" ON public.tecdoc_matches;

CREATE POLICY "Admins can insert tecdoc matches"
  ON public.tecdoc_matches FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update tecdoc matches"
  ON public.tecdoc_matches FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================
-- G. rdw_lookups: keep public read, admin writes only
-- ============================================================
DROP POLICY IF EXISTS "Allow anonymous RDW lookup inserts" ON public.rdw_lookups;
DROP POLICY IF EXISTS "Allow anonymous RDW lookup updates" ON public.rdw_lookups;

CREATE POLICY "Admins can insert rdw lookups"
  ON public.rdw_lookups FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update rdw lookups"
  ON public.rdw_lookups FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================
-- H. own_podcasts: hide owner_email from anonymous visitors
-- ============================================================
REVOKE SELECT (owner_email) ON public.own_podcasts FROM anon;