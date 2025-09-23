import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper functions for different quiz types
function generatePhysicalQuizPrompt(physical: any, questionCount: number) {
  return `
Je bent een muziekquiz generator. Analyseer deze fysieke muziekcollectie en genereer precies ${questionCount} uitdagende maar eerlijke quiz vragen.

FYSIEKE COLLECTIE DATA:
- Totaal albums: ${physical.totalAlbums}
- Artiesten: ${physical.artists.join(', ')}
- Genres: ${physical.genres.join(', ')}
- Jaren: ${physical.years[0]} - ${physical.years[physical.years.length - 1]}

SAMPLE ALBUMS:
${physical.sampleAlbums.map((a: any) => `${a.artist} - ${a.title} (${a.year || 'Unknown'})`).join('\n')}

Genereer ${questionCount} verschillende vraagtypen:
1. Album herkenning: "Welke artiest heeft het album [TITLE]?"
2. Jaar vragen: "Uit welk jaar is [ALBUM] van [ARTIST]?"
3. Genre classificatie: "Tot welk genre behoort [ALBUM]?"
4. Artiest tellen: "Hoeveel albums heb je van [ARTIST]?"
5. Chronologie: "Wat is het oudste/nieuwste album van [ARTIST] in je collectie?"
6. Label vragen: "Op welk label verscheen [ALBUM]?"
7. Vergelijkingen: "Welke artiest heeft zowel een album uit de jaren 70 als 90?"
8. Genre mix: "Hoeveel [GENRE] albums heb je?"
9. Decade focus: "Welk album uit de jaren [DECADE] heb je?"
10. Collectie trivia: Unieke vraag over de collectie

BELANGRIJK: Alle antwoordopties moeten uit de DAADWERKELIJKE collectie komen.

Retourneer JSON format:
{
  "questions": [
    {
      "id": 1,
      "type": "album_recognition",
      "question": "Welke artiest heeft het album 'Title'?",
      "correctAnswer": "Artist Name",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "explanation": "Korte uitleg waarom dit klopt"
    }
  ]
}`;
}

function generateSpotifyQuizPrompt(spotify: any, questionCount: number) {
  return `
Je bent een Spotify muziekquiz generator. Analyseer deze Spotify luisterdata en genereer precies ${questionCount} uitdagende maar eerlijke quiz vragen.

SPOTIFY DATA:
- Totaal tracks: ${spotify.totalTracks}
- Totaal playlists: ${spotify.totalPlaylists}
- Top artiesten: ${spotify.topArtists.join(', ')}
- Top tracks: ${spotify.topTracks.join(', ')}
- Playlist namen: ${spotify.playlistNames.join(', ')}

SAMPLE TRACKS:
${spotify.sampleTracks.map((t: any) => `${t.artist_name} - ${t.name} (Album: ${t.album_name || 'Unknown'})`).join('\n')}

Genereer ${questionCount} verschillende Spotify vraagtypen:
1. Top artiest herkenning: "Wie is jouw #1 meest beluisterde artiest?"
2. Playlist trivia: "In welke playlist staat het nummer [TRACK]?"
3. Artiest ranking: "Welke artiest staat hoger in jouw top lijst?"
4. Track herkenning: "Van welke artiest is het nummer [TRACK]?"
5. Luistergedrag: "Hoeveel playlists heb je?"
6. Genre voorkeur: Gebaseerd op top artiesten
7. Album herkenning: "Op welk album staat [TRACK]?"
8. Vergelijkingen: "Welke artiest heb je vaker beluisterd?"
9. Playlist grootte: "Welke playlist heeft de meeste nummers?"
10. Muziek trivia: Unieke vraag over luistergedrag

BELANGRIJK: Alle antwoordopties moeten uit de DAADWERKELIJKE Spotify data komen.

Retourneer JSON format:
{
  "questions": [
    {
      "id": 1,
      "type": "spotify_top_artist",
      "question": "Wie is jouw meest beluisterde artiest op Spotify?",
      "correctAnswer": "Artist Name",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "explanation": "Gebaseerd op jouw Spotify luisterdata"
    }
  ]
}`;
}

function generateMixedQuizPrompt(summary: any, questionCount: number) {
  return `
Je bent een mixed muziekquiz generator. Analyseer zowel de fysieke collectie als Spotify data en genereer precies ${questionCount} uitdagende vragen.

FYSIEKE COLLECTIE:
- Albums: ${summary.physical.totalAlbums}
- Artiesten: ${summary.physical.artists.slice(0, 20).join(', ')}

SPOTIFY DATA:
- Tracks: ${summary.spotify.totalTracks}
- Top artiesten: ${summary.spotify.topArtists.slice(0, 10).join(', ')}
- Playlists: ${summary.spotify.totalPlaylists}

Genereer ${questionCount} mixed vragen:
1. Cross-platform: "Welke artiest heb je zowel op vinyl/CD als in je Spotify top?"
2. Collectie vs streaming: "Hoeveel albums van [ARTIST] heb je fysiek vs. hoeveel luister je op Spotify?"
3. Ontbrekende albums: "Welke van jouw Spotify top artiesten mis je nog in je fysieke collectie?"
4. Overlap analyse: "Van welke artiest heb je het meeste fysieke albums?"
5. Platform voorkeur: Vergelijking tussen formaten
6. Completist vragen: Over volledigheid van collecties
7. Era vergelijking: Oude albums vs nieuwe Spotify tracks
8. Format mix: CD vs vinyl vs digital
9. Discovery: "Welke artiest ontdekte je via Spotify maar verzamel je nu ook fysiek?"
10. Muziek DNA: Cross-platform persoonlijkheid vragen

BELANGRIJK: Mix vragen over beide platforms en zoek verbindingen tussen fysiek en digitaal.

Retourneer JSON format:
{
  "questions": [
    {
      "id": 1,
      "type": "cross_platform",
      "question": "Welke artiest heb je zowel fysiek als in je Spotify top 10?",
      "correctAnswer": "Artist Name",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "explanation": "Deze artiest staat zowel in je fysieke collectie als Spotify statistieken"
    }
  ]
}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body to get question count
    const body = await req.json().catch(() => ({}));
    const questionCount = body.questionCount || 10;

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    console.log(`Generating quiz for user: ${user.id}`);

    // Fetch user's collection from both tables AND Spotify data
    const [cdResult, vinylResult, spotifyTracksResult, spotifyPlaylistsResult, spotifyStatsResult] = await Promise.all([
      supabase
        .from('cd_scan')
        .select('artist, title, label, catalog_number, year, genre, style, country')
        .eq('user_id', user.id)
        .not('artist', 'is', null)
        .not('title', 'is', null),
      supabase
        .from('vinyl2_scan')
        .select('artist, title, label, catalog_number, year, genre, style, country')
        .eq('user_id', user.id)
        .not('artist', 'is', null)
        .not('title', 'is', null),
      supabase
        .from('spotify_tracks')
        .select('name, artist_name, album_name, playlist_id')
        .eq('user_id', user.id)
        .limit(200),
      supabase
        .from('spotify_playlists')
        .select('name, description, track_count')
        .eq('user_id', user.id)
        .limit(50),
      supabase
        .from('spotify_user_stats')
        .select('name, stat_type, time_range, data, rank_position')
        .eq('user_id', user.id)
        .in('stat_type', ['top_artists', 'top_tracks'])
        .eq('time_range', 'medium_term')
        .limit(50)
    ]);

    if (cdResult.error || vinylResult.error) {
      console.error('Database error:', cdResult.error || vinylResult.error);
      throw new Error('Failed to fetch collection data');
    }

    const allAlbums = [...(cdResult.data || []), ...(vinylResult.data || [])];
    const spotifyTracks = spotifyTracksResult.data || [];
    const spotifyPlaylists = spotifyPlaylistsResult.data || [];
    const spotifyStats = spotifyStatsResult.data || [];
    
    // Determine quiz mode based on available data
    const hasPhysicalCollection = allAlbums.length > 0;
    const hasSpotifyData = spotifyTracks.length > 0 || spotifyStats.length > 0;
    
    let quizMode = body.quizMode || 'auto';
    if (quizMode === 'auto') {
      if (hasPhysicalCollection && hasSpotifyData) {
        quizMode = 'mixed';
      } else if (hasSpotifyData) {
        quizMode = 'spotify_only';
      } else if (hasPhysicalCollection) {
        quizMode = 'physical_only';
      } else {
        throw new Error('No collection or Spotify data found');
      }
    }
    
    console.log(`Quiz mode: ${quizMode}, Physical: ${allAlbums.length}, Spotify tracks: ${spotifyTracks.length}, Spotify stats: ${spotifyStats.length}`);

    // Prepare data summary for OpenAI based on quiz mode
    let collectionSummary: any = {};
    let promptContext = '';
    
    if (quizMode === 'physical_only' || quizMode === 'mixed') {
      collectionSummary.physical = {
        totalAlbums: allAlbums.length,
        artists: [...new Set(allAlbums.map(a => a.artist))].slice(0, 50),
        genres: [...new Set(allAlbums.map(a => a.genre).filter(Boolean))],
        years: [...new Set(allAlbums.map(a => a.year).filter(Boolean))].sort(),
        sampleAlbums: allAlbums.slice(0, 30)
      };
    }
    
    if (quizMode === 'spotify_only' || quizMode === 'mixed') {
      const topArtists = spotifyStats.filter(s => s.stat_type === 'top_artists').slice(0, 20);
      const topTracks = spotifyStats.filter(s => s.stat_type === 'top_tracks').slice(0, 20);
      const uniqueArtists = [...new Set(spotifyTracks.map(t => t.artist_name))].slice(0, 50);
      
      collectionSummary.spotify = {
        totalTracks: spotifyTracks.length,
        totalPlaylists: spotifyPlaylists.length,
        topArtists: topArtists.map(a => a.name),
        topTracks: topTracks.map(t => t.name),
        playlistNames: spotifyPlaylists.map(p => p.name).slice(0, 20),
        sampleTracks: spotifyTracks.slice(0, 30),
        uniqueArtists
      };
    }

    // Generate context-aware prompt based on quiz mode
    let prompt = '';
    
    if (quizMode === 'physical_only') {
      prompt = generatePhysicalQuizPrompt(collectionSummary.physical, questionCount);
    } else if (quizMode === 'spotify_only') {
      prompt = generateSpotifyQuizPrompt(collectionSummary.spotify, questionCount);
    } else if (quizMode === 'mixed') {
      prompt = generateMixedQuizPrompt(collectionSummary, questionCount);
    }

    console.log('Calling OpenAI with collection data...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Je bent een expert in het maken van muziekquizzes. Genereer altijd valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: questionCount > 20 ? 6000 : 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    // Function to clean markdown formatting from OpenAI response
    const cleanMarkdown = (content: string): string => {
      return content
        .replace(/```json\s*/g, '') // Remove ```json
        .replace(/```\s*/g, '')     // Remove ```
        .trim();                    // Remove extra whitespace
    };

    let quizData;
    try {
      const rawContent = data.choices[0].message.content;
      console.log('Raw OpenAI response:', rawContent);
      
      const cleanedContent = cleanMarkdown(rawContent);
      console.log('Cleaned content for parsing:', cleanedContent);
      
      quizData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response after cleaning:', data.choices[0].message.content);
      console.error('Parse error details:', parseError);
      throw new Error('Invalid response format from OpenAI');
    }

    console.log(`Generated ${quizData.questions?.length || 0} quiz questions`);

    return new Response(JSON.stringify({
      success: true,
      quiz: quizData,
      quizMode: quizMode,
      collectionStats: quizMode === 'spotify_only' ? {
        totalTracks: collectionSummary.spotify?.totalTracks || 0,
        totalPlaylists: collectionSummary.spotify?.totalPlaylists || 0,
        totalArtists: collectionSummary.spotify?.uniqueArtists?.length || 0,
        topArtists: collectionSummary.spotify?.topArtists?.slice(0, 5) || []
      } : {
        totalAlbums: collectionSummary.physical?.totalAlbums || 0,
        totalArtists: collectionSummary.physical?.artists?.length || 0,
        genres: collectionSummary.physical?.genres?.length || 0,
        yearRange: collectionSummary.physical?.years?.length > 0 ? 
          `${collectionSummary.physical.years[0]} - ${collectionSummary.physical.years[collectionSummary.physical.years.length - 1]}` : 'N/A',
        ...(quizMode === 'mixed' && {
          spotifyTracks: collectionSummary.spotify?.totalTracks || 0,
          spotifyPlaylists: collectionSummary.spotify?.totalPlaylists || 0
        })
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in collection-quiz-generator:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});