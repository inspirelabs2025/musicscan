// Merge duplicate album stories in blog_posts.
// Runs with the service-role key because RLS on blog_posts only allows a user
// to update their own rows, while most stories belong to system accounts.
// Nothing is deleted: duplicates are unpublished and tagged with duplicate_of.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Post {
  id: string;
  slug: string;
  markdown_content: string | null;
  views_count: number | null;
  published_at: string | null;
  is_published: boolean | null;
  yaml_frontmatter: Record<string, unknown> | null;
}

const norm = (v: unknown) =>
  String(v ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]/g, "");

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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

    // ---------------- UNDO ----------------
    if (undo) {
      const { data: logs, error: logErr } = await supabase
        .from("merge_duplicate_log")
        .select("id, blog_id, slug, previous_is_published")
        .order("id", { ascending: true });
      if (logErr) throw new Error(`log fetch failed: ${logErr.message}`);

      let restored = 0;
      for (const log of logs ?? []) {
        const { data: post, error: pErr } = await supabase
          .from("blog_posts")
          .select("id, yaml_frontmatter")
          .eq("id", log.blog_id)
          .maybeSingle();
        if (pErr) throw new Error(`undo fetch ${log.blog_id}: ${pErr.message}`);
        if (!post) continue;

        const fm = { ...((post.yaml_frontmatter as Record<string, unknown>) ?? {}) };
        delete fm.duplicate_of;

        const { data: upd, error: uErr } = await supabase
          .from("blog_posts")
          .update({
            is_published: log.previous_is_published ?? true,
            yaml_frontmatter: fm,
            updated_at: new Date().toISOString(),
          })
          .eq("id", log.blog_id)
          .select("id");
        if (uErr) throw new Error(`undo update ${log.blog_id}: ${uErr.message}`);
        if (!upd || upd.length !== 1) {
          return json(
            { error: `Undo aborted: update of ${log.blog_id} affected ${upd?.length ?? 0} rows` },
            500,
          );
        }
        restored++;
        await supabase.from("merge_duplicate_log").delete().eq("id", log.id);
      }
      return json({ mode: "undo", restored });
    }

    // ---------------- FETCH ----------------
    // Stable ordering by id + de-duplication on id, otherwise paging can return
    // the same row twice and it would count as a duplicate of itself.
    const seen = new Set<string>();
    const posts: Post[] = [];
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, markdown_content, views_count, published_at, is_published, yaml_frontmatter")
        .eq("is_published", true)
        .order("id", { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) throw new Error(`fetch failed: ${error.message}`);
      if (!data || data.length === 0) break;
      for (const p of data as Post[]) {
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        posts.push(p);
      }
      if (data.length < pageSize) break;
    }

    // ---------------- GROUP ----------------
    // pass: "artistAlbum" (default leading pass), "slug" (fallback on slug pattern), "both"
    const pass = typeof body.pass === "string" ? body.pass : "both";
    const runArtistAlbum = pass === "artistAlbum" || pass === "both";
    const runSlug = pass === "slug" || pass === "both";

    const groups = new Map<string, Post[]>();
    const skipped: Post[] = []; // missing artist or album -> handled by slug pass
    for (const p of posts) {
      const fm = p.yaml_frontmatter ?? {};
      const artist = norm((fm as any).artist);
      const album = norm((fm as any).album);
      if (!artist || !album) {
        skipped.push(p);
        continue;
      }
      const key = `${artist}|${album}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }

    // --- second pass: group on slug base, only for records the first pass skipped ---
    // Strip exactly one trailing "-unknown" or "-<4 digits>" suffix, never repeated.
    const baseSlug = (slug: string) => slug.replace(/-(?:unknown|\d{4})$/, "");

    // Opening paragraph fingerprint, used to detect that a year suffix hides
    // two genuinely different releases (e.g. nirvana-live-1992 vs -1994).
    const opening = (p: Post) =>
      (p.markdown_content ?? "")
        .replace(/^---[\s\S]*?---/, "")
        .replace(/[#*_>`\[\]()]/g, " ")
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 60);

    const similarity = (a: string[], b: string[]) => {
      if (!a.length || !b.length) return 1; // no content to compare on -> don't flag
      const sa = new Set(a);
      const sb = new Set(b);
      let inter = 0;
      for (const w of sa) if (sb.has(w)) inter++;
      return inter / new Set([...sa, ...sb]).size;
    };

    const slugGroups = new Map<string, Post[]>();
    if (runSlug) {
      for (const p of skipped) {
        const key = baseSlug(p.slug);
        if (!slugGroups.has(key)) slugGroups.set(key, []);
        slugGroups.get(key)!.push(p);
      }
    }

    const uncertain: Array<{ key: string; reason: string; slugs: string[] }> = [];
    const slugDupGroups: Array<[string, Post[]]> = [];
    for (const [key, list] of slugGroups.entries()) {
      if (list.length < 2) continue;
      // album titles must not conflict
      const albums = [...new Set(list.map((p) => norm((p.yaml_frontmatter as any)?.album)).filter(Boolean))];
      if (albums.length > 1) {
        uncertain.push({ key, reason: "different album titles", slugs: list.map((p) => p.slug) });
        continue;
      }
      const heads = list.map(opening);
      let minSim = 1;
      for (let i = 0; i < heads.length; i++) {
        for (let j = i + 1; j < heads.length; j++) {
          minSim = Math.min(minSim, similarity(heads[i], heads[j]));
        }
      }
      if (minSim < 0.35) {
        uncertain.push({
          key,
          reason: `opening paragraphs differ (similarity ${minSim.toFixed(2)})`,
          slugs: list.map((p) => p.slug),
        });
        continue;
      }
      slugDupGroups.push([`slug:${key}`, list]);
    }
    slugDupGroups.sort((a, b) => a[0].localeCompare(b[0]));

    const faDupGroups: Array<[string, Post[]]> = runArtistAlbum
      ? [...groups.entries()].filter(([, list]) => list.length > 1).sort((a, b) => a[0].localeCompare(b[0]))
      : [];

    // first pass stays leading; slug pass is appended
    const dupGroups: Array<[string, Post[]]> = [...faDupGroups, ...slugDupGroups];

    const pick = (list: Post[]) =>
      [...list].sort((a, b) => {
        const la = (a.markdown_content ?? "").length;
        const lb = (b.markdown_content ?? "").length;
        if (lb !== la) return lb - la;
        const va = a.views_count ?? 0;
        const vb = b.views_count ?? 0;
        if (vb !== va) return vb - va;
        const pa = a.published_at ? new Date(a.published_at).getTime() : Number.MAX_SAFE_INTEGER;
        const pb = b.published_at ? new Date(b.published_at).getTime() : Number.MAX_SAFE_INTEGER;
        if (pa !== pb) return pa - pb;
        return a.id.localeCompare(b.id);
      })[0];

    const selected = limit ? dupGroups.slice(0, limit) : dupGroups;

    const plan = selected.map(([key, list]) => {
      const keep = pick(list);
      const drop = list.filter((p) => p.id !== keep.id);
      return { key, keep, drop };
    });

    const totalDropAll = dupGroups.reduce((n, [, l]) => n + l.length - 1, 0);
    const totalDropSelected = plan.reduce((n, g) => n + g.drop.length, 0);


    if (dryRun) {
      return json({
        mode: "dryRun",
        pass,
        publishedPosts: posts.length,
        duplicateGroupsTotal: dupGroups.length,
        recordsToUnpublishTotal: totalDropAll,
        groupsSelected: plan.length,
        recordsToUnpublishSelected: totalDropSelected,
        slugPassGroups: slugDupGroups.length,
        slugPassRecordsToUnpublish: slugDupGroups.reduce((n, [, l]) => n + l.length - 1, 0),
        uncertainGroups: uncertain.length,
        uncertainExamples: uncertain.slice(0, 20),
        pairs: plan.slice(0, 20).map((g) => `${g.keep.slug}  ←  ${g.drop.map((d) => d.slug).join(", ")}`),

        examples: plan.slice(0, 20).map((g) => ({
          key: g.key,
          keep: { slug: g.keep.slug, length: (g.keep.markdown_content ?? "").length },
          drop: g.drop.map((d) => ({ slug: d.slug, length: (d.markdown_content ?? "").length })),
        })),
      });
    }

    // ---------------- APPLY ----------------
    let groupsProcessed = 0;
    let unpublished = 0;
    const processed: Array<{ slug: string; kept_slug: string }> = [];

    for (const g of plan) {
      const groupTouched: string[] = [];
      for (const d of g.drop) {
        if (d.id === g.keep.id) {
          return json({ error: `Internal error: kept record ${d.id} present in drop list` }, 500);
        }
        const fm = { ...((d.yaml_frontmatter as Record<string, unknown>) ?? {}), duplicate_of: g.keep.slug };
        const { data: upd, error: uErr } = await supabase
          .from("blog_posts")
          .update({ is_published: false, yaml_frontmatter: fm, updated_at: new Date().toISOString() })
          .eq("id", d.id)
          .select("id");

        if (uErr || !upd || upd.length !== 1) {
          // Roll the partially processed group back so no half group is left behind.
          for (const doneId of groupTouched) {
            const orig = g.drop.find((x) => x.id === doneId)!;
            await supabase
              .from("blog_posts")
              .update({ is_published: orig.is_published ?? true, yaml_frontmatter: orig.yaml_frontmatter })
              .eq("id", doneId);
            await supabase.from("merge_duplicate_log").delete().eq("blog_id", doneId);
          }
          return json(
            {
              error: `Update of ${d.id} (${d.slug}) changed ${upd?.length ?? 0} rows${uErr ? `: ${uErr.message}` : ""}. Aborted; group rolled back.`,
              groupsProcessed,
              unpublished,
            },
            500,
          );
        }

        const { error: logErr } = await supabase.from("merge_duplicate_log").insert({
          blog_id: d.id,
          slug: d.slug,
          kept_slug: g.keep.slug,
          previous_is_published: d.is_published ?? true,
        });
        if (logErr) throw new Error(`log insert failed for ${d.id}: ${logErr.message}`);

        groupTouched.push(d.id);
        unpublished++;
        processed.push({ slug: d.slug, kept_slug: g.keep.slug });
      }
      groupsProcessed++;
    }

    return json({
      mode: "apply",
      publishedPostsBefore: posts.length,
      duplicateGroupsTotal: dupGroups.length,
      groupsProcessed,
      recordsUnpublished: unpublished,
      examples: processed.slice(0, 20),
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
