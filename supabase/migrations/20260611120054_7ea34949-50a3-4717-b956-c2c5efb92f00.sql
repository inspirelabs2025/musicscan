CREATE OR REPLACE FUNCTION public.notify_new_news()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.published_at IS NOT NULL AND (OLD IS NULL OR OLD.published_at IS NULL) THEN
    INSERT INTO public.notifications (user_id, actor_id, type, message, link, icon, is_read)
    SELECT p.user_id, p.user_id, 'new_news',
      '📰 Nieuw artikel: ' || COALESCE(NEW.title, ''),
      '/nieuws/' || NEW.slug,
      'news',
      false
    FROM public.profiles p;
  END IF;
  RETURN NEW;
END;
$function$;