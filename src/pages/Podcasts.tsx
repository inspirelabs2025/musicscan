import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Headphones, Search } from "lucide-react";
import { PodcastCard } from "@/components/podcast/PodcastCard";
import { PodcastCategoryFilter } from "@/components/podcast/PodcastCategoryFilter";
import { EpisodeCard } from "@/components/podcast/EpisodeCard";
import { useCuratedPodcasts, usePodcastEpisodes, CuratedShow } from "@/hooks/useCuratedPodcasts";

export default function Podcasts() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedShow, setSelectedShow] = useState<CuratedShow | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: shows = [], isLoading: showsLoading } = useCuratedPodcasts(selectedCategory);
  const { data: episodes = [], isLoading: episodesLoading } = usePodcastEpisodes(
    selectedShow?.id || '',
    false
  );

  const filteredShows = shows.filter(show =>
    searchQuery === '' ||
    show.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    show.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    show.publisher?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedShow) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <button
            onClick={() => setSelectedShow(null)}
            className="text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            ← Terug naar overzicht
          </button>
          
          <div className="flex items-start gap-4">
            {selectedShow.image_url && (
              <img
                src={selectedShow.image_url}
                alt={selectedShow.name}
                className="w-24 h-24 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold mb-2">{selectedShow.name}</h1>
              {selectedShow.publisher && (
                <p className="text-lg text-muted-foreground mb-2">{selectedShow.publisher}</p>
              )}
              {selectedShow.description && (
                <p className="text-sm text-muted-foreground">{selectedShow.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Afleveringen</h2>
          
          {episodesLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : episodes.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center">
                  Nog geen afleveringen beschikbaar voor deze podcast.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {episodes.map((episode) => (
                <EpisodeCard
                  key={episode.id}
                  episode={episode}
                  compact={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Headphones className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Muziek Podcasts</h1>
        </div>
        <p className="text-muted-foreground">
          Ontdek gecureerde muziekpodcasts met interviews, muziekgeschiedenis en industrie-inzichten.
        </p>
      </div>

      <div className="space-y-6 mb-8">
        <PodcastCategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek podcasts op naam, beschrijving of uitgever..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {showsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : filteredShows.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <Headphones className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'Geen podcasts gevonden' : 'Nog geen podcasts beschikbaar'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? `Er zijn geen podcasts gevonden voor "${searchQuery}". Probeer een andere zoekterm.`
                  : 'Er zijn nog geen gecureerde podcasts toegevoegd.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShows.map((show) => (
            <PodcastCard
              key={show.id}
              show={show}
              onViewEpisodes={(show) => setSelectedShow(show)}
            />
          ))}
        </div>
      )}
    </div>
  );
}