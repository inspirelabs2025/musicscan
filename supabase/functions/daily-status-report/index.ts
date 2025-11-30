import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REPORT_EMAIL = "rogiervisser76@gmail.com";

// Content sources - same as useStatusDashboard hook
const CONTENT_SOURCES = [
  { 
    id: 'anecdotes', 
    label: 'Anekdotes', 
    table: 'music_anecdotes', 
    dateColumn: 'created_at',
    publishedColumn: 'is_published',
    schedule: 'Dagelijks 06:05',
    expectedDaily: 1,
    warningAfterHours: 26,
    icon: '🎭'
  },
  { 
    id: 'music_history', 
    label: 'Muziekgeschiedenis', 
    table: 'music_history_events', 
    dateColumn: 'created_at',
    publishedColumn: 'is_published',
    schedule: 'Dagelijks 06:00',
    expectedDaily: 1,
    warningAfterHours: 26,
    icon: '📜'
  },
  { 
    id: 'news', 
    label: 'Nieuws Artikelen', 
    table: 'news_blog_posts', 
    dateColumn: 'created_at',
    publishedColumn: 'is_published',
    schedule: '3x per dag',
    expectedDaily: 3,
    warningAfterHours: 10,
    icon: '📰'
  },
  { 
    id: 'youtube', 
    label: 'YouTube Videos', 
    table: 'youtube_discoveries', 
    dateColumn: 'created_at',
    schedule: 'Continu',
    expectedDaily: 20,
    warningAfterHours: 8,
    icon: '🎬'
  },
  { 
    id: 'spotify', 
    label: 'Spotify Releases', 
    table: 'spotify_new_releases_processed', 
    dateColumn: 'created_at',
    schedule: 'Dagelijks 09:00',
    expectedDaily: 1,
    warningAfterHours: 26,
    icon: '🎵'
  },
  { 
    id: 'artist_stories', 
    label: 'Artist Stories', 
    table: 'artist_stories', 
    dateColumn: 'created_at',
    publishedColumn: 'is_published',
    schedule: 'Dagelijks 01:00',
    expectedDaily: 1,
    warningAfterHours: 48,
    icon: '👤'
  },
  { 
    id: 'music_stories', 
    label: 'Music Stories', 
    table: 'music_stories', 
    dateColumn: 'created_at',
    publishedColumn: 'is_published',
    schedule: 'Continu',
    expectedDaily: 10,
    warningAfterHours: 8,
    icon: '📖'
  },
  { 
    id: 'blogs', 
    label: 'Blog Posts', 
    table: 'blog_posts', 
    dateColumn: 'created_at',
    publishedColumn: 'is_published',
    schedule: 'Continu',
    expectedDaily: 50,
    warningAfterHours: 4,
    icon: '📝'
  },
  { 
    id: 'indexnow', 
    label: 'IndexNow', 
    table: 'indexnow_submissions', 
    dateColumn: 'submitted_at',
    schedule: 'Elke 15 min',
    expectedDaily: 10,
    warningAfterHours: 6,
    icon: '🔍'
  },
];

interface ContentActivity {
  source: typeof CONTENT_SOURCES[0];
  lastActivity: string | null;
  countInPeriod: number;
  total: number;
  publishedCount: number | null;
  unpublishedCount: number | null;
  status: 'ok' | 'warning' | 'error' | 'unknown';
  hoursSinceActivity: number | null;
}

interface QueueStats {
  name: string;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

function calculateStatus(
  source: typeof CONTENT_SOURCES[0],
  lastActivity: Date | null,
  countInPeriod: number
): 'ok' | 'warning' | 'error' | 'unknown' {
  if (!lastActivity) return 'unknown';
  
  const hoursSince = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);
  
  if (hoursSince > source.warningAfterHours) {
    return 'error';
  }
  
  if (hoursSince > source.warningAfterHours * 0.75) {
    return 'warning';
  }
  
  return 'ok';
}

function formatRelativeTime(date: Date | null): string {
  if (!date) return 'Nooit';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 24) {
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} dag${diffDays > 1 ? 'en' : ''} geleden`;
  } else if (diffHours > 0) {
    return `${diffHours} uur geleden`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} min geleden`;
  } else {
    return 'Zojuist';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('📊 Generating status report (same as dashboard)...');

    const periodHours = 24;
    const periodStart = new Date(Date.now() - periodHours * 60 * 60 * 1000).toISOString();
    const reportTime = new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' });

    // ============================================
    // CONTENT ACTIVITY (same as useStatusDashboard)
    // ============================================
    const contentActivity: ContentActivity[] = [];
    
    for (const source of CONTENT_SOURCES) {
      try {
        // Get last activity
        const { data: lastRecord } = await supabase
          .from(source.table)
          .select(source.dateColumn)
          .order(source.dateColumn, { ascending: false })
          .limit(1)
          .single();
        
        // Get count in period
        const { count: periodCount } = await supabase
          .from(source.table)
          .select('*', { count: 'exact', head: true })
          .gte(source.dateColumn, periodStart);
        
        // Get total count
        const { count: totalCount } = await supabase
          .from(source.table)
          .select('*', { count: 'exact', head: true });
        
        // Get published/unpublished counts if applicable
        let publishedCount: number | null = null;
        let unpublishedCount: number | null = null;
        
        if (source.publishedColumn) {
          const { count: pubCount } = await supabase
            .from(source.table)
            .select('*', { count: 'exact', head: true })
            .eq(source.publishedColumn, true);
          
          const { count: unpubCount } = await supabase
            .from(source.table)
            .select('*', { count: 'exact', head: true })
            .eq(source.publishedColumn, false);
          
          publishedCount = pubCount || 0;
          unpublishedCount = unpubCount || 0;
        }
        
        const lastActivity = lastRecord?.[source.dateColumn] 
          ? new Date(lastRecord[source.dateColumn]) 
          : null;
        
        const hoursSinceActivity = lastActivity 
          ? (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60)
          : null;
        
        contentActivity.push({
          source,
          lastActivity: lastActivity?.toISOString() || null,
          countInPeriod: periodCount || 0,
          total: totalCount || 0,
          publishedCount,
          unpublishedCount,
          status: calculateStatus(source, lastActivity, periodCount || 0),
          hoursSinceActivity
        });
      } catch (error) {
        console.error(`Error fetching ${source.table}:`, error);
        contentActivity.push({
          source,
          lastActivity: null,
          countInPeriod: 0,
          total: 0,
          publishedCount: null,
          unpublishedCount: null,
          status: 'unknown',
          hoursSinceActivity: null
        });
      }
    }

    // ============================================
    // QUEUE STATS (same as useStatusDashboard)
    // ============================================
    const queueStats: QueueStats[] = [];
    
    // Singles queue
    const { data: singlesData } = await supabase
      .from('singles_import_queue')
      .select('status');
    
    if (singlesData) {
      queueStats.push({
        name: 'Singles Import',
        pending: singlesData.filter(s => s.status === 'pending').length,
        processing: singlesData.filter(s => s.status === 'processing').length,
        completed: singlesData.filter(s => s.status === 'completed').length,
        failed: singlesData.filter(s => s.status === 'failed').length,
      });
    }
    
    // Discogs queue
    const { data: discogsData } = await supabase
      .from('discogs_import_log')
      .select('status');
    
    if (discogsData) {
      queueStats.push({
        name: 'Discogs Import',
        pending: discogsData.filter(s => s.status === 'pending').length,
        processing: discogsData.filter(s => s.status === 'processing').length,
        completed: discogsData.filter(s => s.status === 'completed').length,
        failed: discogsData.filter(s => s.status === 'failed').length,
      });
    }
    
    // Batch queue
    const { data: batchData } = await supabase
      .from('batch_queue_items')
      .select('status');
    
    if (batchData) {
      queueStats.push({
        name: 'Batch Queue',
        pending: batchData.filter(s => s.status === 'pending').length,
        processing: batchData.filter(s => s.status === 'processing').length,
        completed: batchData.filter(s => s.status === 'completed').length,
        failed: batchData.filter(s => s.status === 'failed').length,
      });
    }

    // ============================================
    // CRON LOGS
    // ============================================
    const { data: cronLogs } = await supabase
      .from('cronjob_execution_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(20);

    // ============================================
    // CALCULATE ISSUES
    // ============================================
    const issues = contentActivity.filter(a => a.status === 'error' || a.status === 'warning');
    const errorCount = contentActivity.filter(a => a.status === 'error').length;
    const warningCount = contentActivity.filter(a => a.status === 'warning').length;
    const hasIssues = issues.length > 0;

    // ============================================
    // BUILD HTML EMAIL (matching dashboard design)
    // ============================================
    const statusIcon = (status: string) => {
      switch (status) {
        case 'ok': return '✅';
        case 'warning': return '⚠️';
        case 'error': return '❌';
        default: return '❓';
      }
    };

    const statusLabel = (status: string) => {
      switch (status) {
        case 'ok': return 'OK';
        case 'warning': return 'Waarschuwing';
        case 'error': return 'Probleem';
        default: return 'Onbekend';
      }
    };

    const contentRows = contentActivity.map(activity => {
      const lastDate = activity.lastActivity ? new Date(activity.lastActivity) : null;
      const rowBg = activity.status === 'error' ? 'background-color: #ffebee;' : 
                    activity.status === 'warning' ? 'background-color: #fff8e1;' : '';
      
      let frontendStatus = '<span style="color: #999;">n.v.t.</span>';
      if (activity.publishedCount !== null) {
        frontendStatus = `<span style="color: #4caf50;">✓ ${activity.publishedCount.toLocaleString()}</span>`;
        if (activity.unpublishedCount && activity.unpublishedCount > 0) {
          frontendStatus += ` <span style="color: #ff9800;">⏳ ${activity.unpublishedCount.toLocaleString()}</span>`;
        }
      }
      
      return `
        <tr style="${rowBg}">
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            ${activity.source.icon} ${activity.source.label}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; color: #666; font-size: 13px;">
            ${activity.source.schedule}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            ${formatRelativeTime(lastDate)}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-family: monospace;">
            ${activity.countInPeriod}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-family: monospace; color: #666;">
            ${activity.total.toLocaleString()}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
            ${frontendStatus}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
            ${statusIcon(activity.status)} ${statusLabel(activity.status)}
          </td>
        </tr>
      `;
    }).join('');

    const queueRows = queueStats.map(queue => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: 500;">${queue.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          <span style="background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 4px;">${queue.pending.toLocaleString()}</span>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          <span style="background: #fff8e1; color: #f57c00; padding: 2px 8px; border-radius: 4px;">${queue.processing.toLocaleString()}</span>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          <span style="background: #e8f5e9; color: #388e3c; padding: 2px 8px; border-radius: 4px;">${queue.completed.toLocaleString()}</span>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          <span style="background: ${queue.failed > 0 ? '#ffebee' : '#f5f5f5'}; color: ${queue.failed > 0 ? '#d32f2f' : '#666'}; padding: 2px 8px; border-radius: 4px;">${queue.failed.toLocaleString()}</span>
        </td>
      </tr>
    `).join('');

    const issuesHtml = issues.length > 0 ? `
      <div style="background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
        <strong style="font-size: 16px;">⚠️ Aandachtspunten (${issues.length})</strong>
        <div style="margin-top: 10px;">
          ${issues.filter(i => i.status === 'error').map(issue => `
            <div style="padding: 8px; margin: 4px 0; background: rgba(244,67,54,0.1); border-radius: 4px;">
              ❌ <strong>${issue.source.icon} ${issue.source.label}</strong>
              <span style="color: #666; margin-left: 8px;">
                — Laatste activiteit: ${formatRelativeTime(issue.lastActivity ? new Date(issue.lastActivity) : null)}
                ${issue.hoursSinceActivity ? ` (${Math.round(issue.hoursSinceActivity)} uur geleden)` : ''}
              </span>
            </div>
          `).join('')}
          ${issues.filter(i => i.status === 'warning').map(issue => `
            <div style="padding: 8px; margin: 4px 0; background: rgba(255,193,7,0.1); border-radius: 4px;">
              ⚠️ <strong>${issue.source.icon} ${issue.source.label}</strong>
              <span style="color: #666; margin-left: 8px;">
                — Verwacht: ${issue.source.expectedDaily}/dag, gevonden: ${issue.countInPeriod} in 24u
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    const overallStatusHtml = errorCount > 0 ? `
      <div style="background: #ffebee; border: 1px solid rgba(244,67,54,0.2); padding: 16px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 32px;">❌</span>
        <div>
          <div style="font-weight: 600; font-size: 18px;">Problemen Gedetecteerd</div>
          <div style="color: #666; font-size: 14px;">${errorCount} kritiek, ${warningCount} waarschuwingen</div>
        </div>
      </div>
    ` : warningCount > 0 ? `
      <div style="background: #fff8e1; border: 1px solid rgba(255,193,7,0.2); padding: 16px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 32px;">⚠️</span>
        <div>
          <div style="font-weight: 600; font-size: 18px;">Waarschuwingen</div>
          <div style="color: #666; font-size: 14px;">${warningCount} items vereisen aandacht</div>
        </div>
      </div>
    ` : `
      <div style="background: #e8f5e9; border: 1px solid rgba(76,175,80,0.2); padding: 16px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 32px;">✅</span>
        <div>
          <div style="font-weight: 600; font-size: 18px;">Alles Operationeel</div>
          <div style="color: #666; font-size: 14px;">Alle content generatie processen werken correct</div>
        </div>
      </div>
    `;

    const cronLogsHtml = (cronLogs && cronLogs.length > 0) ? `
      <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-top: 30px;">Recente Cron Job Logs</h2>
      <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <thead style="background: #f5f5f5;">
          <tr>
            <th style="padding: 12px; text-align: left;">Functie</th>
            <th style="padding: 12px; text-align: left;">Status</th>
            <th style="padding: 12px; text-align: left;">Gestart</th>
            <th style="padding: 12px; text-align: right;">Duur</th>
            <th style="padding: 12px; text-align: right;">Items</th>
          </tr>
        </thead>
        <tbody>
          ${cronLogs.slice(0, 10).map(log => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: 500;">${log.function_name}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">
                <span style="background: ${log.status === 'completed' ? '#e8f5e9' : log.status === 'failed' ? '#ffebee' : '#f5f5f5'}; 
                             color: ${log.status === 'completed' ? '#388e3c' : log.status === 'failed' ? '#d32f2f' : '#666'}; 
                             padding: 2px 8px; border-radius: 4px;">
                  ${log.status}
                </span>
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 13px;">
                ${formatRelativeTime(new Date(log.started_at))}
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-family: monospace; font-size: 13px;">
                ${log.execution_time_ms ? `${(log.execution_time_ms / 1000).toFixed(1)}s` : '-'}
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-family: monospace;">
                ${log.items_processed || 0}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>MusicScan Status Dashboard</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">📊 Status Dashboard</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Real-time overzicht van content generatie (laatste 24 uur)</p>
          <p style="margin: 4px 0 0 0; opacity: 0.7; font-size: 14px;">${reportTime}</p>
        </div>
        
        <div style="background: white; padding: 24px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
          
          ${overallStatusHtml}
          
          ${issuesHtml}
          
          <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Content Generatie Overzicht</h2>
          <p style="color: #666; margin-bottom: 16px; font-size: 14px;">Status gebaseerd op daadwerkelijke content in de database</p>
          
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <thead style="background: #f5f5f5;">
              <tr>
                <th style="padding: 12px; text-align: left;">Content Type</th>
                <th style="padding: 12px; text-align: left;">Schema</th>
                <th style="padding: 12px; text-align: left;">Laatste Activiteit</th>
                <th style="padding: 12px; text-align: right;">24u</th>
                <th style="padding: 12px; text-align: right;">Totaal</th>
                <th style="padding: 12px; text-align: center;">Frontend</th>
                <th style="padding: 12px; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${contentRows}
            </tbody>
          </table>
          
          <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-top: 30px;">Queue Status</h2>
          <p style="color: #666; margin-bottom: 16px; font-size: 14px;">Overzicht van verwerkingsqueues</p>
          
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <thead style="background: #f5f5f5;">
              <tr>
                <th style="padding: 12px; text-align: left;">Queue</th>
                <th style="padding: 12px; text-align: right;">Pending</th>
                <th style="padding: 12px; text-align: right;">Processing</th>
                <th style="padding: 12px; text-align: right;">Completed</th>
                <th style="padding: 12px; text-align: right;">Failed</th>
              </tr>
            </thead>
            <tbody>
              ${queueRows}
            </tbody>
          </table>
          
          ${cronLogsHtml}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 13px;">
            <a href="https://www.musicscan.app/admin/status" style="color: #667eea; text-decoration: none;">
              Bekijk live dashboard →
            </a>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      
      await resend.emails.send({
        from: 'MusicScan <onboarding@resend.dev>',
        to: [REPORT_EMAIL],
        subject: `${hasIssues ? '⚠️' : '✅'} MusicScan Status Dashboard - ${reportTime}`,
        html: emailHtml,
      });
      
      console.log('📧 Status dashboard email sent successfully');
    } else {
      console.warn('⚠️ RESEND_API_KEY not configured');
    }

    // Log execution
    await supabase
      .from('cronjob_execution_log')
      .insert({
        function_name: 'daily-status-report',
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        metadata: {
          errorCount,
          warningCount,
          contentSources: contentActivity.length,
          queueStats: queueStats.length
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Status dashboard email sent',
        hasIssues,
        errorCount,
        warningCount,
        contentActivity: contentActivity.map(a => ({
          source: a.source.label,
          status: a.status,
          countInPeriod: a.countInPeriod,
          total: a.total
        })),
        queueStats
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error generating status report:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
