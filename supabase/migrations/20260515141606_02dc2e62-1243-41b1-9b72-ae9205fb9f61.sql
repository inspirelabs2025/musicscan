
-- 1) Podcast owner email: move to private admin-only table
CREATE TABLE IF NOT EXISTS public.own_podcasts_private (
  podcast_id uuid PRIMARY KEY REFERENCES public.own_podcasts(id) ON DELETE CASCADE,
  owner_email text NOT NULL DEFAULT 'podcast@musicscan.app',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.own_podcasts_private ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage podcast private" ON public.own_podcasts_private;
CREATE POLICY "Admins manage podcast private"
  ON public.own_podcasts_private
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Backfill from existing data (only if column still exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='own_podcasts' AND column_name='owner_email'
  ) THEN
    EXECUTE $sql$
      INSERT INTO public.own_podcasts_private (podcast_id, owner_email)
      SELECT id, COALESCE(NULLIF(owner_email,''), 'podcast@musicscan.app')
      FROM public.own_podcasts
      ON CONFLICT (podcast_id) DO NOTHING
    $sql$;
    EXECUTE 'ALTER TABLE public.own_podcasts DROP COLUMN owner_email';
  END IF;
END $$;

-- 2) facebook_auto_post_settings: re-create policy with strict admin check
DROP POLICY IF EXISTS "Admins can manage auto-post settings" ON public.facebook_auto_post_settings;
CREATE POLICY "Admins can manage auto-post settings"
  ON public.facebook_auto_post_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 3) vinyl_records_backup: admin-only SELECT (no user_id column to scope by)
DROP POLICY IF EXISTS "Authenticated users can view vinyl backup records" ON public.vinyl_records_backup;
DROP POLICY IF EXISTS "Admins can view vinyl backup records" ON public.vinyl_records_backup;
CREATE POLICY "Admins can view vinyl backup records"
  ON public.vinyl_records_backup
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- 4) echo_messages: drop public read, restrict to conversation owner
DROP POLICY IF EXISTS "Anyone can view messages" ON public.echo_messages;
CREATE POLICY "Owners view their conversation messages"
  ON public.echo_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.echo_conversations c
      WHERE c.id = echo_messages.conversation_id
        AND c.user_id = auth.uid()
    )
  );
