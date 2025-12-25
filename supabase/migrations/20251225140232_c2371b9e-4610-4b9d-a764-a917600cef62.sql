-- Disable the old discogs-lp-crawler cron job to avoid conflicts with new AI-based album discovery
SELECT cron.unschedule('hourly-discogs-lp-crawler');