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

      // Trigger first processing tick
      console.log('🔄 Triggering first processing tick...');
      const { data: tickData, error: tickError } = await supabase.functions.invoke('singles-batch-processor');
      
      if (tickError) {
        console.error('⚠️ Tick trigger error:', tickError);
      } else {
        console.log('✅ First tick triggered:', tickData);
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Batch processing started, first tick triggered',
        pending_count: count || 0,
        tick_triggered: !tickError
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

      // If there are pending items and nothing is processing, trigger a tick
      let tickTriggered = false;
      if (statusCounts.pending > 0 && statusCounts.processing === 0) {
        console.log('🔄 Auto-triggering tick (pending items, nothing processing)...');
        const { error: tickError } = await supabase.functions.invoke('singles-batch-processor');
        if (!tickError) {
          tickTriggered = true;
          console.log('✅ Status tick triggered');
        } else {
          console.error('⚠️ Status tick error:', tickError);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        ...statusCounts,
        tick_triggered: tickTriggered
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'retry' || action === 'retry_failed') {
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

    if (action === 'clear') {
      console.log('🗑️ Clearing pending queue...');
      
      const { error: clearError } = await supabase
        .from('singles_import_queue')
        .delete()
        .eq('status', 'pending');

      if (clearError) throw clearError;

      return new Response(JSON.stringify({
        success: true,
        message: 'Pending queue cleared'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action. Use: start, stop, status, retry, or clear');

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
