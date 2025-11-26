import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { blogPostId, artist, title, genre, year, format } = await req.json();

    // Generate long-tail keywords using AI
    const prompt = `Genereer 8-12 specifieke, long-tail SEO trefwoorden voor deze muziek content:

Artiest: ${artist || 'Onbekend'}
Album/Titel: ${title || 'Onbekend'}
Genre: ${genre || 'Onbekend'}
Jaar: ${year || 'Onbekend'}
Format: ${format || 'vinyl/cd'}

Voorbeelden van gewenste long-tail trefwoorden:
- "beste Motown albums vinyl"
- "zeldzame Prince platen herkennen"
- "jaren 80 Nederlandse pop vinyl waarde"
- "first pressing Beatles vinyl herkennen"
- "limited edition jazz vinyl kopen"

Focus op:
1. Specifieke combinaties van genre + format + jaartal
2. Verzamelaar vragen ("herkennen", "waarde bepalen", "first pressing")
3. Nederlandse zoektermen voor lokale SEO
4. Niche subcategorieën en stijlen
5. Verwante artiesten en bewegingen

Geef ALLEEN de trefwoorden terug, gescheiden door komma's, zonder uitleg.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Je bent een SEO expert die long-tail trefwoorden genereert voor Nederlandse muziek content. Geef alleen de trefwoorden, gescheiden door komma\'s.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const keywordsText = data.choices[0].message.content;
    
    // Parse keywords and clean them up
    const keywords = keywordsText
      .split(',')
      .map((k: string) => k.trim().toLowerCase())
      .filter((k: string) => k.length > 3 && k.length < 80);

    // Update blog post with keywords if blogPostId provided
    if (blogPostId) {
      const { error: updateError } = await supabaseClient
        .from('blog_posts')
        .update({ 
          yaml_frontmatter: supabaseClient.rpc('jsonb_set', {
            target: 'yaml_frontmatter',
            path: '{seo_keywords}',
            new_value: JSON.stringify(keywords)
          })
        })
        .eq('id', blogPostId);

      if (updateError) {
        console.error('Error updating blog post:', updateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        keywords,
        count: keywords.length,
        generated_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error generating keywords:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
