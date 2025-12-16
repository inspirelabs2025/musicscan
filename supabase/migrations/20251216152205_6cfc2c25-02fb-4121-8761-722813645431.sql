-- Fix HTML entities in existing news_blog_posts records
UPDATE news_blog_posts
SET 
  title = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    title,
    '&#8211;', '–'),
    '&#8212;', '—'),
    '&#8216;', E'\''),
    '&#8217;', E'\''),
    '&#8220;', '"'),
    '&#8221;', '"'),
    '&#8230;', '…'),
    '&#038;', '&'),
    '&#39;', E'\''),
    '&amp;', '&'),
    '&nbsp;', ' '),
    '&ndash;', '–'),
  summary = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    summary,
    '&#8211;', '–'),
    '&#8212;', '—'),
    '&#8216;', E'\''),
    '&#8217;', E'\''),
    '&#8220;', '"'),
    '&#8221;', '"'),
    '&#8230;', '…'),
    '&#038;', '&'),
    '&#39;', E'\''),
    '&amp;', '&'),
    '&nbsp;', ' '),
    '&ndash;', '–')
WHERE title LIKE '%&#%' OR title LIKE '%&amp;%' OR title LIKE '%&nbsp;%'
   OR summary LIKE '%&#%' OR summary LIKE '%&amp;%' OR summary LIKE '%&nbsp;%';