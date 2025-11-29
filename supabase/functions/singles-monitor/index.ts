import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALERT_EMAIL = "rogiervisser76@gmail.com";
const STALL_THRESHOLD_MINUTES = 10; // Alert if no processing for 10 minutes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Singles monitor check started');

    // Get count of pending singles
    const { count: pendingCount, error: pendingError } = await supabase
      .from('singles_import_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (pendingError) throw pendingError;

    // If no pending items, nothing to monitor
    if (!pendingCount || pendingCount === 0) {
      console.log('✅ No pending singles - queue is empty');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Queue is empty, no monitoring needed',
        pending: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if any items were processed in the last threshold period
    const thresholdTime = new Date(Date.now() - STALL_THRESHOLD_MINUTES * 60 * 1000).toISOString();
    
    const { count: recentlyProcessed, error: recentError } = await supabase
      .from('singles_import_queue')
      .select('*', { count: 'exact', head: true })
      .in('status', ['completed', 'failed', 'processing'])
      .gte('processed_at', thresholdTime);

    if (recentError) throw recentError;

    // Also check for stuck "processing" items
    const { data: stuckItems, error: stuckError } = await supabase
      .from('singles_import_queue')
      .select('id, artist, single_name, processed_at')
      .eq('status', 'processing')
      .lt('processed_at', thresholdTime);

    if (stuckError) throw stuckError;

    const isStalled = (recentlyProcessed === 0 || recentlyProcessed === null) && pendingCount > 0;
    const hasStuckItems = stuckItems && stuckItems.length > 0;

    console.log(`📊 Status: ${pendingCount} pending, ${recentlyProcessed || 0} recently processed, ${stuckItems?.length || 0} stuck`);

    if (isStalled || hasStuckItems) {
      console.log('⚠️ Processing appears stalled! Sending alert...');

      // Reset stuck items to pending
      if (hasStuckItems) {
        const stuckIds = stuckItems.map(item => item.id);
        await supabase
          .from('singles_import_queue')
          .update({ status: 'pending', error_message: 'Reset by monitor - was stuck' })
          .in('id', stuckIds);
        console.log(`🔄 Reset ${stuckIds.length} stuck items to pending`);
      }

      // Send email alert
      if (resendApiKey) {
        const resend = new Resend(resendApiKey);
        
        const stuckItemsList = stuckItems?.map(item => 
          `- ${item.artist} - ${item.single_name}`
        ).join('\n') || 'None';

        await resend.emails.send({
          from: 'Singles Monitor <onboarding@resend.dev>',
          to: [ALERT_EMAIL],
          subject: '⚠️ Singles Processor Alert - Processing Stalled',
          html: `
            <h2>Singles Processor Alert</h2>
            <p>The singles batch processor appears to have stalled.</p>
            
            <h3>Current Status:</h3>
            <ul>
              <li><strong>Pending items:</strong> ${pendingCount}</li>
              <li><strong>Recently processed (last ${STALL_THRESHOLD_MINUTES} min):</strong> ${recentlyProcessed || 0}</li>
              <li><strong>Stuck items:</strong> ${stuckItems?.length || 0}</li>
            </ul>
            
            ${hasStuckItems ? `
            <h3>Stuck Items (now reset to pending):</h3>
            <pre>${stuckItemsList}</pre>
            ` : ''}
            
            <p><strong>Action taken:</strong> ${hasStuckItems ? 'Stuck items have been reset to pending status.' : 'No automatic action taken.'}</p>
            
            <p>Check the Supabase dashboard for more details:</p>
            <a href="https://supabase.com/dashboard/project/ssxbpyqnjfiyubsuonar/editor">Open Supabase Dashboard</a>
            
            <hr>
            <p style="color: #666; font-size: 12px;">This alert was sent at ${new Date().toISOString()}</p>
          `,
        });
        
        console.log('📧 Alert email sent successfully');
      } else {
        console.warn('⚠️ RESEND_API_KEY not configured, skipping email');
      }

      // Log to cronjob_execution_log
      await supabase
        .from('cronjob_execution_log')
        .insert({
          function_name: 'singles-monitor',
          status: 'warning',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          metadata: {
            pending_count: pendingCount,
            recently_processed: recentlyProcessed || 0,
            stuck_items: stuckItems?.length || 0,
            alert_sent: !!resendApiKey,
            items_reset: stuckItems?.length || 0
          }
        });

      return new Response(JSON.stringify({
        success: true,
        alert: true,
        message: 'Processing stalled - alert sent',
        pending: pendingCount,
        recentlyProcessed: recentlyProcessed || 0,
        stuckItems: stuckItems?.length || 0,
        itemsReset: stuckItems?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Everything is fine
    console.log('✅ Processing is running normally');
    return new Response(JSON.stringify({
      success: true,
      alert: false,
      message: 'Processing running normally',
      pending: pendingCount,
      recentlyProcessed: recentlyProcessed || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Monitor error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
