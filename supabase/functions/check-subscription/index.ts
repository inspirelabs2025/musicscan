import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

async function getUserWithRetry(supabaseClient: any, token: string, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logStep(`Attempting to get user (attempt ${attempt}/${maxRetries})`);
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
      
      if (userError) {
        throw new Error(`Authentication error: ${userError.message}`);
      }
      
      return userData.user;
    } catch (error) {
      lastError = error;
      logStep(`Attempt ${attempt} failed`, { error: error instanceof Error ? error.message : String(error) });
      
      // Don't retry on auth errors, only on network errors
      if (error instanceof Error && !error.message.includes('connection')) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        logStep(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const user = await getUserWithRetry(supabaseClient, token);
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning FREE tier");
      return new Response(JSON.stringify({ 
        subscribed: false, 
        plan_slug: 'free',
        plan_name: 'FREE - Music Explorer'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let planSlug = 'free';
    let planName = 'FREE - Music Explorer';
    let subscriptionEnd = null;
    let stripeProductId = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      stripeProductId = subscription.items.data[0].price.product as string;
      
      // Get plan details from database by Stripe product ID
      const { data: plan } = await supabaseClient
        .from("subscription_plans")
        .select("slug, name")
        .eq("stripe_product_id", stripeProductId)
        .single();

      if (plan) {
        planSlug = plan.slug;
        planName = plan.name;
      }
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        endDate: subscriptionEnd, 
        planSlug, 
        stripeProductId 
      });
    } else {
      logStep("No active subscription found");
    }

    // Update user subscription status in database
    if (hasActiveSub && stripeProductId) {
      const { data: plan } = await supabaseClient
        .from("subscription_plans")
        .select("id")
        .eq("stripe_product_id", stripeProductId)
        .single();

      if (plan) {
        await supabaseClient
          .from("user_subscriptions")
          .upsert({
            user_id: user.id,
            plan_id: plan.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptions.data[0].id,
            status: 'active',
            current_period_start: new Date(subscriptions.data[0].current_period_start * 1000).toISOString(),
            current_period_end: subscriptionEnd,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id, stripe_subscription_id'
          });
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan_slug: planSlug,
      plan_name: planName,
      subscription_end: subscriptionEnd,
      stripe_product_id: stripeProductId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    
    // For auth errors (session missing/expired) or network errors, return 200 with free tier
    // This prevents app crashes and allows graceful handling of logged-out users
    const isGracefulError = errorMessage.includes('Auth session missing') ||
                           errorMessage.includes('session_not_found') ||
                           errorMessage.includes('Invalid Refresh Token') ||
                           errorMessage.includes('connection') || 
                           errorMessage.includes('timeout') ||
                           errorMessage.includes('ECONNRESET');
    
    return new Response(JSON.stringify({ 
      subscribed: false,
      plan_slug: 'free',
      plan_name: 'FREE - Music Explorer'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Always return 200 - free tier is valid for non-authenticated users
    });
  }
});