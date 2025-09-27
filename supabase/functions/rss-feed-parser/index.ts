import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RSSEpisode {
  title: string;
  description?: string;
  audioUrl: string;
  publishedDate?: string;
  duration?: number;
  episodeNumber?: number;
  seasonNumber?: number;
  fileSize?: number;
  guid?: string;
}

// Parse RSS feed XML and extract episode data
function parseRSSFeed(xmlText: string): RSSEpisode[] {
  const episodes: RSSEpisode[] = [];
  
  try {
    // Simple XML parsing for RSS feeds
    const items = xmlText.split('<item>').slice(1);
    
    for (const item of items) {
      const endIndex = item.indexOf('</item>');
      if (endIndex === -1) continue;
      
      const itemContent = item.substring(0, endIndex);
      
      // Extract basic episode information
      const title = extractXMLValue(itemContent, 'title');
      const description = extractXMLValue(itemContent, 'description') || extractXMLValue(itemContent, 'itunes:summary');
      const guid = extractXMLValue(itemContent, 'guid');
      const pubDate = extractXMLValue(itemContent, 'pubDate');
      
      // Extract audio URL from enclosure
      const enclosureMatch = itemContent.match(/<enclosure[^>]*url="([^"]*)"[^>]*type="audio\/[^"]*"/);
      const audioUrl = enclosureMatch ? enclosureMatch[1] : null;
      
      // Extract iTunes-specific data
      const durationStr = extractXMLValue(itemContent, 'itunes:duration');
      const episodeStr = extractXMLValue(itemContent, 'itunes:episode');
      const seasonStr = extractXMLValue(itemContent, 'itunes:season');
      
      if (title && audioUrl) {
        episodes.push({
          title: cleanXMLText(title),
          description: description ? cleanXMLText(description) : undefined,
          audioUrl,
          publishedDate: pubDate || undefined,
          duration: parseDuration(durationStr),
          episodeNumber: episodeStr ? parseInt(episodeStr) : undefined,
          seasonNumber: seasonStr ? parseInt(seasonStr) : undefined,
          guid: guid || undefined
        });
      }
    }
  } catch (error) {
    console.error('Error parsing RSS feed:', error);
  }
  
  return episodes;
}

function extractXMLValue(content: string, tag: string): string | null {
  const openTag = `<${tag}>`;
  const closeTag = `</${tag}>`;
  const startIndex = content.indexOf(openTag);
  if (startIndex === -1) return null;
  
  const valueStart = startIndex + openTag.length;
  const valueEnd = content.indexOf(closeTag, valueStart);
  if (valueEnd === -1) return null;
  
  return content.substring(valueStart, valueEnd);
}

function cleanXMLText(text: string): string {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function parseDuration(durationStr?: string): number | undefined {
  if (!durationStr) return undefined;
  
  // Handle HH:MM:SS or MM:SS format
  const parts = durationStr.split(':').map(p => parseInt(p));
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  
  // Handle seconds only
  const seconds = parseInt(durationStr);
  return isNaN(seconds) ? undefined : seconds;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, params } = await req.json();

    switch (action) {
      case 'sync_rss_feed': {
        const { showId, rssUrl } = params;
        
        console.log(`Syncing RSS feed for show ${showId}: ${rssUrl}`);
        
        // Fetch RSS feed
        const response = await fetch(rssUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
        }
        
        const xmlText = await response.text();
        const episodes = parseRSSFeed(xmlText);
        
        console.log(`Parsed ${episodes.length} episodes from RSS feed`);
        
        // Store episodes in database
        const results = [];
        for (const episode of episodes) {
          const { data, error } = await supabase
            .from('rss_feed_episodes')
            .upsert({
              show_id: showId,
              title: episode.title,
              description: episode.description,
              audio_url: episode.audioUrl,
              duration_seconds: episode.duration,
              published_date: episode.publishedDate ? new Date(episode.publishedDate).toISOString() : null,
              episode_number: episode.episodeNumber,
              season_number: episode.seasonNumber,
              file_size: episode.fileSize,
              guid: episode.guid || `${showId}-${episode.title}`,
            }, {
              onConflict: 'show_id,guid'
            });
          
          if (error) {
            console.error('Error storing episode:', error);
          } else {
            results.push(data);
          }
        }
        
        // Update last sync time
        await supabase
          .from('spotify_curated_shows')
          .update({ last_rss_sync: new Date().toISOString() })
          .eq('id', showId);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            episodesCount: episodes.length,
            results 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }
      
      case 'add_rss_show': {
        const { name, description, rssUrl, imageUrl, publisher } = params;
        
        console.log(`Adding RSS show: ${name}`);
        
        // Create new show entry
        const { data: show, error: showError } = await supabase
          .from('spotify_curated_shows')
          .insert({
            name,
            description,
            publisher,
            image_url: imageUrl,
            rss_feed_url: rssUrl,
            feed_type: 'rss',
            spotify_show_id: null // RSS shows don't have Spotify IDs
          })
          .select()
          .single();
        
        if (showError) {
          throw showError;
        }
        
        // Immediately sync episodes
        const syncResponse = await fetch(req.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'sync_rss_feed',
            params: { showId: show.id, rssUrl }
          })
        });
        
        const syncResult = await syncResponse.json();
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            show,
            sync: syncResult
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }
      
      case 'toggle_rss_episode_featured': {
        const { episodeId } = params;
        
        // Get current featured status
        const { data: episode, error: fetchError } = await supabase
          .from('rss_feed_episodes')
          .select('is_featured')
          .eq('id', episodeId)
          .single();
        
        if (fetchError) {
          throw fetchError;
        }
        
        // Toggle featured status
        const { data, error } = await supabase
          .from('rss_feed_episodes')
          .update({ is_featured: !episode.is_featured })
          .eq('id', episodeId)
          .select();
        
        if (error) {
          throw error;
        }
        
        return new Response(
          JSON.stringify({ success: true, data }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }
      
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
    }
  } catch (error) {
    console.error('RSS Feed Parser Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});