import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action } = await req.json();

    if (action === 'start') {
      console.log('🚀 Starting singles batch processing...');
      
      const { count, error: countError } = await supabase
        .from('singles_import_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (countError) throw countError;

      return new Response(JSON.stringify({
        success: true,
        message: 'Batch processing started',
        pending_count: count || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'stop') {
      console.log('⏸️ Stopping singles batch processing...');
      
      const { error: updateError } = await supabase
        .from('singles_import_queue')
        .update({ status: 'pending' })
        .eq('status', 'processing');

      if (updateError) throw updateError;

      return new Response(JSON.stringify({
        success: true,
        message: 'Batch processing stopped'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'status') {
      console.log('📊 Getting batch status...');
      
      const { data: stats, error: statsError } = await supabase
        .from('singles_import_queue')
        .select('status');

      if (statsError) throw statsError;

      const statusCounts = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: stats?.length || 0
      };

      stats?.forEach((item: any) => {
        statusCounts[item.status as keyof typeof statusCounts]++;
      });

      return new Response(JSON.stringify({
        success: true,
        ...statusCounts
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'retry') {
      console.log('🔄 Retrying failed items...');
      
      const { error: retryError } = await supabase
        .from('singles_import_queue')
        .update({ 
          status: 'pending',
          attempts: 0,
          error_message: null 
        })
        .eq('status', 'failed');

      if (retryError) throw retryError;

      return new Response(JSON.stringify({
        success: true,
        message: 'Failed items reset to pending'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action. Use: start, stop, status, or retry');

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
