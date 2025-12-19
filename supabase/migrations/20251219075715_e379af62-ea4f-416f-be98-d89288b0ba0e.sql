-- Remove duplicate second image from Tonny Eyk story
UPDATE artist_stories 
SET story_content = REPLACE(
  story_content,
  E'Hij was de spil, de constante factor, de man zonder wie veel shows simpelweg niet de impact zouden hebben gehad die ze hadden.\n\n![Tony Eijck  (1940 - 2025) - Tonny_eyk_14122019-1576535136.jpg.webp](https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/spotlight-uploads/d2ae731d-221a-4be5-8715-fef869ee7744/1766078996199.webp)\n\n## Muzikale Evolutie',
  E'Hij was de spil, de constante factor, de man zonder wie veel shows simpelweg niet de impact zouden hebben gehad die ze hadden.\n\n## Muzikale Evolutie'
)
WHERE id = 'd2ae731d-221a-4be5-8715-fef869ee7744';