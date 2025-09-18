-- Remove duplicate YAML frontmatter from Van Morrison blog post markdown content
UPDATE blog_posts 
SET markdown_content = SUBSTRING(markdown_content FROM POSITION('## Waarom deze plaat nú?' IN markdown_content))
WHERE slug = 'van-morrison-van-morrison-the-best-of-van-morrison-1990';