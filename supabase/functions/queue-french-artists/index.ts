import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Priority French artists with genres for comprehensive coverage
const FRENCH_ARTISTS_TO_QUEUE = [
  // Chanson Classique
  { name: "Édith Piaf", genre: "Chanson" },
  { name: "Charles Aznavour", genre: "Chanson" },
  { name: "Serge Gainsbourg", genre: "Chanson" },
  { name: "Jacques Brel", genre: "Chanson" },
  { name: "Georges Brassens", genre: "Chanson" },
  { name: "Françoise Hardy", genre: "Pop" },
  { name: "France Gall", genre: "Pop" },
  { name: "Johnny Hallyday", genre: "Rock" },
  
  // French Pop/Rock
  { name: "Air", genre: "Electronic" },
  { name: "Phoenix", genre: "Indie Rock" },
  { name: "Indochine", genre: "Rock" },
  { name: "Téléphone", genre: "Rock" },
  { name: "Noir Désir", genre: "Rock" },
  { name: "M (Matthieu Chedid)", genre: "Pop" },
  { name: "Christine and the Queens", genre: "Pop" },
  
  // Electronic/House
  { name: "Daft Punk", genre: "Electronic" },
  { name: "David Guetta", genre: "House" },
  { name: "Justice", genre: "Electronic" },
  { name: "M83", genre: "Electronic" },
  { name: "Kavinsky", genre: "Synthwave" },
  { name: "Gesaffelstein", genre: "Electronic" },
  { name: "Bob Sinclar", genre: "House" },
  { name: "Cassius", genre: "House" },
  { name: "Laurent Garnier", genre: "Techno" },
  
  // Hip Hop/R&B
  { name: "Stromae", genre: "Hip Hop" },
  { name: "MC Solaar", genre: "Hip Hop" },
  { name: "IAM", genre: "Hip Hop" },
  { name: "Orelsan", genre: "Hip Hop" },
  { name: "Angèle", genre: "Pop" },
  { name: "Aya Nakamura", genre: "R&B" },
  { name: "NTM", genre: "Hip Hop" },
  
  // Modern Pop
  { name: "Zaz", genre: "Pop" },
  { name: "Clara Luciani", genre: "Pop" },
  { name: "Pomme", genre: "Pop" },
  { name: "Julien Doré", genre: "Pop" },
  { name: "Louane", genre: "Pop" },
  
  // Metal/Rock
  { name: "Gojira", genre: "Metal" },
  { name: "Alcest", genre: "Metal" },
  { name: "Magma", genre: "Progressive Rock" },
  
  // Jazz/World
  { name: "Django Reinhardt", genre: "Jazz" },
  { name: "Stéphane Grappelli", genre: "Jazz" },
  { name: "Manu Chao", genre: "World" },
];

// French singles to queue for music_stories
const FRENCH_SINGLES_TO_QUEUE = [
  { artist: "Daft Punk", title: "Around the World", year: 1997 },
  { artist: "Daft Punk", title: "One More Time", year: 2000 },
  { artist: "Daft Punk", title: "Digital Love", year: 2001 },
  { artist: "Daft Punk", title: "Get Lucky", year: 2013 },
  { artist: "Stromae", title: "Alors on danse", year: 2010 },
  { artist: "Stromae", title: "Papaoutai", year: 2013 },
  { artist: "Édith Piaf", title: "La Vie en rose", year: 1947 },
  { artist: "Édith Piaf", title: "Non, je ne regrette rien", year: 1960 },
  { artist: "Phoenix", title: "1901", year: 2009 },
  { artist: "Phoenix", title: "Lisztomania", year: 2009 },
  { artist: "M83", title: "Midnight City", year: 2011 },
  { artist: "Air", title: "Sexy Boy", year: 1998 },
  { artist: "Air", title: "Cherry Blossom Girl", year: 2004 },
  { artist: "Justice", title: "D.A.N.C.E.", year: 2007 },
  { artist: "Kavinsky", title: "Nightcall", year: 2010 },
  { artist: "Serge Gainsbourg", title: "Je t'aime... moi non plus", year: 1969 },
  { artist: "Jacques Brel", title: "Ne me quitte pas", year: 1959 },
  { artist: "Charles Aznavour", title: "La Bohème", year: 1965 },
  { artist: "France Gall", title: "Ella, elle l'a", year: 1987 },
  { artist: "David Guetta", title: "Titanium", year: 2011 },
  { artist: "Angèle", title: "Balance ton quoi", year: 2019 },
  { artist: "Aya Nakamura", title: "Djadja", year: 2018 },
  { artist: "Zaz", title: "Je veux", year: 2010 },
  { artist: "Indochine", title: "L'Aventurier", year: 1982 },
  { artist: "Téléphone", title: "Un autre monde", year: 1984 },
  { artist: "MC Solaar", title: "Caroline", year: 1991 },
  { artist: "IAM", title: "Je danse le Mia", year: 1994 },
  { artist: "Gojira", title: "Flying Whales", year: 2005 },
  { artist: "Christine and the Queens", title: "Tilted", year: 2015 },
  { artist: "Clara Luciani", title: "La Grenade", year: 2018 },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action = 'all' } = await req.json().catch(() => ({}));

    const results = {
      artistsQueued: 0,
      artistsSkipped: 0,
      singlesQueued: 0,
      singlesSkipped: 0,
      errors: [] as string[],
    };

    // Get existing artist stories
    const { data: existingArtists } = await supabase
      .from('artist_stories')
      .select('artist_name');
    
    const existingArtistNames = new Set(
      (existingArtists || []).map(a => a.artist_name.toLowerCase())
    );

    // Get existing singles
    const { data: existingSingles } = await supabase
      .from('music_stories')
      .select('artist, single_name');
    
    const existingSingleKeys = new Set(
      (existingSingles || [])
        .filter(s => s.single_name)
        .map(s => `${s.artist?.toLowerCase()}-${s.single_name?.toLowerCase()}`)
    );

    // Check for active batch
    const { data: activeBatch } = await supabase
      .from('batch_processing_status')
      .select('id')
      .eq('process_type', 'french_content_generation')
      .in('status', ['pending', 'processing'])
      .single();

    let batchId = activeBatch?.id;

    if (!batchId && (action === 'all' || action === 'artists')) {
      // Create new batch for French content
      const { data: newBatch, error: batchError } = await supabase
        .from('batch_processing_status')
        .insert({
          process_type: 'french_content_generation',
          status: 'pending',
          total_items: 0,
        })
        .select('id')
        .single();

      if (batchError) {
        throw new Error(`Failed to create batch: ${batchError.message}`);
      }
      batchId = newBatch.id;
    }

    // Queue artists
    if (action === 'all' || action === 'artists') {
      for (const artist of FRENCH_ARTISTS_TO_QUEUE) {
        if (existingArtistNames.has(artist.name.toLowerCase())) {
          results.artistsSkipped++;
          continue;
        }

        // Check if already in queue by metadata artist_name
        const { data: existingQueueItems } = await supabase
          .from('batch_queue_items')
          .select('id, metadata')
          .eq('item_type', 'artist_story');

        const alreadyQueued = (existingQueueItems || []).some(
          item => item.metadata?.artist_name?.toLowerCase() === artist.name.toLowerCase()
        );

        if (alreadyQueued) {
          results.artistsSkipped++;
          continue;
        }

        // Generate a UUID for item_id, store artist name in metadata
        const itemUuid = crypto.randomUUID();
        
        const { error: queueError } = await supabase
          .from('batch_queue_items')
          .insert({
            batch_id: batchId,
            item_id: itemUuid,
            item_type: 'artist_story',
            status: 'pending',
            priority: 100,
            metadata: { 
              artist_name: artist.name, 
              genre: artist.genre,
              country: 'France'
            },
          });

        if (queueError) {
          results.errors.push(`Failed to queue artist ${artist.name}: ${queueError.message}`);
        } else {
          results.artistsQueued++;
        }
      }
    }

    // Queue singles
    if (action === 'all' || action === 'singles') {
      // Get or create singles batch
      let singlesBatchId = batchId;
      
      if (!singlesBatchId) {
        const { data: singlesBatch } = await supabase
          .from('batch_processing_status')
          .select('id')
          .eq('process_type', 'singles_generation')
          .in('status', ['pending', 'processing'])
          .single();

        if (singlesBatch) {
          singlesBatchId = singlesBatch.id;
        } else {
          const { data: newSinglesBatch } = await supabase
            .from('batch_processing_status')
            .insert({
              process_type: 'singles_generation',
              status: 'pending',
              total_items: 0,
            })
            .select('id')
            .single();
          singlesBatchId = newSinglesBatch?.id;
        }
      }

      if (singlesBatchId) {
        for (const single of FRENCH_SINGLES_TO_QUEUE) {
          const singleKey = `${single.artist.toLowerCase()}-${single.title.toLowerCase()}`;
          
          if (existingSingleKeys.has(singleKey)) {
            results.singlesSkipped++;
            continue;
          }

          // Check if already in singles_import_queue
          const { data: existingInQueue } = await supabase
            .from('singles_import_queue')
            .select('id')
            .eq('artist', single.artist)
            .eq('single_name', single.title)
            .single();

          if (existingInQueue) {
            results.singlesSkipped++;
            continue;
          }

          const { error: singlesQueueError } = await supabase
            .from('singles_import_queue')
            .insert({
              user_id: '594ede44-c1d6-474d-95e6-202a19585793',
              artist: single.artist,
              single_name: single.title,
              year: single.year,
              status: 'pending',
              priority: 100,
            });

          if (singlesQueueError) {
            results.errors.push(`Failed to queue single ${single.artist} - ${single.title}: ${singlesQueueError.message}`);
          } else {
            results.singlesQueued++;
          }
        }
      }
    }

    // Update batch total
    if (batchId && results.artistsQueued > 0) {
      await supabase
        .from('batch_processing_status')
        .update({ 
          total_items: results.artistsQueued,
          status: 'pending'
        })
        .eq('id', batchId);
    }

    console.log(`French content queued - Artists: ${results.artistsQueued}, Singles: ${results.singlesQueued}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Queued ${results.artistsQueued} French artists and ${results.singlesQueued} French singles`,
      results,
      batchId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error queuing French content:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
