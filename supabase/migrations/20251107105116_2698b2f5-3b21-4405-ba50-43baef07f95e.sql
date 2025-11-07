-- Create sitemap_logs table for tracking sitemap proxy requests
CREATE TABLE IF NOT EXISTS sitemap_logs (
  id BIGSERIAL PRIMARY KEY,
  method TEXT,
  path TEXT,
  file TEXT,
  status_code INT,
  size_bytes BIGINT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_sitemap_logs_created_at ON sitemap_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sitemap_logs_file ON sitemap_logs(file);
CREATE INDEX IF NOT EXISTS idx_sitemap_logs_status ON sitemap_logs(status_code);

-- Add comment for documentation
COMMENT ON TABLE sitemap_logs IS 'Logs all sitemap proxy requests for monitoring and debugging';
COMMENT ON COLUMN sitemap_logs.path IS 'The requested URL path';
COMMENT ON COLUMN sitemap_logs.file IS 'The actual sitemap file served from Storage';
COMMENT ON COLUMN sitemap_logs.size_bytes IS 'Size of the file in bytes';
COMMENT ON COLUMN sitemap_logs.note IS 'Error message or additional info';