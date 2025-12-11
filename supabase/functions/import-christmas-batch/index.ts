import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChristmasSong {
  artist: string;
  song_title: string;
  album?: string;
  year?: number;
  country_origin?: string;
  decade?: string;
  is_classic?: boolean;
  is_dutch?: boolean;
  youtube_video_id?: string;
  tags?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { songs } = await req.json() as { songs: ChristmasSong[] };

    if (!songs || !Array.isArray(songs) || songs.length === 0) {
      throw new Error('No songs provided. Expected { songs: [...] }');
    }

    console.log(`🎄 Importing ${songs.length} Christmas songs...`);

    // Validate and prepare songs
    const validSongs = songs.filter(song => song.artist && song.song_title);
    
    if (validSongs.length === 0) {
      throw new Error('No valid songs found. Each song needs artist and song_title.');
    }

    // Check for existing songs
    const { data: existingItems } = await supabase
      .from('christmas_import_queue')
      .select('artist, song_title');

    const existingSet = new Set(
      (existingItems || []).map(item => `${item.artist.toLowerCase()}|${item.song_title.toLowerCase()}`)
    );

    // Filter out duplicates
    const newSongs = validSongs.filter(song => 
      !existingSet.has(`${song.artist.toLowerCase()}|${song.song_title.toLowerCase()}`)
    );

    if (newSongs.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'All songs already in queue',
        imported: 0,
        skipped: validSongs.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prepare insert data
    const insertData = newSongs.map(song => ({
      artist: song.artist,
      song_title: song.song_title,
      album: song.album || null,
      year: song.year || null,
      country_origin: song.country_origin || null,
      decade: song.decade || (song.year ? `${Math.floor(song.year / 10) * 10}s` : null),
      is_classic: song.is_classic || false,
      is_dutch: song.is_dutch || false,
      youtube_video_id: song.youtube_video_id || null,
      tags: song.tags || ['christmas', 'kerst'],
      status: 'pending',
      attempts: 0,
    }));

    // Insert into queue
    const { data: inserted, error: insertError } = await supabase
      .from('christmas_import_queue')
      .insert(insertData)
      .select('id');

    if (insertError) {
      throw new Error(`Insert error: ${insertError.message}`);
    }

    console.log(`✅ Imported ${inserted?.length || 0} Christmas songs`);

    return new Response(JSON.stringify({ 
      success: true, 
      imported: inserted?.length || 0,
      skipped: validSongs.length - newSongs.length,
      total_submitted: songs.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Import Christmas batch error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
