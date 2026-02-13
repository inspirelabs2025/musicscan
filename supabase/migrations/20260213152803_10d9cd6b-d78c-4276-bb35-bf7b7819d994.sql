
-- Tabel voor permanente Discogs OAuth tokens per gebruiker
CREATE TABLE public.discogs_user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discogs_username TEXT,
  discogs_user_id INTEGER,
  oauth_token TEXT NOT NULL,
  oauth_token_secret TEXT NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.discogs_user_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own discogs tokens"
  ON public.discogs_user_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own discogs tokens"
  ON public.discogs_user_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own discogs tokens"
  ON public.discogs_user_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own discogs tokens"
  ON public.discogs_user_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Tijdelijke request tokens voor OAuth 1.0a handshake
CREATE TABLE public.discogs_oauth_temp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  oauth_token TEXT NOT NULL,
  oauth_token_secret TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(oauth_token)
);

ALTER TABLE public.discogs_oauth_temp ENABLE ROW LEVEL SECURITY;

-- Edge functions schrijven/lezen via service role, geen directe user access nodig
-- Maar we voegen een policy toe zodat users hun eigen temp tokens kunnen lezen
CREATE POLICY "Users can view own temp tokens"
  ON public.discogs_oauth_temp FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own temp tokens"
  ON public.discogs_oauth_temp FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own temp tokens"
  ON public.discogs_oauth_temp FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-cleanup oude temp tokens (ouder dan 1 uur)
CREATE OR REPLACE FUNCTION public.cleanup_discogs_oauth_temp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.discogs_oauth_temp WHERE created_at < now() - interval '1 hour';
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_old_discogs_temp
  AFTER INSERT ON public.discogs_oauth_temp
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_discogs_oauth_temp();
