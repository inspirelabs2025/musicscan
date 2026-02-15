import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Also check body for user_id
    const body = await req.json().catch(() => ({}));
    if (!userId && body.user_id) userId = body.user_id;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Niet ingelogd' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🎧 Starting Spotify AI analysis for user:', userId);

    // Fetch all Spotify data in parallel
    const [tracksResult, playlistsResult, statsResult, recentResult, profileResult] = await Promise.all([
      supabase.from('spotify_tracks').select('artist, title, album, genre, year, popularity, duration_ms, explicit, added_at').eq('user_id', userId),
      supabase.from('spotify_playlists').select('name, track_count, is_public').eq('user_id', userId),
      supabase.from('spotify_user_stats').select('stat_type, time_range, name, data, rank_position').eq('user_id', userId),
      supabase.from('spotify_recently_played').select('artist, title, album, played_at, duration_ms').eq('user_id', userId).order('played_at', { ascending: false }).limit(50),
      supabase.from('profiles').select('spotify_display_name, spotify_country, spotify_followers').eq('user_id', userId).single(),
    ]);

    const tracks = tracksResult.data || [];
    const playlists = playlistsResult.data || [];
    const stats = statsResult.data || [];
    const recent = recentResult.data || [];
    const profile = profileResult.data;

    if (tracks.length === 0 && stats.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Geen Spotify data gevonden. Synchroniseer eerst je Spotify account.' 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Extract audio features
    const audioFeaturesEntry = stats.find(s => s.stat_type === 'audio_features' && s.time_range === 'medium_term');
    const audioFeatures = audioFeaturesEntry?.data || null;

    // Top artists per time range
    const topArtistsShort = stats.filter(s => s.stat_type === 'top_artists' && s.time_range === 'short_term').sort((a, b) => (a.rank_position || 0) - (b.rank_position || 0));
    const topArtistsMedium = stats.filter(s => s.stat_type === 'top_artists' && s.time_range === 'medium_term').sort((a, b) => (a.rank_position || 0) - (b.rank_position || 0));
    const topArtistsLong = stats.filter(s => s.stat_type === 'top_artists' && s.time_range === 'long_term').sort((a, b) => (a.rank_position || 0) - (b.rank_position || 0));

    // Genre analysis from top artists
    const allGenres: Record<string, number> = {};
    stats.filter(s => s.stat_type === 'top_artists').forEach(artist => {
      const genres = (artist.data as any)?.genres || [];
      genres.forEach((g: string) => { allGenres[g] = (allGenres[g] || 0) + 1; });
    });
    const topGenres = Object.entries(allGenres).sort(([,a], [,b]) => b - a).slice(0, 15);

    // Decade distribution from tracks
    const decades: Record<string, number> = {};
    tracks.forEach(t => {
      if (t.year) {
        const decade = `${Math.floor(t.year / 10) * 10}s`;
        decades[decade] = (decades[decade] || 0) + 1;
      }
    });

    // Listening time patterns from recently played
    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<number, number> = {};
    recent.forEach(r => {
      const d = new Date(r.played_at);
      hourCounts[d.getUTCHours()] = (hourCounts[d.getUTCHours()] || 0) + 1;
      dayCounts[d.getUTCDay()] = (dayCounts[d.getUTCDay()] || 0) + 1;
    });

    // Explicit ratio
    const explicitCount = tracks.filter(t => t.explicit).length;
    const explicitRatio = tracks.length > 0 ? Math.round((explicitCount / tracks.length) * 100) : 0;

    // Average track popularity
    const avgPopularity = tracks.length > 0 ? Math.round(tracks.reduce((s, t) => s + (t.popularity || 0), 0) / tracks.length) : 0;

    // Fetch physical collection for comparison
    const [cdResult, vinylResult] = await Promise.all([
      supabase.from('cd_scan').select('artist, genre').eq('user_id', userId),
      supabase.from('vinyl2_scan').select('artist, genre').eq('user_id', userId),
    ]);
    const physicalItems = [...(cdResult.data || []), ...(vinylResult.data || [])];
    const physicalArtists = new Set(physicalItems.map(i => i.artist?.toLowerCase()).filter(Boolean));
    const spotifyArtists = new Set(tracks.map(t => t.artist?.toLowerCase()).filter(Boolean));
    const overlap = [...physicalArtists].filter(a => spotifyArtists.has(a));
    const physicalOnly = [...physicalArtists].filter(a => !spotifyArtists.has(a));
    const spotifyOnly = [...spotifyArtists].filter(a => !physicalArtists.has(a));

    // Build AI prompt
    const prompt = `Je bent een slimme muziekanalyst. Analyseer dit Spotify profiel en geef persoonlijke inzichten.

SPOTIFY PROFIEL: ${profile?.spotify_display_name || 'Gebruiker'} (${profile?.spotify_country || 'NL'})
- ${tracks.length} opgeslagen tracks, ${playlists.length} playlists, ${profile?.spotify_followers || 0} volgers

AUDIO DNA:
${audioFeatures ? `- Danceability: ${audioFeatures.danceability}%, Energy: ${audioFeatures.energy}%, Vrolijkheid: ${audioFeatures.valence}%
- Akoestisch: ${audioFeatures.acousticness}%, Tempo: ${audioFeatures.tempo} BPM` : 'Niet beschikbaar'}

TOP GENRES: ${topGenres.slice(0, 10).map(([g, c]) => `${g} (${c})`).join(', ')}

TOP ARTIESTEN (recent): ${topArtistsShort.slice(0, 5).map(a => a.name).join(', ')}
TOP ARTIESTEN (6 maanden): ${topArtistsMedium.slice(0, 5).map(a => a.name).join(', ')}
TOP ARTIESTEN (altijd): ${topArtistsLong.slice(0, 5).map(a => a.name).join(', ')}

DECENNIA VERDELING: ${Object.entries(decades).sort(([a], [b]) => a.localeCompare(b)).map(([d, c]) => `${d}: ${c}`).join(', ')}

LUISTERPATRONEN: Explicit: ${explicitRatio}%, Gem. populariteit: ${avgPopularity}/100
Recent beluisterd: ${recent.slice(0, 5).map(r => `${r.artist} - ${r.title}`).join(', ')}

${physicalItems.length > 0 ? `VERGELIJKING MET FYSIEKE COLLECTIE (${physicalItems.length} items):
- ${overlap.length} artiesten in BEIDE
- ${physicalOnly.length} artiesten ALLEEN fysiek
- ${spotifyOnly.length} artiesten ALLEEN op Spotify` : ''}

Geef een JSON response met PRECIES deze structuur (Nederlandse tekst):
{
  "personality": {
    "title": "Een pakkende titel voor het muziekprofiel (max 5 woorden)",
    "summary": "Een paragraaf van 2-3 zinnen die het muziekkarakter beschrijft",
    "traits": ["trait1", "trait2", "trait3", "trait4", "trait5"]
  },
  "trends": {
    "description": "Analyse van hoe de smaak verandert (vergelijk recent vs altijd)",
    "rising": ["Genres/artiesten die steeds meer worden beluisterd"],
    "declining": ["Genres/artiesten die minder worden beluisterd"]
  },
  "recommendations": {
    "description": "Op basis van het luisterprofiel",
    "artists": ["5 artiest-aanbevelingen met korte reden"],
    "genres": ["3 genre-suggesties om te verkennen"]
  },
  "patterns": {
    "listeningStyle": "Beschrijf het luisterpatroon (ontdekker, nostalgist, etc.)",
    "moodProfile": "Beschrijf het emotionele profiel op basis van audio features",
    "uniqueness": "Wat maakt dit profiel uniek?"
  },
  "collectionComparison": {
    "insight": "Vergelijking fysiek vs digitaal luistergedrag (of 'Geen fysieke collectie gekoppeld')",
    "suggestions": ["Suggesties om beide collecties te verrijken"]
  },
  "funFacts": ["3-5 leuke weetjes/observaties over het luisterprofiel"]
}

BELANGRIJK: Return ALLEEN valid JSON!`;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) throw new Error('LOVABLE_API_KEY not configured');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Je bent een muziekanalyst die persoonlijke inzichten geeft over Spotify luistergedrag. Antwoord altijd in het Nederlands. Return alleen valid JSON.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI error:', aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ success: false, error: 'Te veel verzoeken. Probeer het later opnieuw.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ success: false, error: 'AI credits op. Voeg credits toe.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || '';
    
    // Clean markdown wrapping
    content = content.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/i, '').trim();
    
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      console.error('JSON parse failed, raw:', content.substring(0, 500));
      // Try extracting JSON
      const start = content.indexOf('{');
      const end = content.lastIndexOf('}');
      if (start !== -1 && end > start) {
        analysis = JSON.parse(content.substring(start, end + 1));
      } else {
        throw new Error('Could not parse AI response');
      }
    }

    console.log('✅ Spotify AI analysis complete');

    return new Response(JSON.stringify({
      success: true,
      analysis,
      metadata: {
        tracksAnalyzed: tracks.length,
        playlistCount: playlists.length,
        topGenresCount: topGenres.length,
        decadeSpread: Object.keys(decades).length,
        hasPhysicalCollection: physicalItems.length > 0,
        physicalCollectionSize: physicalItems.length,
        generatedAt: new Date().toISOString(),
      }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Spotify AI analysis error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
