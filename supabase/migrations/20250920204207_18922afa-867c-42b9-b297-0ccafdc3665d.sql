-- Create policy to allow viewing public profiles of other users
CREATE POLICY "Anyone can view public profiles" 
ON public.profiles 
FOR SELECT 
USING (is_public = true);