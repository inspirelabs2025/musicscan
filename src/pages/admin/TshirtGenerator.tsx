import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useGenerateTshirtDesign } from "@/hooks/useGenerateTshirtDesign";
import { useAlbumTshirts } from "@/hooks/useAlbumTshirts";
import { useTrendingAlbums } from "@/hooks/useTrendingAlbums";
import { Loader2 } from "lucide-react";

const TshirtGenerator = () => {
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [customArtist, setCustomArtist] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customCoverUrl, setCustomCoverUrl] = useState("");
  const [patternType, setPatternType] = useState("auto");
  const [designTheme, setDesignTheme] = useState("auto");
  const [generateStyleVariants, setGenerateStyleVariants] = useState(true);
  const [generateProducts, setGenerateProducts] = useState(true);

  const { mutate: generateTshirt, isPending } = useGenerateTshirtDesign();
  const { data: recentTshirts } = useAlbumTshirts();
  const { data: trendingAlbums } = useTrendingAlbums();

  const handleGenerate = () => {
    const albumData = selectedAlbum || {
      artist: customArtist,
      title: customTitle,
      cover_image: customCoverUrl,
    };

    if (!albumData.artist || !albumData.title || !albumData.cover_image) {
      return;
    }

    generateTshirt({
      artistName: albumData.artist,
      albumTitle: albumData.title,
      albumCoverUrl: albumData.cover_image,
      discogsId: albumData.discogs_id,
      releaseYear: albumData.year,
      genre: albumData.genre,
      generateProducts,
      generateStyleVariants,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">👕 T-Shirts of Sound Generator</h1>
        <p className="text-muted-foreground">
          Create AI-designed T-shirts featuring iconic album artwork
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Album Selection */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Select Trending Album</h2>
            <div className="grid grid-cols-2 gap-4">
              {trendingAlbums?.map((album) => (
                <Card
                  key={album.id}
                  className={`p-3 cursor-pointer transition-all ${
                    selectedAlbum?.id === album.id
                      ? "ring-2 ring-primary"
                      : "hover:ring-1 ring-muted"
                  }`}
                  onClick={() => setSelectedAlbum(album)}
                >
                  {album.cover_image && (
                    <img
                      src={album.cover_image}
                      alt={album.title}
                      className="w-full aspect-square object-cover rounded mb-2"
                    />
                  )}
                  <p className="text-sm font-medium truncate">{album.artist}</p>
                  <p className="text-xs text-muted-foreground truncate">{album.title}</p>
                </Card>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Or Enter Custom Album</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="artist">Artist Name</Label>
                <Input
                  id="artist"
                  value={customArtist}
                  onChange={(e) => {
                    setCustomArtist(e.target.value);
                    setSelectedAlbum(null);
                  }}
                  placeholder="Pink Floyd"
                />
              </div>
              <div>
                <Label htmlFor="title">Album Title</Label>
                <Input
                  id="title"
                  value={customTitle}
                  onChange={(e) => {
                    setCustomTitle(e.target.value);
                    setSelectedAlbum(null);
                  }}
                  placeholder="The Dark Side of the Moon"
                />
              </div>
              <div>
                <Label htmlFor="cover">Album Cover URL</Label>
                <Input
                  id="cover"
                  value={customCoverUrl}
                  onChange={(e) => {
                    setCustomCoverUrl(e.target.value);
                    setSelectedAlbum(null);
                  }}
                  placeholder="https://..."
                />
              </div>
            </div>
          </Card>

          {(selectedAlbum || (customArtist && customTitle && customCoverUrl)) && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Preview</h3>
              <img
                src={selectedAlbum?.cover_image || customCoverUrl}
                alt="Album cover"
                className="w-full aspect-square object-cover rounded"
              />
              <div className="mt-4">
                <p className="font-medium">{selectedAlbum?.artist || customArtist}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedAlbum?.title || customTitle}
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Design Options */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Design Options</h2>

            <div className="space-y-6">
              <div>
                <Label className="mb-3 block">Pattern Type</Label>
                <RadioGroup value={patternType} onValueChange={setPatternType}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="pattern-auto" />
                    <Label htmlFor="pattern-auto" className="cursor-pointer">
                      Auto (AI decides)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="artwork-print" id="pattern-artwork" />
                    <Label htmlFor="pattern-artwork" className="cursor-pointer">
                      Artwork Print
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="minimalist" id="pattern-minimal" />
                    <Label htmlFor="pattern-minimal" className="cursor-pointer">
                      Minimalist
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="vintage" id="pattern-vintage" />
                    <Label htmlFor="pattern-vintage" className="cursor-pointer">
                      Vintage
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="mb-3 block">Design Theme</Label>
                <RadioGroup value={designTheme} onValueChange={setDesignTheme}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="theme-auto" />
                    <Label htmlFor="theme-auto" className="cursor-pointer">
                      Auto (AI decides)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="minimalist" id="theme-minimalist" />
                    <Label htmlFor="theme-minimalist" className="cursor-pointer">
                      Minimalist
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bold" id="theme-bold" />
                    <Label htmlFor="theme-bold" className="cursor-pointer">
                      Bold & Vibrant
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="retro" id="theme-retro" />
                    <Label htmlFor="theme-retro" className="cursor-pointer">
                      Retro
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Generation Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="variants"
                  checked={generateStyleVariants}
                  onCheckedChange={(checked) => setGenerateStyleVariants(checked as boolean)}
                />
                <Label htmlFor="variants" className="cursor-pointer">
                  Generate 7 style variants (vintage, neon, pastel, etc.)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="products"
                  checked={generateProducts}
                  onCheckedChange={(checked) => setGenerateProducts(checked as boolean)}
                />
                <Label htmlFor="products" className="cursor-pointer">
                  Create shop products automatically
                </Label>
              </div>
            </div>
          </Card>

          <Button
            size="lg"
            className="w-full"
            onClick={handleGenerate}
            disabled={
              isPending ||
              (!selectedAlbum && (!customArtist || !customTitle || !customCoverUrl))
            }
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate T-Shirt Design"
            )}
          </Button>
        </div>
      </div>

      {/* Recent Designs */}
      {recentTshirts && recentTshirts.length > 0 && (
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Recent T-Shirt Designs</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentTshirts.slice(0, 12).map((tshirt) => (
              <div key={tshirt.id} className="space-y-2">
                <img
                  src={tshirt.base_design_url}
                  alt={tshirt.album_title}
                  className="w-full aspect-square object-cover rounded"
                />
                <p className="text-sm font-medium truncate">{tshirt.artist_name}</p>
                <p className="text-xs text-muted-foreground truncate">{tshirt.album_title}</p>
                {tshirt.is_published && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Published
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default TshirtGenerator;
