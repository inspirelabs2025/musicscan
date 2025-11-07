// deno-lint-ignore-file no-explicit-any
// Generic sitemap proxy — serves any file from Storage bucket "sitemaps"
// Supports: /sitemaps/<any-file> and /sitemap.xml (if you route it)
// Reads filename from "x-sitemap-file" header (preferred) or from the URL path after /sitemaps/
// Good logging, correct headers, and cache-control switches for test/prod.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = Deno.env.get("SITEMAP_BUCKET") ?? "sitemaps";

// Cache strategy: test (0) vs prod (900)
const TESTING = Deno.env.get("SITEMAP_PROXY_TESTING") === "1";
const CACHE_HEADER = TESTING
  ? "max-age=0, s-maxage=0, must-revalidate"
  : "public, max-age=900, s-maxage=900";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

type FileMeta = { name: string; id?: string; updated_at?: string | null; size?: number | null };

// Best-effort logging (optional table)
async function logRequest(details: {
  path: string;
  file: string | null;
  status: number;
  size?: number | null;
  note?: string;
}) {
  try {
    await supabase.from("sitemap_logs").insert({
      method: "GET",
      path: details.path,
      file: details.file,
      status_code: details.status,
      size_bytes: details.size ?? null,
      note: details.note ?? null,
      created_at: new Date().toISOString(),
    });
  } catch (_) {
    // ignore
  }
}

function detectContentType(filename: string): { ct: string; encoding?: string } {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".xml")) return { ct: "application/xml; charset=utf-8" };
  if (lower.endsWith(".xml.gz")) return { ct: "application/xml; charset=utf-8", encoding: "gzip" };
  // Default to XML for safety (all our sitemap assets are XML anyway)
  return { ct: "application/xml; charset=utf-8" };
}

// Try to extract the filename to serve:
// 1) x-sitemap-file header (from Vercel/CF rewrite)
// 2) "file" query parameter (from rewrites like ?file=$1)
// 3) path after "/sitemaps/" (if routed directly)
// 4) exact "/sitemap.xml" (map to index file)
function resolveFilename(req: Request): string | null {
  const url = new URL(req.url);
  const hdr = req.headers.get("x-sitemap-file");
  if (hdr && hdr.trim()) return hdr.trim();

  // Query parameter support e.g. /functions/v1/sitemap-proxy?file=sitemap-blog.xml
  const qp = url.searchParams.get("file");
  if (qp && qp.trim()) return qp.trim();

  // Direct path parsing (when function is routed with original path)
  // Examples:
  //   https://musicscan.app/sitemaps/sitemap-blog-v3-part1.xml  -> filename = "sitemap-blog-v3-part1.xml"
  //   https://musicscan.app/sitemap.xml                         -> filename = "sitemap-index.xml"
  const path = url.pathname;

  if (path === "/sitemap.xml" || path.endsWith("/sitemap.xml")) return "sitemap-index.xml";

  const m = path.match(/\/sitemaps\/(.+)$/);
  if (m && m[1]) return decodeURIComponent(m[1]);

  return null;
}

// (Optional) get basic metadata (size, updated_at). Storage doesn't have a single-file HEAD,
// so list in the bucket prefix and pick the file. Keep it fast by filtering the parent "folder".
async function getFileMeta(filename: string): Promise<FileMeta | null> {
  const slashIdx = filename.lastIndexOf("/");
  const prefix = slashIdx >= 0 ? filename.substring(0, slashIdx + 1) : "";
  const name = slashIdx >= 0 ? filename.substring(slashIdx + 1) : filename;

  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
    limit: 1000, // folders typically small
    search: name,
  });
  if (error || !data) return null;
  const found = data.find((f: any) => f.name === name);
  if (!found) return null;
  return { name: found.name, updated_at: found.updated_at ?? null, size: found.metadata?.size ?? found.size ?? null };
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const filename = resolveFilename(req);

  console.log('🗺️ [v2] Sitemap proxy request:', { path: url.pathname, filename, testing: TESTING });

  if (!filename) {
    await logRequest({ path: url.pathname, file: null, status: 400, note: "missing filename" });
    return new Response("Bad Request: missing sitemap filename", { status: 400 });
  }

  // Get public URL and fetch the file
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  
  if (!urlData?.publicUrl) {
    console.error('❌ Failed to get public URL for:', filename);
    await logRequest({ path: url.pathname, file: filename, status: 404, note: "No public URL" });
    return new Response("Not Found", { status: 404 });
  }

  // Fetch the file from the public URL
  const fileResponse = await fetch(urlData.publicUrl);
  
  if (!fileResponse.ok) {
    console.error('❌ Failed to fetch sitemap:', filename, fileResponse.status);
    await logRequest({ path: url.pathname, file: filename, status: 404, note: `HTTP ${fileResponse.status}` });
    return new Response("Not Found", { status: 404 });
  }

  const data = await fileResponse.blob();

  // Fetch metadata (size, updated_at) for nicer headers (optional)
  const meta = await getFileMeta(filename).catch(() => null);

  const { ct, encoding } = detectContentType(filename);
  const headers: HeadersInit = {
    "Content-Type": ct,
    "Cache-Control": CACHE_HEADER,
    "X-Sitemap-File": filename,
  };

  // Content-Length if known
  try {
    const size = (data as Blob).size;
    if (typeof size === "number" && Number.isFinite(size)) {
      headers["Content-Length"] = String(size);
    }
    console.log('✅ Serving sitemap:', filename, `(${size} bytes)`);
    await logRequest({ path: url.pathname, file: filename, status: 200, size });
  } catch {
    await logRequest({ path: url.pathname, file: filename, status: 200 });
  }

  // Last-Modified if we have it
  if (meta?.updated_at) headers["Last-Modified"] = new Date(meta.updated_at).toUTCString();

  // Content-Encoding if gzipped
  if (encoding) headers["Content-Encoding"] = encoding;

  // Stream back the blob
  return new Response((data as Blob).stream(), { status: 200, headers });
});
