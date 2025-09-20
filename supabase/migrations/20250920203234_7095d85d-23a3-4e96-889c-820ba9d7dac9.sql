-- Fix security warnings by updating function search paths
CREATE OR REPLACE FUNCTION public.update_follower_counts()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following count for follower
    UPDATE public.profiles 
    SET total_following = total_following + 1 
    WHERE user_id = NEW.follower_id;
    
    -- Increment follower count for followed user
    UPDATE public.profiles 
    SET total_followers = total_followers + 1 
    WHERE user_id = NEW.following_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following count for follower
    UPDATE public.profiles 
    SET total_following = total_following - 1 
    WHERE user_id = OLD.follower_id;
    
    -- Decrement follower count for followed user
    UPDATE public.profiles 
    SET total_followers = total_followers - 1 
    WHERE user_id = OLD.following_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations 
  SET 
    last_message_id = NEW.id,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;