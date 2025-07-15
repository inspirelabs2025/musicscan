-- Add matrix number scanning columns to cd_scan table
ALTER TABLE public.cd_scan 
ADD COLUMN matrix_number TEXT,
ADD COLUMN side TEXT,
ADD COLUMN stamper_codes TEXT;