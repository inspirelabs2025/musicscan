-- Function to increment podcast rotation counter
CREATE OR REPLACE FUNCTION public.increment_podcast_rotation(p_episode_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.podcast_rotation_tracker
  SET 
    times_posted = times_posted + 1,
    last_posted_at = now(),
    updated_at = now()
  WHERE episode_id = p_episode_id;
END;
$$;

-- Seed existing published episodes into rotation tracker
INSERT INTO public.podcast_rotation_tracker (episode_id, times_posted)
SELECT id, 0
FROM public.own_podcast_episodes
WHERE is_published = true
ON CONFLICT (episode_id) DO NOTHING;