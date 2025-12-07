-- Add tiktok_video_url column to blog_posts table
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS tiktok_video_url TEXT;

-- Create TikTok video queue table
CREATE TABLE IF NOT EXISTS public.tiktok_video_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  album_cover_url TEXT NOT NULL,
  artist TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  video_url TEXT,
  operation_name TEXT,
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create index for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_tiktok_video_queue_status ON public.tiktok_video_queue(status);
CREATE INDEX IF NOT EXISTS idx_tiktok_video_queue_blog_id ON public.tiktok_video_queue(blog_id);

-- Enable RLS
ALTER TABLE public.tiktok_video_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for tiktok_video_queue
CREATE POLICY "Admins can manage TikTok video queue"
  ON public.tiktok_video_queue
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "System can manage TikTok video queue"
  ON public.tiktok_video_queue
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_tiktok_video_queue_updated_at
  BEFORE UPDATE ON public.tiktok_video_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for TikTok videos (handled via Supabase dashboard or function)
INSERT INTO storage.buckets (id, name, public)
VALUES ('tiktok-videos', 'tiktok-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for tiktok-videos bucket
CREATE POLICY "TikTok videos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tiktok-videos');

CREATE POLICY "Authenticated users can upload TikTok videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'tiktok-videos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update TikTok videos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'tiktok-videos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete TikTok videos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'tiktok-videos' AND auth.uid() IS NOT NULL);