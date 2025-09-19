-- Update existing blog posts to change "## Waarom deze plaat nú?" to "## De Plaat"
UPDATE blog_posts 
SET markdown_content = REPLACE(markdown_content, '## Waarom deze plaat nú?', '## De Plaat'),
    updated_at = now()
WHERE markdown_content LIKE '%## Waarom deze plaat nú?%';