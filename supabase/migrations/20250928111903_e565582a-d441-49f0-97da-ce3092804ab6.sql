-- Fix RLS policy for conversation_participants to allow viewing other participants
-- Drop the restrictive policy that only allows users to see their own records
DROP POLICY IF EXISTS "Users can view their own participant records" ON public.conversation_participants;

-- Create a new policy that allows participants to view all participants in their conversations
CREATE POLICY "Participants can view all participants in their conversations"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversation_participants cp2
    WHERE cp2.conversation_id = conversation_participants.conversation_id
      AND cp2.user_id = auth.uid()
  )
);