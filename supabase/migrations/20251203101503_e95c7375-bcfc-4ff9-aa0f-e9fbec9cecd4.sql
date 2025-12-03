-- Create site_popups table for behavior-driven popup management
CREATE TABLE public.site_popups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  popup_type TEXT NOT NULL,
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  button_text TEXT,
  button_url TEXT,
  image_url TEXT,
  
  -- Trigger configuration
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('time_on_page', 'scroll_depth', 'exit_intent', 'page_visit')),
  trigger_value INTEGER,
  trigger_pages TEXT[],
  exclude_pages TEXT[],
  
  -- Display rules
  display_frequency TEXT DEFAULT 'once_per_session' CHECK (display_frequency IN ('once_per_session', 'once_per_day', 'once_ever', 'always')),
  max_displays INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 0,
  
  -- Targeting
  show_to_guests BOOLEAN DEFAULT true,
  show_to_users BOOLEAN DEFAULT true,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  
  -- Tracking
  views_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  dismissals_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for active popups query
CREATE INDEX idx_site_popups_active ON public.site_popups (is_active, priority DESC);

-- Enable RLS
ALTER TABLE public.site_popups ENABLE ROW LEVEL SECURITY;

-- Public can read active popups
CREATE POLICY "Anyone can read active popups"
ON public.site_popups
FOR SELECT
USING (is_active = true);

-- Admins can manage all popups
CREATE POLICY "Admins can manage popups"
ON public.site_popups
FOR ALL
USING (public.is_admin(auth.uid()));

-- Update trigger
CREATE TRIGGER update_site_popups_updated_at
BEFORE UPDATE ON public.site_popups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert starter popups
INSERT INTO public.site_popups (name, popup_type, title, description, button_text, button_url, trigger_type, trigger_value, exclude_pages, display_frequency, priority, is_active)
VALUES 
(
  'Quiz Uitnodiging',
  'quiz_prompt',
  '🎯 Test je muziekkennis!',
  'Speel onze gratis quiz en verdien punten. Hoe goed ken jij de muziekwereld?',
  'Start Quiz',
  '/quizzen',
  'time_on_page',
  45,
  ARRAY['/quizzen', '/quiz', '/auth', '/login', '/register'],
  'once_per_day',
  10,
  true
),
(
  'Dagelijkse Nieuwsbrief',
  'newsletter',
  '📬 Mis geen muzieknieuws!',
  'Ontvang dagelijks het laatste muzieknieuws, verhalen en exclusieve content in je inbox.',
  'Inschrijven',
  NULL,
  'scroll_depth',
  60,
  ARRAY['/auth', '/login', '/register', '/newsletter'],
  'once_per_session',
  5,
  true
);