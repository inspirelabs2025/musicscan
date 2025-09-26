import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to clean JSON from markdown code blocks
function cleanJsonFromMarkdown(content: string): string {
  // Remove markdown code blocks
  let cleaned = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
  // Remove any remaining backticks
  cleaned = cleaned.replace(/`/g, '');
  // Trim whitespace
  return cleaned.trim();
}

// Get or create system user for auto-generated content
async function getSystemUserId(): Promise<string> {
  try {
    // Try to find existing system user
    const { data: systemUser } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('first_name', 'System')
      .limit(1)
      .single();
    
    if (systemUser) {
      return systemUser.user_id;
    }
    
    // If no system user found, use the first admin or any user
    const { data: firstUser } = await supabase
      .from('profiles')
      .select('user_id')
      .limit(1)
      .single();
    
    return firstUser?.user_id || '00000000-0000-0000-0000-000000000000';
  } catch (error) {
    console.error('Error getting system user ID:', error);
    return '00000000-0000-0000-0000-000000000000';
  }
}

// Fallback discussion content
const getFallbackContent = (artist: string, title: string) => ({
  title: `Discussie: "${title}" van ${artist}`,
  description: `Laten we praten over "${title}" van ${artist}! 

Dit album verdient onze aandacht. Wat vind jij van dit werk? 

🎵 Wat is je favoriete track?
🎨 Hoe vind je de productie?
📀 Heb je dit album in je collectie?
💭 Welke herinneringen roept het op?

Deel je gedachten en laten we een interessante discussie beginnen!`
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting weekly forum discussion generation...');
    
    // Get system user ID
    const systemUserId = await getSystemUserId();
    console.log('Using system user ID:', systemUserId);
    
    // Get a random album from the database
    const { data: randomAlbum, error: albumError } = await supabase
      .from('unified_scans')
      .select('artist, title, discogs_id')
      .not('artist', 'is', null)
      .not('title', 'is', null)
      .limit(1)
      .order('created_at', { ascending: false });

    if (albumError) {
      console.error('Error fetching random album:', albumError);
      throw albumError;
    }

    const album = randomAlbum?.[0];
    if (!album) {
      console.log('No albums found in database');
      throw new Error('No albums found in database');
    }

    console.log(`Selected album: ${album.artist} - ${album.title}`);

    let discussionContent;
    
    // Try to generate content with OpenAI
    if (openAIApiKey) {
      try {
        console.log('Attempting to generate content with OpenAI...');
        
        // Improved prompt with explicit JSON instructions
        const discussionPrompt = `Je bent een muziekexpert die elke week een interessante discussie start over een album voor een Nederlandse muziekforum. 

Album: "${album.title}" door ${album.artist}

Creëer een boeiende discussie met:
1. Een korte, pakkende titel (max 80 karakters)
2. Een interessante beschrijving die mensen uitnodigt om te reageren (max 300 woorden)

De beschrijving moet:
- Interessante achtergrondinformatie bevatten
- Specifieke vragen stellen die discussie uitlokken
- Warm en uitnodigend zijn
- In het Nederlands geschreven zijn
- Persoonlijke ervaringen en herinneringen aanmoedigen

BELANGRIJK: Retourneer ALLEEN geldige JSON zonder markdown formatting, geen code blocks, geen extra tekst. Exact dit format:
{"title": "discussie titel", "description": "volledige beschrijving"}`;

        const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { 
                role: 'system', 
                content: 'Je bent een ervaren muziekjournalist die boeiende discussies creëert voor een Nederlandse muziekforum. Retourneer ALTIJD alleen geldige JSON zonder markdown formatting.'
              },
              { role: 'user', content: discussionPrompt }
            ],
            max_tokens: 800,
            temperature: 0.7,
          }),
        });

        if (!openAIResponse.ok) {
          throw new Error(`OpenAI API error: ${openAIResponse.status} ${openAIResponse.statusText}`);
        }

        const openAIData = await openAIResponse.json();
        console.log('OpenAI response received:', { 
          choices: openAIData.choices?.length,
          usage: openAIData.usage 
        });
        
        if (!openAIData.choices?.[0]?.message?.content) {
          throw new Error('No content generated by OpenAI');
        }

        // Clean and parse the JSON response
        const rawContent = openAIData.choices[0].message.content;
        console.log('Raw OpenAI content (first 200 chars):', rawContent.substring(0, 200));
        
        const cleanedContent = cleanJsonFromMarkdown(rawContent);
        console.log('Cleaned content (first 200 chars):', cleanedContent.substring(0, 200));
        
        try {
          discussionContent = JSON.parse(cleanedContent);
          console.log('Successfully parsed OpenAI content:', discussionContent);
          
          // Validate the parsed content
          if (!discussionContent.title || !discussionContent.description) {
            throw new Error('Invalid content structure from OpenAI');
          }
        } catch (parseError) {
          console.error('JSON parsing failed:', parseError);
          console.error('Attempted to parse:', cleanedContent);
          throw new Error(`Failed to parse OpenAI response as JSON: ${parseError.message}`);
        }
        
      } catch (openAIError) {
        console.error('OpenAI generation failed:', openAIError);
        console.log('Falling back to default content...');
        discussionContent = getFallbackContent(album.artist, album.title);
      }
    } else {
      console.log('No OpenAI API key found, using fallback content...');
      discussionContent = getFallbackContent(album.artist, album.title);
    }

    console.log('Final discussion content:', discussionContent);

    // Create the forum topic
    const { data: newTopic, error: topicError } = await supabase
      .from('forum_topics')
      .insert({
        title: discussionContent.title,
        description: discussionContent.description,
        topic_type: 'auto_generated',
        artist_name: album.artist,
        album_title: album.title,
        is_featured: true,
        created_by: systemUserId,
      })
      .select()
      .single();

    if (topicError) {
      console.error('Error creating forum topic:', topicError);
      throw topicError;
    }

    console.log('Created new weekly discussion:', newTopic);

    // Mark previous auto-generated topics as not featured
    const { error: updateError } = await supabase
      .from('forum_topics')
      .update({ is_featured: false })
      .eq('topic_type', 'auto_generated')
      .neq('id', newTopic.id);

    if (updateError) {
      console.error('Error updating previous topics:', updateError);
      // Don't throw here, it's not critical
    }

    // Trigger email notifications (don't wait for completion to avoid blocking)
    try {
      console.log('📧 Triggering email notifications...');
      
      // Call email notification function without awaiting to avoid blocking
      fetch(`${supabaseUrl}/functions/v1/send-weekly-discussion-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          topicId: newTopic.id,
          topicTitle: discussionContent.title,
          topicDescription: discussionContent.description,
          artistName: album.artist,
          albumTitle: album.title
        })
      }).then(response => {
        console.log('📧 Email notification response status:', response.status);
        return response.json();
      }).then(data => {
        console.log('📧 Email notification result:', data);
      }).catch(error => {
        console.error('❌ Failed to trigger email notifications:', error);
      });
      
    } catch (emailError) {
      console.error('❌ Error triggering email notifications:', emailError);
      // Don't fail the main function if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Weekly forum discussion created successfully',
        topic: newTopic,
        method: openAIApiKey ? 'ai_generated' : 'fallback'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in weekly-forum-discussions function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});