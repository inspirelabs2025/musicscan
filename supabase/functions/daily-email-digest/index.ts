import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DailyDigestData {
  news: any[];
  releases: any[];
  blogs: any[];
  uploads: number;
  newUsers: number;
}

interface EmailRecipient {
  user_id: string;
  first_name: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Check for required environment variables
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY environment variable is not set');
  throw new Error('RESEND_API_KEY is required but not found in environment variables');
}

const resend = new Resend(RESEND_API_KEY);

async function collectDailyData(): Promise<DailyDigestData> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = yesterday.toISOString();
  
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoISO = weekAgo.toISOString();

  console.log('Collecting daily digest data...');

  // Get latest news from cache
  const { data: newsData } = await supabase
    .from('news_cache')
    .select('content')
    .order('cached_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let news = [];
  if (newsData?.content && Array.isArray(newsData.content)) {
    news = newsData.content.slice(0, 3); // Top 3 news items
  }

  // Get latest releases from news_blog_posts (music news)
  const { data: releasesData } = await supabase
    .from('news_blog_posts')
    .select('title, summary, slug, image_url, published_at')
    .gte('published_at', yesterdayISO)
    .order('published_at', { ascending: false })
    .limit(5);

  // Get recent blog posts 
  const { data: blogsData } = await supabase
    .from('blog_posts')
    .select('id, album_id, slug, yaml_frontmatter, album_cover_url, created_at')
    .eq('is_published', true)
    .gte('created_at', yesterdayISO)
    .order('created_at', { ascending: false })
    .limit(5);

  // Count new uploads (CD + Vinyl scans)
  const { count: cdUploads } = await supabase
    .from('cd_scan')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', yesterdayISO);

  const { count: vinylUploads } = await supabase
    .from('vinyl2_scan')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', yesterdayISO);

  // Count new users
  const { count: newUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgoISO);

  return {
    news: news || [],
    releases: releasesData || [],
    blogs: blogsData || [],
    uploads: (cdUploads || 0) + (vinylUploads || 0),
    newUsers: newUsers || 0
  };
}

function generateEmailHTML(firstName: string, data: DailyDigestData, userId: string): string {
  const unsubscribeUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/daily-email-digest?action=unsubscribe&user_id=${userId}`;
  const baseUrl = "https://musicscan.app";
  
  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MusicScan - Dagelijkse Update</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset & Base */
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #ffffff; color: #0f172a; line-height: 1.6; }
    table { border-collapse: collapse; width: 100%; }
    
    /* Container */
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    
    /* Header with gradient */
    .header { 
      background: linear-gradient(135deg, #9c4dcc 0%, #ffcc00 100%); 
      color: #ffffff; 
      padding: 32px 24px; 
      text-align: center; 
      border-radius: 12px 12px 0 0;
    }
    .header h1 { margin: 0 0 8px 0; font-size: 28px; font-weight: 700; }
    .header p { margin: 0; font-size: 16px; opacity: 0.9; }
    
    /* Content */
    .content { padding: 24px; background-color: #f8fafc; }
    
    /* Sections */
    .section { margin-bottom: 32px; }
    .section-title { 
      font-size: 20px; 
      font-weight: 700; 
      margin-bottom: 20px; 
      color: #9c4dcc; 
      border-bottom: 2px solid #9c4dcc; 
      padding-bottom: 12px; 
      display: block;
    }
    
    /* Cards */
    .card { 
      margin-bottom: 16px; 
      padding: 20px; 
      background: #ffffff;
      border-radius: 12px; 
      border: 1px solid #e2e8f0;
      transition: all 0.3s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .card:hover { 
      border-color: #9c4dcc; 
      box-shadow: 0 8px 25px rgba(156, 77, 204, 0.15);
    }
    
    /* Card Links */
    .card-link { 
      text-decoration: none; 
      color: inherit; 
      display: block;
    }
    .card-link:hover .card-title { color: #9c4dcc; }
    
    .card-title { 
      font-weight: 700; 
      margin-bottom: 8px; 
      color: #0f172a; 
      font-size: 16px;
      line-height: 1.4;
      transition: color 0.3s ease;
    }
    .card-summary { 
      color: #64748b; 
      font-size: 14px; 
      line-height: 1.5; 
      margin: 0;
    }
    
    /* Stats */
    .stats-container { 
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .stats-grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 20px; 
    }
    .stat-item { 
      text-align: center; 
      padding: 20px; 
      background: linear-gradient(135deg, #9c4dcc 0%, #ffcc00 100%);
      border-radius: 8px; 
      color: #ffffff;
    }
    .stat-number { 
      font-size: 32px; 
      font-weight: 900; 
      line-height: 1;
      margin-bottom: 4px;
    }
    .stat-label { 
      font-size: 12px; 
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    /* CTA Section */
    .cta { 
      text-align: center; 
      margin: 40px 0; 
      padding: 32px 24px;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .cta-button { 
      display: inline-block; 
      padding: 16px 32px; 
      background: linear-gradient(135deg, #9c4dcc 0%, #ffcc00 100%); 
      color: #ffffff; 
      text-decoration: none; 
      border-radius: 8px; 
      font-weight: 700; 
      font-size: 16px;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .cta-button:hover { 
      transform: translateY(-2px); 
      box-shadow: 0 8px 25px rgba(156, 77, 204, 0.3);
    }
    
    /* Stats CTA */
    .stats-cta { 
      margin-top: 20px; 
      text-align: center; 
    }
    .stats-cta-link { 
      display: inline-block; 
      color: #9c4dcc; 
      text-decoration: none; 
      font-weight: 600; 
      font-size: 14px;
      padding: 8px 16px;
      border: 1px solid #9c4dcc;
      border-radius: 6px;
      transition: all 0.3s ease;
    }
    .stats-cta-link:hover { 
      background-color: #9c4dcc; 
      color: #ffffff; 
    }
    
    /* Footer */
    .footer { 
      background-color: #f8fafc; 
      padding: 32px 24px; 
      text-align: center; 
      color: #64748b; 
      font-size: 12px;
      border-top: 1px solid #e2e8f0;
    }
    .footer p { margin: 8px 0; }
    .unsubscribe { 
      color: #64748b; 
      text-decoration: underline; 
      font-weight: 500;
    }
    .unsubscribe:hover { color: #9c4dcc; }
    
    /* Mobile Responsive */
    @media only screen and (max-width: 480px) {
      .container { margin: 0; }
      .header { padding: 24px 16px; }
      .content { padding: 16px; }
      .stats-grid { grid-template-columns: 1fr; gap: 12px; }
      .cta { padding: 24px 16px; }
      .card { padding: 16px; }
      .header h1 { font-size: 24px; }
      .stat-number { font-size: 28px; }
    }
  </style>
</head>
<body>
  <table role="presentation" width="100%" style="background-color: #ffffff;">
    <tr>
      <td align="center">
        <div class="container">
          <div class="header">
            <h1>🎵 MusicScan Dagelijkse Update</h1>
            <p>Hallo ${firstName}! Hier is wat er vandaag gebeurt in de muziekwereld.</p>
          </div>
          
          <div class="content">
            ${data.releases.length > 0 ? `
            <div class="section">
              <h2 class="section-title">📰 Muzieknieuws</h2>
              ${data.releases.map(release => {
                const releaseUrl = release.slug ? `${baseUrl}/nieuws/${release.slug}` : `${baseUrl}/news`;
                return `
                  <a href="${releaseUrl}" class="card-link">
                    <div class="card">
                      <div class="card-title">${release.title}</div>
                      <p class="card-summary">${release.summary}</p>
                    </div>
                  </a>
                `;
              }).join('')}
              <div style="text-align: center; margin-top: 20px;">
                <a href="${baseUrl}/news" style="color: #9c4dcc; text-decoration: none; font-weight: 600;">→ Bekijk al het muzieknieuws</a>
              </div>
            </div>
            ` : ''}

            ${data.news.length > 0 ? `
            <div class="section">
              <h2 class="section-title">🆕 Nieuwe Vinyl Releases</h2>
              ${data.news.map(item => `
                <a href="${baseUrl}/news" class="card-link">
                  <div class="card">
                    <div class="card-title">${item.title || 'Nieuwe Release'}</div>
                    <p class="card-summary">${item.summary || item.content || 'Nieuwe releases van vandaag'}</p>
                  </div>
                </a>
              `).join('')}
              <div style="text-align: center; margin-top: 20px;">
                <a href="${baseUrl}/news" style="color: #9c4dcc; text-decoration: none; font-weight: 600;">→ Ontdek alle nieuwe releases</a>
              </div>
            </div>
            ` : ''}

            ${data.blogs.length > 0 ? `
            <div class="section">
              <h2 class="section-title">📝 Nieuwe Community Blogs</h2>
              ${data.blogs.map(blog => {
                const frontmatter = blog.yaml_frontmatter || {};
                const blogUrl = `${baseUrl}/plaat-verhaal/${blog.slug}`;
                return `
                  <a href="${blogUrl}" class="card-link">
                    <div class="card">
                      <div class="card-title">${frontmatter.title || 'Nieuwe Blog Post'}</div>
                      <p class="card-summary">Door een community member - ${frontmatter.artist || 'Onbekende artiest'}</p>
                    </div>
                  </a>
                `;
              }).join('')}
              <div style="text-align: center; margin-top: 20px;">
                <a href="${baseUrl}/plaat-verhaal" style="color: #9c4dcc; text-decoration: none; font-weight: 600;">→ Lees alle community verhalen</a>
              </div>
            </div>
            ` : ''}

            <div class="section">
              <h2 class="section-title">📊 Community Activiteit</h2>
              <div class="stats-container">
                <div class="stats-grid">
                  <div class="stat-item">
                    <div class="stat-number">${data.uploads}</div>
                    <div class="stat-label">Nieuwe Uploads</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-number">${data.newUsers}</div>
                    <div class="stat-label">Nieuwe Gebruikers</div>
                  </div>
                </div>
                <div class="stats-cta">
                  <a href="${baseUrl}/dashboard" class="stats-cta-link">Bekijk je Dashboard</a>
                </div>
              </div>
            </div>

            <div class="cta">
              <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px;">Klaar om je collectie te scannen?</h3>
              <a href="${baseUrl}" class="cta-button">Ga naar MusicScan</a>
            </div>
          </div>

          <div class="footer">
            <p>Je ontvangt deze email omdat je ingeschreven bent voor dagelijkse updates van MusicScan.</p>
            <p><a href="${unsubscribeUrl}" class="unsubscribe">Uitschrijven</a> | MusicScan Team</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

async function sendDigestEmails(data: DailyDigestData, testUserId?: string, testEmail?: string) {
  console.log('Fetching users who want email notifications...');
  
  let query = supabase
    .from('profiles')
    .select('user_id, first_name')
    .eq('email_notifications', true);

  // Filter to specific user if test parameter provided
  if (testUserId) {
    query = query.eq('user_id', testUserId);
    console.log(`🧪 Test mode: filtering to user ${testUserId}`);
  }

  const { data: recipients, error } = await query;

  if (error) {
    console.error('Error fetching recipients:', error);
    return { success: false, error: error.message };
  }

  if (!recipients || recipients.length === 0) {
    console.log('No recipients found for daily digest');
    return { success: true, sent: 0, message: 'No recipients found' };
  }

  console.log(`Found ${recipients.length} recipients for daily digest`);

  // Get user emails from auth.users (this requires service role key)
  const userIds = recipients.map(r => r.user_id);
  
  let sentCount = 0;
  let errors = [];

  for (const recipient of recipients) {
    try {
      let emailAddress = testEmail;
      
      if (!testEmail) {
        // Get user email from auth metadata
        const { data: authUser } = await supabase.auth.admin.getUserById(recipient.user_id);
        
        if (!authUser.user?.email) {
          console.log(`No email found for user ${recipient.user_id}`);
          continue;
        }
        emailAddress = authUser.user.email;
      }

      const emailHTML = generateEmailHTML(
        recipient.first_name || 'Muziekliefhebber', 
        data, 
        recipient.user_id
      );

      console.log(`📧 Sending email to ${emailAddress}...`);

      const { data: emailResult, error: emailError } = await resend.emails.send({
        // Using verified sender temporarily - switch to 'MusicScan <dagelijks@musicscan.ai>' when domain is verified
        from: 'MusicScan <onboarding@resend.dev>',
        to: [emailAddress],
        subject: `🎵 Je dagelijkse muziekupdate - ${new Date().toLocaleDateString('nl-NL')}`,
        html: emailHTML,
      });

      if (emailError) {
        console.error(`❌ Failed to send email to ${emailAddress}:`, emailError);
        errors.push({ user_id: recipient.user_id, error: emailError.message });
      } else {
        sentCount++;
        console.log(`✅ Email sent successfully to ${emailAddress}`, emailResult ? `(ID: ${emailResult.id})` : '');
      }

      // Rate limiting - wait 1 second between emails to prevent rate limit errors
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`❌ Error processing recipient ${recipient.user_id}:`, error);
      errors.push({ user_id: recipient.user_id, error: error.message });
    }
  }

  return {
    success: true,
    sent: sentCount,
    total: recipients.length,
    errors: errors
  };
}

async function handleUnsubscribe(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ email_notifications: false })
    .eq('user_id', userId);

  if (error) {
    console.error('Error unsubscribing user:', error);
    return new Response('Error processing unsubscribe request', { status: 500 });
  }

  return new Response(`
    <!DOCTYPE html>
    <html>
    <head><title>Uitgeschreven</title></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; text-align: center; padding: 20px;">
      <h1>✅ Je bent uitgeschreven</h1>
      <p>Je ontvangt geen dagelijkse email updates meer van MusicScan.</p>
      <p>Je kunt deze instelling altijd wijzigen in je profiel op de app.</p>
      <a href="https://musicscan.ai" style="color: #667eea;">Terug naar MusicScan</a>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const userId = url.searchParams.get('user_id');
    const testUserId = url.searchParams.get('only_user');
    const testEmail = url.searchParams.get('test_email');

    // Handle unsubscribe requests
    if (action === 'unsubscribe' && userId) {
      return await handleUnsubscribe(userId);
    }

    // Main digest sending logic
    console.log('🚀 Starting daily email digest process...');
    
    if (testUserId) {
      console.log(`🧪 Test mode enabled: sending only to user ${testUserId}`);
    } else if (testEmail) {
      console.log(`🧪 Test mode enabled: sending only to email ${testEmail}`);
    } else {
      console.log('📧 Normal mode: sending to all subscribed users');
    }
    
    const data = await collectDailyData();
    console.log('Collected data:', {
      news: data.news.length,
      releases: data.releases.length,
      blogs: data.blogs.length,
      uploads: data.uploads,
      newUsers: data.newUsers
    });

    const result = await sendDigestEmails(data, testUserId || undefined, testEmail || undefined);
    
    console.log('✅ Daily digest process completed:', result);

    return new Response(JSON.stringify({
      success: true,
      message: 'Daily digest emails sent successfully',
      ...result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in daily digest process:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});