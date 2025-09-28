-- Resolve infinite recursion by using a SECURITY DEFINER helper
-- 1) Create helper function that bypasses RLS safely
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1
    from public.conversation_participants
    where conversation_id = _conversation_id
      and user_id = _user_id
  );
$$;

-- Ensure authenticated users can execute the function
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated;

-- 2) Replace the SELECT policy to use the helper (no recursion)
DROP POLICY IF EXISTS "Participants can view all participants in their conversations" ON public.conversation_participants;

CREATE POLICY "Participants can view all participants in their conversations"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (
  public.is_conversation_participant(conversation_participants.conversation_id, auth.uid())
);
