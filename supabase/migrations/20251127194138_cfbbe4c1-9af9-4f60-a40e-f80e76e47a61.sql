-- Drop the existing constraint and add the new one with 'media_library' included
ALTER TABLE public.photos DROP CONSTRAINT IF EXISTS photos_source_type_check;

ALTER TABLE public.photos ADD CONSTRAINT photos_source_type_check 
CHECK (source_type = ANY (ARRAY['royalty'::text, 'user'::text, 'ai'::text, 'media_library'::text]));