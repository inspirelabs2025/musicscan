import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useGenerateSockDesign } from "@/hooks/useGenerateSockDesign";
import { useAlbumSocks } from "@/hooks/useAlbumSocks";
import { useTrendingAlbums } from "@/hooks/useTrendingAlbums";
import { Loader2 } from "lucide-react";

export default function SockGenerator() {
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [customAlbumCover, setCustomAlbumCover] = useState("");
  const [customArtist, setCustomArtist] = useState("");
  const [customAlbum, setCustomAlbum] = useState("");
  const [patternType, setPatternType] = useState("auto");
  const [designTheme, setDesignTheme] = useState("auto");
  const [generateProducts, setGenerateProducts] = useState(true);
  const [generateVariants, setGenerateVariants] = useState(true);

  const { mutate: generateSock, isPending } = useGenerateSockDesign();
  const { data: recentSocks } = useAlbumSocks();
  const { data: trendingAlbums } = useTrendingAlbums();

  const handleGenerate = () => {
    const albumData = selectedAlbum || {
      artist: customArtist,
      title: customAlbum,
      cover_image: customAlbumCover,
    };

    if (!albumData.artist || !albumData.title || !albumData.cover_image) {
      return;
    }

    generateSock({
      artistName: albumData.artist,
      albumTitle: albumData.title,
      albumCoverUrl: albumData.cover_image,
      discogsId: albumData.discogs_id,
      releaseYear: albumData.year,
      genre: albumData.genre,
      generateProducts,
      generateStyleVariants: generateVariants,
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🧦 Socks of Sound Generator</h1>
        <p className="text-muted-foreground">
          Create AI-designed socks inspired by iconic album covers
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column: Album Selection */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>📀 Select Album</CardTitle>
              <CardDescription>Choose from trending albums or enter custom data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Trending Albums */}
              {trendingAlbums && trendingAlbums.length > 0 && (
                <div>
                  <Label className="mb-2 block">Recent Scans</Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {trendingAlbums.slice(0, 10).map((album) => (
                      <div
                        key={album.id}
                        className={`p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors ${
                          selectedAlbum?.id === album.id ? 'border-primary bg-accent' : ''
                        }`}
                        onClick={() => setSelectedAlbum(album)}
                      >
                        <div className="flex items-center gap-3">
                          {album.cover_image && (
                            <img
                              src={album.cover_image}
                              alt={album.title}
                              className="w-12 h-12 rounded object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{album.artist}</p>
                            <p className="text-sm text-muted-foreground truncate">{album.title}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Album Input */}
              <div className="space-y-3 pt-4 border-t">
                <Label>Or Enter Custom Album</Label>
                <Input
                  placeholder="Artist name"
                  value={customArtist}
                  onChange={(e) => setCustomArtist(e.target.value)}
                />
                <Input
                  placeholder="Album title"
                  value={customAlbum}
                  onChange={(e) => setCustomAlbum(e.target.value)}
                />
                <Input
                  placeholder="Album cover URL"
                  value={customAlbumCover}
                  onChange={(e) => setCustomAlbumCover(e.target.value)}
                />
              </div>

              {/* Album Preview */}
              {(selectedAlbum?.cover_image || customAlbumCover) && (
                <div className="pt-4">
                  <Label className="mb-2 block">Album Cover Preview</Label>
                  <img
                    src={selectedAlbum?.cover_image || customAlbumCover}
                    alt="Album cover"
                    className="w-full rounded-lg border"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Design Options */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🎨 Design Options</CardTitle>
              <CardDescription>Customize your sock design preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-3 block">Pattern Type</Label>
                <RadioGroup value={patternType} onValueChange={setPatternType}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="pattern-auto" />
                    <Label htmlFor="pattern-auto" className="cursor-pointer">Auto-detect from album</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="stripes" id="pattern-stripes" />
                    <Label htmlFor="pattern-stripes" className="cursor-pointer">Stripes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="geometric" id="pattern-geometric" />
                    <Label htmlFor="pattern-geometric" className="cursor-pointer">Geometric</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="abstract" id="pattern-abstract" />
                    <Label htmlFor="pattern-abstract" className="cursor-pointer">Abstract</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="mb-3 block">Design Theme</Label>
                <RadioGroup value={designTheme} onValueChange={setDesignTheme}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="theme-auto" />
                    <Label htmlFor="theme-auto" className="cursor-pointer">Auto from album</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="minimalist" id="theme-minimalist" />
                    <Label htmlFor="theme-minimalist" className="cursor-pointer">Minimalist</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bold" id="theme-bold" />
                    <Label htmlFor="theme-bold" className="cursor-pointer">Bold</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="psychedelic" id="theme-psychedelic" />
                    <Label htmlFor="theme-psychedelic" className="cursor-pointer">Psychedelic</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateVariants}
                    onChange={(e) => setGenerateVariants(e.target.checked)}
                    className="rounded"
                  />
                  Generate 7 style variants
                </Label>
                <Label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateProducts}
                    onChange={(e) => setGenerateProducts(e.target.checked)}
                    className="rounded"
                  />
                  Create shop products automatically
                </Label>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isPending || (!selectedAlbum && (!customArtist || !customAlbum || !customAlbumCover))}
                className="w-full"
                size="lg"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Socks...
                  </>
                ) : (
                  '🚀 Generate Sock Design'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Socks */}
          {recentSocks && recentSocks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Sock Designs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentSocks.slice(0, 5).map((sock) => (
                    <div key={sock.id} className="flex items-center gap-3 p-2 rounded border">
                      {sock.base_design_url && (
                        <img
                          src={sock.base_design_url}
                          alt={sock.album_title}
                          className="w-16 h-16 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{sock.artist_name}</p>
                        <p className="text-sm text-muted-foreground truncate">{sock.album_title}</p>
                        {sock.is_published && (
                          <span className="text-xs text-green-600">✓ Published</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
