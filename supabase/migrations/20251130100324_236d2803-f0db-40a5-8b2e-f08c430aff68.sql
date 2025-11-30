-- Add youtube_discoveries to facebook_auto_post_settings
INSERT INTO facebook_auto_post_settings (content_type, is_enabled, schedule_type, schedule_hour, include_image, include_url, custom_hashtags)
VALUES ('youtube_discoveries', true, 'daily', 10, true, true, ARRAY['MusicScan', 'YouTube', 'MuziekOntdekking', 'LiveMusic'])
ON CONFLICT (content_type) DO UPDATE SET 
  is_enabled = true,
  updated_at = now();