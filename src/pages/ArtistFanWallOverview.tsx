import { useState } from "react";
import { useArtistFanwalls } from "@/hooks/useArtistFanwalls";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { ArtistCard } from "@/components/ArtistCard";

export default function ArtistFanWallOverview() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"photo_count" | "total_views" | "artist_name">("photo_count");

  const { data: artists, isLoading } = useArtistFanwalls(sortBy);

  const filteredArtists = artists?.filter((artist) =>
    artist.artist_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>FanWall - Artiesten Ontdekken | MusicScan</title>
        <meta
          name="description"
          content="Ontdek muziek herinneringen per artiest. Browse door duizenden fan foto's, concertmomenten en vinyl collecties georganiseerd per artiest."
        />
        <link rel="canonical" href="https://www.musicscan.app/fanwall" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">🎸 Artiest FanWall</h1>
            <p className="text-muted-foreground">
              Ontdek muziek herinneringen per artiest
            </p>
          </div>

          {/* Filters */}
          <Card className="p-4 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Zoek artiest..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Sorteer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photo_count">Meeste Foto's</SelectItem>
                  <SelectItem value="total_views">Populairste</SelectItem>
                  <SelectItem value="artist_name">Alfabetisch</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => navigate("/upload")} className="gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </div>
          </Card>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredArtists && filteredArtists.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredArtists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Geen artiesten gevonden</p>
              {!searchQuery && (
                <Button onClick={() => navigate("/upload")}>
                  Upload de eerste foto
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
