-- Create video-templates storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('video-templates', 'video-templates', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policy for public read access to templates
CREATE POLICY "Public can read video templates"
ON storage.objects FOR SELECT
USING (bucket_id = 'video-templates');

-- Admin upload policy for templates
CREATE POLICY "Admins can upload video templates"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'video-templates' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Admin delete policy for templates
CREATE POLICY "Admins can delete video templates"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'video-templates' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Add template_used column to track which template was used
ALTER TABLE tiktok_video_queue 
ADD COLUMN IF NOT EXISTS template_used TEXT;