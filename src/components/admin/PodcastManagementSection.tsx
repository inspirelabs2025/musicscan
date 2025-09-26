import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Headphones, Search, Plus, RefreshCw, Trash2, Star, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  useCuratedPodcasts, 
  usePodcastEpisodes,
  useSearchPodcasts,
  useAddCuratedShow,
  useAddCuratedShowByUrl,
  useSyncEpisodes,
  useToggleFeaturedEpisode,
  CuratedShow 
} from "@/hooks/useCuratedPodcasts";

const CATEGORIES = [
  'General',
  'Music History', 
  'Artist Interviews',
  'Music Production',
  'Genre Specific',
  'Industry News'
];

export const PodcastManagementSection = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [curatorNotes, setCuratorNotes] = useState('');
  const [selectedShow, setSelectedShow] = useState<CuratedShow | null>(null);

  const { data: curatedShows = [] } = useCuratedPodcasts();
  const { data: episodes = [] } = usePodcastEpisodes(selectedShow?.id || '');
  
  const searchMutation = useSearchPodcasts();
  const addShowMutation = useAddCuratedShow();
  const addShowByUrlMutation = useAddCuratedShowByUrl();
  const syncEpisodesMutation = useSyncEpisodes();
  const toggleFeaturedMutation = useToggleFeaturedEpisode();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      await searchMutation.mutateAsync(searchQuery);
      toast({
        title: "Zoekresultaten",
        description: `${searchMutation.data?.length || 0} podcasts gevonden voor "${searchQuery}"`,
      });
    } catch (error) {
      toast({
        title: "Zoekfout",
        description: "Er ging iets mis bij het zoeken naar podcasts.",
        variant: "destructive",
      });
    }
  };

  const handleAddShow = async (spotifyShowId: string) => {
    try {
      await addShowMutation.mutateAsync({
        spotify_show_id: spotifyShowId,
        category: selectedCategory,
        curator_notes: curatorNotes.trim() || undefined,
      });
      
      toast({
        title: "Podcast toegevoegd",
        description: "De podcast is succesvol toegevoegd aan de gecureerde lijst.",
      });
      
      setCuratorNotes('');
    } catch (error) {
      toast({
        title: "Fout bij toevoegen",
        description: "Er ging iets mis bij het toevoegen van de podcast.",
        variant: "destructive",
      });
    }
  };

  const handleAddShowByUrl = async () => {
    if (!spotifyUrl.trim()) return;
    
    try {
      await addShowByUrlMutation.mutateAsync({
        spotify_url: spotifyUrl,
        category: selectedCategory,
        curator_notes: curatorNotes.trim() || undefined,
      });
      
      toast({
        title: "Podcast toegevoegd via URL",
        description: "De podcast is succesvol toegevoegd aan de gecureerde lijst.",
      });
      
      setSpotifyUrl('');
      setCuratorNotes('');
    } catch (error: any) {
      toast({
        title: "Fout bij toevoegen",
        description: error?.message || "Er ging iets mis bij het toevoegen van de podcast via URL.",
        variant: "destructive",
      });
    }
  };

  const handleSyncEpisodes = async (showId: string) => {
    try {
      const result = await syncEpisodesMutation.mutateAsync(showId);
      toast({
        title: "Episodes gesynchroniseerd",
        description: `${result.episodes_synced} afleveringen bijgewerkt.`,
      });
} catch (error: any) {
  const message = error?.message || (typeof error === 'string' ? error : 'Er ging iets mis bij het synchroniseren van afleveringen.');
  toast({
    title: "Synchronisatiefout",
    description: message,
    variant: "destructive",
  });
}
  };

  const handleToggleFeatured = async (episodeId: string, isFeatured: boolean) => {
    try {
      await toggleFeaturedMutation.mutateAsync({ episodeId, isFeatured });
      toast({
        title: isFeatured ? "Episode als featured gemarkeerd" : "Featured status verwijderd",
        description: "De wijziging is opgeslagen.",
      });
    } catch (error) {
      toast({
        title: "Fout bij bijwerken",
        description: "Er ging iets mis bij het bijwerken van de episode status.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="w-5 h-5" />
            Podcast Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add by URL */}
          <div className="space-y-4">
            <h3 className="font-semibold">Toevoegen via Spotify URL</h3>
            <div className="flex gap-2">
              <Input
                placeholder="https://open.spotify.com/show/..."
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddShowByUrl()}
                className="flex-1"
              />
              <Button 
                onClick={handleAddShowByUrl}
                disabled={addShowByUrlMutation.isPending || !spotifyUrl.trim()}
              >
                <Plus className="w-4 h-4" />
                Toevoegen
              </Button>
            </div>
          </div>

          {/* Search New Podcasts */}
          <div className="space-y-4">
            <h3 className="font-semibold">Of Zoeken naar Nieuwe Podcasts</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Zoek Spotify podcasts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch}
                disabled={searchMutation.isPending || !searchQuery.trim()}
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Curator notities (optioneel)"
                value={curatorNotes}
                onChange={(e) => setCuratorNotes(e.target.value)}
                className="min-h-[40px]"
              />
            </div>

            {/* Search Results */}
            {searchMutation.data && searchMutation.data.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Zoekresultaten:</h4>
                <div className="grid gap-3 max-h-60 overflow-y-auto">
                  {searchMutation.data.map((show: any) => (
                    <div key={show.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      {show.images?.[0] && (
                        <img src={show.images[0].url} alt={show.name} className="w-12 h-12 rounded" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-sm truncate">{show.name}</h5>
                        <p className="text-xs text-muted-foreground">{show.publisher}</p>
                        <p className="text-xs text-muted-foreground">{show.total_episodes} episodes</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddShow(show.id)}
                        disabled={addShowMutation.isPending}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Toevoegen
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Curated Shows Management */}
      <Card>
        <CardHeader>
          <CardTitle>Gecureerde Podcasts ({curatedShows.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {curatedShows.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nog geen gecureerde podcasts. Zoek en voeg podcasts toe om te beginnen.
              </p>
            ) : (
              <div className="space-y-3">
                {curatedShows.map((show) => (
                  <div key={show.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    {show.image_url && (
                      <img src={show.image_url} alt={show.name} className="w-12 h-12 rounded" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm truncate">{show.name}</h5>
                      <p className="text-xs text-muted-foreground">{show.publisher}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{show.category}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {show.total_episodes} afleveringen
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedShow(selectedShow?.id === show.id ? null : show)}
                      >
                        <Settings className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSyncEpisodes(show.id)}
                        disabled={syncEpisodesMutation.isPending}
                      >
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Episode Management */}
      {selectedShow && (
        <Card>
          <CardHeader>
            <CardTitle>Episodes - {selectedShow.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {episodes.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Geen afleveringen gevonden. Synchroniseer eerst de afleveringen.
                </p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {episodes.map((episode) => (
                    <div key={episode.id} className="flex items-center gap-3 p-2 border rounded">
                      <div className="flex-1 min-w-0">
                        <h6 className="text-sm font-medium truncate">{episode.name}</h6>
                        <p className="text-xs text-muted-foreground">
                          {episode.release_date && new Date(episode.release_date).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={episode.is_featured ? "default" : "outline"}
                        onClick={() => handleToggleFeatured(episode.id, !episode.is_featured)}
                        disabled={toggleFeaturedMutation.isPending}
                      >
                        <Star className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};