-- Add retry_count column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'render_jobs' 
    AND column_name = 'retry_count'
  ) THEN
    ALTER TABLE public.render_jobs ADD COLUMN retry_count integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add dead_letter column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'render_jobs' 
    AND column_name = 'dead_letter'
  ) THEN
    ALTER TABLE public.render_jobs ADD COLUMN dead_letter boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add last_error column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'render_jobs' 
    AND column_name = 'last_error'
  ) THEN
    ALTER TABLE public.render_jobs ADD COLUMN last_error text;
  END IF;
END $$;