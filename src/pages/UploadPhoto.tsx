import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image as ImageIcon } from "lucide-react";
import { Helmet } from "react-helmet";

export default function UploadPhoto() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    artist: "",
    album: "",
    venue: "",
    city: "",
    country: "",
    year: "",
    format: "concert",
    caption: "",
    licenseGranted: false,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 20 * 1024 * 1024) {
        toast({
          title: "Bestand te groot",
          description: "Maximum bestandsgrootte is 20MB",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Login vereist");
      if (!file) throw new Error("Geen bestand geselecteerd");
      if (!formData.licenseGranted) throw new Error("Licentie acceptatie vereist");

      // Generate slug
      const slugParts = [
        formData.artist || "photo",
        formData.city || "",
        formData.year || "",
        Date.now().toString().slice(-6)
      ].filter(Boolean);
      const slug = slugParts.join("-").toLowerCase().replace(/[^a-z0-9-]/g, "");

      // Upload to storage
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("fanwall-photos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("fanwall-photos")
        .getPublicUrl(filePath);

      // Create photo record
      const { error: insertError } = await supabase.from("photos").insert({
        user_id: user.id,
        source_type: "user",
        original_url: filePath,
        display_url: publicUrl,
        artist: formData.artist || null,
        album: formData.album || null,
        venue: formData.venue || null,
        city: formData.city || null,
        country: formData.country || null,
        year: formData.year ? parseInt(formData.year) : null,
        format: formData.format,
        caption: formData.caption || null,
        license_granted: formData.licenseGranted,
        seo_slug: slug,
        seo_title: `${formData.artist || "Muziek"} ${formData.year ? formData.year : ""} ${formData.city || ""}`.trim(),
        seo_description: formData.caption || `Muziek herinnering gedeeld op MusicScan`,
        canonical_url: `https://www.musicscan.app/photo/${slug}`,
        status: "published",
        published_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      return slug;
    },
    onSuccess: (slug) => {
      toast({
        title: "Succes!",
        description: "Je foto is gepubliceerd",
      });
      navigate(`/photo/${slug}`);
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij uploaden",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <p className="mb-4">Log in om foto's te uploaden</p>
          <Button onClick={() => navigate("/auth")}>Inloggen</Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Upload Foto | MusicScan FanWall</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Upload Foto</h1>
            <p className="text-muted-foreground mb-8">Deel je muziek herinneringen met de community</p>

            {/* Step 1: File Upload */}
            {step === 1 && (
              <Card className="p-6">
                <Label className="text-lg font-semibold mb-4 block">Selecteer Foto</Label>
                
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center mb-4">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    {preview ? (
                      <img src={preview} alt="Preview" className="max-h-64 mx-auto mb-4 rounded" />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">Klik om een foto te selecteren</p>
                        <p className="text-xs text-muted-foreground">Max 20MB - JPG, PNG, WebP, HEIC</p>
                      </div>
                    )}
                  </label>
                </div>

                <Button
                  onClick={() => setStep(2)}
                  disabled={!file}
                  className="w-full"
                >
                  Volgende
                </Button>
              </Card>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <Card className="p-6">
                <Label className="text-lg font-semibold mb-4 block">Voeg Details Toe</Label>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <Label htmlFor="artist">Artiest</Label>
                    <Input
                      id="artist"
                      value={formData.artist}
                      onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                      placeholder="Naam van de artiest of band"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">Stad</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Amsterdam"
                      />
                    </div>
                    <div>
                      <Label htmlFor="year">Jaar</Label>
                      <Input
                        id="year"
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        placeholder="2024"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="format">Type</Label>
                    <Select value={formData.format} onValueChange={(value) => setFormData({ ...formData, format: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="concert">Concert</SelectItem>
                        <SelectItem value="vinyl">Vinyl</SelectItem>
                        <SelectItem value="cd">CD</SelectItem>
                        <SelectItem value="cassette">Cassette</SelectItem>
                        <SelectItem value="poster">Poster</SelectItem>
                        <SelectItem value="other">Anders</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="caption">Beschrijving</Label>
                    <Textarea
                      id="caption"
                      value={formData.caption}
                      onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                      placeholder="Vertel het verhaal achter deze foto..."
                      rows={4}
                    />
                  </div>

                  <div className="flex items-start space-x-2 border-t pt-4">
                    <Checkbox
                      id="license"
                      checked={formData.licenseGranted}
                      onCheckedChange={(checked) => setFormData({ ...formData, licenseGranted: checked as boolean })}
                    />
                    <label htmlFor="license" className="text-sm leading-tight cursor-pointer">
                      Ik bevestig dat ik de rechten heb op deze foto en geef MusicScan een niet-exclusieve, wereldwijde licentie om deze weer te geven op musicscan.app. Ik behoud het copyright.
                    </label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Terug
                  </Button>
                  <Button
                    onClick={() => uploadMutation.mutate()}
                    disabled={!formData.licenseGranted || uploadMutation.isPending}
                    className="flex-1"
                  >
                    {uploadMutation.isPending ? "Uploaden..." : "Publiceren"}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
