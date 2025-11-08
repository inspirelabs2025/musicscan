import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const method = req.method;
    const slug = url.searchParams.get('slug');
    const id = url.searchParams.get('id');

    // GET - Fetch events
    if (method === 'GET') {
      // Single event by slug or id
      if (slug || id) {
        const query = supabase
          .from('time_machine_events')
          .select('*');
        
        if (slug) query.eq('slug', slug);
        if (id) query.eq('id', id);
        
        const { data, error } = await query.single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ event: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // List events with filters
      const published = url.searchParams.get('published');
      const featured = url.searchParams.get('featured');
      const artist = url.searchParams.get('artist');
      const limit = url.searchParams.get('limit') || '50';

      let query = supabase
        .from('time_machine_events')
        .select('*')
        .order('concert_date', { ascending: false })
        .limit(parseInt(limit));

      if (published === 'true') query = query.eq('is_published', true);
      if (featured === 'true') query = query.eq('is_featured', true);
      if (artist) query = query.ilike('artist_name', `%${artist}%`);

      const { data, error } = await query;

      if (error) throw error;

      return new Response(
        JSON.stringify({ events: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST - Create new event
    if (method === 'POST') {
      let body;
      try {
        const text = await req.text();
        body = text ? JSON.parse(text) : {};
      } catch (e) {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      // Generate slug if not provided
      if (!body.slug) {
        const baseSlug = `${body.artist_name}-${body.venue_name}-${new Date(body.concert_date).getFullYear()}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        body.slug = baseSlug;
      }

      const { data, error } = await supabase
        .from('time_machine_events')
        .insert(body)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ event: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
      );
    }

    // PUT - Update event
    if (method === 'PUT') {
      let body;
      try {
        const text = await req.text();
        body = text ? JSON.parse(text) : {};
      } catch (e) {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      const eventId = body.id || id;

      if (!eventId) {
        throw new Error('Event ID is required for updates');
      }

      // Set published_at if publishing for the first time
      if (body.is_published && !body.published_at) {
        body.published_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('time_machine_events')
        .update(body)
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ event: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE - Remove event
    if (method === 'DELETE') {
      let eventId = id;
      if (!eventId) {
        try {
          const text = await req.text();
          const body = text ? JSON.parse(text) : {};
          eventId = body.id;
        } catch (e) {
          // If no body, use id from query param
        }
      }

      if (!eventId) {
        throw new Error('Event ID is required for deletion');
      }

      const { error } = await supabase
        .from('time_machine_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );

  } catch (error) {
    console.error('Error in time-machine-events function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
