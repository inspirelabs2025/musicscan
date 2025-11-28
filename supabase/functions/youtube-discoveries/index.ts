import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Quality YouTube channels for music content
const QUALITY_CHANNELS = {
  interviews: [
    'UCmBA_wu8xGg1OfOkfW13Q0Q', // Zane Lowe
    'UC0RhatS1pyxInC00YKjjBqQ', // Genius
    'UCqECaJ8Gagnn7YCbPEzWH6g', // The FADER
    'UCO3GgqahVE2MdIEpqMVdLyA', // Pitchfork
  ],
  studio: [
    'UCZFWPqqPkFlNwIxcpsLOwew', // Sound on Sound
    'UCS-bq8kKHOC04bRqLrCqJvw', // Sweetwater
    'UCqBYGlD2C0OnZjfAA3D7T7A', // Pensado's Place
    'UC7TrNpGSM8JMOAi6I4b_Qnw', // Produce Like A Pro
  ],
  live_sessions: [
    'UC4eYXhJI4-7wSWc8UNRwD4A', // NPR Music (Tiny Desk)
    'UC2XeMjGaJj2aVq3_wEatoRg', // COLORS
    'UC3I2GFN_F8WudD_2jUZbojA', // KEXP
    'UCJ0ZFPzWLP8BMMJW9b2qCjg', // AudioTree Live
  ]
};

// Search terms for different content types
const SEARCH_TERMS = {
  interview: ['interview', 'in conversation', 'talks about', 'discusses', 'Q&A'],
  studio: ['studio session', 'making of', 'recording', 'behind the scenes', 'in the studio', 'studio tour'],
};

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelName: string;
  channelId: string;
  thumbnailUrl: string;
  publishedAt: string;
  viewCount?: number;
}

async function searchYouTube(query: string, maxResults = 10): Promise<YouTubeVideo[]> {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&videoDuration=medium&key=${YOUTUBE_API_KEY}`;
  
  console.log(`Searching YouTube for: ${query}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.text();
    console.error('YouTube API error:', error);
    throw new Error(`YouTube API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return data.items?.map((item: any) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    channelName: item.snippet.channelTitle,
    channelId: item.snippet.channelId,
    thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
    publishedAt: item.snippet.publishedAt,
  })) || [];
}

async function getVideoDetails(videoIds: string[]): Promise<Map<string, number>> {
  if (videoIds.length === 0) return new Map();
  
  const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) return new Map();
  
  const data = await response.json();
  const viewCounts = new Map<string, number>();
  
  data.items?.forEach((item: any) => {
    viewCounts.set(item.id, parseInt(item.statistics.viewCount || '0'));
  });
  
  return viewCounts;
}

function classifyContentType(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('interview') || text.includes('talks') || text.includes('conversation') || text.includes('q&a')) {
    return 'interview';
  }
  if (text.includes('studio') || text.includes('making of') || text.includes('recording') || text.includes('behind the scenes')) {
    return 'studio';
  }
  if (text.includes('live') || text.includes('session') || text.includes('tiny desk') || text.includes('colors show')) {
    return 'live_session';
  }
  if (text.includes('documentary') || text.includes('doc')) {
    return 'documentary';
  }
  
  return 'other';
}

function isValidMusicContent(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  
  // Exclude standard music videos/clips
  const excludePatterns = [
    'official video', 'official music video', 'lyric video', 'lyrics video',
    'official audio', 'visualizer', 'music video', 'mv', 'official mv'
  ];
  
  for (const pattern of excludePatterns) {
    if (text.includes(pattern)) return false;
  }
  
  return true;
}

function calculateQualityScore(video: YouTubeVideo, viewCount: number): number {
  let score = 0;
  
  // View count score (up to 30 points)
  if (viewCount > 1000000) score += 30;
  else if (viewCount > 100000) score += 25;
  else if (viewCount > 10000) score += 15;
  else if (viewCount > 1000) score += 5;
  
  // Quality channel bonus (up to 20 points)
  const allQualityChannels = [
    ...QUALITY_CHANNELS.interviews,
    ...QUALITY_CHANNELS.studio,
    ...QUALITY_CHANNELS.live_sessions
  ];
  if (allQualityChannels.includes(video.channelId)) {
    score += 20;
  }
  
  // Content relevance (up to 50 points)
  const title = video.title.toLowerCase();
  if (title.includes('interview')) score += 15;
  if (title.includes('studio')) score += 15;
  if (title.includes('making of')) score += 20;
  if (title.includes('behind the scenes')) score += 15;
  if (title.includes('tiny desk')) score += 25;
  if (title.includes('colors')) score += 20;
  
  return Math.min(score, 100);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { userId, contentTypes = ['interview', 'studio'] } = await req.json();

    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API key not configured');
    }

    console.log(`Discovering YouTube content for user: ${userId}`);
    console.log(`Content types: ${contentTypes.join(', ')}`);

    // Get unique artists from user's collection
    const [cdResult, vinylResult] = await Promise.all([
      supabase
        .from('cd_scan')
        .select('artist')
        .eq('user_id', userId)
        .not('artist', 'is', null),
      supabase
        .from('vinyl2_scan')
        .select('artist')
        .eq('user_id', userId)
        .not('artist', 'is', null)
    ]);

    const allArtists = [
      ...(cdResult.data || []).map(r => r.artist),
      ...(vinylResult.data || []).map(r => r.artist)
    ];

    // Get unique artists (max 20 for API quota)
    const uniqueArtists = [...new Set(allArtists)].slice(0, 20);
    
    console.log(`Found ${uniqueArtists.length} unique artists in collection`);

    if (uniqueArtists.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No artists found in collection',
        discoveries: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get existing video IDs to avoid duplicates
    const { data: existingVideos } = await supabase
      .from('youtube_discoveries')
      .select('video_id');
    
    const existingIds = new Set(existingVideos?.map(v => v.video_id) || []);

    const allDiscoveries: any[] = [];
    
    // Search for each artist and content type combination
    for (const artist of uniqueArtists.slice(0, 10)) { // Limit to 10 artists per run
      for (const contentType of contentTypes) {
        const searchTerms = SEARCH_TERMS[contentType as keyof typeof SEARCH_TERMS] || [];
        
        for (const term of searchTerms.slice(0, 2)) { // Limit searches per artist
          try {
            const query = `${artist} ${term}`;
            const videos = await searchYouTube(query, 5);
            
            // Filter valid content
            const validVideos = videos.filter(v => 
              isValidMusicContent(v.title, v.description) && 
              !existingIds.has(v.id)
            );
            
            if (validVideos.length > 0) {
              // Get view counts
              const viewCounts = await getVideoDetails(validVideos.map(v => v.id));
              
              for (const video of validVideos) {
                const viewCount = viewCounts.get(video.id) || 0;
                const detectedType = classifyContentType(video.title, video.description);
                const qualityScore = calculateQualityScore(video, viewCount);
                
                // Only add if quality score is decent
                if (qualityScore >= 20) {
                  allDiscoveries.push({
                    video_id: video.id,
                    title: video.title,
                    description: video.description,
                    channel_name: video.channelName,
                    channel_id: video.channelId,
                    thumbnail_url: video.thumbnailUrl,
                    published_at: video.publishedAt,
                    view_count: viewCount,
                    content_type: detectedType !== 'other' ? detectedType : contentType,
                    artist_name: artist,
                    quality_score: qualityScore,
                    user_id: userId
                  });
                  
                  existingIds.add(video.id);
                }
              }
            }
            
            // Small delay to respect API rate limits
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (err) {
            console.error(`Error searching for ${artist} ${term}:`, err);
          }
        }
      }
    }

    console.log(`Found ${allDiscoveries.length} new discoveries`);

    // Sort by quality score and take top results
    allDiscoveries.sort((a, b) => b.quality_score - a.quality_score);
    const topDiscoveries = allDiscoveries.slice(0, 50);

    // Insert discoveries
    if (topDiscoveries.length > 0) {
      const { error: insertError } = await supabase
        .from('youtube_discoveries')
        .upsert(topDiscoveries, { onConflict: 'video_id' });

      if (insertError) {
        console.error('Error inserting discoveries:', insertError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      artistsSearched: uniqueArtists.length,
      discoveriesFound: topDiscoveries.length,
      discoveries: topDiscoveries
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in youtube-discoveries:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
