import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SpotifyAlbumSearchProps {
  onSelect: (coverUrl: string, spotifyUrl: string) => void;
  initialArtist?: string;
  initialAlbum?: string;
}

interface SpotifySearchResult {
  success: boolean;
  albumUrl?: string;
  coverImage?: string;
  artist: string;
  album: string;
  releaseDate?: string;
}

export const SpotifyAlbumSearch = ({ 
  onSelect, 
  initialArtist = "", 
  initialAlbum = "" 
}: SpotifyAlbumSearchProps) => {
  const [artist, setArtist] = useState(initialArtist);
  const [album, setAlbum] = useState(initialAlbum);
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<SpotifySearchResult | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!artist || !album) {
      toast({
        title: "Vul beide velden in",
        description: "Artiest en album zijn verplicht",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('spotify-album-search', {
        body: { artist, album }
      });

      if (error) throw error;

      if (data?.success && data?.coverImage) {
        setResult(data);
        toast({
          title: "Album gevonden!",
          description: `${data.artist} - ${data.album}`,
        });
      } else {
        toast({
          title: "Geen resultaten",
          description: "Probeer de spellingwijze te controleren",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Spotify search error:', error);
      toast({
        title: "Fout bij zoeken",
        description: error instanceof Error ? error.message : "Probeer het opnieuw",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = () => {
    if (result?.coverImage && result?.albumUrl) {
      onSelect(result.coverImage, result.albumUrl);
      toast({
        title: "Cover toegevoegd",
        description: "Album cover en Spotify link zijn ingevuld",
      });
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">Zoek Album op Spotify</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="search-artist">Artiest</Label>
          <Input
            id="search-artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="bijv. Sam Fender"
          />
        </div>
        <div>
          <Label htmlFor="search-album">Album</Label>
          <Input
            id="search-album"
            value={album}
            onChange={(e) => setAlbum(e.target.value)}
            placeholder="bijv. People Watching"
          />
        </div>
      </div>

      <Button 
        onClick={handleSearch} 
        disabled={isSearching || !artist || !album}
        className="w-full"
        variant="outline"
      >
        <Search className="h-4 w-4 mr-2" />
        {isSearching ? "Zoeken..." : "Zoek op Spotify"}
      </Button>

      {result?.coverImage && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <img 
              src={result.coverImage} 
              alt={`${result.artist} - ${result.album}`}
              className="w-24 h-24 rounded object-cover shadow-md"
            />
            <div className="flex-1">
              <p className="font-semibold">{result.artist}</p>
              <p className="text-sm text-muted-foreground">{result.album}</p>
              {result.releaseDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Release: {result.releaseDate}
                </p>
              )}
            </div>
          </div>
          <Button 
            onClick={handleSelectResult}
            className="w-full"
          >
            <Check className="h-4 w-4 mr-2" />
            Gebruik deze cover
          </Button>
        </div>
      )}
    </div>
  );
};
