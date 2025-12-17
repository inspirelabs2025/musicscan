import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface AnalyticsStats {
  total_hits: number;
  real_users: number;
  datacenter_hits: number;
  purity_score: number;
  avg_real_score: number;
  unique_sessions: number;
  pages_per_session: number;
}

interface CountryStats {
  country: string;
  hit_count: number;
  real_users: number;
}

interface SourceStats {
  source: string;
  hit_count: number;
  percentage: number;
}

interface DeviceStats {
  device_type: string;
  count: number;
  percentage: number;
}

interface HourlyStats {
  hour: number;
  count: number;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('nl-NL', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function formatPercentageChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '↑ nieuw' : '—';
  const change = ((current - previous) / previous) * 100;
  if (change > 0) return `↑ ${change.toFixed(0)}%`;
  if (change < 0) return `↓ ${Math.abs(change).toFixed(0)}%`;
  return '—';
}

function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    'Netherlands': '🇳🇱',
    'Belgium': '🇧🇪',
    'Germany': '🇩🇪',
    'United States': '🇺🇸',
    'France': '🇫🇷',
    'United Kingdom': '🇬🇧',
    'Spain': '🇪🇸',
    'Italy': '🇮🇹',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
  };
  return flags[country] || '🌍';
}

function generateEmailHtml(
  date: string,
  stats: AnalyticsStats,
  prevStats: AnalyticsStats,
  countries: CountryStats[],
  sources: SourceStats[],
  devices: DeviceStats[],
  peakHour: HourlyStats | null
): string {
  const sessionsChange = formatPercentageChange(stats.unique_sessions, prevStats.unique_sessions);
  const pageviewsChange = formatPercentageChange(stats.real_users, prevStats.real_users);
  const datacenterChange = formatPercentageChange(stats.datacenter_hits, prevStats.datacenter_hits);

  const countriesHtml = countries.slice(0, 5).map(c => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${getCountryFlag(c.country)} ${c.country}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">${c.real_users}</td>
    </tr>
  `).join('');

  const sourcesHtml = sources.slice(0, 5).map(s => {
    const barWidth = Math.min(s.percentage, 100);
    return `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${s.source || 'Direct'}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee; width: 120px;">
        <div style="background: #e0e0e0; border-radius: 4px; height: 8px; width: 100%;">
          <div style="background: linear-gradient(90deg, #8B5CF6, #F59E0B); border-radius: 4px; height: 8px; width: ${barWidth}%;"></div>
        </div>
      </td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">${s.percentage.toFixed(0)}%</td>
    </tr>
  `;
  }).join('');

  const devicesHtml = devices.map(d => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${d.device_type === 'desktop' ? '💻' : d.device_type === 'mobile' ? '📱' : '📟'} ${d.device_type}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">${d.percentage.toFixed(0)}%</td>
    </tr>
  `).join('');

  const peakHourText = peakHour ? `${peakHour.hour.toString().padStart(2, '0')}:00 - ${(peakHour.hour + 1).toString().padStart(2, '0')}:00 (${peakHour.count} sessies)` : 'Geen data';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MusicScan Dagelijkse Statistieken</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8B5CF6 0%, #F59E0B 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">🎵 MusicScan</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Dagelijkse Statistieken</p>
              <p style="margin: 4px 0 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">${date}</p>
            </td>
          </tr>

          <!-- Main Stats -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 18px; border-bottom: 2px solid #8B5CF6; padding-bottom: 10px;">📊 Bezoekersoverzicht</h2>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding: 10px;">
                    <div style="background: #f8f4ff; border-radius: 8px; padding: 16px; text-align: center;">
                      <div style="font-size: 28px; font-weight: 700; color: #8B5CF6;">${stats.unique_sessions.toLocaleString('nl-NL')}</div>
                      <div style="font-size: 12px; color: #666; margin-top: 4px;">Unieke Sessies</div>
                      <div style="font-size: 11px; color: ${sessionsChange.startsWith('↑') ? '#22c55e' : sessionsChange.startsWith('↓') ? '#ef4444' : '#666'}; margin-top: 2px;">${sessionsChange}</div>
                    </div>
                  </td>
                  <td width="50%" style="padding: 10px;">
                    <div style="background: #fff7ed; border-radius: 8px; padding: 16px; text-align: center;">
                      <div style="font-size: 28px; font-weight: 700; color: #F59E0B;">${stats.real_users.toLocaleString('nl-NL')}</div>
                      <div style="font-size: 12px; color: #666; margin-top: 4px;">Echte Pageviews</div>
                      <div style="font-size: 11px; color: ${pageviewsChange.startsWith('↑') ? '#22c55e' : pageviewsChange.startsWith('↓') ? '#ef4444' : '#666'}; margin-top: 2px;">${pageviewsChange}</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding: 10px;">
                    <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; text-align: center;">
                      <div style="font-size: 28px; font-weight: 700; color: #22c55e;">${stats.purity_score.toFixed(0)}%</div>
                      <div style="font-size: 12px; color: #666; margin-top: 4px;">Purity Score</div>
                    </div>
                  </td>
                  <td width="50%" style="padding: 10px;">
                    <div style="background: #fef2f2; border-radius: 8px; padding: 16px; text-align: center;">
                      <div style="font-size: 28px; font-weight: 700; color: #ef4444;">${stats.datacenter_hits.toLocaleString('nl-NL')}</div>
                      <div style="font-size: 12px; color: #666; margin-top: 4px;">Bot/Datacenter Hits</div>
                      <div style="font-size: 11px; color: ${datacenterChange.startsWith('↓') ? '#22c55e' : datacenterChange.startsWith('↑') ? '#ef4444' : '#666'}; margin-top: 2px;">${datacenterChange}</div>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 15px 0 0 0; font-size: 13px; color: #666; text-align: center;">
                📄 ${stats.pages_per_session.toFixed(1)} pagina's per sessie &nbsp;|&nbsp; ⏰ Piekuur: ${peakHourText}
              </p>
            </td>
          </tr>

          <!-- Traffic Sources -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 16px;">📍 Traffic Bronnen</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background: #f9f9f9;">
                    <th style="padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px; color: #666;">Bron</th>
                    <th style="padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px; color: #666;"></th>
                    <th style="padding: 10px 12px; text-align: right; font-weight: 600; font-size: 12px; color: #666;">%</th>
                  </tr>
                </thead>
                <tbody>
                  ${sourcesHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Countries & Devices -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding-right: 10px; vertical-align: top;">
                    <h2 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 16px;">🌍 Top Landen</h2>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                      <tbody>
                        ${countriesHtml}
                      </tbody>
                    </table>
                  </td>
                  <td width="50%" style="padding-left: 10px; vertical-align: top;">
                    <h2 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 16px;">📱 Devices</h2>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                      <tbody>
                        ${devicesHtml}
                      </tbody>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee;">
              <a href="https://musicscan.nl/admin/statistics" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #F59E0B 100%); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                Bekijk Volledig Dashboard →
              </a>
              <p style="margin: 15px 0 0 0; font-size: 11px; color: #999;">
                Deze email wordt dagelijks om 08:00 verzonden.<br>
                © ${new Date().getFullYear()} MusicScan
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    if (!adminEmail) {
      throw new Error("ADMIN_EMAIL not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate yesterday's date range
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const dayBefore = new Date(yesterday);
    dayBefore.setDate(dayBefore.getDate() - 1);

    const yesterdayStart = yesterday.toISOString().split('T')[0];
    const yesterdayEnd = yesterday.toISOString().split('T')[0];
    const dayBeforeStart = dayBefore.toISOString().split('T')[0];
    const dayBeforeEnd = dayBefore.toISOString().split('T')[0];

    console.log(`Fetching stats for: ${yesterdayStart} (comparing to ${dayBeforeStart})`);

    // Fetch yesterday's stats
    const { data: statsData, error: statsError } = await supabase.rpc('get_clean_analytics_stats', {
      p_start_date: yesterdayStart,
      p_end_date: yesterdayEnd
    });

    if (statsError) {
      console.error('Stats error:', statsError);
      throw statsError;
    }

    // Fetch day before stats for comparison
    const { data: prevStatsData } = await supabase.rpc('get_clean_analytics_stats', {
      p_start_date: dayBeforeStart,
      p_end_date: dayBeforeEnd
    });

    // Fetch countries
    const { data: countriesData } = await supabase.rpc('get_clean_analytics_countries', {
      p_start_date: yesterdayStart,
      p_end_date: yesterdayEnd
    });

    // Fetch sources
    const { data: sourcesData } = await supabase.rpc('get_clean_analytics_sources', {
      p_start_date: yesterdayStart,
      p_end_date: yesterdayEnd
    });

    // Fetch devices
    const { data: devicesData } = await supabase.rpc('get_clean_analytics_devices', {
      p_start_date: yesterdayStart,
      p_end_date: yesterdayEnd
    });

    // Fetch hourly for peak hour
    const { data: hourlyData } = await supabase.rpc('get_clean_analytics_hourly', {
      p_start_date: yesterdayStart,
      p_end_date: yesterdayEnd
    });

    // Process stats
    const stats: AnalyticsStats = statsData || {
      total_hits: 0,
      real_users: 0,
      datacenter_hits: 0,
      purity_score: 0,
      avg_real_score: 0,
      unique_sessions: 0,
      pages_per_session: 0
    };

    const prevStats: AnalyticsStats = prevStatsData || {
      total_hits: 0,
      real_users: 0,
      datacenter_hits: 0,
      purity_score: 0,
      avg_real_score: 0,
      unique_sessions: 0,
      pages_per_session: 0
    };

    const countries: CountryStats[] = countriesData || [];
    const sources: SourceStats[] = sourcesData || [];
    const devices: DeviceStats[] = devicesData || [];
    
    // Find peak hour
    const peakHour: HourlyStats | null = hourlyData?.length > 0 
      ? hourlyData.reduce((max: HourlyStats, h: HourlyStats) => h.count > max.count ? h : max, hourlyData[0])
      : null;

    // Generate email HTML
    const dateStr = formatDate(yesterday);
    const emailHtml = generateEmailHtml(dateStr, stats, prevStats, countries, sources, devices, peakHour);

    // Send email
    const emailResponse = await resend.emails.send({
      from: "MusicScan <noreply@musicscan.nl>",
      to: [adminEmail],
      subject: `📊 MusicScan Stats - ${dateStr}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Daily stats email sent to ${adminEmail}`,
        stats: {
          date: yesterdayStart,
          sessions: stats.unique_sessions,
          pageviews: stats.real_users,
          purity: stats.purity_score
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending daily stats email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
