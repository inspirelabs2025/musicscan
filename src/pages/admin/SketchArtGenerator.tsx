import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSketchArtGenerator } from "@/hooks/useSketchArtGenerator";
import { Loader2, Sparkles } from "lucide-react";

const SketchArtGenerator = () => {
  const [formData, setFormData] = useState({
    artist: "",
    title: "",
    discogs_id: "",
    price: "149.99",
    style: "pencil_sketch" as 'pencil_sketch' | 'ink_drawing' | 'charcoal'
  });

  const { mutate: generateSketch, isPending } = useSketchArtGenerator();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params: any = {
      price: parseFloat(formData.price),
      style: formData.style
    };

    if (formData.discogs_id) {
      params.discogs_id = parseInt(formData.discogs_id);
    } else if (formData.artist && formData.title) {
      params.artist = formData.artist;
      params.title = formData.title;
    } else {
      return;
    }

    generateSketch(params);
  };

  const isFormValid = formData.discogs_id || (formData.artist && formData.title);

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            AI Sketch Variant Generator
          </CardTitle>
          <CardDescription>
            Genereer een AI sketch variant van een albumcover. De AI maakt een hand-getekende interpretatie
            van de originele cover die wordt geprint op metaal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="discogs_id">Discogs ID (optioneel)</Label>
                <Input
                  id="discogs_id"
                  type="number"
                  placeholder="bijv. 588618"
                  value={formData.discogs_id}
                  onChange={(e) => setFormData({ ...formData, discogs_id: e.target.value })}
                  disabled={isPending}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Of vul hieronder artist + title in
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="artist">Artist</Label>
                  <Input
                    id="artist"
                    placeholder="bijv. Pink Floyd"
                    value={formData.artist}
                    onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                    disabled={isPending || !!formData.discogs_id}
                  />
                </div>

                <div>
                  <Label htmlFor="title">Album Titel</Label>
                  <Input
                    id="title"
                    placeholder="bijv. The Wall"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    disabled={isPending || !!formData.discogs_id}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="style">Sketch Stijl</Label>
                <Select
                  value={formData.style}
                  onValueChange={(value: any) => setFormData({ ...formData, style: value })}
                  disabled={isPending}
                >
                  <SelectTrigger id="style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pencil_sketch">Pencil Sketch (Potlood)</SelectItem>
                    <SelectItem value="ink_drawing">Ink Drawing (Inkt)</SelectItem>
                    <SelectItem value="charcoal">Charcoal Drawing (Houtskool)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Kies de tekenstijl voor de AI conversie
                </p>
              </div>

              <div>
                <Label htmlFor="price">Prijs (€)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={!isFormValid || isPending}
                className="flex-1"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sketch Genereren...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Genereer AI Sketch
                  </>
                )}
              </Button>
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-2">
              <h4 className="font-medium text-sm">ℹ️ Hoe werkt het?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>1. Voer een Discogs ID in, of artist + album titel</li>
                <li>2. Kies een sketch stijl (potlood, inkt, houtskool)</li>
                <li>3. De AI genereert een hand-getekende variant</li>
                <li>4. Product wordt automatisch gepubliceerd als ART</li>
              </ul>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SketchArtGenerator;
