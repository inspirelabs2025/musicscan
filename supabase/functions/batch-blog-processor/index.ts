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
    let { data: batchStatus } = await supabase
      .from('batch_processing_status')
      .select('*')
      .eq('process_type', 'blog_generation')
      .eq('status', 'running')
      .maybeSingle();

    // Auto-recovery: if no active batch but pending items exist, reactivate ONLY blog batches
    if (!batchStatus) {
      console.log('📴 No active blog batch found, checking for recoverable blog batch...');
      
      // Get recent blog_generation batches only
      const { data: recentBlogBatches } = await supabase
        .from('batch_processing_status')
        .select('id')
        .eq('process_type', 'blog_generation')
        .order('started_at', { ascending: false })
        .limit(10);

      if (recentBlogBatches && recentBlogBatches.length > 0) {
        const blogBatchIds = recentBlogBatches.map(b => b.id);
        
        // Check for pending items only in these blog batches
        const { data: pendingBlogItems } = await supabase
          .from('batch_queue_items')
          .select('batch_id')
          .in('batch_id', blogBatchIds)
          .eq('status', 'pending')
          .limit(1);
          
        if (pendingBlogItems && pendingBlogItems.length > 0) {
          console.log('🔄 Found pending blog items, reactivating batch...');
          
          // Find the blog batch that actually has pending items
          const { data: batchWithPendingItems } = await supabase
            .from('batch_processing_status')
            .select('*')
            .eq('process_type', 'blog_generation')
            .eq('id', pendingBlogItems[0].batch_id)
            .maybeSingle();
            
          if (batchWithPendingItems) {
            await supabase
              .from('batch_processing_status')
              .update({ 
                status: 'running',
                completed_at: null,
                last_heartbeat: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', batchWithPendingItems.id);
            
            batchStatus = { ...batchWithPendingItems, status: 'running' };
            console.log('✅ Reactivated blog batch:', batchStatus.id);
          } else {
            // Orphaned queue items - but only clean up if batch truly missing (not another process type)
            console.log('💀 Found orphaned blog queue items - cleaning up');
            await supabase
              .from('batch_queue_items')
              .update({ 
                status: 'failed',
                error_message: 'Missing blog batch_status record - orphaned item',
                updated_at: new Date().toISOString()
              })
              .eq('batch_id', pendingBlogItems[0].batch_id)
              .eq('status', 'pending');
          }
        }
      }
      
      if (!batchStatus) {
        console.log('📴 No recoverable blog batch found');
        return new Response(JSON.stringify({ message: 'No active blog batch' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
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

    // Get next pending items (corrected query without broken filter)
    const { data: pendingItems } = await supabase
      .from('batch_queue_items')
      .select('*')
      .eq('batch_id', batchStatus.id)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(25);

    if (!pendingItems || pendingItems.length === 0) {
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

    // Find first item with attempts < max_attempts, auto-fail others
    let nextItem = null;
    for (const item of pendingItems) {
      const maxAttempts = item.max_attempts || 3;
      if (item.attempts < maxAttempts) {
        nextItem = item;
        break;
      } else {
        // Auto-fail items that exceeded max attempts
        console.log(`💀 Auto-failing item ${item.item_id} (${item.attempts}/${maxAttempts} attempts)`);
        await supabase
          .from('batch_queue_items')
          .update({ 
            status: 'failed',
            error_message: `Exceeded maximum attempts (${maxAttempts})`,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);
      }
    }

    if (!nextItem) {
      console.log('✅ No valid pending items found in current batch');
      return new Response(JSON.stringify({ message: 'No processable items found' }), {
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

    // Update batch status with current item info
    await supabase
      .from('batch_processing_status')
      .update({ 
        current_items: {
          id: nextItem.item_id,
          type: nextItem.item_type,
          started_at: new Date().toISOString()
        },
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
      const errorMessage = error.message || String(error);
      
      // Smart retry logic: Don't retry if error is due to incomplete metadata
      const shouldRetry = !errorMessage.includes('INCOMPLETE_METADATA') && 
                         !errorMessage.includes('Missing required metadata') &&
                         !errorMessage.includes('422') && // Status code for incomplete data
                         newAttempts < maxAttempts;
      
      if (shouldRetry) {
        // Mark as pending for retry with delay
        const retryDelay = Math.min(5 * newAttempts, 15); // 5, 10, or 15 minutes
        const scheduledAt = new Date(Date.now() + retryDelay * 60 * 1000);
        
        await supabase
          .from('batch_queue_items')
          .update({ 
            status: 'pending',
            error_message: errorMessage,
            scheduled_at: scheduledAt.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', nextItem.id);

        console.log(`🔄 Item will retry in ${retryDelay} minutes (attempt ${newAttempts}/${maxAttempts})`);
      } else {
        // Mark as failed - either max attempts reached or incomplete metadata
        await supabase
          .from('batch_queue_items')
          .update({ 
            status: 'failed',
            error_message: errorMessage,
            updated_at: new Date().toISOString()
          })
          .eq('id', nextItem.id);

        if (errorMessage.includes('INCOMPLETE_METADATA') || errorMessage.includes('422')) {
          console.log(`💀 Item failed due to incomplete metadata (no retry): ${errorMessage}`);
        } else {
          console.log(`💀 Item failed after ${maxAttempts} attempts`);
        }
      }

      // Update batch counters
      await supabase
        .from('batch_processing_status')
        .update({ 
          processed_items: (batchStatus.processed_items || 0) + 1,
          failed_items: (batchStatus.failed_items || 0) + (!shouldRetry ? 1 : 0),
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