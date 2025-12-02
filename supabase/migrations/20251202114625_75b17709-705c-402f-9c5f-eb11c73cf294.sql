-- Drop existing UPDATE and DELETE policies
DROP POLICY IF EXISTS "Users can update their own artist stories" ON artist_stories;
DROP POLICY IF EXISTS "Users can delete their own artist stories" ON artist_stories;

-- Create new UPDATE policy that allows admins
CREATE POLICY "Users can update their own artist stories" ON artist_stories
FOR UPDATE USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Create new DELETE policy that allows admins
CREATE POLICY "Users can delete their own artist stories" ON artist_stories
FOR DELETE USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);