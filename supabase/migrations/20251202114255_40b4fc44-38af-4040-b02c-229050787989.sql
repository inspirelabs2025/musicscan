-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Artist stories are viewable by everyone" ON artist_stories;

-- Create new policy that allows admins to see all spotlights
CREATE POLICY "Artist stories are viewable by everyone" ON artist_stories
FOR SELECT USING (
  is_published = true 
  OR auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);