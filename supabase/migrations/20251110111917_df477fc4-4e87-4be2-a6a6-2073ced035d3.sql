-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'photo_like', 'photo_comment', 'comment_like', 'follow', 'comment_reply'
  photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.photo_comments(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- System can create notifications
CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_notifications_updated_at();

-- Function to create notification for photo like
CREATE OR REPLACE FUNCTION public.notify_photo_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if liking someone else's photo
  IF NEW.user_id != (SELECT user_id FROM public.photos WHERE id = NEW.photo_id) THEN
    INSERT INTO public.notifications (user_id, actor_id, type, photo_id)
    VALUES (
      (SELECT user_id FROM public.photos WHERE id = NEW.photo_id),
      NEW.user_id,
      'photo_like',
      NEW.photo_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for photo likes
CREATE TRIGGER trigger_notify_photo_like
AFTER INSERT ON public.photo_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_photo_like();

-- Function to create notification for photo comment
CREATE OR REPLACE FUNCTION public.notify_photo_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify photo owner if someone else comments
  IF NEW.user_id != (SELECT user_id FROM public.photos WHERE id = NEW.photo_id) THEN
    INSERT INTO public.notifications (user_id, actor_id, type, photo_id, comment_id)
    VALUES (
      (SELECT user_id FROM public.photos WHERE id = NEW.photo_id),
      NEW.user_id,
      'photo_comment',
      NEW.photo_id,
      NEW.id
    );
  END IF;
  
  -- If it's a reply, also notify the parent comment author
  IF NEW.parent_comment_id IS NOT NULL THEN
    IF NEW.user_id != (SELECT user_id FROM public.photo_comments WHERE id = NEW.parent_comment_id) THEN
      INSERT INTO public.notifications (user_id, actor_id, type, photo_id, comment_id)
      VALUES (
        (SELECT user_id FROM public.photo_comments WHERE id = NEW.parent_comment_id),
        NEW.user_id,
        'comment_reply',
        NEW.photo_id,
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for photo comments
CREATE TRIGGER trigger_notify_photo_comment
AFTER INSERT ON public.photo_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_photo_comment();

-- Function to create notification for comment like
CREATE OR REPLACE FUNCTION public.notify_comment_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if liking someone else's comment
  IF NEW.user_id != (SELECT user_id FROM public.photo_comments WHERE id = NEW.comment_id) THEN
    INSERT INTO public.notifications (user_id, actor_id, type, comment_id)
    VALUES (
      (SELECT user_id FROM public.photo_comments WHERE id = NEW.comment_id),
      NEW.user_id,
      'comment_like',
      NEW.comment_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for comment likes
CREATE TRIGGER trigger_notify_comment_like
AFTER INSERT ON public.comment_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_comment_like();

-- Function to create notification for follows
CREATE OR REPLACE FUNCTION public.notify_follow()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, actor_id, type)
  VALUES (
    NEW.following_id,
    NEW.follower_id,
    'follow'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for follows
CREATE TRIGGER trigger_notify_follow
AFTER INSERT ON public.user_follows
FOR EACH ROW
EXECUTE FUNCTION public.notify_follow();