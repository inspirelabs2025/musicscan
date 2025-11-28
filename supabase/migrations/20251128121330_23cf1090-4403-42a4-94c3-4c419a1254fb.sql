-- Clean up existing incorrect YouTube discoveries
-- Remove videos that are not about musicians or contain non-music content

DELETE FROM public.youtube_discoveries 
WHERE 
  -- Sports celebrities
  LOWER(title) LIKE '%michael jordan%'
  OR LOWER(title) LIKE '%lebron james%'
  OR LOWER(title) LIKE '%kobe bryant%'
  OR LOWER(description) LIKE '%basketball%'
  OR LOWER(description) LIKE '%nba%'
  
  -- Actors/film content
  OR LOWER(title) LIKE '%marlon brando%'
  OR LOWER(title) LIKE '%charlton heston%'
  OR LOWER(title) LIKE '%gregory peck%'
  OR LOWER(title) LIKE '%opening titles%'
  OR LOWER(title) LIKE '%movie scene%'
  OR LOWER(title) LIKE '%film clip%'
  
  -- Politicians/controversial figures
  OR LOWER(title) LIKE '%joseph kony%'
  OR LOWER(title) LIKE '%war criminal%'
  
  -- Films with same names as bands (e.g., Big Country the film vs Big Country the band)
  OR (artist_name = 'Big Country' AND LOWER(title) LIKE '%the big country%' AND LOWER(title) NOT LIKE '%in a big country%')
  
  -- Reaction videos
  OR LOWER(title) LIKE '%reaction%'
  OR LOWER(title) LIKE '%reacts to%'
  OR LOWER(title) LIKE '%first time hearing%'
  OR LOWER(title) LIKE '%first time listening%';
