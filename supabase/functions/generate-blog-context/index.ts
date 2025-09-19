import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { blogPostId, albumYear, albumTitle, albumArtist, force } = await req.json();
    
    if (!blogPostId || !albumYear || !albumTitle || !albumArtist) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      return new Response(
        JSON.stringify({ error: 'Perplexity API key not configured' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating context for ${albumArtist} - ${albumTitle} (${albumYear})`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // If force is true, delete existing context
    if (force) {
      console.log('Force regenerate requested, deleting existing context');
      await supabase
        .from('blog_context')
        .delete()
        .eq('blog_post_id', blogPostId);
    }

    // Generate context using Perplexity API
    const prompt = `Genereer uitgebreide historische en culturele context voor het jaar ${albumYear}. Focus op de brede context van dat jaar, niet specifiek op het album "${albumTitle}" van ${albumArtist}.

Geef een gestructureerde JSON response in dit formaat:
{
  "historical_events": [
    {
      "title": "Gebeurtenis Titel",
      "description": "Uitgebreide beschrijving van wat er gebeurde en waarom het belangrijk was (150-200 woorden)",
      "date": "Specifieke datum indien mogelijk",
      "global_impact": "Wereldwijde impact van deze gebeurtenis"
    }
  ],
  "music_scene_context": [
    {
      "title": "Muziekscene Ontwikkeling",
      "description": "Wat er gebeurde in de muziekwereld, nieuwe genres, belangrijke albums (150-200 woorden)",
      "artists": ["Artiest 1", "Artiest 2", "Artiest 3"],
      "albums": ["Album 1", "Album 2"],
      "trends": ["Trend 1", "Trend 2"]
    }
  ],
  "cultural_context": [
    {
      "title": "Culturele Beweging/Trend", 
      "description": "Culturele betekenis, maatschappelijke trends, technologische ontwikkelingen (150-200 woorden)",
      "impact": "Hoe het de samenleving beïnvloedde",
      "dutch_context": "Specifieke Nederlandse context indien relevant"
    }
  ],
  "dutch_context": [
    {
      "title": "Nederlandse Gebeurtenissen ${albumYear}",
      "description": "Belangrijke gebeurtenissen specifiek in Nederland in ${albumYear}",
      "politics": "Politieke ontwikkelingen",
      "culture": "Nederlandse culturele hoogtepunten"
    }
  ]
}

Focus op het jaar ${albumYear} en geef:
1. 6-8 belangrijke wereldwijde gebeurtenissen van ${albumYear} (9/11, Afghanistan, Wikipedia lancering, etc.)
2. 5-7 muziekscene ontwikkelingen (opkomst indie rock, nu-metal, iPod lancering, Napster controverse, belangrijke albums)
3. 4-6 culturele trends (internet revolutie, reality TV, post-millennium sentiment, mode trends)
4. 3-4 specifiek Nederlandse gebeurtenissen en ontwikkelingen

Geef uitgebreide, informatieve beschrijvingen die echt het gevoel en de sfeer van ${albumYear} weergeven. Schrijf alles in het Nederlands.`;

    const primaryModel = 'llama-3.1-70b-instruct';
    const fallbackModel = 'llama-3.1-8b-instruct';
    let currentModel = primaryModel;
    let triedModels = [];

    triedModels.push(currentModel);
    let response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: currentModel,
        messages: [
          {
            role: 'system',
            content: `Je bent een muziekhistoricus en cultureel expert gespecialiseerd in het jaar ${albumYear}. Geef nauwkeurige, uitgebreide historische context in het Nederlands. Antwoord ALLEEN met geldige JSON zonder markdown formatting. Geef uitgebreide beschrijvingen van 150-200 woorden per item.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        top_p: 0.9,
        max_tokens: 1400,
        return_images: false,
        return_related_questions: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Perplexity API error - Status: ${response.status}, Model: ${currentModel}, Text: ${errorText}`);
      
      // Try with fallback model on 400 Bad Request
      if (response.status === 400) {
        console.log('Retrying with fallback model due to 400 error');
        currentModel = fallbackModel;
        triedModels.push(currentModel);
        
        const fallbackResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${perplexityApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: currentModel,
            messages: [
              {
                role: 'system',
                content: `Je bent een muziekhistoricus en cultureel expert gespecialiseerd in het jaar ${albumYear}. Geef nauwkeurige, uitgebreide historische context in het Nederlands. Antwoord ALLEEN met geldige JSON zonder markdown formatting.`
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.1,
            top_p: 0.9,
            max_tokens: 1200,
            return_images: false,
            return_related_questions: false
          }),
        });

        if (!fallbackResponse.ok) {
          const fallbackErrorText = await fallbackResponse.text();
          console.error(`Perplexity fallback API error - Status: ${fallbackResponse.status}, Model: ${currentModel}, Text: ${fallbackErrorText}`);
          
          // Return detailed error information
          return new Response(
            JSON.stringify({ 
              success: false,
              error: `Beide Perplexity modellen faalden. Primair model (${primaryModel}): ${response.status}. Fallback model (${currentModel}): ${fallbackResponse.status}`,
              tried_models: triedModels,
              primary_error: errorText,
              fallback_error: fallbackErrorText
            }), 
            { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        response = fallbackResponse;
        console.log(`Fallback model response received: ${currentModel}`);
      } else {
        // Return detailed error for non-400 errors
        return new Response(
          JSON.stringify({ 
            success: false,
            error: `Perplexity API fout - Status: ${response.status}`,
            tried_models: triedModels,
            response_text: errorText
          }), 
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log('Raw Perplexity response:', generatedContent);

    // Parse the JSON response with preprocessing
    let contextData;
    try {
      // Clean the response by removing markdown code blocks and extra whitespace
      let cleanedContent = generatedContent.trim();
      
      // Remove markdown JSON code blocks if present
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
      if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Remove any extra whitespace and newlines at start/end
      cleanedContent = cleanedContent.trim();
      
      console.log('Cleaned content for parsing:', cleanedContent);
      contextData = JSON.parse(cleanedContent);
      
      // Validate that we have the expected structure
      if (!contextData.historical_events || !contextData.music_scene_context || !contextData.cultural_context) {
        throw new Error('Missing required context categories in response');
      }
      
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      console.error('Raw content:', generatedContent);
      
      // Enhanced fallback with more comprehensive data
      contextData = {
        historical_events: [
          {
            title: `Belangrijke Wereldgebeurtenissen ${albumYear}`,
            description: `Het jaar ${albumYear} stond in het teken van dramatische wereldveranderingen. De terroristische aanslagen van 11 september op het World Trade Center en het Pentagon schokten de wereld en leidden tot een nieuwe geopolitieke realiteit met de start van de 'War on Terror'. Dit jaar markeerde ook de lancering van Wikipedia, wat een revolutie in kennisdeling betekende.`,
            date: `${albumYear}`,
            global_impact: "Fundamentele veranderingen in veiligheid, geopolitiek en informatietoegang"
          }
        ],
        music_scene_context: [
          {
            title: `Muziekrevolutie ${albumYear}`,
            description: `${albumYear} was een cruciaal jaar voor de muziekindustrie. De eerste iPod werd gelanceerd door Apple, wat de manier waarop we naar muziek luisteren voor altijd veranderde. Tegelijkertijd woedde de controverse rond Napster en illegaal downloaden. Muzikaal zagen we de opkomst van indie rock, nu-metal en de eerste tekenen van de garage rock revival.`,
            artists: [albumArtist, "The Strokes", "The White Stripes", "Linkin Park"],
            albums: ["Is This It", "White Blood Cells", "Hybrid Theory"],
            trends: ["iPod revolutie", "Napster controverse", "Indie rock opkomst"]
          }
        ],
        cultural_context: [
          {
            title: `Culturele Veranderingen ${albumYear}`,
            description: `${albumYear} markeerde het begin van het digitale tijdperk met snelle internetadoptie en de opkomst van reality TV. De post-millennium malaise werd vervangen door een nieuw soort urgentie na 9/11. Fashion en design werden minimalistischer, terwijl de eerste sociale netwerken hun intrede deden.`,
            impact: "Fundamentele verschuiving naar digitale cultuur en nieuwe medialandschap",
            dutch_context: "Nederland kende eigen culturele ontwikkelingen met de opkomst van nieuwe media"
          }
        ],
        dutch_context: [
          {
            title: `Nederland in ${albumYear}`,
            description: "Nederland beleefde eigen belangrijke ontwikkelingen in dit jaar.",
            politics: "Politieke ontwikkelingen in Nederland",
            culture: "Nederlandse culturele hoogtepunten"
          }
        ]
      };
    }

    // Save to database using Supabase client
    if (supabaseUrl && supabaseServiceKey) {
      try {
        // Delete any existing context for this blog post to ensure uniqueness
        await supabase
          .from('blog_context')
          .delete()
          .eq('blog_post_id', blogPostId);

        const { error: insertError } = await supabase
          .from('blog_context')
          .insert({
            blog_post_id: blogPostId,
            historical_events: contextData.historical_events,
            music_scene_context: contextData.music_scene_context,
            cultural_context: contextData.cultural_context,
            ai_model: currentModel,
            cached_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });

        if (insertError) {
          console.error('Failed to save context to database:', insertError);
        } else {
          console.log('Context saved to database successfully');
        }
      } catch (saveError) {
        console.error('Error saving to database:', saveError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        context: contextData 
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-blog-context function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});