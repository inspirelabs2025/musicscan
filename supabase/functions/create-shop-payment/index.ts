import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    // Parse request body
    const { items, shippingAddress, buyerName } = await req.json();
    
    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("No items provided");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Calculate total amount
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      console.log(`Processing item ${item.id} of type ${item.type}`);
      
      let itemData, tableName;
      
      if (item.type === 'product') {
        // Try platform_products first (for metal prints & posters)
        let { data, error } = await supabaseClient
          .from("platform_products")
          .select("*")
          .eq("id", item.id)
          .single();
        
        let isPlatformProduct = !error && data;
        
        // Fallback to shop_products for backwards compatibility
        if (error || !data) {
          const shopResult = await supabaseClient
            .from("shop_products")
            .select("*")
            .eq("id", item.id)
            .single();
          
          if (!shopResult.error && shopResult.data) {
            data = shopResult.data;
            error = null;
            isPlatformProduct = false;
          }
        }
        
        if (error || !data) {
          throw new Error(`Product not found: ${item.id}`);
        }
        
        itemData = data;
        tableName = isPlatformProduct ? 'platform_products' : 'shop_products';
      } else {
        // Handle CD/Vinyl items
        tableName = item.type === 'cd' ? 'cd_scan' : 'vinyl2_scan';
        
        const { data, error } = await supabaseClient
          .from(tableName)
          .select('*')
          .eq('id', item.id)
          .eq('is_for_sale', true)
          .is('sold_at', null)
          .single();
          
        if (error || !data) {
          throw new Error(`Item ${item.id} not found or no longer available`);
        }
        
        itemData = data;
      }

      // Calculate price based on table type
      const itemPrice = item.type === 'product' 
        ? (itemData.price || 0) // Both platform_products and shop_products use 'price'
        : (itemData.marketplace_price || itemData.calculated_advice_price || 0);
      
      const shippingCost = item.type === 'product' 
        ? (itemData.shipping_cost || 5) // Default to 5 if not set
        : 5; // Default shipping for albums
      
      totalAmount += itemPrice + shippingCost;
      
      orderItems.push({
        item_id: item.id,
        item_type: item.type,
        price: itemPrice + shippingCost,
        quantity: 1,
        item_data: itemData
      });
    }

    // Get seller info (assuming all items are from the same seller for now)
    const sellerId = orderItems[0].item_type === 'product' 
      ? orderItems[0].item_data.admin_user_id 
      : orderItems[0].item_data.user_id;

    // Check if Stripe customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create order in database
    const { data: order, error: orderError } = await supabaseClient
      .from('shop_orders')
      .insert({
        buyer_id: user.id,
        seller_id: sellerId,
        total_amount: totalAmount,
        currency: 'EUR',
        buyer_email: user.email,
        buyer_name: buyerName || user.email,
        shipping_address: shippingAddress
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const itemsToInsert = orderItems.map(item => ({
      ...item,
      order_id: order.id
    }));

    const { error: itemsError } = await supabaseClient
      .from('shop_order_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    // Create Stripe checkout session
    const lineItems = orderItems.map(item => {
      // Handle naming for different product types
      let itemName;
      if (item.item_type === 'product') {
        // Platform products have title/artist, shop_products have name
        if (item.item_data.title && item.item_data.artist) {
          itemName = `${item.item_data.artist} - ${item.item_data.title}`;
        } else {
          itemName = item.item_data.name || item.item_data.title || 'Product';
        }
      } else {
        itemName = `${item.item_data.artist || 'Unknown'} - ${item.item_data.title || 'Unknown'}`;
      }
      
      const itemDescription = item.item_type === 'product'
        ? item.item_data.description || 'Shop product'
        : `${item.item_data.format || 'Album'} - ${item.item_data.condition_grade || 'Good'}`;
      
      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: itemName,
            description: itemDescription,
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: 1,
      };
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/shop/order-success?order_id=${order.id}`,
      cancel_url: `${req.headers.get("origin")}/shop/${orderItems[0].item_data.user_id}`,
      metadata: {
        order_id: order.id,
        buyer_id: user.id,
      },
    });

    // Update order with stripe payment intent
    await supabaseClient
      .from('shop_orders')
      .update({ stripe_payment_intent_id: session.payment_intent as string })
      .eq('id', order.id);

    return new Response(JSON.stringify({ url: session.url, order_id: order.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in create-shop-payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});