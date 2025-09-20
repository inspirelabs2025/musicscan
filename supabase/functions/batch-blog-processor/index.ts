import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔄 Batch blog processor tick started');

    // Check if there's an active batch
    const { data: batchStatus } = await supabase
      .from('batch_processing_status')
      .select('*')
      .eq('process_type', 'blog_generation')
      .eq('status', 'active')
      .single();

    if (!batchStatus) {
      console.log('📴 No active batch found');
      return new Response(JSON.stringify({ message: 'No active batch' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📋 Found active batch:', batchStatus.id);

    // Update heartbeat
    await supabase
      .from('batch_processing_status')
      .update({ 
        last_heartbeat: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', batchStatus.id);

    // Get next pending item to process
    const { data: nextItem } = await supabase
      .from('batch_queue_items')
      .select('*')
      .eq('batch_id', batchStatus.id)
      .eq('status', 'pending')
      .lt('attempts', 'max_attempts')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (!nextItem) {
      console.log('✅ No more pending items - marking batch as completed');
      
      // Mark batch as completed
      await supabase
        .from('batch_processing_status')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', batchStatus.id);

      return new Response(JSON.stringify({ message: 'Batch completed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🎵 Processing item: ${nextItem.item_id} (${nextItem.item_type})`);

    // Mark item as processing
    await supabase
      .from('batch_queue_items')
      .update({ 
        status: 'processing',
        attempts: nextItem.attempts + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', nextItem.id);

    // Update batch status with current item
    await supabase
      .from('batch_processing_status')
      .update({ 
        current_item: nextItem.item_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', batchStatus.id);

    try {
      // Call plaat-verhaal-generator for this item
      console.log('📝 Generating blog post...');
      const { data: blogResult, error: blogError } = await supabase.functions.invoke(
        'plaat-verhaal-generator',
        {
          body: {
            albumId: nextItem.item_id,
            albumType: nextItem.item_type,
            forceRegenerate: false,
            autoPublish: true
          }
        }
      );

      if (blogError) {
        throw new Error(`Blog generation failed: ${blogError.message}`);
      }

      console.log('✅ Blog generation successful');

      // Mark item as completed
      await supabase
        .from('batch_queue_items')
        .update({ 
          status: 'completed',
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', nextItem.id);

      // Update batch counters
      await supabase
        .from('batch_processing_status')
        .update({ 
          processed_items: (batchStatus.processed_items || 0) + 1,
          successful_items: (batchStatus.successful_items || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', batchStatus.id);

    } catch (error) {
      console.error('❌ Blog generation failed:', error);

      const maxAttempts = nextItem.max_attempts || 3;
      const newAttempts = nextItem.attempts + 1;
      
      if (newAttempts >= maxAttempts) {
        // Mark as failed after max attempts
        await supabase
          .from('batch_queue_items')
          .update({ 
            status: 'failed',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', nextItem.id);

        console.log(`💀 Item failed after ${maxAttempts} attempts`);
      } else {
        // Mark as pending for retry
        await supabase
          .from('batch_queue_items')
          .update({ 
            status: 'pending',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', nextItem.id);

        console.log(`🔄 Item will retry (attempt ${newAttempts}/${maxAttempts})`);
      }

      // Update batch counters
      await supabase
        .from('batch_processing_status')
        .update({ 
          processed_items: (batchStatus.processed_items || 0) + 1,
          failed_items: (batchStatus.failed_items || 0) + (newAttempts >= maxAttempts ? 1 : 0),
          updated_at: new Date().toISOString()
        })
        .eq('id', batchStatus.id);
    }

    return new Response(JSON.stringify({ 
      message: 'Item processed', 
      itemId: nextItem.item_id,
      itemType: nextItem.item_type 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Processor error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});