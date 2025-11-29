import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderEmailRequest {
  order_id: string;
  email_type: 'confirmation' | 'shipped' | 'delivered';
}

interface OrderItem {
  title: string;
  artist: string;
  price: number;
  quantity: number;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-order-email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id, email_type = 'confirmation' }: OrderEmailRequest = await req.json();
    console.log(`Processing ${email_type} email for order: ${order_id}`);

    if (!order_id) {
      throw new Error("order_id is required");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('platform_orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error("Error fetching order:", orderError);
      throw new Error(`Order not found: ${order_id}`);
    }

    console.log(`Found order ${order.order_number} for ${order.customer_email}`);

    // Fetch order items
    const { data: items, error: itemsError } = await supabase
      .from('platform_order_items')
      .select('*')
      .eq('order_id', order_id);

    if (itemsError) {
      console.error("Error fetching order items:", itemsError);
    }

    const orderItems: OrderItem[] = items || [];

    // Generate email content based on type
    let subject: string;
    let htmlContent: string;

    switch (email_type) {
      case 'shipped':
        subject = `Je bestelling ${order.order_number} is verzonden! 📦`;
        htmlContent = generateShippedEmail(order, orderItems);
        break;
      case 'delivered':
        subject = `Je bestelling ${order.order_number} is bezorgd! ✅`;
        htmlContent = generateDeliveredEmail(order, orderItems);
        break;
      default:
        subject = `Bedankt voor je bestelling ${order.order_number}! 🎵`;
        htmlContent = generateConfirmationEmail(order, orderItems);
    }

    // Send email
    const emailResponse = await resend.emails.send({
      from: "MusicScan <noreply@musicscan.app>",
      to: [order.customer_email],
      subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the email
    await supabase.from('email_logs').insert({
      email_type: `order_${email_type}`,
      recipient_email: order.customer_email,
      subject,
      status: 'sent',
      resend_id: emailResponse.data?.id,
      user_id: order.customer_id,
      metadata: { order_id, order_number: order.order_number }
    });

    return new Response(
      JSON.stringify({ success: true, message: "Email sent", resend_id: emailResponse.data?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-order-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

function generateConfirmationEmail(order: any, items: OrderItem[]): string {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong>${item.title}</strong><br>
        <span style="color: #6b7280; font-size: 14px;">${item.artist}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">€${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

  const shippingAddress = order.shipping_address || {};

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎵 MusicScan</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Bedankt voor je bestelling!</p>
        </div>

        <!-- Content -->
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #374151; margin: 0 0 24px 0;">
            Hoi ${order.customer_name || 'muziekliefhebber'},
          </p>
          
          <p style="font-size: 16px; color: #374151; margin: 0 0 24px 0;">
            We hebben je bestelling <strong>${order.order_number}</strong> ontvangen en gaan er direct mee aan de slag!
          </p>

          <!-- Order Items -->
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 16px 0; color: #111827;">Je bestelling</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid #e5e7eb;">
                  <th style="padding: 12px; text-align: left; color: #6b7280; font-weight: 500;">Product</th>
                  <th style="padding: 12px; text-align: center; color: #6b7280; font-weight: 500;">Aantal</th>
                  <th style="padding: 12px; text-align: right; color: #6b7280; font-weight: 500;">Prijs</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #e5e7eb;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6b7280;">Subtotaal:</span>
                <span>€${(order.subtotal || 0).toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6b7280;">Verzendkosten:</span>
                <span>€${(order.shipping_cost || 0).toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #8b5cf6;">
                <span>Totaal:</span>
                <span>€${(order.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <!-- Shipping Address -->
          ${shippingAddress.street ? `
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 12px 0; color: #111827;">Verzendadres</h3>
            <p style="margin: 0; color: #374151; line-height: 1.6;">
              ${shippingAddress.name || order.customer_name}<br>
              ${shippingAddress.street}<br>
              ${shippingAddress.postal_code} ${shippingAddress.city}<br>
              ${shippingAddress.country || 'Nederland'}
            </p>
          </div>
          ` : ''}

          <p style="font-size: 14px; color: #6b7280; margin: 24px 0 0 0;">
            Je ontvangt een email zodra je bestelling verzonden is met track & trace informatie.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            Vragen? Neem contact op via <a href="mailto:support@musicscan.app" style="color: #8b5cf6;">support@musicscan.app</a>
          </p>
          <p style="margin: 12px 0 0 0; color: #9ca3af; font-size: 12px;">
            © ${new Date().getFullYear()} MusicScan - Voor muziekliefhebbers
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateShippedEmail(order: any, items: OrderItem[]): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📦 Je pakket is onderweg!</h1>
        </div>

        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #374151; margin: 0 0 24px 0;">
            Hoi ${order.customer_name || 'muziekliefhebber'},
          </p>
          
          <p style="font-size: 16px; color: #374151; margin: 0 0 24px 0;">
            Goed nieuws! Je bestelling <strong>${order.order_number}</strong> is verzonden en komt snel jouw kant op.
          </p>

          ${order.tracking_number ? `
          <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
            <p style="margin: 0 0 8px 0; color: #065f46; font-weight: 500;">Track & Trace</p>
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #047857;">${order.tracking_number}</p>
            ${order.carrier ? `<p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">Vervoerder: ${order.carrier}</p>` : ''}
          </div>
          ` : ''}

          <p style="font-size: 14px; color: #6b7280;">
            Verwachte levertijd: 1-3 werkdagen binnen Nederland
          </p>
        </div>

        <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            © ${new Date().getFullYear()} MusicScan
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateDeliveredEmail(order: any, items: OrderItem[]): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✅ Bezorgd!</h1>
        </div>

        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #374151; margin: 0 0 24px 0;">
            Hoi ${order.customer_name || 'muziekliefhebber'},
          </p>
          
          <p style="font-size: 16px; color: #374151; margin: 0 0 24px 0;">
            Je bestelling <strong>${order.order_number}</strong> is bezorgd. Veel plezier met je nieuwe muziekaankoop! 🎵
          </p>

          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
            <p style="margin: 0 0 12px 0; color: #374151;">Tevreden met je aankoop?</p>
            <a href="https://www.musicscan.app/shop" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500;">
              Bekijk meer in onze shop
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280; text-align: center;">
            Deel je aankoop op social media met #MusicScan 📸
          </p>
        </div>

        <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            © ${new Date().getFullYear()} MusicScan
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(handler);
