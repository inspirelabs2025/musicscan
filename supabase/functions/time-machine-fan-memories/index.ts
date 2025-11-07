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
    const eventId = url.searchParams.get('event_id');
    const memoryId = url.searchParams.get('id');

    // GET - Fetch memories
    if (method === 'GET') {
      // Single memory by id
      if (memoryId) {
        const { data, error } = await supabase
          .from('time_machine_fan_memories')
          .select('*, profiles(first_name, avatar_url)')
          .eq('id', memoryId)
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ memory: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // List memories for an event
      if (!eventId) {
        throw new Error('event_id parameter is required');
      }

      const approved = url.searchParams.get('approved') !== 'false';
      const featured = url.searchParams.get('featured');
      const limit = url.searchParams.get('limit') || '50';

      let query = supabase
        .from('time_machine_fan_memories')
        .select('*, profiles(first_name, avatar_url)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));

      if (approved) query = query.eq('is_approved', true);
      if (featured === 'true') query = query.eq('is_featured', true);

      const { data, error } = await query;

      if (error) throw error;

      return new Response(
        JSON.stringify({ memories: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST - Create new memory
    if (method === 'POST') {
      const body = await req.json();
      
      if (!body.event_id || !body.user_id || !body.memory_text) {
        throw new Error('event_id, user_id, and memory_text are required');
      }

      const { data, error } = await supabase
        .from('time_machine_fan_memories')
        .insert(body)
        .select('*, profiles(first_name, avatar_url)')
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ memory: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
      );
    }

    // PUT - Update memory (approve, feature, like)
    if (method === 'PUT') {
      const body = await req.json();
      const id = body.id || memoryId;

      if (!id) {
        throw new Error('Memory ID is required for updates');
      }

      // Handle like increment
      if (body.action === 'like') {
        const { data, error } = await supabase
          .from('time_machine_fan_memories')
          .select('likes_count')
          .eq('id', id)
          .single();

        if (error) throw error;

        const { data: updated, error: updateError } = await supabase
          .from('time_machine_fan_memories')
          .update({ likes_count: (data.likes_count || 0) + 1 })
          .eq('id', id)
          .select('*, profiles(first_name, avatar_url)')
          .single();

        if (updateError) throw updateError;

        return new Response(
          JSON.stringify({ memory: updated }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Regular update
      delete body.action;
      const { data, error } = await supabase
        .from('time_machine_fan_memories')
        .update(body)
        .eq('id', id)
        .select('*, profiles(first_name, avatar_url)')
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ memory: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE - Remove memory
    if (method === 'DELETE') {
      const id = memoryId || (await req.json()).id;

      if (!id) {
        throw new Error('Memory ID is required for deletion');
      }

      const { error } = await supabase
        .from('time_machine_fan_memories')
        .delete()
        .eq('id', id);

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
    console.error('Error in time-machine-fan-memories function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
