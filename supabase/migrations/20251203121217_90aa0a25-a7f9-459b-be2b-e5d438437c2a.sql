-- Create queue table for daily quiz Facebook posts
CREATE TABLE IF NOT EXISTS public.daily_quiz_facebook_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES public.daily_challenges(id),
  challenge_date DATE NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  facebook_post_id TEXT,
  error_message TEXT,
  posted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_quiz_facebook_queue ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access
CREATE POLICY "Service role can manage daily quiz queue"
ON public.daily_quiz_facebook_queue
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for efficient querying
CREATE INDEX idx_daily_quiz_facebook_queue_status ON public.daily_quiz_facebook_queue(status);
CREATE INDEX idx_daily_quiz_facebook_queue_scheduled ON public.daily_quiz_facebook_queue(scheduled_for);

-- Add trigger for updated_at
CREATE TRIGGER update_daily_quiz_facebook_queue_updated_at
BEFORE UPDATE ON public.daily_quiz_facebook_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();