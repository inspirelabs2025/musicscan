import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-key',
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 🔐 Validate X-ADMIN-KEY header
    const adminKey = req.headers.get('X-ADMIN-KEY');
    const expectedKey = Deno.env.get('ADMIN_SECRET');

    if (!adminKey || adminKey !== expectedKey) {
      console.error('❌ Unauthorized: Invalid or missing X-ADMIN-KEY');
      return new Response(
        JSON.stringify({ ok: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { type, payload, priority = 0, request_id } = body;

    // Validate required fields
    if (!type) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required field: type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!payload || typeof payload !== 'object') {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing or invalid payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 🔄 Deduplication check via request_id
    if (request_id) {
      const { data: existing } = await supabaseClient
        .from('render_jobs')
        .select('id')
        .eq('payload->>request_id', request_id)
        .maybeSingle();

      if (existing) {
        console.log(`⚠️ Duplicate request_id detected: ${request_id}, returning existing job`);
        return new Response(
          JSON.stringify({ ok: true, id: existing.id, duplicate: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Extract image_url from payload (required column)
    const imageUrl = payload?.album_cover_url || payload?.image_url || payload?.images?.[0] || 'pending';
    
    // Store request_id in payload for deduplication
    const enrichedPayload = request_id 
      ? { ...payload, request_id } 
      : payload;

    console.log(`📥 Enqueueing render job: type=${type}, priority=${priority}, request_id=${request_id || 'none'}`);

    // Insert new job
    const { data, error } = await supabaseClient
      .from('render_jobs')
      .insert({
        type,
        payload: enrichedPayload,
        priority,
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
        image_url: imageUrl,
        source_type: 'admin_enqueue'
      })
      .select('id')
      .single();

    if (error) {
      console.error('❌ Error inserting render job:', error);
      throw error;
    }

    console.log(`✅ Render job enqueued: ${data.id}`);

    return new Response(
      JSON.stringify({ ok: true, id: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in enqueue_render_job:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
