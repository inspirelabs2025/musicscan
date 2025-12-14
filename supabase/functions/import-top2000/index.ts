import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Top2000Entry {
  year: number;
  position: number;
  artist: string;
  title: string;
  album?: string;
  release_year?: number;
  genres?: string[];
  country?: string;
  discogs_release_id?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { entries, clear_existing } = await req.json();

    if (!entries || !Array.isArray(entries)) {
      return new Response(JSON.stringify({ error: 'entries array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate entries
    const validEntries: Top2000Entry[] = [];
    const errors: string[] = [];

    entries.forEach((entry, index) => {
      if (!entry.year || !entry.position || !entry.artist || !entry.title) {
        errors.push(`Row ${index + 1}: Missing required fields (year, position, artist, title)`);
        return;
      }

      validEntries.push({
        year: parseInt(entry.year),
        position: parseInt(entry.position),
        artist: String(entry.artist).trim(),
        title: String(entry.title).trim(),
        album: entry.album ? String(entry.album).trim() : null,
        release_year: entry.release_year ? parseInt(entry.release_year) : null,
        genres: entry.genres ? (Array.isArray(entry.genres) ? entry.genres : [entry.genres]) : null,
        country: entry.country ? String(entry.country).trim() : null,
        discogs_release_id: entry.discogs_release_id ? parseInt(entry.discogs_release_id) : null,
      });
    });

    if (validEntries.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No valid entries found',
        validation_errors: errors 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Clear existing data if requested
    if (clear_existing) {
      const yearsToImport = [...new Set(validEntries.map(e => e.year))];
      console.log(`Clearing existing data for years: ${yearsToImport.join(', ')}`);
      
      await supabase
        .from('top2000_entries')
        .delete()
        .in('year', yearsToImport);
    }

    // Insert in batches of 500
    const batchSize = 500;
    let inserted = 0;
    let skipped = 0;

    for (let i = 0; i < validEntries.length; i += batchSize) {
      const batch = validEntries.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('top2000_entries')
        .upsert(batch, { 
          onConflict: 'year,position',
          ignoreDuplicates: false 
        })
        .select('id');

      if (error) {
        console.error('Insert error:', error);
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else {
        inserted += data?.length || 0;
      }
    }

    // Trigger analysis after successful import
    if (inserted > 0) {
      console.log(`Triggering analysis for ${inserted} entries`);
      
      // Call analyze function
      try {
        await supabase.functions.invoke('analyze-top2000', {
          body: { force: true }
        });
      } catch (analyzeError) {
        console.log('Analysis will be triggered by database trigger');
      }
    }

    return new Response(JSON.stringify({
      success: true,
      total_submitted: entries.length,
      valid_entries: validEntries.length,
      inserted: inserted,
      skipped: skipped,
      validation_errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in import-top2000:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
