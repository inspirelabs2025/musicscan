-- Add unique constraints for Spotify tables to enable proper upserts

-- Add unique constraint for spotify_playlists (user_id + spotify_id combination)
ALTER TABLE spotify_playlists 
ADD CONSTRAINT unique_user_spotify_playlist 
UNIQUE (user_id, spotify_id);

-- Add unique constraint for spotify_tracks (user_id + spotify_id combination)  
ALTER TABLE spotify_tracks
ADD CONSTRAINT unique_user_spotify_track
UNIQUE (user_id, spotify_id);

-- Add unique constraint for spotify_user_stats (user_id + stat_type + time_range + spotify_id combination)
ALTER TABLE spotify_user_stats
ADD CONSTRAINT unique_user_spotify_stat
UNIQUE (user_id, stat_type, time_range, spotify_id);