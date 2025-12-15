import { useState, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, Sparkles, CheckCircle, AlertTriangle, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet";
import { usePhotoEnrichment } from "@/hooks/usePhotoEnrichment";
import { useDropzone } from "react-dropzone";

export default function UploadPhoto() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const enrichMutation = usePhotoEnrichment();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [enrichedData, setEnrichedData] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
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
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/heic': ['.heic'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleEnrich = async () => {
    if (!preview) return;
    
    setUploadProgress(20);
    
    try {
      const result = await enrichMutation.mutateAsync({
        image_url: preview,
        caption: formData.caption,
        artist: formData.artist,
        album: formData.album,
        venue: formData.venue,
        city: formData.city,
        country: formData.country,
        event_date: formData.year ? `${formData.year}-01-01` : undefined,
      });
      
      setEnrichedData(result);
      setUploadProgress(60);
      
      // Auto-fill if confidence is high
      if (result.inferred_data?.artist && result.inferred_data.confidence > 0.8 && !formData.artist) {
        setFormData(prev => ({ ...prev, artist: result.inferred_data.artist }));
      }
      
      toast({
        title: "Verrijking Compleet",
        description: `${result.tags.length} tags gegenereerd`,
      });
      
      setStep(3);
    } catch (error: any) {
      setUploadProgress(0);
      toast({
        title: "Verrijking Mislukt",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Login vereist");
      if (!file) throw new Error("Geen bestand geselecteerd");
      if (!formData.licenseGranted) throw new Error("Licentie acceptatie vereist");

      setUploadProgress(70);

      // Upload to storage
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("fanwall-photos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setUploadProgress(85);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("fanwall-photos")
        .getPublicUrl(filePath);

      // Use enriched data if available
      const slug = enrichedData?.slug_suggestion || `photo-${Date.now().toString().slice(-6)}`;
      const seoTitle = enrichedData?.seo_title || `${formData.artist || "Muziek"} ${formData.year || ""} ${formData.city || ""}`.trim();
      const seoDescription = enrichedData?.seo_description || formData.caption || "Muziek herinnering gedeeld op MusicScan";
      const tags = enrichedData?.tags || [];

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
        seo_title: seoTitle,
        seo_description: seoDescription,
        tags: tags,
        canonical_url: enrichedData?.canonical_url || `https://www.musicscan.app/photo/${slug}`,
        status: "published",
        published_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      setUploadProgress(100);
      return slug;
    },
    onSuccess: (slug) => {
      toast({
        title: "Succes!",
        description: "Je foto is gepubliceerd",
      });
      setTimeout(() => {
        navigate(`/photo/${slug}`);
      }, 500);
    },
    onError: (error: any) => {
      setUploadProgress(0);
      toast({
        title: "Fout bij uploaden",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 max-w-md">
          <div className="text-center mb-6">
            <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Login Vereist</h2>
            <p className="text-muted-foreground">Log in om je muziek herinneringen te delen</p>
          </div>
          <Button onClick={() => navigate("/auth")} className="w-full">Inloggen</Button>
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
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/fanwall")}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Terug naar FanWall
              </Button>
              <h1 className="text-4xl font-bold mb-2">Upload Foto</h1>
              <p className="text-muted-foreground">Deel je muziek herinneringen met de community</p>
            </div>

            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-primary bg-primary/10' : 'border-muted'}`}>
                    {step > 1 ? <CheckCircle className="h-4 w-4" /> : '1'}
                  </div>
                  <span className="text-sm font-medium">Upload</span>
                </div>
                <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-primary bg-primary/10' : 'border-muted'}`}>
                    {step > 2 ? <CheckCircle className="h-4 w-4" /> : '2'}
                  </div>
                  <span className="text-sm font-medium">Details</span>
                </div>
                <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-primary bg-primary/10' : 'border-muted'}`}>
                    {uploadMutation.isSuccess ? <CheckCircle className="h-4 w-4" /> : '3'}
                  </div>
                  <span className="text-sm font-medium">Review</span>
                </div>
              </div>
              {uploadProgress > 0 && (
                <Progress value={uploadProgress} className="h-2" />
              )}
            </div>

            {/* Step 1: File Upload */}
            {step === 1 && (
              <Card className="p-8">
                <h2 className="text-2xl font-semibold mb-6">Selecteer een Foto</h2>
                
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
                    isDragActive
                      ? 'border-primary bg-primary/5'
                      : preview
                      ? 'border-border'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  {preview ? (
                    <div className="space-y-4">
                      <img src={preview} alt="Preview" className="max-h-96 mx-auto rounded-lg shadow-lg" />
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{file?.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Klik of sleep om een andere foto te selecteren</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                        <Upload className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-lg font-medium mb-1">
                          {isDragActive ? 'Laat los om te uploaden' : 'Sleep een foto hierheen'}
                        </p>
                        <p className="text-sm text-muted-foreground">of klik om te selecteren</p>
                      </div>
                      <Badge variant="secondary">Max 20MB • JPG, PNG, WebP, HEIC</Badge>
                    </div>
                  )}
                </div>

                {preview && (
                  <div className="mt-6 flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                      }}
                      className="flex-1"
                    >
                      Verwijder
                    </Button>
                    <Button
                      onClick={() => setStep(2)}
                      className="flex-1"
                    >
                      Volgende
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {/* Step 2: Add Details */}
            {step === 2 && (
              <Card className="p-8">
                <h2 className="text-2xl font-semibold mb-6">Voeg Details Toe</h2>
                
                {preview && (
                  <div className="mb-6">
                    <img src={preview} alt="Preview" className="w-full max-h-48 object-contain rounded-lg" />
                  </div>
                )}

                <div className="space-y-4 mb-6">
                  <div>
                    <Label htmlFor="artist">Artiest / Band *</Label>
                    <Input
                      id="artist"
                      value={formData.artist}
                      onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                      placeholder="Bijv. Queen, Metallica, Taylor Swift"
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
                        min="1900"
                        max={new Date().getFullYear()}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="format">Type Foto</Label>
                    <Select value={formData.format} onValueChange={(value) => setFormData({ ...formData, format: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="concert">Concert Foto</SelectItem>
                        <SelectItem value="vinyl">Vinyl Plaat</SelectItem>
                        <SelectItem value="cd">CD</SelectItem>
                        <SelectItem value="cassette">Cassette</SelectItem>
                        <SelectItem value="poster">Poster / Artwork</SelectItem>
                        <SelectItem value="other">Anders</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="caption">Beschrijving (optioneel)</Label>
                    <Textarea
                      id="caption"
                      value={formData.caption}
                      onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                      placeholder="Vertel het verhaal achter deze foto... Waar en wanneer was dit? Wat is er speciaal aan deze herinnering?"
                      rows={4}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep(1);
                      setUploadProgress(0);
                    }}
                    className="flex-1"
                  >
                    Terug
                  </Button>
                  <Button
                    onClick={handleEnrich}
                    disabled={!formData.artist || enrichMutation.isPending}
                    className="flex-1 gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    {enrichMutation.isPending ? "Verrijken..." : "Automatisch Verrijken"}
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 3: Review & Publish */}
            {step === 3 && enrichedData && (
              <Card className="p-8">
                <h2 className="text-2xl font-semibold mb-6">Review & Publiceer</h2>
                
                {preview && (
                  <div className="mb-6">
                    <img src={preview} alt="Preview" className="w-full max-h-64 object-contain rounded-lg shadow-lg" />
                  </div>
                )}

                {/* AI Generated Data */}
                <div className="mb-6 space-y-4">
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">AI Gegenereerd</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">SEO Titel</Label>
                        <p className="text-sm font-medium">{enrichedData.seo_title}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">SEO Beschrijving</Label>
                        <p className="text-sm">{enrichedData.seo_description}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Tags</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {enrichedData.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">URL</Label>
                        <p className="text-xs font-mono bg-muted px-2 py-1 rounded mt-1">
                          musicscan.app/photo/{enrichedData.slug_suggestion}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="bg-muted rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Jouw Details</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">Artiest</Label>
                        <p className="font-medium">{formData.artist}</p>
                      </div>
                      {formData.city && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Stad</Label>
                          <p className="font-medium">{formData.city}</p>
                        </div>
                      )}
                      {formData.year && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Jaar</Label>
                          <p className="font-medium">{formData.year}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-xs text-muted-foreground">Type</Label>
                        <p className="font-medium capitalize">{formData.format}</p>
                      </div>
                    </div>
                  </div>

                  {/* Safety Check */}
                  {!enrichedData.safety.is_safe && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <h3 className="font-semibold text-destructive">Beveiligingswaarschuwing</h3>
                      </div>
                      <ul className="text-sm text-destructive space-y-1">
                        {enrichedData.safety.concerns.map((concern: string, i: number) => (
                          <li key={i}>• {concern}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* License Agreement */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="license"
                        checked={formData.licenseGranted}
                        onCheckedChange={(checked) => setFormData({ ...formData, licenseGranted: checked as boolean })}
                        className="mt-1"
                      />
                      <label htmlFor="license" className="text-sm leading-relaxed cursor-pointer">
                        Ik bevestig dat ik de rechten heb op deze foto en geef MusicScan een niet-exclusieve, wereldwijde licentie om deze weer te geven. Ik behoud het volledige copyright.
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep(2);
                      setUploadProgress(0);
                    }}
                    className="flex-1"
                    disabled={uploadMutation.isPending}
                  >
                    Terug
                  </Button>
                  <Button
                    onClick={() => uploadMutation.mutate()}
                    disabled={!formData.licenseGranted || uploadMutation.isPending || !enrichedData.safety.is_safe}
                    className="flex-1 gap-2"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <Sparkles className="h-4 w-4 animate-spin" />
                        Publiceren...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Publiceer Foto
                      </>
                    )}
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
