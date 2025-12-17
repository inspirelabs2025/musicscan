import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Detect if content is truncated (ends mid-sentence, too short, or abruptly)
function isTruncated(content: string | null): boolean {
  if (!content) return false;
  
  const trimmed = content.trim();
  
  // Too short for a proper story (less than 4000 chars for stories)
  if (trimmed.length < 4000) return true;
  
  // Get last 200 characters to check ending
  const ending = trimmed.slice(-200);
  const lastWord = ending.split(/\s+/).pop() || '';
  
  // Check if ends mid-word (less than 3 chars, not common endings)
  const validShortEndings = ['op', 'in', 'om', 'en', 'de', 'het', 'ze', 'je', 'we', 'mij', 'ons'];
  if (lastWord.length <= 4 && !lastWord.match(/[.!?]$/) && !validShortEndings.includes(lastWord.toLowerCase())) {
    return true;
  }
  
  // Dutch words that indicate incomplete sentences at end
  const incompleteEndingWords = [
    'de', 'het', 'een', 'en', 'van', 'voor', 'met', 'op', 'aan', 'om', 'te', 'die', 'dat', 
    'werd', 'werden', 'heeft', 'hebben', 'naar', 'door', 'bij', 'als', 'maar', 'ook',
    'zijn', 'was', 'waren', 'deze', 'dit', 'onder', 'over', 'uit', 'tot', 'basis',
    'rauwe', 'helende', 'snaar', 'echo'
  ];
  
  // Check if last word (without punctuation) is an incomplete indicator
  const cleanLastWord = lastWord.replace(/[.!?,;:'")\]]+$/, '').toLowerCase();
  if (incompleteEndingWords.includes(cleanLastWord)) {
    return true;
  }
  
  // Check for truncation patterns (mid-word truncation)
  if (lastWord.match(/^[a-zA-Z]{2,5}$/) && !lastWord.match(/[.!?]$/)) {
    // Likely a truncated word if it's short and doesn't end with punctuation
    return true;
  }
  
  return false;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { contentType, dryRun = false, limit = 1 } = await req.json().catch(() => ({}));

    const results: any = {
      music_stories: { found: 0, processed: 0, errors: [] },
      artist_stories: { found: 0, processed: 0, errors: [] },
      music_anecdotes: { found: 0, processed: 0, errors: [] },
    };

    // Process music_stories (singles and albums)
    if (!contentType || contentType === 'music_stories' || contentType === 'all') {
      const { data: stories, error } = await supabase
        .from('music_stories')
        .select('id, slug, artist, title, single_name, story_content, regenerate_pending')
        .eq('is_published', true)
        .is('regenerate_pending', null)
        .order('created_at', { ascending: true })
        .limit(500);

      if (stories) {
        const truncated = stories.filter(s => isTruncated(s.story_content));
        results.music_stories.found = truncated.length;

        if (!dryRun && truncated.length > 0) {
          const toProcess = truncated.slice(0, limit);
          
          for (const story of toProcess) {
            try {
              // Mark as pending regeneration
              await supabase
                .from('music_stories')
                .update({ regenerate_pending: true })
                .eq('id', story.id);

              // Determine if it's a single or album story
              if (story.single_name) {
                // Regenerate single story
                const response = await supabase.functions.invoke('generate-single-story', {
                  body: {
                    artist: story.artist,
                    single_name: story.single_name,
                    regenerate: true,
                    existingId: story.id
                  }
                });
                
                if (response.error) throw response.error;
              } else {
                // Regenerate album story via music-story-generator
                const response = await supabase.functions.invoke('music-story-generator', {
                  body: {
                    artist: story.artist,
                    title: story.title,
                    regenerate: true,
                    existingId: story.id
                  }
                });
                
                if (response.error) throw response.error;
              }

              results.music_stories.processed++;
              console.log(`Regenerated music_story: ${story.slug}`);
            } catch (err) {
              results.music_stories.errors.push({ id: story.id, slug: story.slug, error: err.message });
              // Reset pending flag on error
              await supabase
                .from('music_stories')
                .update({ regenerate_pending: null })
                .eq('id', story.id);
            }
          }
        }
      }
    }

    // Process artist_stories
    if (!contentType || contentType === 'artist_stories' || contentType === 'all') {
      const { data: artists, error } = await supabase
        .from('artist_stories')
        .select('id, slug, artist_name, story_content, regenerate_pending')
        .eq('is_published', true)
        .is('regenerate_pending', null)
        .order('created_at', { ascending: true })
        .limit(100);

      if (artists) {
        const truncated = artists.filter(a => isTruncated(a.story_content));
        results.artist_stories.found = truncated.length;

        if (!dryRun && truncated.length > 0) {
          const toProcess = truncated.slice(0, limit);
          
          for (const artist of toProcess) {
            try {
              await supabase
                .from('artist_stories')
                .update({ regenerate_pending: true })
                .eq('id', artist.id);

              const response = await supabase.functions.invoke('generate-artist-story', {
                body: {
                  artistName: artist.artist_name,
                  regenerate: true,
                  existingId: artist.id
                }
              });
              
              if (response.error) throw response.error;

              results.artist_stories.processed++;
              console.log(`Regenerated artist_story: ${artist.slug}`);
            } catch (err) {
              results.artist_stories.errors.push({ id: artist.id, slug: artist.slug, error: err.message });
              await supabase
                .from('artist_stories')
                .update({ regenerate_pending: null })
                .eq('id', artist.id);
            }
          }
        }
      }
    }

    // Process music_anecdotes
    if (!contentType || contentType === 'music_anecdotes' || contentType === 'all') {
      const { data: anecdotes, error } = await supabase
        .from('music_anecdotes')
        .select('id, slug, subject_name, subject_type, anecdote_content, regenerate_pending')
        .eq('is_active', true)
        .is('regenerate_pending', null)
        .order('created_at', { ascending: true })
        .limit(100);

      if (anecdotes) {
        const truncated = anecdotes.filter(a => isTruncated(a.anecdote_content));
        results.music_anecdotes.found = truncated.length;

        if (!dryRun && truncated.length > 0) {
          const toProcess = truncated.slice(0, limit);
          
          for (const anecdote of toProcess) {
            try {
              await supabase
                .from('music_anecdotes')
                .update({ regenerate_pending: true })
                .eq('id', anecdote.id);

              const response = await supabase.functions.invoke('daily-anecdote-generator', {
                body: {
                  subject: anecdote.subject_name,
                  subjectType: anecdote.subject_type,
                  regenerate: true,
                  existingId: anecdote.id
                }
              });
              
              if (response.error) throw response.error;

              results.music_anecdotes.processed++;
              console.log(`Regenerated music_anecdote: ${anecdote.slug}`);
            } catch (err) {
              results.music_anecdotes.errors.push({ id: anecdote.id, slug: anecdote.slug, error: err.message });
              await supabase
                .from('music_anecdotes')
                .update({ regenerate_pending: null })
                .eq('id', anecdote.id);
            }
          }
        }
      }
    }

    const totalFound = results.music_stories.found + results.artist_stories.found + results.music_anecdotes.found;
    const totalProcessed = results.music_stories.processed + results.artist_stories.processed + results.music_anecdotes.processed;

    console.log(`Backfill complete: Found ${totalFound} truncated, processed ${totalProcessed}`);

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      summary: {
        totalFound,
        totalProcessed,
      },
      details: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
