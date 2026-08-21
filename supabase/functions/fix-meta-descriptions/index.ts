// Rebuild meta_description for published music_stories and artist_stories from
// their own story_content. Fully deterministic: no AI, no translation model.
// Runs with the service-role key. dryRun is on by default; every write is logged
// in meta_description_fix_log so it can be undone.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const MAX = 155;
const CUT = 152;

interface Para {
  text: string;
  bold: boolean;
}

/** Strip frontmatter, headings, markdown syntax, images and links. */
function toPlainText(raw: string): Para[] {
  let text = raw ?? "";
  // YAML frontmatter
  text = text.replace(/^\uFEFF?\s*---\r?\n[\s\S]*?\r?\n---\s*/, "");
  // fenced code blocks
  text = text.replace(/```[\s\S]*?```/g, "");
  // images then links -> keep link label
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  text = text.replace(/<[^>]+>/g, " ");

  const paragraphs: Para[] = [];
  for (const block of text.split(/\r?\n\s*\r?\n/)) {
    const lines = block
      .split(/\r?\n/)
      .map((l) => l.trim())
      // drop headings, quotes, list bullets, table rows, hrules
      .filter((l) => l && !/^#{1,6}\s/.test(l) && !/^[-*_]{3,}$/.test(l) && !/^\|/.test(l))
      .map((l) => l.replace(/^>+\s*/, "").replace(/^[-*+]\s+/, "").replace(/^\d+[.)]\s+/, ""));
    let p = lines.join(" ").trim();
    if (!p) continue;
    // whole paragraph wrapped in bold/italic markers -> looks like a title line
    const bold = /^(\*\*|__|\*|_)[\s\S]+(\*\*|__|\*|_)$/.test(p);
    // inline markers
    p = p.replace(/[*_`>|#]/g, " ").replace(/\s+/g, " ").trim();
    if (p) paragraphs.push({ text: p, bold });
  }
  return paragraphs;
}

/** A paragraph that reads like a title: bold, short, or without closing punctuation. */
function looksLikeTitle(p: Para): boolean {
  return p.bold || p.text.length < 60 || !/[.!?…]["'”’)]?$/.test(p.text.trim());
}

function splitSentences(p: string): string[] {
  const parts = p.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) ?? [];
  return parts.map((s) => s.trim()).filter(Boolean);
}

/** Build a description of whole sentences up to 155 chars. */
export function buildDescription(storyContent: string | null): string | null {
  if (!storyContent) return null;
  const paragraphs = toPlainText(storyContent);
  // Prefer the first paragraph that is real prose, skipping title-like openers.
  let startIdx = paragraphs.findIndex((p) => !looksLikeTitle(p));
  if (startIdx < 0) startIdx = paragraphs.findIndex((p) => p.text.length >= 40);
  if (startIdx < 0) return null;

  // Collect sentences from the first real paragraph onwards, so a very short
  // opening sentence still yields a full description.
  const sentences: string[] = [];
  for (const p of paragraphs.slice(startIdx)) {
    sentences.push(...splitSentences(p.text));
    if (sentences.join(" ").length > MAX) break;
  }
  if (sentences.length === 0) return null;


  let out = "";
  for (const s of sentences) {
    const next = out ? `${out} ${s}` : s;
    if (next.length > MAX) break;
    out = next;
  }
  // Long enough to be a useful description: keep whole sentences.
  if (out.length >= 60) return out;

  // Too short (or the first sentence does not fit): cut on the last word
  // before 152 chars and close with an ellipsis.
  const source = sentences.join(" ");
  const slice = source.slice(0, CUT);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = slice.slice(0, lastSpace > 0 ? lastSpace : CUT).trim();
  const cleaned = cut.replace(/[,;:\-–—]+$/, "").trim();
  if (!cleaned) return out || null;
  return source.length <= CUT ? source : `${cleaned}...`;
}


const ENGLISH_MARKERS = [
  "the ", "story behind", "discover", "explore", " its ", " and ", " was ", " with ",
  "learn ", "find out", "everything you", " this ", " that ", " from ",
];

const DUTCH_MARKERS = [
  " de ", " het ", " een ", " en ", " van ", " werd ", " is ", " met ", " voor ",
  " zijn ", " niet ", " maar ", " door ", " op ", " dat ", " die ",
];

function score(text: string, markers: string[]): number {
  const t = ` ${text.toLowerCase()} `;
  let n = 0;
  for (const m of markers) {
    if (t.includes(m)) n++;
  }
  return n;
}

function looksDutch(text: string): boolean {
  return score(text, DUTCH_MARKERS) >= score(text, ENGLISH_MARKERS);
}

function looksEnglish(text: string): boolean {
  const t = text.toLowerCase().trim();
  if (/^(the|discover|explore|learn|find out|everything|inside|how|why|a )\b/.test(t)) return true;
  return score(text, ENGLISH_MARKERS) > score(text, DUTCH_MARKERS);
}

interface Row {
  id: string;
  slug: string | null;
  meta_description: string | null;
  story_content: string | null;
  content_language?: string | null;
}

type Reason = "empty" | "markdown" | "english" | "truncated";

function classify(row: Row, table: string): Reason | null {
  const md = (row.meta_description ?? "").trim();
  if (!md) return "empty";
  if (/^[#>*`|_-]/.test(md)) return "markdown";

  const contentIsDutch = looksDutch((row.story_content ?? "").slice(0, 1200));
  const langIsEnglish = (row.content_language ?? "").toLowerCase().startsWith("en");
  if (!langIsEnglish && contentIsDutch && looksEnglish(md)) return "english";

  if (table === "artist_stories" && md.length === 160 && !/[.!?…]$/.test(md)) return "truncated";
  return null;
}

async function fetchAll(supabase: any, table: string, cols: string): Promise<Row[]> {
  const seen = new Set<string>();
  const rows: Row[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select(cols)
      .eq("is_published", true)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`${table} fetch failed: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const r of data as Row[]) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      rows.push(r);
    }
    if (data.length < pageSize) break;
  }
  return rows;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch (_) {
      body = {};
    }

    const dryRun = body.dryRun === undefined ? true : body.dryRun === true;
    const limit = typeof body.limit === "number" && body.limit > 0 ? Math.floor(body.limit) : null;
    const undo = body.undo === true;
    const only = typeof body.table === "string" ? body.table : null;
    const sampleSize = typeof body.samples === "number" ? Math.floor(body.samples) : 10;

    // ---------------- UNDO ----------------
    if (undo) {
      const { data: logs, error: logErr } = await supabase
        .from("meta_description_fix_log")
        .select("id, table_name, record_id, previous_meta_description")
        .order("id", { ascending: true });
      if (logErr) throw new Error(`log fetch failed: ${logErr.message}`);

      let restored = 0;
      for (const log of logs ?? []) {
        const { data: upd, error: uErr } = await supabase
          .from(log.table_name)
          .update({ meta_description: log.previous_meta_description })
          .eq("id", log.record_id)
          .select("id");
        if (uErr) throw new Error(`undo ${log.record_id}: ${uErr.message}`);
        if (!upd || upd.length !== 1) {
          return json(
            { error: `Undo aborted: update of ${log.record_id} affected ${upd?.length ?? 0} rows` },
            500,
          );
        }
        restored++;
        await supabase.from("meta_description_fix_log").delete().eq("id", log.id);
      }
      return json({ mode: "undo", restored });
    }

    const tables = [
      {
        name: "music_stories",
        cols: "id, slug, meta_description, story_content, content_language",
      },
      { name: "artist_stories", cols: "id, slug, meta_description, story_content" },
    ].filter((t) => !only || t.name === only);

    const report: Record<string, unknown> = {};
    let remaining = limit ?? Number.MAX_SAFE_INTEGER;

    for (const t of tables) {
      const rows = await fetchAll(supabase, t.name, t.cols);
      const reasons: Record<Reason, number> = { empty: 0, markdown: 0, english: 0, truncated: 0 };
      const updatedReasons: Record<Reason, number> = {
        empty: 0,
        markdown: 0,
        english: 0,
        truncated: 0,
      };
      const noContent: string[] = [];
      const samples: unknown[] = [];
      let updated = 0;
      let candidates = 0;


      for (const row of rows) {
        const reason = classify(row, t.name);
        if (!reason) continue;
        const next = buildDescription(row.story_content);
        if (!next) {
          noContent.push(row.slug ?? row.id);
          continue;
        }
        if (next === (row.meta_description ?? "").trim()) continue;
        candidates++;
        reasons[reason]++;

        if (samples.length < sampleSize) {
          samples.push({
            slug: row.slug,
            reason,
            old: row.meta_description,
            new: next,
          });
        }

        if (dryRun) continue;
        if (remaining <= 0) continue;

        const { data: upd, error: uErr } = await supabase
          .from(t.name)
          .update({ meta_description: next })
          .eq("id", row.id)
          .select("id");
        if (uErr) throw new Error(`update ${t.name} ${row.id}: ${uErr.message}`);
        if (!upd || upd.length !== 1) {
          return json(
            { error: `Aborted: update of ${t.name} ${row.id} affected ${upd?.length ?? 0} rows` },
            500,
          );
        }
        const { error: lErr } = await supabase.from("meta_description_fix_log").insert({
          table_name: t.name,
          record_id: row.id,
          slug: row.slug,
          reason,
          previous_meta_description: row.meta_description,
          new_meta_description: next,
        });
        if (lErr) throw new Error(`log insert ${row.id}: ${lErr.message}`);
        updated++;
        remaining--;
      }

      report[t.name] = {
        publishedRows: rows.length,
        candidates,
        byReason: reasons,
        skippedNoUsableContent: noContent.length,
        updated: dryRun ? 0 : updated,
        samples,
      };
    }

    return json({ mode: dryRun ? "dryRun" : "apply", limit, ...report });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
