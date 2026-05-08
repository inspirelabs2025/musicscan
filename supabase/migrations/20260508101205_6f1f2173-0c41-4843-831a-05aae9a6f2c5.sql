
CREATE OR REPLACE FUNCTION public.generate_podcast_episode_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    RETURN NEW;
  END IF;

  base_slug := lower(regexp_replace(coalesce(NEW.title, 'episode'), '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  IF base_slug = '' THEN base_slug := 'episode'; END IF;

  IF NEW.season_number IS NOT NULL AND NEW.episode_number IS NOT NULL THEN
    base_slug := base_slug || '-s' || NEW.season_number || 'e' || NEW.episode_number;
  END IF;

  final_slug := base_slug;
  WHILE EXISTS (
    SELECT 1 FROM public.own_podcast_episodes
    WHERE podcast_id = NEW.podcast_id AND slug = final_slug AND id <> NEW.id
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_podcast_episode_slug ON public.own_podcast_episodes;
CREATE TRIGGER trg_generate_podcast_episode_slug
BEFORE INSERT OR UPDATE ON public.own_podcast_episodes
FOR EACH ROW
EXECUTE FUNCTION public.generate_podcast_episode_slug();

-- Backfill existing null slugs by touching rows
UPDATE public.own_podcast_episodes
SET updated_at = updated_at
WHERE slug IS NULL OR slug = '';
