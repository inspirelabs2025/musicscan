-- Fix RLS policies for conversations to prevent infinite recursion

-- Drop problematic policies first
DROP POLICY IF EXISTS "Users can view participants of conversations they're in" ON public.conversation_participants;

-- Create simple, non-recursive SELECT policy for conversation_participants
CREATE POLICY "Users can view their own participant records"
ON public.conversation_participants
FOR SELECT
USING (user_id = auth.uid());

-- Update conversations SELECT policy to be simpler
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;

CREATE POLICY "Users can view conversations they created or participate in"
ON public.conversations
FOR SELECT
USING (
  created_by = auth.uid() OR 
  id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Ensure conversation creator can add participants
DROP POLICY IF EXISTS "Conversation creator can add participants" ON public.conversation_participants;

CREATE POLICY "Conversation creators can add participants"
ON public.conversation_participants
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.conversations 
    WHERE id = conversation_participants.conversation_id 
      AND created_by = auth.uid()
  )
);