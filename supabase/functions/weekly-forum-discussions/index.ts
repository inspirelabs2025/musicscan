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
  let cleaned = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
  cleaned = cleaned.replace(/`/g, '');
  return cleaned.trim();
}

// Function to validate and clean artist name
function isValidArtistName(artist: string): boolean {
  if (!artist || artist.length < 2 || artist.length > 100) return false;
  
  // Reject if it looks like description text
  const descriptionPatterns = [
    /^the cover/i,
    /^this is/i,
    /^a photo/i,
    /^an image/i,
    /^featuring/i,
    /^photograph/i,
    /^unknown/i,
    /^various$/i,
    /^\*\*/,  // Starts with **
    /^#+/,   // Starts with #
    /\bcover\b/i,
    /\bphoto\b/i,
    /\bimage\b/i,
  ];
  
  for (const pattern of descriptionPatterns) {
    if (pattern.test(artist)) return false;
  }
  
  return true;
}

// Function to clean artist name
function cleanArtistName(artist: string): string {
  let cleaned = artist.replace(/^\*+\s*/, '');
  cleaned = cleaned.trim();
  return cleaned;
}

// Function to extract artist from title if needed (format: "Artist - Album")
function extractArtistFromTitle(title: string): { artist: string; album: string } | null {
  const match = title.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (match && match[1] && match[2]) {
    const artist = match[1].trim();
    const album = match[2].trim();
    if (artist.length >= 2 && album.length >= 2) {
      return { artist, album };
    }
  }
  return null;
}

// Get or create system user for auto-generated content
async function getSystemUserId(): Promise<string> {
  try {
    const { data: systemUser } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('first_name', 'System')
      .limit(1)
      .single();
    
    if (systemUser) {
      return systemUser.user_id;
    }
    
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

// Get albums that have already been used in forum discussions
async function getUsedAlbumTitles(): Promise<Set<string>> {
  try {
    const { data: usedTopics } = await supabase
      .from('forum_topics')
      .select('album_title')
      .eq('topic_type', 'auto_generated')
      .not('album_title', 'is', null);
    
    const usedTitles = new Set<string>();
    if (usedTopics) {
      for (const topic of usedTopics) {
        if (topic.album_title) {
          // Normalize the title for comparison
          usedTitles.add(topic.album_title.toLowerCase().trim());
        }
      }
    }
    console.log(`Found ${usedTitles.size} already used albums`);
    return usedTitles;
  } catch (error) {
    console.error('Error getting used album titles:', error);
    return new Set();
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting weekly forum discussion generation...');
    
    const systemUserId = await getSystemUserId();
    console.log('Using system user ID:', systemUserId);
    
    // Get list of already used albums
    const usedAlbumTitles = await getUsedAlbumTitles();
    
    // Get more albums to have a larger pool to choose from
    const { data: albums, error: albumError } = await supabase
      .from('unified_scans')
      .select('artist, title, discogs_id')
      .not('artist', 'is', null)
      .not('title', 'is', null)
      .limit(200);

    if (albumError) {
      console.error('Error fetching albums:', albumError);
      throw albumError;
    }

    if (!albums || albums.length === 0) {
      console.log('No albums found in database');
      throw new Error('No albums found in database');
    }

    console.log(`Found ${albums.length} albums, searching for valid unused one...`);

    // Find a valid album with proper artist name that hasn't been used
    let selectedAlbum: { artist: string; title: string; discogs_id?: number } | null = null;
    
    // Shuffle albums for random selection
    const shuffled = albums.sort(() => Math.random() - 0.5);
    
    for (const album of shuffled) {
      // Check if this album title has already been used
      const normalizedTitle = album.title.toLowerCase().trim();
      if (usedAlbumTitles.has(normalizedTitle)) {
        console.log(`Skipping already used album: ${album.title}`);
        continue;
      }
      
      const cleanedArtist = cleanArtistName(album.artist);
      
      // Check if artist name is valid
      if (isValidArtistName(cleanedArtist)) {
        // Also try to extract from title to get clean album name
        const extracted = extractArtistFromTitle(album.title);
        if (extracted) {
          selectedAlbum = {
            artist: extracted.artist,
            title: extracted.album,
            discogs_id: album.discogs_id
          };
        } else {
          selectedAlbum = {
            artist: cleanedArtist,
            title: album.title,
            discogs_id: album.discogs_id
          };
        }
        break;
      }
      
      // Try to extract artist from title if artist field is bad
      const extracted = extractArtistFromTitle(album.title);
      if (extracted && isValidArtistName(extracted.artist)) {
        selectedAlbum = {
          artist: extracted.artist,
          title: extracted.album,
          discogs_id: album.discogs_id
        };
        break;
      }
    }

    if (!selectedAlbum) {
      console.log('No valid unused albums found after filtering');
      throw new Error('No valid unused albums found - all albums have been used or have invalid data');
    }

    console.log(`Selected album: ${selectedAlbum.artist} - ${selectedAlbum.title}`);

    let discussionContent;
    
    if (openAIApiKey) {
      try {
        console.log('Attempting to generate content with OpenAI...');
        
        const discussionPrompt = `Je bent een muziekexpert die elke week een interessante discussie start over een album voor een Nederlands muziekforum. 

Album: "${selectedAlbum.title}" door ${selectedAlbum.artist}

Creëer een boeiende discussie met:
1. Een korte, pakkende titel (max 80 karakters)
2. Een interessante beschrijving die mensen uitnodigt om te reageren (max 300 woorden)

De beschrijving moet:
- Interessante achtergrondinformatie bevatten over het album of de artiest
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
                content: 'Je bent een ervaren muziekjournalist die boeiende discussies creëert voor een Nederlands muziekforum. Retourneer ALTIJD alleen geldige JSON zonder markdown formatting.'
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

        const rawContent = openAIData.choices[0].message.content;
        console.log('Raw OpenAI content (first 200 chars):', rawContent.substring(0, 200));
        
        const cleanedContent = cleanJsonFromMarkdown(rawContent);
        console.log('Cleaned content (first 200 chars):', cleanedContent.substring(0, 200));
        
        try {
          discussionContent = JSON.parse(cleanedContent);
          console.log('Successfully parsed OpenAI content:', discussionContent);
          
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
        discussionContent = getFallbackContent(selectedAlbum.artist, selectedAlbum.title);
      }
    } else {
      console.log('No OpenAI API key found, using fallback content...');
      discussionContent = getFallbackContent(selectedAlbum.artist, selectedAlbum.title);
    }

    console.log('Final discussion content:', discussionContent);

    // Create the forum topic - store the CLEAN album title for deduplication
    const { data: newTopic, error: topicError } = await supabase
      .from('forum_topics')
      .insert({
        title: discussionContent.title,
        description: discussionContent.description,
        topic_type: 'auto_generated',
        artist_name: selectedAlbum.artist,
        album_title: selectedAlbum.title, // Store clean title without artist prefix
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
    }

    // Trigger email notifications
    try {
      console.log('📧 Triggering email notifications...');
      
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
          artistName: selectedAlbum.artist,
          albumTitle: selectedAlbum.title
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
