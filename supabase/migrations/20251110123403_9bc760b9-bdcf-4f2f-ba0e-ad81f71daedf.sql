-- Verwijder alle nieuwsartikelen met afgekapte content (< 500 karakters)
DELETE FROM news_blog_posts 
WHERE LENGTH(content) < 500;
