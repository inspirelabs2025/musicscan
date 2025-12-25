import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type DiscogsSearchResult = {
  id: number;
  title: string;
  type: string;
};

type DiscogsSearchResponse = {
  results?: DiscogsSearchResult[];
};

function normalizeArtistName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = temp;
    }
  }

  return dp[n];
}

function similarityPercent(a: string, b: string): number {
  const na = normalizeArtistName(a);
  const nb = normalizeArtistName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 100;

  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return Math.round(((maxLen - dist) / maxLen) * 100);
}

async function logExecution(
  supabase: ReturnType<typeof createClient>,
  payload: {
    function_name: string;
    status: string;
    started_at: string;
    completed_at: string;
    execution_time_ms: number;
    items_processed: number;
    error_message?: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  const { error } = await supabase.from('cronjob_execution_log').insert({
    function_name: payload.function_name,
    status: payload.status,
    started_at: payload.started_at,
    completed_at: payload.completed_at,
    execution_time_ms: payload.execution_time_ms,
    items_processed: payload.items_processed,
    error_message: payload.error_message ?? null,
    metadata: payload.metadata ?? null,
  });

  if (error) {
    console.error('[fill-missing-discogs-ids] Failed to log execution:', error.message);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const startedAtIso = new Date().toISOString();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const discogsToken = Deno.env.get('DISCOGS_TOKEN');
    if (!discogsToken) {
      throw new Error('Missing DISCOGS_TOKEN secret');
    }

    let batchSize = 15;
    let minScore = 70;

    try {
      const body = await req.json();
      if (typeof body?.batchSize === 'number') batchSize = Math.min(Math.max(1, body.batchSize), 25);
      if (typeof body?.minScore === 'number') minScore = Math.min(Math.max(50, body.minScore), 95);
    } catch {
      // ignore
    }

    console.log(`[fill-missing-discogs-ids] Start (batchSize=${batchSize}, minScore=${minScore})`);

    const { data: artists, error: fetchError } = await supabase
      .from('curated_artists')
      .select('id, artist_name')
      .eq('is_active', true)
      .is('discogs_artist_id', null)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (fetchError) throw new Error(`Failed to fetch artists: ${fetchError.message}`);

    if (!artists || artists.length === 0) {
      const executionTime = Date.now() - startTime;
      await logExecution(supabase, {
        function_name: 'fill-missing-discogs-ids',
        status: 'success',
        started_at: startedAtIso,
        completed_at: new Date().toISOString(),
        execution_time_ms: executionTime,
        items_processed: 0,
        metadata: { message: 'No artists to process' },
      });

      return new Response(
        JSON.stringify({ success: true, processed: 0, updated: 0, skipped: 0, message: 'No artists to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let updated = 0;
    let skipped = 0;
    const results: Array<{ artistName: string; success: boolean; discogsArtistId?: number; score?: number; reason?: string }> = [];

    for (let i = 0; i < artists.length; i++) {
      const artist = artists[i];
      const artistName = artist.artist_name;
      console.log(`[fill-missing-discogs-ids] Lookup: ${artistName}`);

      try {
        const url = new URL('https://api.discogs.com/database/search');
        url.searchParams.set('type', 'artist');
        url.searchParams.set('q', artistName);
        url.searchParams.set('per_page', '8');

        const resp = await fetch(url.toString(), {
          headers: {
            'User-Agent': 'MusicScan/1.0 (+https://www.musicscan.app)',
            Authorization: `Discogs token=${discogsToken}`,
          },
        });

        if (!resp.ok) {
          const errorText = await resp.text().catch(() => '');
          throw new Error(`Discogs API error ${resp.status}: ${errorText}`);
        }

        const data = (await resp.json()) as DiscogsSearchResponse;
        const candidates = (data.results || []).filter((r) => r.type === 'artist');

        if (candidates.length === 0) {
          skipped++;
          results.push({ artistName, success: false, reason: 'no_results' });
        } else {
          let best: DiscogsSearchResult | null = null;
          let bestScore = 0;

          for (const c of candidates) {
            const score = similarityPercent(artistName, c.title);
            if (score > bestScore) {
              bestScore = score;
              best = c;
            }
          }

          if (!best || bestScore < minScore) {
            skipped++;
            results.push({ artistName, success: false, score: bestScore, reason: 'low_match' });
          } else {
            const { error: updateError } = await supabase
              .from('curated_artists')
              .update({
                discogs_artist_id: best.id,
                updated_at: new Date().toISOString(),
              })
              .eq('id', artist.id);

            if (updateError) throw new Error(`Failed to update artist: ${updateError.message}`);

            updated++;
            results.push({ artistName, success: true, discogsArtistId: best.id, score: bestScore });
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[fill-missing-discogs-ids] Error for ${artistName}: ${msg}`);
        skipped++;
        results.push({ artistName, success: false, reason: msg });
      }

      // Rate limit (Discogs)
      if (i < artists.length - 1) await delay(1200);
    }

    const executionTime = Date.now() - startTime;

    await logExecution(supabase, {
      function_name: 'fill-missing-discogs-ids',
      status: 'success',
      started_at: startedAtIso,
      completed_at: new Date().toISOString(),
      execution_time_ms: executionTime,
      items_processed: artists.length,
      metadata: {
        batchSize,
        minScore,
        updated,
        skipped,
        results,
      },
    });

    console.log(`[fill-missing-discogs-ids] Done: updated=${updated}, skipped=${skipped}, time=${executionTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: artists.length,
        updated,
        skipped,
        executionTimeMs: executionTime,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[fill-missing-discogs-ids] Fatal:', msg);

    return new Response(JSON.stringify({ success: false, error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
