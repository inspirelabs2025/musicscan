import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { topicId, topicTitle, topicDescription, artistName, albumTitle } = await req.json();
    
    console.log('📧 Starting weekly discussion email notification');
    console.log('📝 Topic details:', { topicId, topicTitle, artistName, albumTitle });

    // Get all users who want to receive notifications
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, first_name')
      .eq('is_public', true); // Only send to public profiles

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      throw usersError;
    }

    if (!users || users.length === 0) {
      console.log('⚠️ No users found to send notifications to');
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log(`👥 Found ${users.length} users to notify`);

    // Get user emails from auth.users (we need service role for this)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      throw authError;
    }

    // Create email list by matching user_ids
    const emailList = users.map(profile => {
      const authUser = authUsers.users.find(u => u.id === profile.user_id);
      return {
        email: authUser?.email,
        firstName: profile.first_name || 'Muziekliefhebber'
      };
    }).filter(user => user.email); // Only include users with email addresses

    console.log(`📮 Sending emails to ${emailList.length} users`);

    // Create HTML email template
    const createEmailHtml = (firstName: string) => `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nieuwe Wekelijkse Discussie - MusicScan</title>
</head>
<body style="margin:0; padding:0; font-family:Arial, sans-serif; background-color:#f4f4f4;">
  <table width="100%" bgcolor="#f4f4f4" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="600" bgcolor="#ffffff" cellpadding="30" cellspacing="0" style="margin:20px 0; border-radius:8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #1DB954, #1ed760); border-radius: 8px 8px 0 0; padding: 30px;">
              <h1 style="color:#ffffff; margin:0; font-size:28px; font-weight:bold;">🎵 Nieuwe Wekelijkse Discussie</h1>
              <p style="color:#ffffff; opacity:0.9; font-size:16px; margin:10px 0 0 0;">MusicScan Community Forum</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="color:#333333; font-size:18px; margin:0 0 20px 0;">Hallo ${firstName}!</p>
              
              <p style="color:#555555; font-size:16px; line-height:1.6; margin:0 0 25px 0;">
                Er is een nieuwe wekelijkse discussie gestart in het MusicScan forum! Deze week bespreken we:
              </p>

              <!-- Album Info Card -->
              <div style="background:#f8f9fa; border-left:4px solid #1DB954; padding:20px; margin:25px 0; border-radius:4px;">
                <h2 style="color:#1DB954; margin:0 0 10px 0; font-size:20px;">${topicTitle}</h2>
                ${artistName && albumTitle ? `<p style="color:#666; margin:0 0 15px 0; font-size:16px;"><strong>${artistName}</strong> - ${albumTitle}</p>` : ''}
                <p style="color:#555555; font-size:15px; line-height:1.5; margin:0;">${topicDescription}</p>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center; margin:35px 0;">
                <a href="https://www.musicscan.app/forum/topic/${topicId}" 
                   style="background:#1DB954; color:#ffffff; text-decoration:none; padding:15px 30px; border-radius:25px; font-size:16px; font-weight:bold; display:inline-block; box-shadow: 0 4px 15px rgba(29, 185, 84, 0.3);">
                  💬 Doe mee met de discussie
                </a>
              </div>

              <p style="color:#555555; font-size:14px; line-height:1.5; margin:25px 0 0 0;">
                Deel je gedachten, herinneringen en muzikale ervaringen met andere muziekliefhebbers. 
                Elke bijdrage maakt onze community rijker!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fa; padding:20px; border-radius: 0 0 8px 8px; border-top:1px solid #eee;">
              <p style="color:#888888; font-size:12px; text-align:center; margin:0;">
                Je ontvangt deze email omdat je lid bent van de MusicScan community.<br>
                <a href="https://www.musicscan.app/forum" style="color:#1DB954; text-decoration:none;">Bezoek het forum</a> • 
                <a href="https://www.musicscan.app" style="color:#1DB954; text-decoration:none;">MusicScan.app</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send emails in batches to avoid rate limits
    const batchSize = 50;
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < emailList.length; i += batchSize) {
      const batch = emailList.slice(i, i + batchSize);
      
      try {
        const emailPromises = batch.map(user => 
          resend.emails.send({
            from: 'MusicScan Community <forum@musicscan.app>',
            to: [user.email!],
            subject: `🎵 Nieuwe discussie: ${topicTitle}`,
            html: createEmailHtml(user.firstName),
          })
        );

        const results = await Promise.allSettled(emailPromises);
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            sentCount++;
            console.log(`✅ Email sent to ${batch[index].email}`);
          } else {
            failedCount++;
            console.error(`❌ Failed to send email to ${batch[index].email}:`, result.reason);
          }
        });

        // Small delay between batches
        if (i + batchSize < emailList.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (batchError) {
        console.error('❌ Batch email error:', batchError);
        failedCount += batch.length;
      }
    }

    console.log(`📊 Email notification complete: ${sentCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        failed: failedCount,
        total: emailList.length 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('❌ Error in send-weekly-discussion-notification:', error);
    
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR'
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);