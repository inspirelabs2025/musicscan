-- Fix Tonny Eyk spotlight: correct name, add artwork, remove duplicate images
UPDATE artist_stories 
SET 
  artist_name = 'Tonny Eyk (1940-2025)',
  artwork_url = 'https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/spotlight-uploads/d2ae731d-221a-4be5-8715-fef869ee7744/1766078995720.png',
  story_content = REPLACE(
    REPLACE(
      story_content,
      E'\n![Tony Eijck  (1940 - 2025) - Sterrenslag_-_Tonny_Eyk_1.png](https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/spotlight-uploads/d2ae731d-221a-4be5-8715-fef869ee7744/1766078995720.png)\n\n![Tony Eijck  (1940 - 2025) - Sterrenslag_-_Tonny_Eyk_1.png](https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/spotlight-uploads/d2ae731d-221a-4be5-8715-fef869ee7744/1766078995720.png)',
      E'\n![Tonny Eyk op de televisie](https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/spotlight-uploads/d2ae731d-221a-4be5-8715-fef869ee7744/1766078995720.png)'
    ),
    E'\n![Tony Eijck  (1940 - 2025) - Tonny_eyk_14122019-1576535136.jpg.webp](https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/spotlight-uploads/d2ae731d-221a-4be5-8715-fef869ee7744/1766078996199.webp)\n\n![Tony Eijck  (1940 - 2025) - Tonny_eyk_14122019-1576535136.jpg.webp](https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/spotlight-uploads/d2ae731d-221a-4be5-8715-fef869ee7744/1766078996199.webp)',
    E'\n![Tonny Eyk in later jaren](https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/spotlight-uploads/d2ae731d-221a-4be5-8715-fef869ee7744/1766078996199.webp)'
  )
WHERE id = 'd2ae731d-221a-4be5-8715-fef869ee7744';