import { useState, useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Upload, Copy, Check, Rss, Music, Mic, ExternalLink, Loader2, Play, Pause, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useOwnPodcasts,
  useOwnPodcastEpisodes,
  useCreatePodcast,
  useUpdatePodcast,
  useDeletePodcast,
  useCreateEpisode,
  useUpdateEpisode,
  useDeleteEpisode,
  uploadPodcastAudio,
  uploadPodcastArtwork,
  getRSSFeedUrl,
  type OwnPodcast,
  type OwnPodcastEpisode,
} from '@/hooks/useOwnPodcasts';

const ITUNES_CATEGORIES = [
  'Arts', 'Business', 'Comedy', 'Education', 'Fiction', 'Government',
  'Health & Fitness', 'History', 'Kids & Family', 'Leisure', 'Music',
  'News', 'Religion & Spirituality', 'Science', 'Society & Culture',
  'Sports', 'Technology', 'True Crime', 'TV & Film'
];

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function OwnPodcasts() {
  const { toast } = useToast();
  const [selectedPodcast, setSelectedPodcast] = useState<OwnPodcast | null>(null);
  const [activeTab, setActiveTab] = useState('podcasts');
  const [showCreatePodcast, setShowCreatePodcast] = useState(false);
  const [showCreateEpisode, setShowCreateEpisode] = useState(false);
  const [showEditPodcast, setShowEditPodcast] = useState(false);
  const [showEditEpisode, setShowEditEpisode] = useState(false);
  const [editingPodcast, setEditingPodcast] = useState<OwnPodcast | null>(null);
  const [editingEpisode, setEditingEpisode] = useState<OwnPodcastEpisode | null>(null);
  const [copiedFeed, setCopiedFeed] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [playingEpisode, setPlayingEpisode] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [editArtworkFile, setEditArtworkFile] = useState<File | null>(null);
  const [editAudioFile, setEditAudioFile] = useState<File | null>(null);

  // Form states
  const [podcastForm, setPodcastForm] = useState({
    name: '',
    description: '',
    slug: '',
    author: 'MusicScan',
    owner_name: 'MusicScan',
    owner_email: 'podcast@musicscan.nl',
    category: 'Music',
    explicit: false,
  });

  const [episodeForm, setEpisodeForm] = useState({
    title: '',
    description: '',
    audio_url: '',
    audio_file_size: 0,
    audio_duration_seconds: 0,
    episode_number: 1,
    season_number: 1,
  });

  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const { data: podcasts, isLoading: podcastsLoading } = useOwnPodcasts();
  const { data: episodes, isLoading: episodesLoading } = useOwnPodcastEpisodes(selectedPodcast?.id || null);

  const createPodcast = useCreatePodcast();
  const updatePodcast = useUpdatePodcast();
  const deletePodcast = useDeletePodcast();
  const createEpisode = useCreateEpisode();
  const updateEpisode = useUpdateEpisode();
  const deleteEpisode = useDeleteEpisode();

  const handleCreatePodcast = async () => {
    try {
      setIsUploading(true);
      let artworkUrl = '';

      if (artworkFile) {
        artworkUrl = await uploadPodcastArtwork(artworkFile, podcastForm.slug);
      }

      await createPodcast.mutateAsync({
        ...podcastForm,
        artwork_url: artworkUrl || undefined,
      });

      setShowCreatePodcast(false);
      setPodcastForm({
        name: '',
        description: '',
        slug: '',
        author: 'MusicScan',
        owner_name: 'MusicScan',
        owner_email: 'podcast@musicscan.nl',
        category: 'Music',
        explicit: false,
      });
      setArtworkFile(null);
    } catch (error) {
      console.error('Error creating podcast:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateEpisode = async () => {
    if (!selectedPodcast || !audioFile) return;

    try {
      setIsUploading(true);

      // Upload audio file
      const audioUrl = await uploadPodcastAudio(audioFile, selectedPodcast.slug);

      // Get audio duration
      const audioDuration = await getAudioDuration(audioFile);

      await createEpisode.mutateAsync({
        podcast_id: selectedPodcast.id,
        title: episodeForm.title,
        description: episodeForm.description,
        audio_url: audioUrl,
        audio_file_size: audioFile.size,
        audio_duration_seconds: audioDuration,
        episode_number: episodeForm.episode_number,
        season_number: episodeForm.season_number,
      });

      setShowCreateEpisode(false);
      setEpisodeForm({
        title: '',
        description: '',
        audio_url: '',
        audio_file_size: 0,
        audio_duration_seconds: 0,
        episode_number: (episodes?.length || 0) + 1,
        season_number: 1,
      });
      setAudioFile(null);
    } catch (error) {
      console.error('Error creating episode:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        resolve(Math.round(audio.duration));
      };
      audio.onerror = () => resolve(0);
      audio.src = URL.createObjectURL(file);
    });
  };

  const copyFeedUrl = (slug: string) => {
    const url = getRSSFeedUrl(slug);
    navigator.clipboard.writeText(url);
    setCopiedFeed(slug);
    setTimeout(() => setCopiedFeed(null), 2000);
    toast({
      title: 'RSS Feed URL gekopieerd',
      description: 'Je kunt deze URL nu toevoegen aan Spotify for Podcasters.',
    });
  };

  const togglePublished = async (podcast: OwnPodcast) => {
    await updatePodcast.mutateAsync({
      id: podcast.id,
      is_published: !podcast.is_published,
    });
  };

  const toggleEpisodePublished = async (episode: OwnPodcastEpisode) => {
    if (!selectedPodcast) return;
    await updateEpisode.mutateAsync({
      id: episode.id,
      podcast_id: selectedPodcast.id,
      is_published: !episode.is_published,
      published_at: !episode.is_published ? new Date().toISOString() : episode.published_at,
    });
  };

  const openEditDialog = (podcast: OwnPodcast) => {
    setEditingPodcast(podcast);
    setPodcastForm({
      name: podcast.name,
      description: podcast.description || '',
      slug: podcast.slug,
      author: podcast.author,
      owner_name: podcast.owner_name,
      owner_email: podcast.owner_email,
      category: podcast.category,
      explicit: podcast.explicit,
    });
    setEditArtworkFile(null);
    setShowEditPodcast(true);
  };

  const handleUpdatePodcast = async () => {
    if (!editingPodcast) return;
    
    try {
      setIsUploading(true);
      let artworkUrl = editingPodcast.artwork_url;

      if (editArtworkFile) {
        artworkUrl = await uploadPodcastArtwork(editArtworkFile, podcastForm.slug);
      }

      await updatePodcast.mutateAsync({
        id: editingPodcast.id,
        name: podcastForm.name,
        description: podcastForm.description || null,
        author: podcastForm.author,
        owner_name: podcastForm.owner_name,
        owner_email: podcastForm.owner_email,
        category: podcastForm.category,
        explicit: podcastForm.explicit,
        artwork_url: artworkUrl,
      });

      setShowEditPodcast(false);
      setEditingPodcast(null);
      setEditArtworkFile(null);
    } catch (error) {
      console.error('Error updating podcast:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const openEditEpisode = (episode: OwnPodcastEpisode) => {
    setEditingEpisode(episode);
    setEpisodeForm({
      title: episode.title,
      description: episode.description || '',
      audio_url: episode.audio_url,
      audio_file_size: episode.audio_file_size || 0,
      audio_duration_seconds: episode.audio_duration_seconds || 0,
      episode_number: episode.episode_number || 1,
      season_number: episode.season_number || 1,
    });
    setEditAudioFile(null);
    setShowEditEpisode(true);
  };

  const handleUpdateEpisode = async () => {
    if (!editingEpisode || !selectedPodcast) return;
    
    try {
      setIsUploading(true);
      let audioUrl = editingEpisode.audio_url;
      let audioFileSize = editingEpisode.audio_file_size;
      let audioDuration = editingEpisode.audio_duration_seconds;

      if (editAudioFile) {
        audioUrl = await uploadPodcastAudio(editAudioFile, selectedPodcast.slug);
        audioFileSize = editAudioFile.size;
        audioDuration = await getAudioDuration(editAudioFile);
      }

      await updateEpisode.mutateAsync({
        id: editingEpisode.id,
        podcast_id: selectedPodcast.id,
        title: episodeForm.title,
        description: episodeForm.description || null,
        audio_url: audioUrl,
        audio_file_size: audioFileSize,
        audio_duration_seconds: audioDuration,
        episode_number: episodeForm.episode_number,
        season_number: episodeForm.season_number,
      });

      setShowEditEpisode(false);
      setEditingEpisode(null);
      setEditAudioFile(null);
    } catch (error) {
      console.error('Error updating episode:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const playEpisode = (episode: OwnPodcastEpisode) => {
    if (playingEpisode === episode.id) {
      audioRef.current?.pause();
      setPlayingEpisode(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = episode.audio_url;
        audioRef.current.play();
      }
      setPlayingEpisode(episode.id);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Eigen Podcasts</h1>
            <p className="text-muted-foreground">
              Beheer je eigen podcasts en genereer RSS feeds voor Spotify
            </p>
          </div>
          <Dialog open={showCreatePodcast} onOpenChange={setShowCreatePodcast}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe Podcast
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nieuwe Podcast Aanmaken</DialogTitle>
                <DialogDescription>
                  Maak een nieuwe podcast aan. Na aanmaken kun je episodes toevoegen.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Podcast Naam *</Label>
                  <Input
                    id="name"
                    value={podcastForm.name}
                    onChange={(e) => {
                      setPodcastForm({
                        ...podcastForm,
                        name: e.target.value,
                        slug: generateSlug(e.target.value),
                      });
                    }}
                    placeholder="MusicScan Podcast"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={podcastForm.slug}
                    onChange={(e) => setPodcastForm({ ...podcastForm, slug: e.target.value })}
                    placeholder="musicscan-podcast"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Beschrijving</Label>
                  <Textarea
                    id="description"
                    value={podcastForm.description}
                    onChange={(e) => setPodcastForm({ ...podcastForm, description: e.target.value })}
                    placeholder="Een podcast over muziek..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="author">Auteur</Label>
                    <Input
                      id="author"
                      value={podcastForm.author}
                      onChange={(e) => setPodcastForm({ ...podcastForm, author: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categorie</Label>
                    <Select
                      value={podcastForm.category}
                      onValueChange={(value) => setPodcastForm({ ...podcastForm, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ITUNES_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="artwork">Podcast Artwork (min. 1400x1400px)</Label>
                  <Input
                    id="artwork"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setArtworkFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="explicit"
                    checked={podcastForm.explicit}
                    onCheckedChange={(checked) => setPodcastForm({ ...podcastForm, explicit: checked })}
                  />
                  <Label htmlFor="explicit">Expliciete content</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreatePodcast(false)}>
                  Annuleren
                </Button>
                <Button onClick={handleCreatePodcast} disabled={!podcastForm.name || isUploading}>
                  {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Aanmaken
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="podcasts">
              <Mic className="h-4 w-4 mr-2" />
              Podcasts ({podcasts?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="episodes" disabled={!selectedPodcast}>
              <Music className="h-4 w-4 mr-2" />
              Episodes {selectedPodcast ? `(${episodes?.length || 0})` : ''}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="podcasts" className="space-y-4">
            {podcastsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : podcasts?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Mic className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nog geen podcasts aangemaakt</p>
                  <Button className="mt-4" onClick={() => setShowCreatePodcast(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Eerste Podcast Aanmaken
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {podcasts?.map((podcast) => (
                  <Card key={podcast.id} className="relative">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {podcast.artwork_url ? (
                            <img
                              src={podcast.artwork_url}
                              alt={podcast.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                              <Mic className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <CardTitle className="text-lg">{podcast.name}</CardTitle>
                            <CardDescription>{podcast.category}</CardDescription>
                          </div>
                        </div>
                        <Badge variant={podcast.is_published ? 'default' : 'secondary'}>
                          {podcast.is_published ? 'Live' : 'Draft'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {podcast.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {podcast.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                        <Rss className="h-4 w-4 text-orange-500" />
                        <span className="text-xs font-mono truncate flex-1">
                          {getRSSFeedUrl(podcast.slug)}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyFeedUrl(podcast.slug)}
                        >
                          {copiedFeed === podcast.slug ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={podcast.is_published}
                            onCheckedChange={() => togglePublished(podcast)}
                          />
                          <span className="text-sm">Publiceren</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPodcast(podcast);
                              setActiveTab('episodes');
                            }}
                          >
                            Episodes
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(podcast)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(getRSSFeedUrl(podcast.slug), '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => {
                              if (confirm('Weet je zeker dat je deze podcast wilt verwijderen?')) {
                                deletePodcast.mutate(podcast.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="episodes" className="space-y-4">
            {selectedPodcast && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedPodcast.artwork_url && (
                      <img
                        src={selectedPodcast.artwork_url}
                        alt={selectedPodcast.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h2 className="text-xl font-semibold">{selectedPodcast.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        {episodes?.length || 0} episodes
                      </p>
                    </div>
                  </div>
                  <Dialog open={showCreateEpisode} onOpenChange={setShowCreateEpisode}>
                    <DialogTrigger asChild>
                      <Button>
                        <Upload className="h-4 w-4 mr-2" />
                        Episode Uploaden
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Nieuwe Episode Uploaden</DialogTitle>
                        <DialogDescription>
                          Upload een audio bestand voor een nieuwe episode.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="episodeTitle">Episode Titel *</Label>
                          <Input
                            id="episodeTitle"
                            value={episodeForm.title}
                            onChange={(e) => setEpisodeForm({ ...episodeForm, title: e.target.value })}
                            placeholder="Aflevering 1: Introductie"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="episodeDescription">Beschrijving</Label>
                          <Textarea
                            id="episodeDescription"
                            value={episodeForm.description}
                            onChange={(e) => setEpisodeForm({ ...episodeForm, description: e.target.value })}
                            placeholder="In deze aflevering..."
                            rows={3}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="seasonNumber">Seizoen</Label>
                            <Input
                              id="seasonNumber"
                              type="number"
                              min={1}
                              value={episodeForm.season_number}
                              onChange={(e) => setEpisodeForm({ ...episodeForm, season_number: parseInt(e.target.value) || 1 })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="episodeNumber">Episode Nr.</Label>
                            <Input
                              id="episodeNumber"
                              type="number"
                              min={1}
                              value={episodeForm.episode_number}
                              onChange={(e) => setEpisodeForm({ ...episodeForm, episode_number: parseInt(e.target.value) || 1 })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="audioFile">Audio Bestand * (MP3, M4A, WAV)</Label>
                          <Input
                            id="audioFile"
                            type="file"
                            accept="audio/mpeg,audio/mp3,audio/wav,audio/m4a,audio/x-m4a,audio/mp4"
                            onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                          />
                          {audioFile && (
                            <p className="text-xs text-muted-foreground">
                              {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                            </p>
                          )}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateEpisode(false)}>
                          Annuleren
                        </Button>
                        <Button
                          onClick={handleCreateEpisode}
                          disabled={!episodeForm.title || !audioFile || isUploading}
                        >
                          {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                          Uploaden
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {episodesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : episodes?.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Music className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nog geen episodes</p>
                      <Button className="mt-4" onClick={() => setShowCreateEpisode(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Eerste Episode Uploaden
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {episodes?.map((episode) => (
                      <Card key={episode.id}>
                        <CardContent className="flex items-center gap-4 py-4">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="shrink-0"
                            onClick={() => playEpisode(episode)}
                          >
                            {playingEpisode === episode.id ? (
                              <Pause className="h-5 w-5" />
                            ) : (
                              <Play className="h-5 w-5" />
                            )}
                          </Button>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-muted-foreground">
                                S{episode.season_number}E{episode.episode_number}
                              </span>
                              <h3 className="font-medium truncate">{episode.title}</h3>
                            </div>
                            {episode.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {episode.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <span className="text-sm text-muted-foreground">
                              {formatDuration(episode.audio_duration_seconds)}
                            </span>
                            <Badge variant={episode.is_published ? 'default' : 'secondary'}>
                              {episode.is_published ? 'Live' : 'Draft'}
                            </Badge>
                            <Switch
                              checked={episode.is_published}
                              onCheckedChange={() => toggleEpisodePublished(episode)}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditEpisode(episode)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => {
                                if (confirm('Episode verwijderen?')) {
                                  deleteEpisode.mutate({
                                    id: episode.id,
                                    podcast_id: selectedPodcast.id,
                                  });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Hidden audio element for playback */}
        <audio
          ref={audioRef}
          onEnded={() => setPlayingEpisode(null)}
          className="hidden"
        />

        {/* Edit Podcast Dialog */}
        <Dialog open={showEditPodcast} onOpenChange={setShowEditPodcast}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Podcast Bewerken</DialogTitle>
              <DialogDescription>
                Bewerk de podcast gegevens en artwork.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Podcast Naam *</Label>
                <Input
                  id="editName"
                  value={podcastForm.name}
                  onChange={(e) => setPodcastForm({ ...podcastForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDescription">Beschrijving</Label>
                <Textarea
                  id="editDescription"
                  value={podcastForm.description}
                  onChange={(e) => setPodcastForm({ ...podcastForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editAuthor">Auteur</Label>
                  <Input
                    id="editAuthor"
                    value={podcastForm.author}
                    onChange={(e) => setPodcastForm({ ...podcastForm, author: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editCategory">Categorie</Label>
                  <Select
                    value={podcastForm.category}
                    onValueChange={(value) => setPodcastForm({ ...podcastForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ITUNES_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editArtwork">Nieuwe Artwork (min. 1400x1400px)</Label>
                {editingPodcast?.artwork_url && !editArtworkFile && (
                  <div className="flex items-center gap-2 mb-2">
                    <img 
                      src={editingPodcast.artwork_url} 
                      alt="Current artwork" 
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <span className="text-sm text-muted-foreground">Huidige artwork</span>
                  </div>
                )}
                <Input
                  id="editArtwork"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditArtworkFile(e.target.files?.[0] || null)}
                />
                {editArtworkFile && (
                  <p className="text-xs text-muted-foreground">
                    Nieuwe: {editArtworkFile.name}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="editExplicit"
                  checked={podcastForm.explicit}
                  onCheckedChange={(checked) => setPodcastForm({ ...podcastForm, explicit: checked })}
                />
                <Label htmlFor="editExplicit">Expliciete content</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditPodcast(false)}>
                Annuleren
              </Button>
              <Button onClick={handleUpdatePodcast} disabled={!podcastForm.name || isUploading}>
                {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Opslaan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Episode Dialog */}
        <Dialog open={showEditEpisode} onOpenChange={setShowEditEpisode}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Episode Bewerken</DialogTitle>
              <DialogDescription>
                Bewerk de episode gegevens of upload een nieuw audio bestand.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editEpisodeTitle">Episode Titel *</Label>
                <Input
                  id="editEpisodeTitle"
                  value={episodeForm.title}
                  onChange={(e) => setEpisodeForm({ ...episodeForm, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEpisodeDescription">Beschrijving</Label>
                <Textarea
                  id="editEpisodeDescription"
                  value={episodeForm.description}
                  onChange={(e) => setEpisodeForm({ ...episodeForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editSeasonNumber">Seizoen</Label>
                  <Input
                    id="editSeasonNumber"
                    type="number"
                    min={1}
                    value={episodeForm.season_number}
                    onChange={(e) => setEpisodeForm({ ...episodeForm, season_number: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEpisodeNumber">Episode Nr.</Label>
                  <Input
                    id="editEpisodeNumber"
                    type="number"
                    min={1}
                    value={episodeForm.episode_number}
                    onChange={(e) => setEpisodeForm({ ...episodeForm, episode_number: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editAudioFile">Nieuw Audio Bestand (MP3, M4A, WAV)</Label>
                {editingEpisode?.audio_url && !editAudioFile && (
                  <div className="flex items-center gap-2 mb-2 p-2 bg-muted/50 rounded-lg">
                    <Music className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground truncate flex-1">
                      Huidige audio: {formatDuration(editingEpisode.audio_duration_seconds)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.src = editingEpisode.audio_url;
                          audioRef.current.play();
                        }
                      }}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Input
                  id="editAudioFile"
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/wav,audio/m4a,audio/x-m4a,audio/mp4"
                  onChange={(e) => setEditAudioFile(e.target.files?.[0] || null)}
                />
                {editAudioFile && (
                  <p className="text-xs text-muted-foreground">
                    Nieuwe: {editAudioFile.name} ({(editAudioFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditEpisode(false)}>
                Annuleren
              </Button>
              <Button onClick={handleUpdateEpisode} disabled={!episodeForm.title || isUploading}>
                {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Opslaan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
