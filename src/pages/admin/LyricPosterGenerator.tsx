import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Music, Sparkles, ExternalLink, Image } from "lucide-react";
import { useGenerateLyricPoster } from "@/hooks/useGenerateLyricPoster";
import { useLyricPosters } from "@/hooks/useLyricPosters";
import { Navigation } from "@/components/Navigation";

const STYLE_PRESETS = [
  { value: 'auto', label: 'Auto-detect (Aanbevolen)' },
  { value: 'david bowie', label: 'Glam Rock (David Bowie)' },
  { value: 'nirvana', label: 'Grunge (Nirvana)' },
  { value: 'prince', label: 'Neon Purple (Prince)' },
  { value: 'the beatles', label: 'British Invasion (The Beatles)' },
  { value: 'bob marley', label: 'Reggae (Bob Marley)' },
  { value: 'amy winehouse', label: 'Neo-Soul (Amy Winehouse)' },
  { value: 'daft punk', label: 'Electronic (Daft Punk)' },
];

const LICENSE_TYPES = [
  { value: 'public-domain', label: 'Publiek Domein (pre-1926)' },
  { value: 'licensed', label: 'Gelicentieerd' },
  { value: 'fair-use', label: 'Fair Use (korte citaten)' },
  { value: 'user-responsibility', label: 'Eigen verantwoordelijkheid' },
];

export default function LyricPosterGenerator() {
  const [artist, setArtist] = useState("");
  const [song, setSong] = useState("");
  const [album, setAlbum] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [highlightLines, setHighlightLines] = useState("");
  const [stylePreset, setStylePreset] = useState("auto");
  const [qrLink, setQrLink] = useState("");
  const [licenseType, setLicenseType] = useState("user-responsibility");
  const [copyrightNotes, setCopyrightNotes] = useState("");
  const [licenseConfirmed, setLicenseConfirmed] = useState(false);

  const generateMutation = useGenerateLyricPoster();
  const { data: posters, isLoading: postersLoading } = useLyricPosters();

  const handleGenerate = () => {
    if (!licenseConfirmed) {
      alert('Je moet eerst de copyright bevestiging aanvinken');
      return;
    }

    generateMutation.mutate({
      artist,
      song,
      lyrics,
      highlightLines,
      album: album || undefined,
      releaseYear: releaseYear ? parseInt(releaseYear) : undefined,
      stylePreset,
      qrLink: qrLink || undefined,
      userLicenseConfirmed: licenseConfirmed,
      licenseType,
      copyrightNotes: copyrightNotes || undefined
    });
  };

  const isFormValid = artist && song && lyrics && highlightLines && licenseConfirmed;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Music className="h-8 w-8" />
            Lyric Poster Generator
          </h1>
          <p className="text-muted-foreground">
            Genereer AI-powered typografische posters van songteksten met automatische stijl-detectie
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Song Informatie</CardTitle>
                <CardDescription>Vul de basis gegevens van het nummer in</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="artist">Artiest *</Label>
                  <Input
                    id="artist"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="Bijv: David Bowie"
                  />
                </div>

                <div>
                  <Label htmlFor="song">Song Titel *</Label>
                  <Input
                    id="song"
                    value={song}
                    onChange={(e) => setSong(e.target.value)}
                    placeholder="Bijv: Heroes"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="album">Album (optioneel)</Label>
                    <Input
                      id="album"
                      value={album}
                      onChange={(e) => setAlbum(e.target.value)}
                      placeholder="Bijv: Heroes"
                    />
                  </div>

                  <div>
                    <Label htmlFor="year">Jaar (optioneel)</Label>
                    <Input
                      id="year"
                      type="number"
                      value={releaseYear}
                      onChange={(e) => setReleaseYear(e.target.value)}
                      placeholder="1977"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="style">Stijl Preset</Label>
                  <Select value={stylePreset} onValueChange={setStylePreset}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STYLE_PRESETS.map(preset => (
                        <SelectItem key={preset.value} value={preset.value}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lyrics Content</CardTitle>
                <CardDescription>Voeg de volledige songtekst en highlight-regels toe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="highlight">Highlight Regels (3-4 regels) *</Label>
                  <Textarea
                    id="highlight"
                    value={highlightLines}
                    onChange={(e) => setHighlightLines(e.target.value)}
                    placeholder="De regels die groot getoond worden op de poster&#10;Meestal het refrein of meest memorabele deel"
                    rows={4}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Dit wordt de prominente tekst op de poster
                  </p>
                </div>

                <div>
                  <Label htmlFor="lyrics">Volledige Songtekst *</Label>
                  <Textarea
                    id="lyrics"
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    placeholder="Paste hier de volledige lyrics...&#10;Deze worden kleiner getoond onder het highlight blok"
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="qr">QR Link (optioneel)</Label>
                  <Input
                    id="qr"
                    type="url"
                    value={qrLink}
                    onChange={(e) => setQrLink(e.target.value)}
                    placeholder="https://www.musicscan.app/plaat-verhaal/..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Link naar verhaal-pagina voor QR code op poster
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Copyright & Licentie
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Juridische Waarschuwing</AlertTitle>
                  <AlertDescription>
                    Songteksten zijn auteursrechtelijk beschermd. Voor commerciële verkoop heb je licenties nodig.
                    <br/><br/>
                    <strong>Gebruik alleen:</strong>
                    <ul className="list-disc ml-4 mt-2 space-y-1">
                      <li>Publiek domein materiaal (pre-1926)</li>
                      <li>Lyrics waarvoor je licentie hebt verkregen</li>
                      <li>Of beperk je tot korte citaten (3-4 regels = mogelijk fair use)</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div>
                  <Label htmlFor="licenseType">Licentie Type</Label>
                  <Select value={licenseType} onValueChange={setLicenseType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LICENSE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Copyright Notities (optioneel)</Label>
                  <Textarea
                    id="notes"
                    value={copyrightNotes}
                    onChange={(e) => setCopyrightNotes(e.target.value)}
                    placeholder="Eventuele notities over licentie of toestemming"
                    rows={2}
                  />
                </div>

                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="license"
                    checked={licenseConfirmed}
                    onCheckedChange={(checked) => setLicenseConfirmed(checked === true)}
                  />
                  <label
                    htmlFor="license"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Ik bevestig dat ik rechten heb om deze lyrics commercieel te gebruiken, 
                    of dat dit gebruik valt onder publiek domein of fair use.
                  </label>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleGenerate}
              disabled={!isFormValid || generateMutation.isPending}
              size="lg"
              className="w-full"
            >
              {generateMutation.isPending ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Genereren... (30-60 sec)
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Genereer Poster + Shop Products
                </>
              )}
            </Button>
          </div>

          {/* Recent Posters */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Gegenereerde Posters</CardTitle>
                <CardDescription>
                  {postersLoading ? 'Laden...' : `${posters?.length || 0} posters`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {postersLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Posters laden...
                  </div>
                ) : posters && posters.length > 0 ? (
                  <div className="space-y-4">
                    {posters.slice(0, 10).map((poster) => (
                      <div
                        key={poster.id}
                        className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        {poster.poster_url ? (
                          <img
                            src={poster.poster_url}
                            alt={`${poster.artist_name} - ${poster.song_title}`}
                            className="w-20 h-28 object-cover rounded"
                          />
                        ) : (
                          <div className="w-20 h-28 bg-muted rounded flex items-center justify-center">
                            <Image className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {poster.song_title}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {poster.artist_name}
                          </p>
                          {poster.album_name && (
                            <p className="text-xs text-muted-foreground truncate">
                              {poster.album_name}
                            </p>
                          )}
                          <div className="flex gap-2 mt-2">
                            {poster.standard_product_id && (
                              <a
                                href={`/product/${poster.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button size="sm" variant="outline">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </a>
                            )}
                            {poster.style_variants && (
                              <span className="text-xs text-muted-foreground self-center">
                                {poster.style_variants.length} styles
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nog geen posters gegenereerd
                  </div>
                )}
              </CardContent>
            </Card>

            {generateMutation.isSuccess && generateMutation.data && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="text-primary">✅ Poster Succesvol Gegenereerd!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <img
                    src={generateMutation.data.poster_url}
                    alt="Generated poster"
                    className="w-full rounded-lg shadow-lg"
                  />
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Style Variants:</strong> {generateMutation.data.style_variants?.length || 0}
                    </p>
                    {generateMutation.data.qr_code_url && (
                      <p className="text-sm">
                        <strong>QR Code:</strong> ✓ Toegevoegd
                      </p>
                    )}
                    <Button
                      onClick={() => window.open(`/product/${generateMutation.data.slug}`, '_blank')}
                      className="w-full"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Bekijk Producten
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
