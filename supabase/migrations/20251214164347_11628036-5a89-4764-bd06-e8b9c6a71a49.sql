-- Create trigger to auto-start enrichment after import
CREATE OR REPLACE FUNCTION trigger_top2000_enrichment_queue()
RETURNS TRIGGER AS $$
BEGIN
  -- When new entries are inserted, they automatically get queued for enrichment
  -- The cron job will pick them up (enriched_at IS NULL)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on insert to top2000_entries
DROP TRIGGER IF EXISTS auto_queue_top2000_enrichment ON top2000_entries;
CREATE TRIGGER auto_queue_top2000_enrichment
  AFTER INSERT ON top2000_entries
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_top2000_enrichment_queue();

-- Add processing status tracking
ALTER TABLE top2000_year_analyses 
ADD COLUMN IF NOT EXISTS comparison_included BOOLEAN DEFAULT false;

-- Create a simple status table for tracking pipeline progress
CREATE TABLE IF NOT EXISTS top2000_pipeline_status (
  id TEXT PRIMARY KEY DEFAULT 'main',
  enrichment_in_progress BOOLEAN DEFAULT false,
  last_enrichment_run TIMESTAMP WITH TIME ZONE,
  year_analysis_in_progress BOOLEAN DEFAULT false,
  last_year_analysis_run TIMESTAMP WITH TIME ZONE,
  comparison_in_progress BOOLEAN DEFAULT false,
  last_comparison_run TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default status row
INSERT INTO top2000_pipeline_status (id) VALUES ('main') ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE top2000_pipeline_status ENABLE ROW LEVEL SECURITY;

-- Admin can read/update
CREATE POLICY "Admins can manage pipeline status"
  ON top2000_pipeline_status
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Service role can manage
CREATE POLICY "Service role can manage pipeline status"
  ON top2000_pipeline_status
  FOR ALL
  USING (auth.role() = 'service_role');