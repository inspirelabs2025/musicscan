import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID');
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET');

interface SpotifyShowSearchResponse {
  shows: {
    items: SpotifyShow[];
  };
}

interface SpotifyShow {
  id: string;
  name: string;
  description: string;
  publisher: string;
  images: Array<{ url: string; height: number; width: number }>;
  external_urls: { spotify: string };
  total_episodes: number;
}

interface SpotifyEpisode {
  id: string;
  name: string;
  description: string;
  audio_preview_url: string | null;
  release_date: string;
  duration_ms: number;
  external_urls: { spotify: string };
}

async function getSpotifyAccessToken(): Promise<string> {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  return data.access_token;
}

async function searchSpotifyShows(query: string, accessToken: string): Promise<SpotifyShow[]> {
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=show&market=NL&limit=20`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  const data: SpotifyShowSearchResponse = await response.json();
  return data.shows?.items || [];
}

async function getShowEpisodes(showId: string, accessToken: string): Promise<SpotifyEpisode[]> {
  const response = await fetch(
    `https://api.spotify.com/v1/shows/${showId}/episodes?market=NL&limit=50`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  const data = await response.json();
  return data.items || [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, ...params } = await req.json();
    console.log('Podcast manager action:', action, 'params:', params);

    const accessToken = await getSpotifyAccessToken();

    switch (action) {
      case 'search_shows': {
        const { query } = params;
        const shows = await searchSpotifyShows(query, accessToken);
        
        return new Response(JSON.stringify({ shows }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'add_curated_show': {
        const { spotify_show_id, category, curator_notes } = params;
        
        // Get show details from Spotify
        const showResponse = await fetch(
          `https://api.spotify.com/v1/shows/${spotify_show_id}?market=NL`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        );
        
        const show = await showResponse.json();
        
        // Add to curated shows
        const { data: curatedShow, error } = await supabase
          .from('spotify_curated_shows')
          .insert({
            spotify_show_id: show.id,
            name: show.name,
            description: show.description,
            publisher: show.publisher,
            image_url: show.images?.[0]?.url,
            spotify_url: show.external_urls?.spotify,
            total_episodes: show.total_episodes,
            category: category || 'General',
            curator_notes: curator_notes || null
          })
          .select()
          .single();

        if (error) {
          console.error('Error adding curated show:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ show: curatedShow }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'sync_episodes': {
        const { show_id } = params;
        
        // Get show from database
        const { data: show, error: showError } = await supabase
          .from('spotify_curated_shows')
          .select('*')
          .eq('id', show_id)
          .single();

        if (showError || !show) {
          return new Response(JSON.stringify({ error: 'Show not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Fetch episodes from Spotify
        const episodes = await getShowEpisodes(show.spotify_show_id, accessToken);
        
        // Insert episodes into database
        const episodeData = episodes.map(episode => ({
          show_id: show.id,
          spotify_episode_id: episode.id,
          name: episode.name,
          description: episode.description,
          audio_preview_url: episode.audio_preview_url,
          release_date: episode.release_date,
          duration_ms: episode.duration_ms,
          spotify_url: episode.external_urls?.spotify
        }));

        const { data: syncedEpisodes, error: episodeError } = await supabase
          .from('spotify_show_episodes')
          .upsert(episodeData, { 
            onConflict: 'spotify_episode_id',
            ignoreDuplicates: false 
          })
          .select();

        if (episodeError) {
          console.error('Error syncing episodes:', episodeError);
          return new Response(JSON.stringify({ error: episodeError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ 
          episodes_synced: syncedEpisodes?.length || 0,
          episodes: syncedEpisodes 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'toggle_featured_episode': {
        const { episode_id, is_featured } = params;
        
        const { data, error } = await supabase
          .from('spotify_show_episodes')
          .update({ is_featured })
          .eq('id', episode_id)
          .select()
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ episode: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'remove_curated_show': {
        const { show_id } = params;
        
        const { error } = await supabase
          .from('spotify_curated_shows')
          .delete()
          .eq('id', show_id);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Error in spotify-podcast-manager:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});