-- Update all blog posts to use "## De Plaat" instead of "## Waarom deze plaat nu/nú?"
UPDATE public.blog_posts
SET 
  markdown_content = REPLACE(
    REPLACE(markdown_content, '## Waarom deze plaat nú?', '## De Plaat'),
    '## Waarom deze plaat nu?', '## De Plaat'
  ),
  updated_at = now()
WHERE markdown_content LIKE '%## Waarom deze plaat n%';