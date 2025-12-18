-- Add special_notes column to studio_import_queue for specific details about instruments, equipment, etc.
ALTER TABLE public.studio_import_queue 
ADD COLUMN IF NOT EXISTS special_notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.studio_import_queue.special_notes IS 'Special notes about iconic instruments, equipment, or other details to include in the story';