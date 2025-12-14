-- Sync existing enriched songs to entries (if any)
UPDATE public.top2000_entries e
SET 
  artist_type = s.artist_type,
  language = s.language,
  subgenre = s.subgenre,
  energy_level = s.energy_level,
  decade = s.decade,
  enriched_at = s.enriched_at
FROM public.top2000_songs s
WHERE e.song_id = s.id
  AND s.enriched_at IS NOT NULL
  AND (e.enriched_at IS NULL OR e.enriched_at <> s.enriched_at);