import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  Disc3, Search, RefreshCw, Loader2, Play, CheckCircle2, 
  XCircle, Clock, AlertCircle, Image, Database
} from "lucide-react";

interface MasterAlbum {
  id: string;
  artist_name: string;
  title: string;
  year: number | null;
  discogs_master_id: number | null;
  artwork_thumb: string | null;
  artwork_large: string | null;
  status: string;
  has_blog: boolean;
  has_products: boolean;
  products_count: number;
  discovered_at: string;
  processed_at: string | null;
  error_message: string | null;
}

interface AlbumStats {
  total: number;
  pending: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  artistsWithAlbums: number;
  artistsWithoutAlbums: number;
}

export default function MasterAlbumsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isDiscovering, setIsDiscovering] = useState(false);
  const queryClient = useQueryClient();

  // Fetch albums
  const { data: albums, isLoading: albumsLoading } = useQuery({
    queryKey: ["master-albums", searchQuery, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from("master_albums")
        .select("*")
        .order("discovered_at", { ascending: false })
        .limit(200);

      if (searchQuery) {
        query = query.or(`artist_name.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`);
      }
      if (filterStatus && filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MasterAlbum[];
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["master-albums-stats"],
    queryFn: async () => {
      const [
        { count: total },
        { count: pending },
        { count: queued },
        { count: processing },
        { count: completed },
        { count: failed },
        { count: artistsWithAlbums },
        { count: artistsWithoutAlbums },
      ] = await Promise.all([
        supabase.from("master_albums").select("id", { count: "exact", head: true }),
        supabase.from("master_albums").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("master_albums").select("id", { count: "exact", head: true }).eq("status", "queued"),
        supabase.from("master_albums").select("id", { count: "exact", head: true }).eq("status", "processing"),
        supabase.from("master_albums").select("id", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("master_albums").select("id", { count: "exact", head: true }).eq("status", "failed"),
        supabase.from("curated_artists").select("id", { count: "exact", head: true }).gt("albums_count", 0),
        supabase.from("curated_artists").select("id", { count: "exact", head: true }).or("albums_count.is.null,albums_count.eq.0"),
      ]);

      return {
        total: total || 0,
        pending: pending || 0,
        queued: queued || 0,
        processing: processing || 0,
        completed: completed || 0,
        failed: failed || 0,
        artistsWithAlbums: artistsWithAlbums || 0,
        artistsWithoutAlbums: artistsWithoutAlbums || 0,
      } as AlbumStats;
    },
    refetchInterval: 30000,
  });

  // Trigger batch album discovery
  const triggerDiscovery = async () => {
    setIsDiscovering(true);
    try {
      const { data, error } = await supabase.functions.invoke("batch-album-discovery", {
        body: { batchSize: 5 },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`${data.successful}/${data.processed} artiesten verwerkt, ${data.totalAlbumsDiscovered} albums ontdekt`);
      } else {
        toast.error(data?.error || "Discovery failed");
      }

      queryClient.invalidateQueries({ queryKey: ["master-albums"] });
      queryClient.invalidateQueries({ queryKey: ["master-albums-stats"] });
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setIsDiscovering(false);
    }
  };

  // Trigger album queue processor
  const processAlbumsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("album-queue-processor", {
        body: { batchSize: 5 },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast.success(`${data.successful}/${data.processed} albums verwerkt`);
      }
      queryClient.invalidateQueries({ queryKey: ["master-albums"] });
      queryClient.invalidateQueries({ queryKey: ["master-albums-stats"] });
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case "queued":
        return <Database className="h-4 w-4 text-blue-500" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      queued: "secondary",
      processing: "default",
      completed: "default",
      failed: "destructive",
    };
    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {getStatusIcon(status)}
        <span className="ml-1">{status}</span>
      </Badge>
    );
  };

  const progressPercent = stats ? Math.round(((stats.completed + stats.failed) / Math.max(stats.total, 1)) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{stats?.total || 0}</p>
            <p className="text-xs text-muted-foreground">Totaal Albums</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{stats?.pending || 0}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-500">{stats?.queued || 0}</p>
            <p className="text-xs text-muted-foreground">Queued</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-yellow-500">{stats?.processing || 0}</p>
            <p className="text-xs text-muted-foreground">Processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-500">{stats?.completed || 0}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-red-500">{stats?.failed || 0}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{stats?.artistsWithAlbums || 0}</p>
            <p className="text-xs text-muted-foreground">Artists ✓</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-orange-500">{stats?.artistsWithoutAlbums || 0}</p>
            <p className="text-xs text-muted-foreground">Artists Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Album Processing Progress</span>
            <span className="text-sm text-muted-foreground">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Disc3 className="h-5 w-5" />
                Album Discovery & Processing
              </CardTitle>
              <CardDescription>
                Ontdek albums van artiesten en verwerk ze naar producten
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={triggerDiscovery}
                disabled={isDiscovering}
                variant="outline"
              >
                {isDiscovering ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Discover Albums (5 Artists)
              </Button>
              <Button
                onClick={() => processAlbumsMutation.mutate()}
                disabled={processAlbumsMutation.isPending}
              >
                {processAlbumsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Process Queue
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Zoek album of artiest..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="queued">Queued</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["master-albums"] })}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Albums Table */}
      <Card>
        <CardContent className="p-0">
          {albumsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Cover</TableHead>
                    <TableHead>Artiest</TableHead>
                    <TableHead>Album</TableHead>
                    <TableHead className="text-center">Jaar</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Blog</TableHead>
                    <TableHead className="text-center">Products</TableHead>
                    <TableHead>Ontdekt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {albums?.map((album) => (
                    <TableRow key={album.id}>
                      <TableCell>
                        {album.artwork_thumb ? (
                          <img
                            src={album.artwork_thumb}
                            alt={album.title}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <Image className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{album.artist_name}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{album.title}</p>
                          {album.discogs_master_id && (
                            <a
                              href={`https://www.discogs.com/master/${album.discogs_master_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:underline"
                            >
                              Discogs #{album.discogs_master_id}
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {album.year || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(album.status)}
                      </TableCell>
                      <TableCell className="text-center">
                        {album.has_blog ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={album.products_count > 0 ? "default" : "outline"}>
                          {album.products_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(album.discovered_at).toLocaleDateString("nl-NL")}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!albums || albums.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Geen albums gevonden. Start "Discover Albums" om te beginnen.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground text-center">
        Toont {albums?.length || 0} albums (max 200) • Auto-refresh elke 30 seconden
      </p>
    </div>
  );
}
