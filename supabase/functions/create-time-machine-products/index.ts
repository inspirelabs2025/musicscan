import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { eventId, styleVariants } = await req.json();

    console.log('📦 Creating Time Machine products for event:', eventId);

    // Fetch the event details
    const { data: event, error: eventError } = await supabase
      .from('time_machine_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new Error(`Event not found: ${eventError?.message}`);
    }

    // Determine which poster to use based on poster_source
    const posterImageUrl = event.poster_source === 'original' 
      ? (event.original_poster_url || event.poster_image_url) 
      : event.poster_image_url;

    if (!posterImageUrl) {
      throw new Error('Event must have a poster (AI or original) to create products');
    }

    console.log(`Using ${event.poster_source === 'original' ? 'original' : 'AI'} poster:`, posterImageUrl);

    const products = [];

    // Generate slug helper
    const generateSlug = (base: string, suffix: string) => {
      const cleaned = base
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 60);
      return `${cleaned}-${suffix}`;
    };

    const baseSlug = `${event.artist_name}-${event.venue_city}-${new Date(event.concert_date).getFullYear()}`;

    // 1. Fine Art Print Product
    const fineArtSlug = generateSlug(baseSlug, 'fine-art-print');
    const fineArtTitle = `${event.artist_name} – ${event.venue_name} '${new Date(event.concert_date).getFullYear()} | Fine Art Print`;
    
    const fineArtDescription = `
# Time Machine Fine Art Print

Breng de magie van **${event.artist_name}** op ${new Date(event.concert_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })} in **${event.venue_name}, ${event.venue_city}** naar je muur.

## Specificaties
- **Materiaal**: Hahnemühle Photo Rag 308gsm
- **Afmetingen**: 50×70 cm
- **Techniek**: Giclée print met 12-kleuren inkjet
- **Extra**: Unieke QR-code die linkt naar het volledige Time Machine verhaal
- **Editie**: Genummerd, limited edition van ${event.edition_size || 100} exemplaren
- **Certificaat**: Met hologram authenticiteits-label

${event.historical_context || ''}

## Over Time Machine
Elk Time Machine poster vertelt het verhaal van een iconisch concert. Scan de QR-code om het volledige verhaal, setlist, archief foto's en fan herinneringen te ontdekken.
    `.trim();

    const { data: fineArt, error: fineArtError } = await supabase
      .from('platform_products')
      .insert({
        title: fineArtTitle,
        slug: fineArtSlug,
        artist: event.artist_name,
        description: fineArtDescription,
        price: event.price_poster || 39.95,
        primary_image: posterImageUrl,
        media_type: 'poster',
        categories: ['time-machine', 'fine-art-print', 'concert-posters'],
        stock_quantity: event.edition_size || 100,
        status: 'active',
        published_at: new Date().toISOString(),
        images: [posterImageUrl]
      })
      .select()
      .single();

    if (fineArtError) {
      console.error('❌ Error creating Fine Art product:', fineArtError);
      throw fineArtError;
    }

    products.push(fineArt);
    console.log('✅ Created Fine Art Print product:', fineArt.id);

    // 2. Metal Print Deluxe Product
    const metalSlug = generateSlug(baseSlug, 'metal-print-deluxe');
    const metalTitle = `${event.artist_name} – ${event.venue_name} '${new Date(event.concert_date).getFullYear()} | Metal Print Deluxe`;
    
    const metalDescription = `
# Time Machine Metal Print Deluxe

De ultieme **premium editie** van ${event.artist_name}'s legendarische concert op ${new Date(event.concert_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })} in **${event.venue_name}, ${event.venue_city}**.

## Specificaties
- **Materiaal**: Geborsteld aluminium Dibond 3mm
- **Afmetingen**: 40×60 cm  
- **Finish**: Subtiel paars reflectie-effect
- **Techniek**: Direct UV print op metaal
- **Montage**: Kant-en-klaar op te hangen met verborgen ophangsysteem
- **Extra**: Unieke QR-code die linkt naar het volledige Time Machine verhaal
- **Editie**: Genummerd, limited edition van 100 exemplaren
- **Certificaat**: Met hologram authenticiteits-label + luxe verpakking

${event.historical_context || ''}

## Waarom Metal Print?
- **Museum kwaliteit**: Diepere kleuren en scherpere details dan papier
- **Duurzaam**: Watervast, UV-bestendig, decennia lang mooi
- **Modern**: Het geborstelde aluminium geeft een unieke premium uitstraling
- **Exclusief**: Slechts 100 exemplaren wereldwijd

## Over Time Machine
Elk Time Machine poster vertelt het verhaal van een iconisch concert. Scan de QR-code om het volledige verhaal, setlist, archief foto's en fan herinneringen te ontdekken.
    `.trim();

    const { data: metal, error: metalError } = await supabase
      .from('platform_products')
      .insert({
        title: metalTitle,
        slug: metalSlug,
        artist: event.artist_name,
        description: metalDescription,
        price: event.price_metal || 79.95,
        primary_image: event.metal_print_image_url || posterImageUrl,
        media_type: 'metal-print',
        categories: ['time-machine', 'metal-print', 'premium', 'concert-posters'],
        stock_quantity: 100,
        status: 'active',
        published_at: new Date().toISOString(),
        images: [event.metal_print_image_url || posterImageUrl]
      })
      .select()
      .single();

    if (metalError) {
      console.error('❌ Error creating Metal Print product:', metalError);
      throw metalError;
    }

    products.push(metal);
    console.log('✅ Created Metal Print Deluxe product:', metal.id);

    // Update event with product IDs
    const { error: updateError } = await supabase
      .from('time_machine_events')
      .update({
        metadata: {
          ...event.metadata,
          product_ids: {
            fine_art_print: fineArt.id,
            metal_print_deluxe: metal.id,
          }
        }
      })
      .eq('id', eventId);

    if (updateError) {
      console.warn('⚠️ Could not update event with product IDs:', updateError);
    }

    console.log('🎉 Successfully created', products.length, 'Time Machine products');

    return new Response(
      JSON.stringify({
        success: true,
        products: products,
        event_id: eventId,
        message: `Created ${products.length} products for Time Machine event`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error in create-time-machine-products:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
