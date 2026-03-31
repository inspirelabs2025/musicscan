import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Camera, Brain, Disc, Music, Upload, AlertCircle, CheckCircle2, Clock, XCircle, User, MapPin, Globe } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ScanAction {
  id: string;
  created_at: string;
  user_id: string;
  artist: string | null;
  title: string | null;
  source: string;
  status: string | null;
  condition_grade: string | null;
  discogs_id: number | null;
  discogs_url: string | null;
  calculated_advice_price: number | null;
  // Extra fields for actions
  image_count?: number | null;
  media_type?: string | null;
  function_name?: string | null;
  error_message?: string | null;
  duration_ms?: number | null;
  ip_address?: string | null;
}

interface UserProfile {
  user_id: string;
  first_name: string | null;
  location: string | null;
}

function useUserProfiles(userIds: string[]) {
  return useQuery({
    queryKey: ["admin-user-profiles", userIds.sort().join(",")],
    queryFn: async () => {
      if (userIds.length === 0) return {};
      const uniqueIds = [...new Set(userIds.filter(id => id && id.length > 0))];
      if (uniqueIds.length === 0) return {};
      
      const { data } = await supabase
        .from("profiles")
        .select("user_id, first_name, location")
        .in("user_id", uniqueIds);
      
      const map: Record<string, UserProfile> = {};
      (data || []).forEach(p => { map[p.user_id] = p; });
      return map;
    },
    enabled: userIds.length > 0,
    staleTime: 60000,
  });
}

function useRecentScanActions(limit: number, sourceFilter: string, searchTerm: string) {
  return useQuery({
    queryKey: ["admin-recent-scan-actions", limit, sourceFilter, searchTerm],
    queryFn: async () => {
      const results: ScanAction[] = [];
      const shouldFetch = (src: string) => sourceFilter === "all" || sourceFilter === src;

      const promises: Promise<void>[] = [];

      // Primary source: scan_activity_log (all scan actions including attempts)
      if (shouldFetch("activity") || sourceFilter === "all") {
        promises.push((async () => {
          let q = supabase
            .from("scan_activity_log")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(limit);
          if (searchTerm) q = q.or(`artist.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%,function_name.ilike.%${searchTerm}%`);
          if (sourceFilter !== "all" && sourceFilter !== "activity") {
            const typeMap: Record<string, string> = {
              ai: "cd_scan", cd: "cd_pipeline", vinyl: "vinyl_scan",
              chat: "scan_chat", chat_photo: "scan_chat_photo"
            };
            if (typeMap[sourceFilter]) q = q.eq("action_type", typeMap[sourceFilter]);
          }
          const { data } = await q;
          (data || []).forEach(r => results.push({
            id: r.id,
            created_at: r.created_at,
            user_id: r.user_id || "",
            artist: r.artist,
            title: r.title,
            source: r.action_type as any,
            status: r.status,
            condition_grade: null,
            discogs_id: r.discogs_id,
            discogs_url: r.discogs_id ? `https://www.discogs.com/release/${r.discogs_id}` : null,
            calculated_advice_price: null,
            image_count: r.image_count,
            media_type: r.media_type,
            function_name: r.function_name,
            error_message: r.error_message,
            duration_ms: r.duration_ms,
            ip_address: r.ip_address,
          }));
        })());
      }

      // Also fetch saved results for historical data (before logging was added)
      if (shouldFetch("ai") || (sourceFilter === "all")) {
        promises.push((async () => {
          let q = supabase
            .from("ai_scan_results")
            .select("id, created_at, user_id, artist, title, status, condition_grade, discogs_id, discogs_url, media_type, error_message")
            .order("created_at", { ascending: false })
            .limit(Math.ceil(limit / 3));
          if (searchTerm) q = q.or(`artist.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`);
          const { data } = await q;
          (data || []).forEach(r => results.push({
            ...r, source: "ai", calculated_advice_price: null,
            media_type: r.media_type, error_message: r.error_message,
          }));
        })());
      }

      if (shouldFetch("cd") || (sourceFilter === "all")) {
        promises.push((async () => {
          let q = supabase
            .from("cd_scan")
            .select("id, created_at, user_id, artist, title, condition_grade, discogs_id, discogs_url, calculated_advice_price")
            .order("created_at", { ascending: false })
            .limit(Math.ceil(limit / 3));
          if (searchTerm) q = q.or(`artist.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`);
          const { data } = await q;
          (data || []).forEach(r => results.push({ ...r, source: "cd", status: "saved" }));
        })());
      }

      if (shouldFetch("vinyl") || (sourceFilter === "all")) {
        promises.push((async () => {
          let q = supabase
            .from("vinyl2_scan")
            .select("id, created_at, user_id, artist, title, condition_grade, discogs_id, discogs_url, calculated_advice_price")
            .order("created_at", { ascending: false })
            .limit(Math.ceil(limit / 3));
          if (searchTerm) q = q.or(`artist.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`);
          const { data } = await q;
          (data || []).forEach(r => results.push({ ...r, source: "vinyl", status: "saved" }));
        })());
      }

      // Batch uploads
      if (shouldFetch("upload") || (sourceFilter === "all")) {
        promises.push((async () => {
          let q = supabase
            .from("batch_uploads")
            .select("id, created_at, user_id, status, media_type, image_count, condition_grade, error_message")
            .order("created_at", { ascending: false })
            .limit(Math.ceil(limit / 5));
          const { data } = await q;
          (data || []).forEach(r => results.push({
            id: r.id, created_at: r.created_at, user_id: r.user_id,
            artist: null, title: null, source: "upload", status: r.status,
            condition_grade: r.condition_grade, discogs_id: null, discogs_url: null,
            calculated_advice_price: null, image_count: r.image_count,
            media_type: r.media_type, error_message: r.error_message,
          }));
        })());
      }

      await Promise.all(promises);
      
      // Deduplicate: prefer activity log entries over saved results with same timestamp
      const seen = new Set<string>();
      const deduped = results.filter(r => {
        const key = `${r.created_at}-${r.user_id}-${r.artist}-${r.title}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      
      deduped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return deduped.slice(0, limit);
    },
    refetchInterval: 30000,
  });
}

function useQuickStats() {
  return useQuery({
    queryKey: ["admin-recent-scans-stats"],
    queryFn: async () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const countQuery = async (table: "ai_scan_results" | "cd_scan" | "vinyl2_scan" | "batch_uploads" | "scan_activity_log", gte?: string) => {
        let q = supabase.from(table).select("id", { count: "exact", head: true });
        if (gte) q = q.gte("created_at", gte);
        const { count } = await q;
        return count || 0;
      };

      const [aiToday, cdToday, vinylToday, uploadsToday, activityToday,
             aiWeek, cdWeek, vinylWeek, uploadsWeek, activityWeek,
             aiTotal, cdTotal, vinylTotal, uploadsTotal, activityTotal] =
        await Promise.all([
          countQuery("ai_scan_results", today), countQuery("cd_scan", today), countQuery("vinyl2_scan", today),
          countQuery("batch_uploads", today), countQuery("scan_activity_log", today),
          countQuery("ai_scan_results", weekAgo), countQuery("cd_scan", weekAgo), countQuery("vinyl2_scan", weekAgo),
          countQuery("batch_uploads", weekAgo), countQuery("scan_activity_log", weekAgo),
          countQuery("ai_scan_results"), countQuery("cd_scan"), countQuery("vinyl2_scan"),
          countQuery("batch_uploads"), countQuery("scan_activity_log"),
        ]);

      return {
        today: activityToday || (aiToday + cdToday + vinylToday),
        thisWeek: activityWeek || (aiWeek + cdWeek + vinylWeek),
        total: activityTotal || (aiTotal + cdTotal + vinylTotal),
        ai: aiTotal, cd: cdTotal, vinyl: vinylTotal,
        uploads: { today: uploadsToday, week: uploadsWeek, total: uploadsTotal },
        activity: { today: activityToday, week: activityWeek, total: activityTotal },
      };
    },
  });
}

const sourceLabel = (s: string) => {
  switch (s) {
    case "ai": return "AI Scan";
    case "cd": case "cd_scan": return "CD Scan";
    case "vinyl": case "vinyl_scan": return "Vinyl Scan";
    case "upload": return "Upload";
    case "ai_call": return "AI Call";
    case "cd_pipeline": return "CD Pipeline";
    case "scan_chat": return "Chat";
    case "scan_chat_photo": return "Chat + Foto";
    default: return s;
  }
};

const sourceBadgeClass = (s: string) => {
  switch (s) {
    case "ai": case "cd_scan": return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
    case "cd": case "cd_pipeline": return "bg-blue-500/10 text-blue-700 border-blue-500/20";
    case "vinyl": case "vinyl_scan": return "bg-purple-500/10 text-purple-700 border-purple-500/20";
    case "upload": return "bg-amber-500/10 text-amber-700 border-amber-500/20";
    case "ai_call": return "bg-rose-500/10 text-rose-700 border-rose-500/20";
    case "scan_chat": case "scan_chat_photo": return "bg-cyan-500/10 text-cyan-700 border-cyan-500/20";
    default: return "";
  }
};

const SourceIcon = ({ source }: { source: string }) => {
  switch (source) {
    case "ai": case "cd_scan": return <Brain className="h-3.5 w-3.5" />;
    case "cd": case "cd_pipeline": return <Disc className="h-3.5 w-3.5" />;
    case "vinyl": case "vinyl_scan": return <Music className="h-3.5 w-3.5" />;
    case "upload": return <Upload className="h-3.5 w-3.5" />;
    case "ai_call": return <Camera className="h-3.5 w-3.5" />;
    case "scan_chat": case "scan_chat_photo": return <Brain className="h-3.5 w-3.5" />;
    default: return null;
  }
};

const StatusIcon = ({ status }: { status: string | null }) => {
  if (!status) return <span className="text-muted-foreground">—</span>;
  switch (status) {
    case "completed":
    case "saved":
    case "success":
      return <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />{status}</span>;
    case "processing":
    case "pending":
      return <span className="flex items-center gap-1 text-amber-600"><Clock className="h-3.5 w-3.5" />{status}</span>;
    case "failed":
    case "error":
      return <span className="flex items-center gap-1 text-destructive"><XCircle className="h-3.5 w-3.5" />{status}</span>;
    default:
      return <span className="flex items-center gap-1 text-muted-foreground"><AlertCircle className="h-3.5 w-3.5" />{status}</span>;
  }
};

const RecentScans = () => {
  const [limit, setLimit] = useState(50);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: scans, isLoading } = useRecentScanActions(limit, sourceFilter, searchTerm);
  const { data: stats } = useQuickStats();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scan Activiteit</h1>
        <p className="text-muted-foreground text-sm">Alle scan-acties inclusief uploads, AI calls en opgeslagen resultaten</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card>
          <CardContent className="pt-3 pb-2 px-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Vandaag</p>
            <p className="text-xl font-bold">{stats?.today ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2 px-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Week</p>
            <p className="text-xl font-bold">{stats?.thisWeek ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2 px-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Totaal</p>
            <p className="text-xl font-bold">{stats?.total ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2 px-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">AI Scans</p>
            <p className="text-xl font-bold text-emerald-600">{stats?.ai ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2 px-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">CD</p>
            <p className="text-xl font-bold text-blue-600">{stats?.cd ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2 px-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Vinyl</p>
            <p className="text-xl font-bold text-purple-600">{stats?.vinyl ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2 px-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Uploads</p>
            <p className="text-xl font-bold text-amber-600">{stats?.uploads?.total ?? "—"}</p>
            <p className="text-[10px] text-muted-foreground">{stats?.uploads?.today ?? 0} vandaag</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2 px-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Acties</p>
            <p className="text-xl font-bold text-rose-600">{stats?.activity?.total ?? "—"}</p>
            <p className="text-[10px] text-muted-foreground">{stats?.activity?.today ?? 0} vandaag</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Zoek op artiest of titel..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle acties</SelectItem>
            <SelectItem value="ai">AI Scans (opgeslagen)</SelectItem>
            <SelectItem value="cd">CD Scans (opgeslagen)</SelectItem>
            <SelectItem value="vinyl">Vinyl Scans (opgeslagen)</SelectItem>
            <SelectItem value="upload">Uploads</SelectItem>
            <SelectItem value="activity">Scan Activiteit (log)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={String(limit)} onValueChange={v => setLimit(Number(v))}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
            <SelectItem value="200">200</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[130px]">Datum</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Artiest / Functie</TableHead>
                    <TableHead>Titel / Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duur</TableHead>
                    <TableHead>Conditie</TableHead>
                    <TableHead>Gebruiker</TableHead>
                    <TableHead>Discogs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scans?.map(scan => (
                    <TableRow key={`${scan.source}-${scan.id}`}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(scan.created_at), "dd MMM HH:mm", { locale: nl })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs gap-1 ${sourceBadgeClass(scan.source)}`}>
                          <SourceIcon source={scan.source} />
                          {sourceLabel(scan.source)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium max-w-[150px] truncate">
                        {scan.function_name && !scan.artist
                          ? scan.function_name
                          : scan.source === "upload"
                          ? `${scan.media_type || "?"} (${scan.image_count || 0} foto's)`
                          : scan.artist || "—"}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate">
                        {scan.error_message
                          ? <span className="text-destructive text-xs">{scan.error_message.slice(0, 60)}</span>
                          : scan.title || (scan.image_count ? `${scan.image_count} foto's` : "—")}
                      </TableCell>
                      <TableCell className="text-xs">
                        <StatusIcon status={scan.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {scan.duration_ms ? `${(scan.duration_ms / 1000).toFixed(1)}s` : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {scan.condition_grade || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[100px] truncate">
                        {scan.user_id ? `${scan.user_id.slice(0, 8)}...` : "—"}
                      </TableCell>
                      <TableCell>
                        {scan.discogs_url ? (
                          <a href={scan.discogs_url} target="_blank" rel="noopener noreferrer"
                            className="text-primary hover:underline">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : scan.discogs_id ? (
                          <span className="text-xs text-muted-foreground">{scan.discogs_id}</span>
                        ) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {scans?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Geen scan-acties gevonden
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RecentScans;
