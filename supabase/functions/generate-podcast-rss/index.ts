import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml; charset=utf-8',
};

interface Podcast {
  id: string;
  name: string;
  description: string;
  slug: string;
  artwork_url: string;
  author: string;
  owner_name: string;
  owner_email: string;
  language: string;
  category: string;
  subcategory: string | null;
  explicit: boolean;
  website_url: string;
}

interface Episode {
  id: string;
  title: string;
  description: string;
  audio_url: string;
  audio_file_size: number;
  audio_duration_seconds: number;
  episode_number: number;
  season_number: number;
  episode_type: string;
  artwork_url: string | null;
  published_at: string;
}

function escapeXml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDuration(seconds: number): string {
  if (!seconds) return '00:00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatPubDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toUTCString();
}

function generateRSSFeed(podcast: Podcast, episodes: Episode[], baseUrl: string): string {
  const lastBuildDate = episodes.length > 0 
    ? formatPubDate(episodes[0].published_at) 
    : formatPubDate(new Date().toISOString());

  const feedUrl = `${baseUrl}/functions/v1/generate-podcast-rss?podcast=${podcast.slug}`;
  
  const episodesXml = episodes.map(episode => {
    const episodeArtwork = episode.artwork_url || podcast.artwork_url;
    const guid = `musicscan-podcast-${podcast.id}-episode-${episode.id}`;
    
    return `
    <item>
      <title>${escapeXml(episode.title)}</title>
      <description><![CDATA[${episode.description || ''}]]></description>
      <pubDate>${formatPubDate(episode.published_at)}</pubDate>
      <enclosure url="${escapeXml(episode.audio_url)}" length="${episode.audio_file_size || 0}" type="audio/mpeg"/>
      <guid isPermaLink="false">${guid}</guid>
      <itunes:title>${escapeXml(episode.title)}</itunes:title>
      <itunes:summary><![CDATA[${episode.description || ''}]]></itunes:summary>
      <itunes:duration>${formatDuration(episode.audio_duration_seconds)}</itunes:duration>
      <itunes:image href="${escapeXml(episodeArtwork)}"/>
      <itunes:explicit>${podcast.explicit ? 'yes' : 'no'}</itunes:explicit>
      <itunes:episodeType>${episode.episode_type || 'full'}</itunes:episodeType>
      ${episode.episode_number ? `<itunes:episode>${episode.episode_number}</itunes:episode>` : ''}
      ${episode.season_number ? `<itunes:season>${episode.season_number}</itunes:season>` : ''}
    </item>`;
  }).join('\n');

  const subcategoryXml = podcast.subcategory 
    ? `<itunes:category text="${escapeXml(podcast.subcategory)}"/>` 
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(podcast.name)}</title>
    <description><![CDATA[${podcast.description || ''}]]></description>
    <link>${escapeXml(podcast.website_url || 'https://musicscan.nl')}</link>
    <language>${podcast.language || 'nl'}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>
    
    <itunes:title>${escapeXml(podcast.name)}</itunes:title>
    <itunes:author>${escapeXml(podcast.author)}</itunes:author>
    <itunes:summary><![CDATA[${podcast.description || ''}]]></itunes:summary>
    <itunes:owner>
      <itunes:name>${escapeXml(podcast.owner_name)}</itunes:name>
      <itunes:email>${escapeXml(podcast.owner_email)}</itunes:email>
    </itunes:owner>
    <itunes:image href="${escapeXml(podcast.artwork_url)}"/>
    <itunes:category text="${escapeXml(podcast.category)}">
      ${subcategoryXml}
    </itunes:category>
    <itunes:explicit>${podcast.explicit ? 'yes' : 'no'}</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    
    ${episodesXml}
  </channel>
</rss>`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const podcastSlug = url.searchParams.get('podcast');

    if (!podcastSlug) {
      return new Response(
        JSON.stringify({ error: 'Missing podcast parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Generating RSS feed for podcast: ${podcastSlug}`);

    // Fetch podcast
    const { data: podcast, error: podcastError } = await supabase
      .from('own_podcasts')
      .select('*')
      .eq('slug', podcastSlug)
      .eq('is_published', true)
      .single();

    if (podcastError || !podcast) {
      console.error('Podcast not found:', podcastError);
      return new Response(
        JSON.stringify({ error: 'Podcast not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch published episodes
    const { data: episodes, error: episodesError } = await supabase
      .from('own_podcast_episodes')
      .select('*')
      .eq('podcast_id', podcast.id)
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (episodesError) {
      console.error('Error fetching episodes:', episodesError);
      return new Response(
        JSON.stringify({ error: 'Error fetching episodes' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${episodes?.length || 0} published episodes`);

    const rssXml = generateRSSFeed(podcast, episodes || [], supabaseUrl);

    return new Response(rssXml, {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
