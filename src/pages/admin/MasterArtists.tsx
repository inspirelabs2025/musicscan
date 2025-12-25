import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Crown, Users, Music, Disc3, ShoppingBag, Search, Plus, RefreshCw, 
  CheckCircle2, XCircle, Loader2, Upload, Trash2, Filter, ArrowUpDown, Database
} from "lucide-react";
import MasterAlbumsTab from "@/components/admin/MasterAlbumsTab";

interface CuratedArtist {
  id: string;
  artist_name: string;
  country_code: string | null;
  genre: string | null;
  priority: number | null;
  is_active: boolean | null;
  has_artist_story: boolean | null;
  artist_story_id: string | null;
  albums_count: number | null;      // Discovered albums from Discogs
  singles_count: number | null;     // Discovered singles from Discogs
  albums_processed: number | null;  // Albums with stories/products
  singles_processed: number | null; // Singles processed
  products_created: number | null;
  last_content_sync: string | null;
  discogs_id: string | null;
  discogs_artist_id: number | null;
  spotify_id: string | null;
  created_at: string | null;
}

const COUNTRY_OPTIONS = [
  { value: "NL", label: "🇳🇱 Nederland" },
  { value: "BE", label: "🇧🇪 België" },
  { value: "US", label: "🇺🇸 Verenigde Staten" },
  { value: "GB", label: "🇬🇧 Verenigd Koninkrijk" },
  { value: "FR", label: "🇫🇷 Frankrijk" },
  { value: "DE", label: "🇩🇪 Duitsland" },
  { value: "SE", label: "🇸🇪 Zweden" },
  { value: "IT", label: "🇮🇹 Italië" },
  { value: "ES", label: "🇪🇸 Spanje" },
  { value: "AU", label: "🇦🇺 Australië" },
  { value: "CA", label: "🇨🇦 Canada" },
  { value: "JM", label: "🇯🇲 Jamaica" },
];

const GENRE_OPTIONS = [
  "Pop", "Rock", "Hip-Hop", "R&B", "Electronic", "Dance", "House", 
  "Jazz", "Classical", "Metal", "Punk", "Indie", "Folk", "Country",
  "Reggae", "Soul", "Funk", "Blues", "Latin", "World"
];

export default function MasterArtists() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [filterContentStatus, setFilterContentStatus] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("priority");
  const [bulkArtistsText, setBulkArtistsText] = useState("");
  const [newArtistName, setNewArtistName] = useState("");
  const [newArtistCountry, setNewArtistCountry] = useState("");
  const [newArtistGenre, setNewArtistGenre] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch artists
  const { data: artists, isLoading, refetch } = useQuery({
    queryKey: ["master-artists", searchQuery, filterCountry, filterGenre, filterContentStatus, sortOrder],
    queryFn: async () => {
      let query = supabase
        .from("curated_artists")
        .select("*");

      // Apply sorting based on sortOrder
      if (sortOrder === "a-z") {
        query = query.order("artist_name", { ascending: true });
      } else if (sortOrder === "z-a") {
        query = query.order("artist_name", { ascending: false });
      } else if (sortOrder === "most-albums") {
        query = query.order("albums_count", { ascending: false, nullsFirst: false });
      } else if (sortOrder === "least-albums") {
        query = query.order("albums_count", { ascending: true, nullsFirst: false });
      } else if (sortOrder === "most-singles") {
        query = query.order("singles_count", { ascending: false, nullsFirst: false });
      } else if (sortOrder === "least-singles") {
        query = query.order("singles_count", { ascending: true, nullsFirst: false });
      } else {
        // Default: priority
        query = query
          .order("priority", { ascending: false, nullsFirst: false })
          .order("artist_name", { ascending: true });
      }

      if (searchQuery) {
        query = query.ilike("artist_name", `%${searchQuery}%`);
      }
      if (filterCountry && filterCountry !== "all") {
        query = query.eq("country_code", filterCountry);
      }
      if (filterGenre && filterGenre !== "all") {
        query = query.eq("genre", filterGenre);
      }
      if (filterContentStatus === "with_story") {
        query = query.eq("has_artist_story", true);
      } else if (filterContentStatus === "without_story") {
        query = query.or("has_artist_story.is.null,has_artist_story.eq.false");
      }

      const { data, error } = await query.limit(500);
      if (error) throw error;
      return data as CuratedArtist[];
    },
  });

  // Stats query - accurate counts from curated_artists aggregated data
  const { data: stats } = useQuery({
    queryKey: ["master-artists-stats"],
    queryFn: async () => {
      // Get all aggregated stats in one query
      const { data: artistStats } = await supabase
        .from("curated_artists")
        .select("has_artist_story, albums_processed, singles_processed, products_created, albums_count, singles_count");
      
      // Get count of artists with discogs_artist_id
      const { count: withDiscogsId } = await supabase
        .from("curated_artists")
        .select("*", { count: "exact", head: true })
        .not("discogs_artist_id", "is", null);

      const total = artistStats?.length || 0;
      const withStory = artistStats?.filter(a => a.has_artist_story).length || 0;
      const albumsProcessed = artistStats?.reduce((sum, a) => sum + (a.albums_processed || 0), 0) || 0;
      const singlesProcessed = artistStats?.reduce((sum, a) => sum + (a.singles_processed || 0), 0) || 0;
      const productsCreated = artistStats?.reduce((sum, a) => sum + (a.products_created || 0), 0) || 0;
      const albumsDiscovered = artistStats?.reduce((sum, a) => sum + (a.albums_count || 0), 0) || 0;
      const singlesDiscovered = artistStats?.reduce((sum, a) => sum + (a.singles_count || 0), 0) || 0;

      return {
        total,
        withStory,
        withoutStory: total - withStory,
        withDiscogsId: withDiscogsId || 0,
        albumsProcessed,      // Album stories created
        singlesProcessed,     // Singles processed  
        productsCreated,      // Products linked
        albumsDiscovered,     // From master_albums
        singlesDiscovered,    // From master_singles
      };
    },
  });

  // Add single artist mutation
  const addArtistMutation = useMutation({
    mutationFn: async ({ name, country, genre }: { name: string; country?: string; genre?: string }) => {
      const { data, error } = await supabase
        .from("curated_artists")
        .insert({
          artist_name: name.trim(),
          country_code: country || null,
          genre: genre || null,
          is_active: true,
          priority: 50,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Artiest toegevoegd");
      setNewArtistName("");
      setNewArtistCountry("");
      setNewArtistGenre("");
      queryClient.invalidateQueries({ queryKey: ["master-artists"] });
      queryClient.invalidateQueries({ queryKey: ["master-artists-stats"] });
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error("Deze artiest bestaat al");
      } else {
        toast.error("Fout bij toevoegen: " + error.message);
      }
    },
  });

  // Bulk add artists mutation
  const bulkAddMutation = useMutation({
    mutationFn: async (artistNames: string[]) => {
      const artists = artistNames.map(name => ({
        artist_name: name.trim(),
        is_active: true,
        priority: 50,
      }));

      const { data, error } = await supabase
        .from("curated_artists")
        .upsert(artists, { onConflict: "artist_name", ignoreDuplicates: true })
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data?.length || 0} artiesten toegevoegd`);
      setBulkArtistsText("");
      queryClient.invalidateQueries({ queryKey: ["master-artists"] });
      queryClient.invalidateQueries({ queryKey: ["master-artists-stats"] });
    },
    onError: (error: any) => {
      toast.error("Fout bij bulk import: " + error.message);
    },
  });

  // Delete artist mutation
  const deleteArtistMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("curated_artists")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Artiest verwijderd");
      queryClient.invalidateQueries({ queryKey: ["master-artists"] });
      queryClient.invalidateQueries({ queryKey: ["master-artists-stats"] });
    },
    onError: (error: any) => {
      toast.error("Fout bij verwijderen: " + error.message);
    },
  });

  // Sync content status
  const syncContentStatus = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-artist-content-status");
      
      if (error) throw error;
      
      toast.success(`Content status gesynchroniseerd: ${data?.updated || 0} artiesten bijgewerkt`);
      queryClient.invalidateQueries({ queryKey: ["master-artists"] });
      queryClient.invalidateQueries({ queryKey: ["master-artists-stats"] });
    } catch (error: any) {
      toast.error("Fout bij synchroniseren: " + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle bulk add
  const handleBulkAdd = () => {
    const lines = bulkArtistsText
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (lines.length === 0) {
      toast.error("Voer minimaal 1 artiest in");
      return;
    }

    bulkAddMutation.mutate(lines);
  };

  // Handle single add
  const handleAddArtist = () => {
    if (!newArtistName.trim()) {
      toast.error("Voer een artiestennaam in");
      return;
    }
    addArtistMutation.mutate({
      name: newArtistName,
      country: newArtistCountry,
      genre: newArtistGenre,
    });
  };

  const getCountryFlag = (code: string | null) => {
    const country = COUNTRY_OPTIONS.find(c => c.value === code);
    return country ? country.label.split(" ")[0] : "🌍";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="h-8 w-8 text-yellow-500" />
            Master Artists
          </h1>
          <p className="text-muted-foreground mt-1">
            Centrale artiestendatabase - basis voor alle content generatie
          </p>
        </div>
        <Button onClick={syncContentStatus} disabled={isSyncing} variant="outline">
          {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Sync Status
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Totaal Artiesten</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.withStory || 0}</p>
                <p className="text-xs text-muted-foreground">Met Artist Story</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.withoutStory || 0}</p>
                <p className="text-xs text-muted-foreground">Zonder Story</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-cyan-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.withDiscogsId || 0}</p>
                <p className="text-xs text-muted-foreground">Met Discogs ID</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Disc3 className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.albumsProcessed || 0}</p>
                <p className="text-xs text-muted-foreground">Album Verhalen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.singlesProcessed || 0}</p>
                <p className="text-xs text-muted-foreground">Singles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-pink-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.productsCreated || 0}</p>
                <p className="text-xs text-muted-foreground">Producten</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Artiesten Overzicht</TabsTrigger>
          <TabsTrigger value="albums" className="flex items-center gap-1">
            <Database className="h-4 w-4" />
            Albums Database
          </TabsTrigger>
          <TabsTrigger value="add">Artiesten Toevoegen</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Zoek artiest..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={filterCountry} onValueChange={setFilterCountry}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Land" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle landen</SelectItem>
                    {COUNTRY_OPTIONS.map(country => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterGenre} onValueChange={setFilterGenre}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle genres</SelectItem>
                    {GENRE_OPTIONS.map(genre => (
                      <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterContentStatus} onValueChange={setFilterContentStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Content Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle artiesten</SelectItem>
                    <SelectItem value="with_story">Met Artist Story</SelectItem>
                    <SelectItem value="without_story">Zonder Artist Story</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-[180px]">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sorteren" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="priority">Prioriteit</SelectItem>
                    <SelectItem value="a-z">A → Z</SelectItem>
                    <SelectItem value="z-a">Z → A</SelectItem>
                    <SelectItem value="most-albums">Meeste albums</SelectItem>
                    <SelectItem value="least-albums">Minste albums</SelectItem>
                    <SelectItem value="most-singles">Meeste singles</SelectItem>
                    <SelectItem value="least-singles">Minste singles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Artists Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Artiest</TableHead>
                        <TableHead>Land</TableHead>
                        <TableHead className="text-center">🎤 Story</TableHead>
                        <TableHead className="text-center">
                          <div className="text-xs">📀 Albums</div>
                          <div className="text-[10px] text-muted-foreground">ontdekt / blogs</div>
                        </TableHead>
                        <TableHead className="text-center">
                          <div className="text-xs">🎵 Singles</div>
                          <div className="text-[10px] text-muted-foreground">ontdekt / stories</div>
                        </TableHead>
                        <TableHead className="text-center">🛍️ Products</TableHead>
                        <TableHead className="text-center">Prioriteit</TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {artists?.map((artist) => (
                        <TableRow key={artist.id}>
                          <TableCell className="font-medium">
                            <div>{artist.artist_name}</div>
                            {artist.genre && (
                              <Badge variant="secondary" className="text-[10px] mt-1">{artist.genre}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-lg">{getCountryFlag(artist.country_code)}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            {artist.has_artist_story ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className={artist.albums_count ? "font-bold text-blue-600" : "text-muted-foreground"}>
                                {artist.albums_count || 0}
                              </span>
                              <span className="text-muted-foreground">/</span>
                              <span className={artist.albums_processed ? "text-green-600" : "text-muted-foreground"}>
                                {artist.albums_processed || 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className={artist.singles_count ? "font-bold text-purple-600" : "text-muted-foreground"}>
                                {artist.singles_count || 0}
                              </span>
                              <span className="text-muted-foreground">/</span>
                              <span className={artist.singles_processed ? "text-green-600" : "text-muted-foreground"}>
                                {artist.singles_processed || 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={artist.products_created ? "font-medium text-pink-600" : "text-muted-foreground"}>
                              {artist.products_created || 0}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={artist.priority && artist.priority >= 80 ? "default" : "outline"}>
                              {artist.priority || 50}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm(`Weet je zeker dat je "${artist.artist_name}" wilt verwijderen?`)) {
                                  deleteArtistMutation.mutate(artist.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!artists || artists.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            Geen artiesten gevonden
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
            Toont {artists?.length || 0} artiesten (max 500)
          </p>
        </TabsContent>

        {/* Albums Database Tab */}
        <TabsContent value="albums">
          <MasterAlbumsTab />
        </TabsContent>

        {/* Add Single Artist Tab */}
        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Nieuwe Artiest Toevoegen
              </CardTitle>
              <CardDescription>
                Voeg individuele artiesten toe aan de master lijst
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Artiestnaam *</label>
                  <Input
                    placeholder="bijv. The Beatles"
                    value={newArtistName}
                    onChange={(e) => setNewArtistName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Land</label>
                  <Select value={newArtistCountry} onValueChange={setNewArtistCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer land" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_OPTIONS.map(country => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Genre</label>
                  <Select value={newArtistGenre} onValueChange={setNewArtistGenre}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRE_OPTIONS.map(genre => (
                        <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={handleAddArtist} 
                disabled={addArtistMutation.isPending}
              >
                {addArtistMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Artiest Toevoegen
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Import Tab */}
        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Bulk Import
              </CardTitle>
              <CardDescription>
                Voeg meerdere artiesten tegelijk toe (1 per regel). Duplicaten worden automatisch overgeslagen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={`Madonna
Michael Jackson
Prince
Whitney Houston
The Beatles
Rolling Stones`}
                value={bulkArtistsText}
                onChange={(e) => setBulkArtistsText(e.target.value)}
                rows={10}
                className="font-mono"
              />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {bulkArtistsText.split("\n").filter(l => l.trim()).length} artiesten om te importeren
                </p>
                <Button 
                  onClick={handleBulkAdd} 
                  disabled={bulkAddMutation.isPending || !bulkArtistsText.trim()}
                >
                  {bulkAddMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Importeren
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
