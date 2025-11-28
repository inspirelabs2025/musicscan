import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SingleImportItem {
  artist: string;
  single_name: string;
  album?: string;
  year?: number;
  label?: string;
  catalog?: string;
  genre?: string;
  styles?: string[];
  discogs_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { singles } = await req.json();

    if (!singles || !Array.isArray(singles) || singles.length === 0) {
      throw new Error('Invalid or empty singles array');
    }

    if (singles.length > 2500) {
      throw new Error('Maximum 2500 singles per batch');
    }

    console.log(`📥 Importing ${singles.length} singles to queue...`);

    // Generate a batch_id for this import
    const batchId = crypto.randomUUID();
    console.log(`📦 Batch ID: ${batchId}`);

    const validSingles: SingleImportItem[] = [];
    const errors: string[] = [];

    singles.forEach((single: any, index: number) => {
      if (!single.artist || !single.single_name) {
        errors.push(`Row ${index + 1}: Missing required fields (artist, single_name)`);
        return;
      }

      validSingles.push({
        artist: single.artist.trim(),
        single_name: single.single_name.trim(),
        album: single.album?.trim() || null,
        year: single.year ? parseInt(single.year) : null,
        label: single.label?.trim() || null,
        catalog: single.catalog?.trim() || null,
        genre: single.genre?.trim() || null,
        styles: Array.isArray(single.styles) ? single.styles : 
                single.styles ? [single.styles] : null,
        discogs_id: single.discogs_id?.trim() || null,
      });
    });

    if (errors.length > 0) {
      console.warn('⚠️ Validation errors:', errors);
    }

    if (validSingles.length === 0) {
      throw new Error('No valid singles to import');
    }

    const { data: insertedSingles, error: insertError } = await supabase
      .from('singles_import_queue')
      .insert(validSingles.map(single => ({
        ...single,
        user_id: user.id,
        batch_id: batchId,
        status: 'pending',
        attempts: 0,
        max_attempts: 3
      })))
      .select();

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      throw insertError;
    }

    console.log(`✅ Imported ${insertedSingles.length} singles to queue`);

    return new Response(JSON.stringify({
      success: true,
      batch_id: batchId,
      imported: insertedSingles.length,
      errors: errors.length > 0 ? errors : null,
      message: `Successfully imported ${insertedSingles.length} singles to processing queue`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Import error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
