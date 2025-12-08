-- Update bucket file size limit to 50MB for video templates
UPDATE storage.buckets 
SET file_size_limit = 52428800
WHERE id = 'video-templates';