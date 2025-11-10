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
    const { 
      items, 
      shippingAddress, 
      buyerName, 
      buyerEmail 
    } = await req.json();

    if (!items || items.length === 0) {
      throw new Error("No items provided");
    }

    if (!buyerEmail || !buyerName) {
      throw new Error("Buyer email and name are required for guest checkout");
    }

    // Initialize Supabase (service role key for server-side operations)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    let totalAmount = 0;
    const orderItems = [];

    // Process each item
    for (const item of items) {
      let itemData;
      let tableName;
      
      // Fetch item details based on media type
      if (item.media_type === 'cd') {
        const { data, error } = await supabase
          .from('cd_scan')
          .select('*')
          .eq('id', item.id)
          .single();
        
        if (error) throw new Error(`CD not found: ${error.message}`);
        itemData = data;
        tableName = 'cd_scan';
      } else if (item.media_type === 'vinyl') {
        const { data, error } = await supabase
          .from('vinyl2_scan')
          .select('*')
          .eq('id', item.id)
          .single();
        
        if (error) throw new Error(`Vinyl not found: ${error.message}`);
        itemData = data;
        tableName = 'vinyl2_scan';
      } else if (item.media_type === 'product') {
        // Try platform_products first
        const { data: platformData, error: platformError } = await supabase
          .from('platform_products')
          .select('*')
          .eq('id', item.id)
          .single();
        
        if (platformData) {
          itemData = {
            artist: platformData.artist || 'Unknown Artist',
            title: platformData.title,
            catalog_number: platformData.sku || '',
            condition_grade: item.selected_style || 'N/A',
            marketplace_price: platformData.price,
            is_for_sale: platformData.status === 'active' && platformData.stock_quantity > 0,
            catalog_image: platformData.primary_image,
            user_id: null
          };
          tableName = 'platform_products';
        } else {
          // Try shop_products
          const { data: shopData, error: shopError } = await supabase
            .from('shop_products')
            .select('*')
            .eq('id', item.id)
            .single();
          
          if (shopError) throw new Error(`Product not found: ${shopError.message}`);
          itemData = {
            artist: shopData.artist || 'Product',
            title: shopData.name,
            catalog_number: shopData.sku || '',
            condition_grade: item.selected_style || shopData.condition || 'N/A',
            marketplace_price: shopData.price,
            is_for_sale: shopData.is_available,
            catalog_image: shopData.image_url,
            user_id: shopData.seller_id
          };
          tableName = 'shop_products';
        }
      } else if (item.media_type === 'art') {
        const { data, error } = await supabase
          .from('art_pieces')
          .select('*')
          .eq('id', item.id)
          .single();
        
        if (error) throw new Error(`Art piece not found: ${error.message}`);
        itemData = {
          artist: data.artist_name || 'Unknown Artist',
          title: data.title,
          catalog_number: '',
          condition_grade: 'Original',
          marketplace_price: data.price,
          is_for_sale: data.is_for_sale,
          catalog_image: data.image_url,
          user_id: data.user_id
        };
        tableName = 'art_pieces';
      } else {
        throw new Error(`Unsupported media type: ${item.media_type}`);
      }

      if (!itemData.is_for_sale || !itemData.marketplace_price) {
        throw new Error(`Item ${itemData.artist} - ${itemData.title} is not for sale`);
      }

      const price = parseFloat(itemData.marketplace_price);
      totalAmount += price;

      orderItems.push({
        item_id: item.id,
        item_type: item.media_type,
        price: price,
        quantity: 1,
        item_data: {
          artist: itemData.artist,
          title: itemData.title,
          catalog_number: itemData.catalog_number,
          condition_grade: itemData.condition_grade,
          image: itemData.catalog_image || itemData.front_image
        }
      });
    }

    // Create order record
    const { data: order, error: orderError } = await supabase
      .from('shop_orders')
      .insert({
        buyer_id: null, // Guest order
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        seller_id: orderItems[0]?.item_data ? 
          (await supabase.from(orderItems[0].item_type === 'cd' ? 'cd_scan' : 'vinyl2_scan')
            .select('user_id').eq('id', orderItems[0].item_id).single()).data?.user_id : null,
        total_amount: totalAmount,
        currency: 'EUR',
        status: 'pending',
        payment_status: 'pending',
        shipping_address: shippingAddress
      })
      .select()
      .single();

    if (orderError) throw new Error(`Failed to create order: ${orderError.message}`);

    // Create order items
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id
    }));

    const { error: itemsError } = await supabase
      .from('shop_order_items')
      .insert(orderItemsWithOrderId);

    if (itemsError) throw new Error(`Failed to create order items: ${itemsError.message}`);

    // Check if Stripe customer exists
    const customers = await stripe.customers.list({ 
      email: buyerEmail, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : buyerEmail,
      line_items: orderItems.map(item => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${item.item_data.artist} - ${item.item_data.title}`,
            description: `${item.item_type.toUpperCase()} - ${item.item_data.condition_grade}`,
            images: item.item_data.image ? [item.item_data.image] : undefined,
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${req.headers.get("origin")}/order-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${req.headers.get("origin")}/shop`,
      metadata: {
        order_id: order.id,
        buyer_email: buyerEmail,
        is_guest: 'true'
      }
    });

    // Update order with Stripe session ID
    await supabase
      .from('shop_orders')
      .update({ stripe_payment_intent_id: session.id })
      .eq('id', order.id);

    return new Response(JSON.stringify({ 
      url: session.url,
      order_id: order.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Guest checkout error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});