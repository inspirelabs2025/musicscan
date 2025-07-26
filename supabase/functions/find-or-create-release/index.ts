import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      discogs_id, artist, title, label, catalog_number, year,
      format, genre, country, style, discogs_url, master_id 
    } = await req.json();

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Call the database function
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/find_or_create_release`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey
      },
      body: JSON.stringify({
        p_discogs_id: discogs_id,
        p_artist: artist,
        p_title: title,
        p_label: label,
        p_catalog_number: catalog_number,
        p_year: year,
        p_format: format,
        p_genre: genre,
        p_country: country,
        p_style: style,
        p_discogs_url: discogs_url,
        p_master_id: master_id
      })
    });

    if (!response.ok) {
      throw new Error(`Database function call failed: ${response.statusText}`);
    }

    const releaseId = await response.text();

    return new Response(
      JSON.stringify({ release_id: releaseId.replace(/"/g, '') }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in find-or-create-release function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});