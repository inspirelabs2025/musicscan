import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateCommentRequest {
  blog_post_id: string;
  artist: string;
  single_name?: string;
  album_title?: string;
  album_type: 'cd' | 'vinyl' | 'ai' | 'product' | 'release';
  genre?: string;
  year?: number;
  story_excerpt?: string;
  num_comments?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      blog_post_id,
      artist,
      single_name,
      album_title,
      album_type,
      genre,
      year,
      story_excerpt,
      num_comments = 1
    }: GenerateCommentRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const title = single_name || album_title || 'deze release';
    const media = album_type === 'cd' ? 'CD' : album_type === 'vinyl' ? 'vinyl' : 'album';

    // Generate comments
    const generatedComments = [];
    for (let i = 0; i < num_comments; i++) {
      try {
        // Get random bot user
        const { data: botUserId, error: botError } = await supabase
          .rpc('get_random_bot_user');

        if (botError || !botUserId) {
          console.error('Failed to get bot user:', botError);
          continue;
        }

        // Build AI prompt
        const prompt = `Je bent een Nederlandse muziekliefhebber die een authentieke, persoonlijke reactie schrijft op een verhaal over ${artist} - ${title}.

Context:
- Artiest: ${artist}
- Titel: ${title}
- Media type: ${media}
${genre ? `- Genre: ${genre}` : ''}
${year ? `- Jaar: ${year}` : ''}
${story_excerpt ? `- Verhaal: ${story_excerpt}` : ''}

Schrijf een korte, natuurlijke comment (50-150 woorden) die:
- Een persoonlijke herinnering of ervaring deelt
- Specifieke muzikale details noemt (zoals gitaarriff, drumbeat, vocalen, productie)
- Emotionele connectie laat zien
- Authentiek Nederlands klinkt (niet te formeel, geen AI-achtige frases)
- Natuurlijk overkomt alsof een echte fan schrijft

Voorbeelden van goede comments:
- "Dit nummer kwam ik voor het eerst tegen op MTV in 2004, die gitaarriff bleef dagenlang in mijn hoofd hangen! Wat een tijd was dat."
- "Herinner me nog goed dat ik dit album kocht bij de Free Record Shop. Die overgangen tussen de tracks zijn zo smooth, blijft genieten."
- "De productie op dit album is echt next level. Die drumcomputer beats klinken nog steeds fris."

Schrijf alleen de comment zelf, geen extra tekst of uitleg.`;

        console.log('🎯 Generating comment for:', artist, '-', title);

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'Je bent een ervaren Nederlandse muziekliefhebber die authentieke, persoonlijke comments schrijft over muziek. Je schrijft natuurlijk en spontaan, zoals een echte fan zou doen.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.9,
            max_tokens: 300
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Lovable AI error:', response.status, errorText);
          
          if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please try again later.');
          }
          if (response.status === 402) {
            throw new Error('Insufficient credits. Please add credits to your workspace.');
          }
          
          throw new Error(`AI generation failed: ${response.status}`);
        }

        const data = await response.json();
        const commentContent = data.choices?.[0]?.message?.content;
        const tokensUsed = data.usage?.total_tokens || 0;

        if (!commentContent) {
          throw new Error('No comment generated from AI');
        }

        // Random timestamp between 1-30 days ago
        const daysAgo = Math.floor(Math.random() * 30) + 1;
        const randomDate = new Date();
        randomDate.setDate(randomDate.getDate() - daysAgo);

        // Save comment to database
        const { data: comment, error: commentError } = await supabase
          .from('blog_comments')
          .insert({
            blog_post_id,
            user_id: botUserId,
            content: commentContent.trim(),
            created_at: randomDate.toISOString(),
            is_ai_generated: true,
            ai_model: 'google/gemini-2.5-flash',
            generation_cost_tokens: tokensUsed
          })
          .select()
          .single();

        if (commentError) {
          console.error('Failed to save comment:', commentError);
          continue;
        }

        generatedComments.push({
          comment_id: comment.id,
          content: commentContent,
          tokens_used: tokensUsed,
          created_at: randomDate
        });

        console.log(`✅ Comment ${i + 1}/${num_comments} generated successfully`);

        // Small delay between comments to avoid rate limiting
        if (i < num_comments - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (commentError) {
        console.error(`Error generating comment ${i + 1}:`, commentError);
        continue;
      }
    }

    // Update stats
    if (generatedComments.length > 0) {
      const totalTokens = generatedComments.reduce((sum, c) => sum + c.tokens_used, 0);
      
      // Get current stats
      const { data: currentStats } = await supabase
        .from('comment_generation_stats')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single();
      
      if (currentStats) {
        await supabase
          .from('comment_generation_stats')
          .update({
            total_comments_generated: currentStats.total_comments_generated + generatedComments.length,
            total_posts_processed: currentStats.total_posts_processed + 1,
            total_tokens_used: currentStats.total_tokens_used + totalTokens,
            last_run_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', '00000000-0000-0000-0000-000000000001');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        blog_post_id,
        comments_generated: generatedComments.length,
        comments: generatedComments
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error in generate-ai-comment:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});