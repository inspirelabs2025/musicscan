import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { action, batch_id } = await req.json();

    console.log(`🎬 Singles batch generator: ${action}`);

    if (action === 'start') {
      // Check for active batch
      const { data: activeBatch } = await supabase
        .from('batch_processing_status')
        .select('*')
        .eq('process_type', 'single_generation')
        .eq('status', 'running')
        .maybeSingle();

      if (activeBatch) {
        return new Response(JSON.stringify({
          error: 'Another singles batch is already running',
          active_batch: activeBatch
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get pending singles count
      const { data: pendingSingles, count } = await supabase
        .from('singles_import_queue')
        .select('*', { count: 'exact', head: false })
        .eq('status', 'pending');

      if (!pendingSingles || pendingSingles.length === 0) {
        return new Response(JSON.stringify({
          message: 'No pending singles to process'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`📋 Found ${count} pending singles to process`);

      // Create batch processing status
      const { data: newBatch, error: batchError } = await supabase
        .from('batch_processing_status')
        .insert({
          process_type: 'single_generation',
          status: 'running',
          total_items: count,
          processed_items: 0,
          successful_items: 0,
          failed_items: 0,
          queue_size: count,
          auto_mode: true,
          started_at: new Date().toISOString(),
          last_heartbeat: new Date().toISOString(),
        })
        .select()
        .single();

      if (batchError) {
        throw new Error(`Failed to create batch: ${batchError.message}`);
      }

      console.log(`✅ Singles batch started: ${newBatch.id}`);

      return new Response(JSON.stringify({
        success: true,
        batch: newBatch,
        message: `Started processing ${count} singles`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'stop') {
      const { data: activeBatch } = await supabase
        .from('batch_processing_status')
        .select('*')
        .eq('process_type', 'single_generation')
        .eq('status', 'running')
        .maybeSingle();

      if (!activeBatch) {
        return new Response(JSON.stringify({
          message: 'No active singles batch to stop'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase
        .from('batch_processing_status')
        .update({
          status: 'stopped',
          stopped_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeBatch.id);

      return new Response(JSON.stringify({
        success: true,
        message: 'Singles batch stopped'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'status') {
      const { data: activeBatch } = await supabase
        .from('batch_processing_status')
        .select('*')
        .eq('process_type', 'single_generation')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { count: pendingCount } = await supabase
        .from('singles_import_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: completedCount } = await supabase
        .from('singles_import_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      const { count: failedCount } = await supabase
        .from('singles_import_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed');

      return new Response(JSON.stringify({
        batch: activeBatch,
        queue_stats: {
          pending: pendingCount || 0,
          completed: completedCount || 0,
          failed: failedCount || 0,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'retry_failed') {
      const { data: failedSingles, count } = await supabase
        .from('singles_import_queue')
        .select('*', { count: 'exact' })
        .eq('status', 'failed');

      if (!failedSingles || failedSingles.length === 0) {
        return new Response(JSON.stringify({
          message: 'No failed singles to retry'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase
        .from('singles_import_queue')
        .update({
          status: 'pending',
          error_message: null,
          attempts: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('status', 'failed');

      return new Response(JSON.stringify({
        success: true,
        message: `Reset ${count} failed singles to pending`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      error: 'Invalid action'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Batch generator error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
