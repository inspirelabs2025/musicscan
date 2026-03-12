import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Disc, Music, Brain, ExternalLink, User, Calendar, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface RecentScan {
  id: string;
  created_at: string;
  user_id: string;
  artist: string | null;
  title: string | null;
  media_type: string;
  status: string;
  source_table: string;
  condition_grade: string | null;
  discogs_id: number | null;
  discogs_url: string | null;
  confidence_score: number | null;
  label: string | null;
  photo_urls: string[] | null;
  calculated_advice_price: number | null;
  user_email?: string;
}

function useRecentScans(limit: number, sourceFilter: string, searchTerm: string) {
  return useQuery({
    queryKey: ["admin-recent-scans", limit, sourceFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("unified_scans")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (sourceFilter && sourceFilter !== "all") {
        query = query.eq("source_table", sourceFilter);
      }

      if (searchTerm) {
        query = query.or(`artist.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get unique user IDs and fetch emails
      const userIds = [...new Set((data || []).map(s => s.user_id))];
      const { data: profiles } = await supabase.rpc("get_user_scan_counts");
      const emailMap: Record<string, string> = {};
      if (profiles) {
        (profiles as any[]).forEach(p => {
          emailMap[p.user_id] = p.email || "Unknown";
        });
      }

      return (data || []).map(scan => ({
        ...scan,
        user_email: emailMap[scan.user_id] || scan.user_id.slice(0, 8) + "...",
      })) as RecentScan[];
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

      const [todayResult, weekResult, totalResult] = await Promise.all([
        supabase.from("unified_scans").select("id", { count: "exact", head: true }).gte("created_at", today),
        supabase.from("unified_scans").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("unified_scans").select("id", { count: "exact", head: true }),
      ]);

      return {
        today: todayResult.count || 0,
        thisWeek: weekResult.count || 0,
        total: totalResult.count || 0,
      };
    },
  });
}

const sourceLabel = (s: string) => {
  switch (s) {
    case "ai_scan_results": return "AI Scan";
    case "cd_scan": return "CD";
    case "vinyl2_scan": return "Vinyl";
    default: return s;
  }
};

const sourceBadgeVariant = (s: string) => {
  switch (s) {
    case "ai_scan_results": return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
    case "cd_scan": return "bg-blue-500/10 text-blue-700 border-blue-500/20";
    case "vinyl2_scan": return "bg-purple-500/10 text-purple-700 border-purple-500/20";
    default: return "";
  }
};

const statusBadge = (status: string) => {
  switch (status) {
    case "completed": return "bg-emerald-500/10 text-emerald-700";
    case "failed": return "bg-destructive/10 text-destructive";
    case "pending": return "bg-yellow-500/10 text-yellow-700";
    default: return "bg-muted text-muted-foreground";
  }
};

const RecentScans = () => {
  const [limit, setLimit] = useState(50);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: scans, isLoading } = useRecentScans(limit, sourceFilter, searchTerm);
  const { data: stats } = useQuickStats();

  return (
    <AdminLayout currentPage="recent-scans">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Laatste Scans</h1>
          <p className="text-muted-foreground text-sm">Overzicht van alle recente scans over alle tabellen</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">Vandaag</p>
              <p className="text-2xl font-bold">{stats?.today ?? "—"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">Deze week</p>
              <p className="text-2xl font-bold">{stats?.thisWeek ?? "—"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">Totaal</p>
              <p className="text-2xl font-bold">{stats?.total ?? "—"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center">
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
              <SelectItem value="all">Alle bronnen</SelectItem>
              <SelectItem value="ai_scan_results">AI Scans</SelectItem>
              <SelectItem value="cd_scan">CD Scans</SelectItem>
              <SelectItem value="vinyl2_scan">Vinyl Scans</SelectItem>
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
                      <TableHead className="w-[140px]">Datum</TableHead>
                      <TableHead>Artiest</TableHead>
                      <TableHead>Titel</TableHead>
                      <TableHead>Bron</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Conditie</TableHead>
                      <TableHead>Prijs</TableHead>
                      <TableHead>Gebruiker</TableHead>
                      <TableHead>Discogs</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scans?.map(scan => (
                      <TableRow key={`${scan.source_table}-${scan.id}`}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(scan.created_at), "dd MMM HH:mm", { locale: nl })}
                        </TableCell>
                        <TableCell className="font-medium max-w-[150px] truncate">
                          {scan.artist || "—"}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate">
                          {scan.title || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${sourceBadgeVariant(scan.source_table)}`}>
                            {sourceLabel(scan.source_table)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`text-xs ${statusBadge(scan.status)}`}>
                            {scan.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {scan.condition_grade || "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {scan.calculated_advice_price
                            ? `€${scan.calculated_advice_price.toFixed(2)}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                          {scan.user_email}
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
                          Geen scans gevonden
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
    </AdminLayout>
  );
};

export default RecentScans;
