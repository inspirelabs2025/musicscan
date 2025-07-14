-- Add matrix_image column to cd_scan table for matrix code photos
ALTER TABLE public.cd_scan 
ADD COLUMN matrix_image TEXT;