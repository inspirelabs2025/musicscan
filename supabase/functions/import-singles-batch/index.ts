import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface SingleImport {
  artist: string;
  single_name: string;
  album?: string;
  year?: number;
  label?: string;
  catalog?: string;
  discogs_id?: number;
  discogs_url?: string;
  artwork_url?: string;
  genre?: string;
  styles?: string[];
  tags?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { singles } = await req.json() as { singles: SingleImport[] };

    if (!singles || !Array.isArray(singles) || singles.length === 0) {
      throw new Error('No singles provided');
    }

    console.log(`📥 Importing ${singles.length} singles for user ${user.id}`);

    // Generate batch ID
    const batchId = crypto.randomUUID();

    // Validate and filter singles
    const badValues = ['unknown', 'onbekend', '—', '-', 'n/a', ''];
    const validSingles: any[] = [];
    const invalidSingles: any[] = [];

    singles.forEach((single, index) => {
      const artist = single.artist?.trim() || '';
      const singleName = single.single_name?.trim() || '';

      // Check if required fields are present and valid
      if (!artist || !singleName || 
          badValues.includes(artist.toLowerCase()) || 
          badValues.includes(singleName.toLowerCase())) {
        invalidSingles.push({
          index,
          reason: 'Missing or invalid artist/single_name',
          data: single
        });
        return;
      }

      validSingles.push({
        user_id: user.id,
        batch_id: batchId,
        artist: single.artist,
        single_name: single.single_name,
        album: single.album || null,
        year: single.year || null,
        label: single.label || null,
        catalog: single.catalog || null,
        discogs_id: single.discogs_id || null,
        discogs_url: single.discogs_url || null,
        artwork_url: single.artwork_url || null,
        genre: single.genre || null,
        styles: single.styles || null,
        tags: single.tags || null,
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
        priority: 0,
      });
    });

    console.log(`✅ ${validSingles.length} valid singles, ❌ ${invalidSingles.length} invalid`);

    // Insert valid singles into queue
    if (validSingles.length > 0) {
      const { data: insertedSingles, error: insertError } = await supabase
        .from('singles_import_queue')
        .insert(validSingles)
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(`Failed to insert singles: ${insertError.message}`);
      }

      console.log(`✅ Successfully imported ${insertedSingles.length} singles to queue`);
    }

    return new Response(JSON.stringify({
      success: true,
      batch_id: batchId,
      imported: validSingles.length,
      invalid: invalidSingles.length,
      invalid_items: invalidSingles,
      message: `Successfully imported ${validSingles.length} singles to queue`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Import error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
