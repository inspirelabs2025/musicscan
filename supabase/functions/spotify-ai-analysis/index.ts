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

    const body = await req.json().catch(() => ({}));
    if (!userId && body.user_id) userId = body.user_id;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Niet ingelogd' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🎧 Starting Spotify AI analysis 2.0 for user:', userId);

    // Fetch all Spotify data + physical collection in parallel
    const [tracksResult, playlistsResult, statsResult, recentResult, profileResult, cdResult, vinylResult, aiScansResult] = await Promise.all([
      supabase.from('spotify_tracks').select('artist, title, album, genre, year, popularity, duration_ms, explicit, added_at').eq('user_id', userId),
      supabase.from('spotify_playlists').select('name, track_count, is_public').eq('user_id', userId),
      supabase.from('spotify_user_stats').select('stat_type, time_range, name, data, rank_position').eq('user_id', userId),
      supabase.from('spotify_recently_played').select('artist, title, album, played_at, duration_ms').eq('user_id', userId).order('played_at', { ascending: false }).limit(50),
      supabase.from('profiles').select('spotify_display_name, spotify_country, spotify_followers').eq('user_id', userId).single(),
      // Physical collection - extended data
      supabase.from('cd_scan').select('artist, title, genre, year, label, country, format').eq('user_id', userId),
      supabase.from('vinyl2_scan').select('artist, title, genre, year, label, country, format').eq('user_id', userId),
      supabase.from('ai_scan_results').select('artist, title, genre, year, media_type, condition_grade').eq('user_id', userId).eq('status', 'completed'),
    ]);

    const tracks = tracksResult.data || [];
    const playlists = playlistsResult.data || [];
    const stats = statsResult.data || [];
    const recent = recentResult.data || [];
    const profile = profileResult.data;
    const cdItems = cdResult.data || [];
    const vinylItems = vinylResult.data || [];
    const aiScans = aiScansResult.data || [];
    const physicalItems = [...cdItems, ...vinylItems];

    if (tracks.length === 0 && stats.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Geen Spotify data gevonden. Synchroniseer eerst je Spotify account.' 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // === Data preparation ===

    // Audio features
    const audioFeaturesEntry = stats.find(s => s.stat_type === 'audio_features' && s.time_range === 'medium_term');
    const audioFeatures = audioFeaturesEntry?.data || null;

    // Top artists per time range
    const topArtistsShort = stats.filter(s => s.stat_type === 'top_artists' && s.time_range === 'short_term').sort((a, b) => (a.rank_position || 0) - (b.rank_position || 0));
    const topArtistsMedium = stats.filter(s => s.stat_type === 'top_artists' && s.time_range === 'medium_term').sort((a, b) => (a.rank_position || 0) - (b.rank_position || 0));
    const topArtistsLong = stats.filter(s => s.stat_type === 'top_artists' && s.time_range === 'long_term').sort((a, b) => (a.rank_position || 0) - (b.rank_position || 0));

    // Top tracks per time range
    const topTracksShort = stats.filter(s => s.stat_type === 'top_tracks' && s.time_range === 'short_term').sort((a, b) => (a.rank_position || 0) - (b.rank_position || 0));
    const topTracksMedium = stats.filter(s => s.stat_type === 'top_tracks' && s.time_range === 'medium_term').sort((a, b) => (a.rank_position || 0) - (b.rank_position || 0));
    const topTracksLong = stats.filter(s => s.stat_type === 'top_tracks' && s.time_range === 'long_term').sort((a, b) => (a.rank_position || 0) - (b.rank_position || 0));

    // Genre analysis from top artists
    const allGenres: Record<string, number> = {};
    stats.filter(s => s.stat_type === 'top_artists').forEach(artist => {
      const genres = (artist.data as any)?.genres || [];
      genres.forEach((g: string) => { allGenres[g] = (allGenres[g] || 0) + 1; });
    });
    const topGenres = Object.entries(allGenres).sort(([,a], [,b]) => b - a).slice(0, 20);

    // Decade distribution from Spotify tracks
    const spotifyDecades: Record<string, number> = {};
    tracks.forEach(t => {
      if (t.year) {
        const decade = `${Math.floor(t.year / 10) * 10}s`;
        spotifyDecades[decade] = (spotifyDecades[decade] || 0) + 1;
      }
    });

    // Physical collection decade distribution
    const physicalDecades: Record<string, number> = {};
    physicalItems.forEach(item => {
      if (item.year) {
        const decade = `${Math.floor(item.year / 10) * 10}s`;
        physicalDecades[decade] = (physicalDecades[decade] || 0) + 1;
      }
    });

    // Physical collection genre distribution
    const physicalGenres: Record<string, number> = {};
    physicalItems.forEach(item => {
      if (item.genre) {
        physicalGenres[item.genre] = (physicalGenres[item.genre] || 0) + 1;
      }
    });
    const topPhysicalGenres = Object.entries(physicalGenres).sort(([,a], [,b]) => b - a).slice(0, 15);

    // Listening time patterns
    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<number, number> = {};
    recent.forEach(r => {
      const d = new Date(r.played_at);
      hourCounts[d.getUTCHours()] = (hourCounts[d.getUTCHours()] || 0) + 1;
      dayCounts[d.getUTCDay()] = (dayCounts[d.getUTCDay()] || 0) + 1;
    });

    // Explicit ratio & popularity
    const explicitCount = tracks.filter(t => t.explicit).length;
    const explicitRatio = tracks.length > 0 ? Math.round((explicitCount / tracks.length) * 100) : 0;
    const avgPopularity = tracks.length > 0 ? Math.round(tracks.reduce((s, t) => s + (t.popularity || 0), 0) / tracks.length) : 0;

    // Popularity distribution for explorer score
    const popularityBuckets = { underground: 0, niche: 0, mainstream: 0, megapopular: 0 };
    tracks.forEach(t => {
      const p = t.popularity || 0;
      if (p < 30) popularityBuckets.underground++;
      else if (p < 50) popularityBuckets.niche++;
      else if (p < 75) popularityBuckets.mainstream++;
      else popularityBuckets.megapopular++;
    });

    // Artist overlap analysis (detailed)
    const physicalArtists = new Set(physicalItems.map(i => i.artist?.toLowerCase()).filter(Boolean));
    const spotifyArtists = new Set(tracks.map(t => t.artist?.toLowerCase()).filter(Boolean));
    const overlap = [...physicalArtists].filter(a => spotifyArtists.has(a));
    const physicalOnly = [...physicalArtists].filter(a => !spotifyArtists.has(a));
    const spotifyOnly = [...spotifyArtists].filter(a => !physicalArtists.has(a));

    // Physical collection by format
    const cdCount = cdItems.length;
    const vinylCount = vinylItems.length;

    // Artists with both physical and spotify, with details
    const physicalArtistAlbums: Record<string, string[]> = {};
    physicalItems.forEach(item => {
      if (item.artist && item.title) {
        const key = item.artist.toLowerCase();
        if (!physicalArtistAlbums[key]) physicalArtistAlbums[key] = [];
        physicalArtistAlbums[key].push(item.title);
      }
    });

    // Smaakevolutie: verschil short vs long term artiesten
    const shortArtistNames = new Set(topArtistsShort.map(a => a.name?.toLowerCase()));
    const longArtistNames = new Set(topArtistsLong.map(a => a.name?.toLowerCase()));
    const newInShort = topArtistsShort.filter(a => !longArtistNames.has(a.name?.toLowerCase())).map(a => a.name);
    const goneFromShort = topArtistsLong.filter(a => !shortArtistNames.has(a.name?.toLowerCase())).map(a => a.name);

    // Build the enriched AI prompt
    const prompt = `Je bent een briljante muziekanalyst en verzamelaar-expert. Maak een diepgaande, persoonlijke en verrassende analyse van dit Spotify profiel. Wees creatief, specifiek en onderbouwd.

SPOTIFY PROFIEL: ${profile?.spotify_display_name || 'Gebruiker'} (${profile?.spotify_country || 'NL'})
- ${tracks.length} opgeslagen tracks, ${playlists.length} playlists, ${profile?.spotify_followers || 0} volgers

AUDIO DNA:
${audioFeatures ? `- Danceability: ${audioFeatures.danceability}%, Energy: ${audioFeatures.energy}%, Vrolijkheid: ${audioFeatures.valence}%
- Akoestisch: ${audioFeatures.acousticness}%, Instrumentaal: ${audioFeatures.instrumentalness}%, Tempo: ${audioFeatures.tempo} BPM
- Liveness: ${audioFeatures.liveness}%, Speechiness: ${audioFeatures.speechiness}%` : 'Niet beschikbaar'}

TOP GENRES (${topGenres.length} unieke genres): ${topGenres.map(([g, c]) => `${g} (${c})`).join(', ')}

TOP ARTIESTEN (recent 4 wkn): ${topArtistsShort.slice(0, 10).map(a => a.name).join(', ')}
TOP ARTIESTEN (6 maanden): ${topArtistsMedium.slice(0, 10).map(a => a.name).join(', ')}
TOP ARTIESTEN (altijd): ${topArtistsLong.slice(0, 10).map(a => a.name).join(', ')}

TOP TRACKS (recent): ${topTracksShort.slice(0, 5).map(t => `${(t.data as any)?.artist || ''} - ${t.name}`).join(', ')}
TOP TRACKS (6 maanden): ${topTracksMedium.slice(0, 5).map(t => `${(t.data as any)?.artist || ''} - ${t.name}`).join(', ')}
TOP TRACKS (altijd): ${topTracksLong.slice(0, 5).map(t => `${(t.data as any)?.artist || ''} - ${t.name}`).join(', ')}

SMAAKEVOLUTIE:
- Nieuw in recente top (niet in all-time): ${newInShort.slice(0, 5).join(', ') || 'geen'}
- Verdwenen uit recente top (wel all-time): ${goneFromShort.slice(0, 5).join(', ') || 'geen'}

DECENNIA SPOTIFY: ${Object.entries(spotifyDecades).sort(([a], [b]) => a.localeCompare(b)).map(([d, c]) => `${d}: ${c}`).join(', ')}

POPULARITEIT VERDELING: Underground (<30): ${popularityBuckets.underground}, Niche (30-49): ${popularityBuckets.niche}, Mainstream (50-74): ${popularityBuckets.mainstream}, Mega-populair (75+): ${popularityBuckets.megapopular}
Gemiddelde populariteit: ${avgPopularity}/100, Explicit: ${explicitRatio}%

LUISTERPATRONEN (recent beluisterd):
- Piek-uren: ${Object.entries(hourCounts).sort(([,a],[,b]) => b - a).slice(0, 3).map(([h, c]) => `${h}:00 (${c}x)`).join(', ')}
- Piek-dagen: ${Object.entries(dayCounts).sort(([,a],[,b]) => b - a).slice(0, 3).map(([d, c]) => `${['zo','ma','di','wo','do','vr','za'][parseInt(d)]} (${c}x)`).join(', ')}
Recent beluisterd: ${recent.slice(0, 8).map(r => `${r.artist} - ${r.title}`).join(', ')}

${physicalItems.length > 0 ? `FYSIEKE COLLECTIE (${physicalItems.length} items: ${cdCount} CDs, ${vinylCount} vinyl):
- Genre-verdeling fysiek: ${topPhysicalGenres.map(([g, c]) => `${g} (${c})`).join(', ')}
- Decennia fysiek: ${Object.entries(physicalDecades).sort(([a], [b]) => a.localeCompare(b)).map(([d, c]) => `${d}: ${c}`).join(', ')}
- Artiesten overlap: ${overlap.length} in BEIDE collecties (${overlap.slice(0, 10).join(', ')})
- Alleen fysiek: ${physicalOnly.length} artiesten (${physicalOnly.slice(0, 10).join(', ')})
- Alleen Spotify: ${spotifyOnly.length} artiesten (${spotifyOnly.slice(0, 10).join(', ')})` : 'GEEN FYSIEKE COLLECTIE GEKOPPELD'}

Geef een JSON response met PRECIES deze structuur (Nederlandse tekst, wees creatief en specifiek):
{
  "personality": {
    "title": "Pakkende titel (max 5 woorden, creatief!)",
    "summary": "2-3 zinnen die het muziekkarakter beschrijven, specifiek en persoonlijk",
    "traits": ["trait1", "trait2", "trait3", "trait4", "trait5"]
  },
  "genreEcosystem": {
    "mainGenres": ["Top 3 hoofdgenres"],
    "nicheGenres": ["2-3 niche/sub-genres die opvallen"],
    "mainstreamRatio": 65,
    "description": "Analyse van genre-verbanden en wat ze verbindt",
    "connections": ["Genre A verbindt met Genre B via...", "..."]
  },
  "explorerProfile": {
    "score": 72,
    "label": "Avontuurlijke Ontdekker / Comfortzone Luisteraar / etc.",
    "diversity": "Beschrijving genre-diversiteit",
    "obscurity": "Hoe underground vs mainstream",
    "adventurousness": "Korte beschrijving avontuurlijkheid"
  },
  "emotionalLandscape": {
    "dominantMood": "Hoofdstemming (energiek, melancholisch, etc.)",
    "moodPalette": [
      {"mood": "Energiek", "percentage": 40, "color": "#FF6B35"},
      {"mood": "Melancholisch", "percentage": 25, "color": "#5B8DEF"},
      {"mood": "Chill", "percentage": 20, "color": "#7ED957"},
      {"mood": "Intens", "percentage": 15, "color": "#C73E1D"}
    ],
    "description": "Hoe je emotionele luisterprofiel eruit ziet"
  },
  "listeningJourney": {
    "evolution": "Beschrijving hoe smaak zich heeft ontwikkeld",
    "phases": [
      {"period": "All-time basis", "description": "Wat de basis vormt"},
      {"period": "Recente ontwikkeling", "description": "Waar je naartoe beweegt"}
    ],
    "turningPoints": ["Opvallende verschuivingen in je smaak"]
  },
  "artistNetwork": {
    "description": "Hoe je top artiesten met elkaar verbonden zijn",
    "clusters": [
      {"name": "Cluster naam", "artists": ["artiest1", "artiest2"], "connection": "Wat hen verbindt"}
    ],
    "influences": ["Opvallende invloedlijnen tussen artiesten"]
  },
  "collectionBridge": {
    "overlapInsight": "Analyse van wat fysiek en digitaal gemeen hebben",
    "genreShifts": "Verschil in genre-voorkeur fysiek vs digitaal",
    "decadeShifts": "Verschil in decennia-voorkeur",
    "blindSpots": {
      "physicalMissing": ["Artiesten die je veel streamt maar niet fysiek hebt"],
      "digitalMissing": ["Artiesten die je fysiek hebt maar niet streamt"]
    },
    "suggestions": ["3-4 concrete suggesties om beide collecties te verrijken"],
    "stats": {
      "totalPhysical": ${physicalItems.length},
      "totalSpotify": ${tracks.length},
      "overlap": ${overlap.length},
      "onlyPhysical": ${physicalOnly.length},
      "onlySpotify": ${spotifyOnly.length}
    }
  },
  "hiddenGems": {
    "description": "Over verborgen parels in het profiel",
    "gems": ["3-4 unieke ontdekkingen, deep cuts, of verrassende patronen"]
  },
  "trends": {
    "description": "Analyse van hoe de smaak verandert",
    "rising": ["Genres/artiesten die steeds meer worden beluisterd"],
    "declining": ["Genres/artiesten die minder worden beluisterd"]
  },
  "recommendations": {
    "description": "Persoonlijke aanbevelingen op basis van het volledige profiel",
    "artists": ["5 artiest-aanbevelingen met korte reden"],
    "genres": ["3 genre-suggesties om te verkennen"],
    "albums": ["2-3 album-suggesties die passen bij het profiel"]
  },
  "funFacts": ["5-7 verrassende, grappige of inzichtelijke weetjes"]
}

BELANGRIJK: 
- Return ALLEEN valid JSON, geen markdown
- Wees SPECIFIEK: verwijs naar echte artiesten/genres uit de data
- explorerProfile.score: 0-100 gebaseerd op populariteitsverdeling en genre-diversiteit
- emotionalLandscape.moodPalette: percentages moeten optellen tot 100
- mainstreamRatio: percentage mainstream content (0-100)
- Wees creatief en persoonlijk, geen generieke beschrijvingen`;

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
          { role: 'system', content: 'Je bent een briljante muziekanalyst die diepgaande, persoonlijke en creatieve inzichten geeft over luistergedrag en verzamelingen. Antwoord altijd in het Nederlands. Return alleen valid JSON, nooit markdown code blocks.' },
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
    
    // Robust JSON extraction
    function extractJsonFromResponse(response: string): unknown {
      let cleaned = response
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');

      if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
        throw new Error('No JSON object found in response');
      }

      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

      try {
        return JSON.parse(cleaned);
      } catch (e) {
        // Fix common LLM JSON issues
        cleaned = cleaned
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          .replace(/[\x00-\x1F\x7F]/g, '')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        
        try {
          return JSON.parse(cleaned);
        } catch (e2) {
          // Last resort: try to fix unbalanced braces
          const openBraces = (cleaned.match(/{/g) || []).length;
          const closeBraces = (cleaned.match(/}/g) || []).length;
          const openBrackets = (cleaned.match(/\[/g) || []).length;
          const closeBrackets = (cleaned.match(/]/g) || []).length;
          
          let fixed = cleaned;
          // Close unclosed brackets/braces
          for (let i = 0; i < openBrackets - closeBrackets; i++) fixed += ']';
          for (let i = 0; i < openBraces - closeBraces; i++) fixed += '}';
          // Remove trailing commas before closers
          fixed = fixed.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
          
          return JSON.parse(fixed);
        }
      }
    }

    let analysis;
    try {
      analysis = extractJsonFromResponse(content);
    } catch (parseError) {
      console.error('JSON parse failed after all attempts, raw (first 800 chars):', content.substring(0, 800));
      throw new Error('Could not parse AI response as JSON');
    }

    console.log('✅ Spotify AI analysis 2.0 complete');

    return new Response(JSON.stringify({
      success: true,
      analysis,
      metadata: {
        tracksAnalyzed: tracks.length,
        playlistCount: playlists.length,
        topGenresCount: topGenres.length,
        decadeSpread: Object.keys(spotifyDecades).length,
        hasPhysicalCollection: physicalItems.length > 0,
        physicalCollectionSize: physicalItems.length,
        physicalCDs: cdCount,
        physicalVinyl: vinylCount,
        overlapArtists: overlap.length,
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
