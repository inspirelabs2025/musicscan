import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SeedPhoto {
  artist: string;
  caption: string;
  year: number;
  city: string;
  country: string;
  venue?: string;
  format: 'concert' | 'vinyl' | 'cd' | 'poster' | 'cassette';
  tags: string[];
}

const seedData: SeedPhoto[] = [
  {
    artist: "David Bowie",
    caption: "Ziggy Stardust era concert poster",
    year: 1973,
    city: "Amsterdam",
    country: "Netherlands",
    venue: "Concertgebouw",
    format: "poster",
    tags: ["glam-rock", "70s", "classic-rock", "legendary"]
  },
  {
    artist: "Pink Floyd",
    caption: "The Dark Side of the Moon vinyl eerste persing",
    year: 1973,
    city: "Rotterdam",
    country: "Netherlands",
    format: "vinyl",
    tags: ["progressive-rock", "psychedelic", "70s", "concept-album"]
  },
  {
    artist: "Nirvana",
    caption: "Nevermind tour live in Paradiso",
    year: 1991,
    city: "Amsterdam",
    country: "Netherlands",
    venue: "Paradiso",
    format: "concert",
    tags: ["grunge", "90s", "alternative-rock", "kurt-cobain"]
  },
  {
    artist: "The Beatles",
    caption: "Abbey Road originele Nederlandse persing",
    year: 1969,
    city: "Utrecht",
    country: "Netherlands",
    format: "vinyl",
    tags: ["60s", "british-invasion", "classic-rock", "iconic"]
  },
  {
    artist: "Metallica",
    caption: "Master of Puppets cassette",
    year: 1986,
    city: "Eindhoven",
    country: "Netherlands",
    format: "cassette",
    tags: ["metal", "thrash", "80s", "heavy"]
  },
  {
    artist: "Madonna",
    caption: "Like a Virgin tour poster",
    year: 1985,
    city: "Amsterdam",
    country: "Netherlands",
    venue: "Ahoy Rotterdam",
    format: "poster",
    tags: ["pop", "80s", "icon", "tour"]
  },
  {
    artist: "Prince",
    caption: "Purple Rain vinyl met originele sleeve",
    year: 1984,
    city: "Den Haag",
    country: "Netherlands",
    format: "vinyl",
    tags: ["funk", "80s", "pop", "legendary"]
  },
  {
    artist: "Queen",
    caption: "Live at Ahoy Rotterdam concert",
    year: 1984,
    city: "Rotterdam",
    country: "Netherlands",
    venue: "Ahoy",
    format: "concert",
    tags: ["rock", "80s", "freddie-mercury", "live"]
  },
  {
    artist: "Radiohead",
    caption: "OK Computer CD eerste editie",
    year: 1997,
    city: "Nijmegen",
    country: "Netherlands",
    format: "cd",
    tags: ["alternative", "90s", "art-rock", "experimental"]
  },
  {
    artist: "Led Zeppelin",
    caption: "Physical Graffiti dubbel vinyl",
    year: 1975,
    city: "Amsterdam",
    country: "Netherlands",
    format: "vinyl",
    tags: ["rock", "70s", "hard-rock", "classic"]
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🎨 Starting FanWall seed data generation...');

    const results = [];

    for (const seed of seedData) {
      try {
        console.log(`Generating image for ${seed.artist} - ${seed.caption}`);

        // Generate image using Lovable AI
        const imagePrompt = `Create a realistic vintage ${seed.format} image: ${seed.caption} by ${seed.artist} from ${seed.year}. 
        Style: authentic ${seed.format === 'vinyl' ? 'album cover' : seed.format === 'poster' ? 'concert poster' : seed.format === 'cassette' ? 'cassette tape case' : seed.format === 'cd' ? 'CD cover' : 'concert photograph'} from the ${seed.year}s era. 
        Include period-appropriate design elements, typography, and aesthetics. High quality, detailed, nostalgic feel.`;

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image-preview',
            messages: [
              {
                role: 'user',
                content: imagePrompt
              }
            ],
            modalities: ['image', 'text']
          })
        });

        if (!aiResponse.ok) {
          throw new Error(`AI generation failed: ${aiResponse.statusText}`);
        }

        const aiData = await aiResponse.json();
        const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageUrl) {
          throw new Error('No image generated');
        }

        // Convert base64 to blob
        const base64Data = imageUrl.split(',')[1];
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Upload to Supabase storage
        const fileName = `seed-${seed.artist.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('fanwall-photos')
          .upload(fileName, binaryData, {
            contentType: 'image/png',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('fanwall-photos')
          .getPublicUrl(fileName);

        // Generate SEO data
        const slug = `${seed.artist.toLowerCase().replace(/\s+/g, '-')}-${seed.year}-${Date.now()}`;
        const seoTitle = `${seed.artist} - ${seed.caption} (${seed.year})`;
        const seoDescription = `${seed.caption} by ${seed.artist} from ${seed.year}. ${seed.venue ? `Live at ${seed.venue}, ` : ''}${seed.city}, ${seed.country}.`;

        // Insert photo record
        const { data: photoData, error: insertError } = await supabase
          .from('photos')
          .insert({
            display_url: publicUrl,
            artist: seed.artist,
            caption: seed.caption,
            year: seed.year,
            city: seed.city,
            country: seed.country,
            venue: seed.venue,
            format: seed.format,
            tags: seed.tags,
            seo_slug: slug,
            seo_title: seoTitle,
            seo_description: seoDescription,
            canonical_url: `https://www.musicscan.app/photo/${slug}`,
            status: 'published',
            published_at: new Date().toISOString(),
            user_id: '00000000-0000-0000-0000-000000000000' // System user
          })
          .select()
          .single();

        if (insertError) throw insertError;

        results.push({
          success: true,
          artist: seed.artist,
          photo_id: photoData.id,
          url: publicUrl
        });

        console.log(`✅ Created photo for ${seed.artist}`);

      } catch (error) {
        console.error(`❌ Failed to create photo for ${seed.artist}:`, error);
        results.push({
          success: false,
          artist: seed.artist,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`🎉 Seed generation complete: ${successCount}/${seedData.length} photos created`);

    return new Response(
      JSON.stringify({
        success: true,
        total: seedData.length,
        created: successCount,
        failed: seedData.length - successCount,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-fanwall-seed:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
