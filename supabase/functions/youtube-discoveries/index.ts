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

// International quality YouTube channels for music content (NO equipment/gear channels)
const QUALITY_CHANNELS = {
  interviews: [
    'UCmBA_wu8xGg1OfOkfW13Q0Q', // Zane Lowe
    'UC0RhatS1pyxInC00YKjjBqQ', // Genius
    'UCqECaJ8Gagnn7YCbPEzWH6g', // The FADER
    'UCO3GgqahVE2MdIEpqMVdLyA', // Pitchfork
    'UCvpDeGlR5wLP9Z3Tb6K0Xfg', // Rick Beato (music analysis)
    'UC0EIMmSn_E8A6bWHYjqSA5Q', // Nardwuar
    'UCw49uOTAJjGUdoAeUcp7tOg', // Rolling Stone
    'UCELBWmlf2of09xyoWNWoSSg', // Red Bull Music
    'UCsQ8JLmlPfHjgHiPnLGYYgQ', // BBC Music
    'UCVHFbqXqoYvEWM1Ddxl0QKg', // Grammy Awards
  ],
  studio: [
    'UC1IJWLhqJAV6pfPE2WpoHMg', // Sound City Studios
    'UCvQS3yKkHnWUUPPTi2kBHqQ', // Abbey Road Studios
    'UCELBWmlf2of09xyoWNWoSSg', // Red Bull Studios
  ],
  live_sessions: [
    'UC4eYXhJI4-7wSWc8UNRwD4A', // NPR Music (Tiny Desk)
    'UC2XeMjGaJj2aVq3_wEatoRg', // COLORS
    'UC3I2GFN_F8WudD_2jUZbojA', // KEXP
    'UCJ0ZFPzWLP8BMMJW9b2qCjg', // AudioTree Live
    'UCZEiciTGpJNR0NqFaCnBSgA', // Mahogany Sessions
    'UCqK_GSMbpiV8spgD3ZGloSw', // BBC Radio 1
    'UCxoHnwxgNs77ZL-W5QQVJZA', // La Blogothèque
    'UC9BXHVsIWJT9VRSZ2M9dSqw', // Sofar Sounds
    'UC-NCnAsRiOlY9PEhZCT5_TQ', // Paste Magazine
    'UCANLZYMidaCbLQFWXBC95Jg', // Audiotree
  ],
  documentaries: [
    'UCJIOFQLGwB3GH9K9waxwynQ', // BBC Documentary
    'UCUXRCYkJwpLVJKg3f6w82tA', // Vice
    'UC4USoIAL9qcsx5nr-TZ6-eA', // Vox
  ]
};

// International search terms (English-focused) - NO gear/equipment terms
// Now with explicit "musician" context to filter out non-music content
const SEARCH_TERMS = {
  interview: [
    'musician interview',
    'artist interview full',
    'music artist talks', 
    'singer interview',
    'band interview'
  ],
  studio: [
    'recording session musician',
    'making of album artist',
    'in the studio recording band',
    'album recording sessions singer',
    'tracking session music'
  ],
  live_session: [
    'tiny desk concert',
    'colors show musician',
    'live session artist',
    'acoustic session singer',
    'KEXP session band',
    'live performance music'
  ],
  documentary: [
    'music documentary',
    'band history documentary',
    'musician career retrospective',
    'artist biography music'
  ]
};

// Expanded exclusion patterns - includes non-musicians, sports, politics, films
const EXCLUDE_PATTERNS = [
  // Dutch/local content
  'dwdd', 'de wereld draait door', '3voor12', 'rtv', 
  'nos', 'npo', 'bnn', 'vpro muziek', 'nl20', '538',
  'radio veronica', 'q-music nl', 'slam',
  // Audio equipment/gear channels
  'audiofidelity', 'sweetwater', 'andertons', 'thomann',
  'gear review', 'pedal demo', 'amp review', 'guitar demo',
  'synth demo', 'plugin review', 'daw tutorial', 'mixing tutorial',
  'mastering tutorial', 'audio interface', 'microphone review',
  'headphone review', 'speaker review', 'studio monitors',
  'produce like a pro', 'pensado', 'sound on sound', 'tape op',
  'vintage king', 'perfect circuit', 'reverb demo', 'equipboard',
  // Sports celebrities/content
  'michael jordan', 'lebron james', 'kobe bryant', 'nba', 'basketball',
  'football', 'soccer', 'tennis', 'golf', 'sports', 'athlete',
  'olympics', 'championship', 'playoffs', 'super bowl', 'world cup',
  'nfl', 'mlb', 'nhl', 'fifa', 'ufc', 'boxing', 'wrestling',
  // Actors/film content (not music)
  'marlon brando', 'charlton heston', 'gregory peck', 'actor', 'actress',
  'hollywood premiere', 'oscars ceremony', 'film premiere', 'red carpet',
  'movie scene', 'film clip', 'opening titles', 'movie soundtrack',
  'cinema', 'blockbuster', 'box office',
  // Politicians/political content
  'politician', 'president', 'election', 'congress', 'senate',
  'parliament', 'prime minister', 'campaign', 'political',
  // War/controversial figures
  'joseph kony', 'war criminal', 'dictator', 'genocide', 'war',
  // Films with same names as bands
  'the big country 1958', 'western film', 'classic movie',
  // Reaction videos and low-quality content
  'reaction', 'reacts to', 'first time hearing', 'first time listening',
  'reacting to', 'my reaction', 'reaction video'
];

// Music-related keywords that content MUST contain
const MUSIC_INDICATORS = [
  // Core music terms
  'music', 'song', 'album', 'band', 'singer', 'musician', 'artist',
  'concert', 'tour', 'live performance', 'recording', 'studio',
  'guitar', 'drums', 'bass', 'vocals', 'producer', 'record label',
  'grammy', 'billboard', 'charts', 'hit', 'single', 'ep', 'lp',
  // Genres
  'rock', 'pop', 'jazz', 'hip hop', 'rap', 'electronic', 'metal',
  'punk', 'indie', 'folk', 'country', 'r&b', 'soul', 'blues',
  'disco', 'funk', 'reggae', 'classical', 'opera', 'techno', 'house',
  // Quality channels/shows
  'tiny desk', 'kexp', 'colors show', 'npr music', 'mtv',
  'rolling stone', 'pitchfork', 'genius', 'vevo', 'audiomack',
  'sofar sounds', 'audiotree', 'la blogotheque', 'mahogany',
  // Music-specific content
  'acoustic', 'unplugged', 'live session', 'backstage', 'soundcheck',
  'rehearsal', 'jam session', 'freestyle', 'cover', 'remix'
];

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelName: string;
  channelId: string;
  thumbnailUrl: string;
  publishedAt: string;
  duration?: string;
  viewCount?: number;
}

async function searchYouTube(query: string, maxResults = 10): Promise<YouTubeVideo[]> {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&videoDuration=medium&relevanceLanguage=en&key=${YOUTUBE_API_KEY}`;
  
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

async function getVideoDetails(videoIds: string[]): Promise<Map<string, { viewCount: number; duration: string }>> {
  if (videoIds.length === 0) return new Map();
  
  const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) return new Map();
  
  const data = await response.json();
  const details = new Map<string, { viewCount: number; duration: string }>();
  
  data.items?.forEach((item: any) => {
    details.set(item.id, {
      viewCount: parseInt(item.statistics.viewCount || '0'),
      duration: item.contentDetails?.duration || ''
    });
  });
  
  return details;
}

// Parse ISO 8601 duration to minutes
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  return hours * 60 + minutes + seconds / 60;
}

function classifyContentType(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('interview') || text.includes('talks') || text.includes('conversation') || text.includes('q&a')) {
    return 'interview';
  }
  if (text.includes('studio') || text.includes('making of') || text.includes('recording') || text.includes('behind the scenes')) {
    return 'studio';
  }
  if (text.includes('tiny desk') || text.includes('colors show') || text.includes('kexp') || text.includes('live session') || text.includes('acoustic session') || text.includes('sofar')) {
    return 'live_session';
  }
  if (text.includes('documentary') || text.includes('doc') || text.includes('history') || text.includes('retrospective')) {
    return 'documentary';
  }
  
  return 'other';
}

// Check if content should be excluded based on patterns
function isExcludedContent(title: string, description: string, channelName: string): boolean {
  const text = `${title} ${description} ${channelName}`.toLowerCase();
  
  // Exclude standard music videos/clips
  const excludePatterns = [
    'official video', 'official music video', 'lyric video', 'lyrics video',
    'official audio', 'visualizer', 'music video', '(mv)', 'official mv',
    'full album', 'álbum completo', 'playlist', 'compilation'
  ];
  
  for (const pattern of excludePatterns) {
    if (text.includes(pattern)) return true;
  }
  
  // Exclude Dutch/local content and non-music content
  for (const pattern of EXCLUDE_PATTERNS) {
    if (text.includes(pattern)) return true;
  }
  
  return false;
}

// NEW: Validate that content is actually music-related
function isMusicRelatedContent(title: string, description: string, channelName: string): boolean {
  const text = `${title} ${description} ${channelName}`.toLowerCase();
  
  // Must contain at least one music indicator
  return MUSIC_INDICATORS.some(indicator => text.includes(indicator));
}

// NEW: Validate that artist name appears in the content
function artistNameInContent(artistName: string, title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  const artistLower = artistName.toLowerCase();
  
  // Exact match
  if (text.includes(artistLower)) return true;
  
  // Check individual words for artists with multiple names (e.g., "The Rolling Stones")
  const artistWords = artistLower
    .split(/[\s&,]+/)
    .filter(w => w.length > 2 && !['the', 'and', 'of'].includes(w));
  
  if (artistWords.length === 0) return false;
  
  const matchCount = artistWords.filter(word => text.includes(word)).length;
  
  // At least 50% of significant words must match
  return matchCount >= Math.ceil(artistWords.length * 0.5);
}

// Combined validation: must pass all checks
function isValidMusicContent(
  artistName: string,
  title: string, 
  description: string, 
  channelName: string
): boolean {
  // 1. Not in exclusion list
  if (isExcludedContent(title, description, channelName)) {
    console.log(`  ❌ Excluded: "${title.substring(0, 50)}..." (matched exclusion pattern)`);
    return false;
  }
  
  // 2. Must be music-related
  if (!isMusicRelatedContent(title, description, channelName)) {
    console.log(`  ❌ Not music: "${title.substring(0, 50)}..." (no music indicators)`);
    return false;
  }
  
  // 3. Artist name must appear in content
  if (!artistNameInContent(artistName, title, description)) {
    console.log(`  ❌ Wrong artist: "${title.substring(0, 50)}..." (artist "${artistName}" not found)`);
    return false;
  }
  
  return true;
}

function calculateQualityScore(video: YouTubeVideo, viewCount: number, durationMinutes: number): number {
  let score = 0;
  
  // View count score (up to 30 points)
  if (viewCount > 1000000) score += 30;
  else if (viewCount > 500000) score += 27;
  else if (viewCount > 100000) score += 22;
  else if (viewCount > 50000) score += 18;
  else if (viewCount > 10000) score += 12;
  else if (viewCount > 5000) score += 8;
  else if (viewCount > 1000) score += 4;
  
  // Quality channel bonus (up to 25 points)
  const allQualityChannels = [
    ...QUALITY_CHANNELS.interviews,
    ...QUALITY_CHANNELS.studio,
    ...QUALITY_CHANNELS.live_sessions,
    ...QUALITY_CHANNELS.documentaries
  ];
  if (allQualityChannels.includes(video.channelId)) {
    score += 25;
  }
  
  // Duration bonus - prefer longer content (up to 15 points)
  if (durationMinutes >= 20) score += 15;
  else if (durationMinutes >= 10) score += 12;
  else if (durationMinutes >= 5) score += 8;
  else if (durationMinutes >= 3) score += 4;
  else score -= 5; // Penalty for very short content
  
  // Content relevance keywords (up to 30 points)
  const title = video.title.toLowerCase();
  const channelName = video.channelName.toLowerCase();
  
  // High-value content indicators
  if (title.includes('tiny desk')) score += 25;
  if (title.includes('colors show') || title.includes('a colors show')) score += 22;
  if (title.includes('kexp')) score += 20;
  if (title.includes('full interview')) score += 18;
  if (title.includes('making of')) score += 18;
  if (title.includes('documentary')) score += 15;
  if (title.includes('behind the scenes')) score += 15;
  if (title.includes('in depth') || title.includes('in-depth')) score += 12;
  if (title.includes('studio session')) score += 12;
  if (title.includes('recording')) score += 10;
  if (title.includes('interview')) score += 8;
  if (title.includes('acoustic')) score += 8;
  if (title.includes('live session')) score += 8;
  
  // Quality channel name indicators
  if (channelName.includes('npr') || channelName.includes('bbc')) score += 10;
  if (channelName.includes('rolling stone') || channelName.includes('pitchfork')) score += 10;
  if (channelName.includes('genius')) score += 8;
  if (channelName.includes('rick beato')) score += 10;
  
  // Recency bonus (up to 10 points)
  const publishDate = new Date(video.publishedAt);
  const monthsOld = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (monthsOld < 6) score += 10;
  else if (monthsOld < 12) score += 7;
  else if (monthsOld < 24) score += 4;
  
  return Math.min(score, 100);
}

// Shuffle array using Fisher-Yates
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { userId, contentTypes = ['interview', 'studio', 'live_session'], artistLimit = 25 } = await req.json();

    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API key not configured');
    }

    console.log(`Discovering YouTube content for user: ${userId}`);
    console.log(`Content types: ${contentTypes.join(', ')}`);

    // Get artists from curated_artists table (primary source)
    const { data: curatedArtists, error: curatedError } = await supabase
      .from('curated_artists')
      .select('artist_name, priority')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (curatedError) {
      console.error('Error fetching curated artists:', curatedError);
      throw new Error('Failed to fetch curated artists');
    }

    console.log(`Found ${curatedArtists?.length || 0} curated artists`);

    if (!curatedArtists || curatedArtists.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No curated artists found',
        discoveries: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Shuffle and select random subset for variety
    const shuffledArtists = shuffleArray(curatedArtists);
    const selectedArtists = shuffledArtists.slice(0, Math.min(artistLimit, shuffledArtists.length));
    
    console.log(`Selected ${selectedArtists.length} artists for this run`);

    // Get existing video IDs to avoid duplicates
    const { data: existingVideos } = await supabase
      .from('youtube_discoveries')
      .select('video_id');
    
    const existingIds = new Set(existingVideos?.map(v => v.video_id) || []);
    console.log(`${existingIds.size} existing videos in database`);

    const allDiscoveries: any[] = [];
    let apiCallCount = 0;
    const maxApiCalls = 100; // Limit API calls per run
    
    // Search for each artist and content type combination
    for (const artist of selectedArtists) {
      if (apiCallCount >= maxApiCalls) {
        console.log('Reached API call limit');
        break;
      }

      console.log(`\n🎵 Processing artist: ${artist.artist_name}`);

      for (const contentType of contentTypes) {
        if (apiCallCount >= maxApiCalls) break;

        const searchTerms = SEARCH_TERMS[contentType as keyof typeof SEARCH_TERMS] || [];
        
        // Pick 1-2 random search terms per content type
        const selectedTerms = shuffleArray(searchTerms).slice(0, 2);
        
        for (const term of selectedTerms) {
          if (apiCallCount >= maxApiCalls) break;

          try {
            // Build query with artist name in quotes for exact match
            const query = `"${artist.artist_name}" ${term}`;
            const videos = await searchYouTube(query, 5);
            apiCallCount++;
            
            // Filter valid content using all validation checks
            const validVideos = videos.filter(v => 
              isValidMusicContent(artist.artist_name, v.title, v.description, v.channelName) && 
              !existingIds.has(v.id)
            );
            
            console.log(`  Found ${validVideos.length}/${videos.length} valid videos for "${term}"`);
            
            if (validVideos.length > 0) {
              // Get video details (view counts, duration)
              const videoDetails = await getVideoDetails(validVideos.map(v => v.id));
              apiCallCount++;
              
              for (const video of validVideos) {
                const details = videoDetails.get(video.id) || { viewCount: 0, duration: '' };
                const durationMinutes = parseDuration(details.duration);
                
                // Skip very short videos (less than 2 minutes)
                if (durationMinutes < 2) continue;
                
                const detectedType = classifyContentType(video.title, video.description);
                const qualityScore = calculateQualityScore(video, details.viewCount, durationMinutes);
                
                // Extract tags from video content
                const tags: string[] = [artist.artist_name];
                const finalContentType = detectedType !== 'other' ? detectedType : contentType;
                
                // Add content type label
                const contentTypeLabels: Record<string, string> = {
                  interview: 'Interview',
                  studio: 'Studio',
                  live_session: 'Live',
                  documentary: 'Documentary'
                };
                if (contentTypeLabels[finalContentType]) {
                  tags.push(contentTypeLabels[finalContentType]);
                }
                
                // Extract song/album mentions from title
                const titleLower = video.title.toLowerCase();
                if (titleLower.includes('tiny desk')) tags.push('Tiny Desk');
                if (titleLower.includes('colors show') || titleLower.includes('a colors show')) tags.push('COLORS');
                if (titleLower.includes('kexp')) tags.push('KEXP');
                if (titleLower.includes('npr')) tags.push('NPR');
                if (titleLower.includes('acoustic')) tags.push('Acoustic');
                if (titleLower.includes('unplugged')) tags.push('Unplugged');
                if (titleLower.includes('full album')) tags.push('Album');
                
                // Only add if quality score is decent
                if (qualityScore >= 25) {
                  allDiscoveries.push({
                    video_id: video.id,
                    title: video.title,
                    description: video.description,
                    channel_name: video.channelName,
                    channel_id: video.channelId,
                    thumbnail_url: video.thumbnailUrl,
                    published_at: video.publishedAt,
                    view_count: details.viewCount,
                    duration_minutes: Math.round(durationMinutes),
                    content_type: finalContentType,
                    artist_name: artist.artist_name,
                    quality_score: qualityScore,
                    tags: tags,
                    user_id: userId
                  });
                  
                  existingIds.add(video.id);
                  console.log(`  ✅ Added: "${video.title.substring(0, 50)}..." (score: ${qualityScore})`);
                }
              }
            }
            
            // Small delay to respect API rate limits
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (err) {
            console.error(`Error searching for ${artist.artist_name} ${term}:`, err);
          }
        }
      }
    }

    console.log(`\nFound ${allDiscoveries.length} new discoveries (${apiCallCount} API calls)`);

    // Sort by quality score and take top results
    allDiscoveries.sort((a, b) => b.quality_score - a.quality_score);
    const topDiscoveries = allDiscoveries.slice(0, 75);

    // Insert discoveries
    if (topDiscoveries.length > 0) {
      const { error: insertError } = await supabase
        .from('youtube_discoveries')
        .upsert(topDiscoveries, { onConflict: 'video_id' });

      if (insertError) {
        console.error('Error inserting discoveries:', insertError);
      } else {
        console.log(`Successfully inserted ${topDiscoveries.length} discoveries`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Discovered ${topDiscoveries.length} new videos`,
      stats: {
        artistsProcessed: selectedArtists.length,
        totalFound: allDiscoveries.length,
        saved: topDiscoveries.length,
        apiCalls: apiCallCount
      },
      topDiscoveries: topDiscoveries.slice(0, 5).map(d => ({
        title: d.title,
        artist: d.artist_name,
        score: d.quality_score
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in youtube-discoveries function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
