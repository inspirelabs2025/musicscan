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
  useToggleFeaturedEpisode
} from '@/hooks/useCuratedPodcasts';
import { 
  useIndividualEpisodes, 
  useAddIndividualEpisode, 
  useToggleFeaturedIndividualEpisode, 
  useRemoveIndividualEpisode 
} from '@/hooks/useIndividualEpisodes';
import { PodcastCard } from '@/components/podcast/PodcastCard';
import { EpisodeCard } from '@/components/podcast/EpisodeCard';
import { IndividualEpisodeCard } from '@/components/podcast/IndividualEpisodeCard';
import { Label } from "@/components/ui/label";

const CATEGORIES = [
  'General',
  'Music History', 
  'Artist Interviews',
  'Music Production',
  'Industry News',
  'Album Reviews'
];

export const PodcastManagementSectionUpdated = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [curatorNotes, setCuratorNotes] = useState('');
  
  // Individual episode states
  const [episodeUrl, setEpisodeUrl] = useState('');
  const [episodeCategory, setEpisodeCategory] = useState('General');
  const [episodeNotes, setEpisodeNotes] = useState('');
  const [selectedShow, setSelectedShow] = useState<any | null>(null);

  const { data: curatedShows = [] } = useCuratedPodcasts();
  const { data: episodes = [] } = usePodcastEpisodes(selectedShow?.id || '');
  
  const searchMutation = useSearchPodcasts();
  const addShowMutation = useAddCuratedShow();
  const addShowByUrlMutation = useAddCuratedShowByUrl();
  const syncEpisodesMutation = useSyncEpisodes();
  const toggleFeaturedMutation = useToggleFeaturedEpisode();
  
  // Individual episode hooks
  const { data: individualEpisodes } = useIndividualEpisodes();
  const addIndividualEpisode = useAddIndividualEpisode();
  const toggleIndividualFeatured = useToggleFeaturedIndividualEpisode();
  const removeIndividualEpisode = useRemoveIndividualEpisode();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchMutation.mutate(searchQuery);
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
        url: spotifyUrl,
        category: selectedCategory,
        curator_notes: curatorNotes
      });
      
      toast({
        title: "Podcast toegevoegd",
        description: "De podcast is succesvol toegevoegd via URL.",
      });
      
      setSpotifyUrl('');
      setCuratorNotes('');
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error?.message || "Er ging iets mis bij het toevoegen van de podcast.",
        variant: "destructive",
      });
    }
  };

  const handleSyncEpisodes = async (showId: string) => {
    try {
      await syncEpisodesMutation.mutateAsync(showId);
      toast({
        title: "Synchronisatie voltooid",
        description: "Episodes zijn succesvol gesynchroniseerd.",
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

  const handleToggleFeatured = (episodeId: string) => {
    toggleFeaturedMutation.mutate({ episodeId, isFeatured: true });
  };

  const handleAddIndividualEpisode = () => {
    if (!episodeUrl.trim()) return;
    
    addIndividualEpisode.mutate({
      spotify_url: episodeUrl,
      category: episodeCategory,
      curator_notes: episodeNotes
    }, {
      onSuccess: () => {
        setEpisodeUrl('');
        setEpisodeCategory('General');
        setEpisodeNotes('');
      }
    });
  };

  const handleToggleIndividualFeatured = (episodeId: string) => {
    toggleIndividualFeatured.mutate(episodeId);
  };

  const handleRemoveIndividualEpisode = (episodeId: string) => {
    removeIndividualEpisode.mutate(episodeId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Podcast Beheer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add show by URL */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold">Podcast Toevoegen via URL</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="spotify-url">Spotify Show URL</Label>
                <Input
                  id="spotify-url"
                  placeholder="https://open.spotify.com/show/..."
                  value={spotifyUrl}
                  onChange={(e) => setSpotifyUrl(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="category">Categorie</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="curator-notes">Curator Notities (optioneel)</Label>
              <Textarea
                id="curator-notes"
                placeholder="Waarom is deze podcast interessant?"
                value={curatorNotes}
                onChange={(e) => setCuratorNotes(e.target.value)}
              />
            </div>
            <Button
              onClick={handleAddShowByUrl}
              disabled={!spotifyUrl.trim() || addShowByUrlMutation.isPending}
            >
              {addShowByUrlMutation.isPending ? 'Toevoegen...' : 'Podcast Toevoegen'}
            </Button>
          </div>

          {/* Add individual episode */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold">Losse Episode Toevoegen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="episode-url">Spotify Episode URL</Label>
                <Input
                  id="episode-url"
                  placeholder="https://open.spotify.com/episode/..."
                  value={episodeUrl}
                  onChange={(e) => setEpisodeUrl(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="episode-category">Categorie</Label>
                <Select value={episodeCategory} onValueChange={setEpisodeCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="episode-notes">Curator Notities (optioneel)</Label>
              <Textarea
                id="episode-notes"
                placeholder="Waarom is deze episode interessant?"
                value={episodeNotes}
                onChange={(e) => setEpisodeNotes(e.target.value)}
              />
            </div>
            <Button
              onClick={handleAddIndividualEpisode}
              disabled={!episodeUrl.trim() || addIndividualEpisode.isPending}
            >
              {addIndividualEpisode.isPending ? 'Toevoegen...' : 'Episode Toevoegen'}
            </Button>
          </div>

          {/* Search for new shows */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold">Zoek Nieuwe Podcasts</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Zoek naar podcasts op Spotify..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={!searchQuery.trim() || searchMutation.isPending}>
                <Search className="w-4 h-4 mr-2" />
                {searchMutation.isPending ? 'Zoeken...' : 'Zoek'}
              </Button>
            </div>
            
            {searchMutation.data?.shows && searchMutation.data.shows.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Zoekresultaten:</h4>
                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {searchMutation.data.shows.map((show: any) => (
                    <div key={show.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      {show.images?.[0]?.url && (
                        <img
                          src={show.images[0].url}
                          alt={show.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium truncate">{show.name}</h5>
                        <p className="text-sm text-muted-foreground truncate">{show.publisher}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddShow(show.id)}
                        disabled={addShowMutation.isPending}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Toevoegen
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Curated shows management */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Gecureerde Podcasts ({curatedShows.length})</h3>
            {curatedShows.length > 0 ? (
              <div className="grid gap-4">
                {curatedShows.map((show) => (
                  <div key={show.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      {show.image_url && (
                        <img
                          src={show.image_url}
                          alt={show.name}
                          className="w-16 h-16 rounded object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{show.name}</h4>
                        <p className="text-sm text-muted-foreground">{show.publisher}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">{show.category}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {show.total_episodes || 0} episodes
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSyncEpisodes(show.id)}
                          disabled={syncEpisodesMutation.isPending}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Sync Episodes
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedShow(selectedShow?.id === show.id ? null : show)}
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          {selectedShow?.id === show.id ? 'Sluiten' : 'Beheer'}
                        </Button>
                      </div>
                    </div>

                    {selectedShow?.id === show.id && episodes.length > 0 && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <h5 className="font-medium">Episodes ({episodes.length})</h5>
                        <div className="max-h-64 overflow-y-auto space-y-2">
                          {episodes.map((episode) => (
                            <div key={episode.id} className="flex items-center gap-3 p-2 border rounded">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{episode.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {episode.release_date && new Date(episode.release_date).toLocaleDateString('nl-NL')}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant={episode.is_featured ? "default" : "outline"}
                                onClick={() => handleToggleFeatured(episode.id)}
                              >
                                <Star className="w-3 h-3 mr-1" />
                                {episode.is_featured ? 'Featured' : 'Maak Featured'}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nog geen gecureerde podcasts toegevoegd.</p>
            )}
          </div>

          {/* Individual Episodes Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Losse Episodes ({individualEpisodes?.length || 0})</h3>
            {individualEpisodes && individualEpisodes.length > 0 ? (
              <div className="grid gap-4">
                {individualEpisodes.map((episode) => (
                  <IndividualEpisodeCard
                    key={episode.id}
                    episode={episode}
                    showActions={true}
                    onToggleFeatured={handleToggleIndividualFeatured}
                    onRemove={handleRemoveIndividualEpisode}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nog geen losse episodes toegevoegd.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};