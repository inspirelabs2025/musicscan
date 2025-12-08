-- Drop the broken policy
DROP POLICY IF EXISTS "Admins can upload video templates" ON storage.objects;

-- Recreate with proper WITH CHECK clause
CREATE POLICY "Admins can upload video templates" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'video-templates' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);