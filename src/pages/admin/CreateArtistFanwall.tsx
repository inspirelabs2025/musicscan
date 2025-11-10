import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, Plus, X, ArrowLeft } from "lucide-react";
import { useDropzone } from "react-dropzone";

export default function CreateArtistFanwall() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  
  // Step 1: Artist info
  const [artistName, setArtistName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [createdArtistId, setCreatedArtistId] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  
  // Step 2: Photo uploads
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    onDrop: (acceptedFiles) => {
      setUploadedFiles((prev) => [...prev, ...acceptedFiles]);
      setUploadProgress((prev) => [...prev, ...acceptedFiles.map(() => 0)]);
    },
    multiple: true,
  });

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadProgress((prev) => prev.filter((_, i) => i !== index));
  };

  const createArtist = async () => {
    if (!artistName.trim()) {
      toast({
        title: "Fout",
        description: "Vul een artiestnaam in",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create artist fanwall using the database function
      const { data: artistId, error: createError } = await supabase
        .rpc('find_or_create_artist_fanwall', {
          artist_name_input: artistName.trim(),
        });

      if (createError) throw createError;

      // Update with custom description if provided
      if (customDescription.trim()) {
        const { error: updateError } = await supabase
          .from('artist_fanwalls')
          .update({
            seo_description: customDescription.trim(),
          })
          .eq('id', artistId);

        if (updateError) throw updateError;
      }

      // Get the slug
      const { data: artistData, error: fetchError } = await supabase
        .from('artist_fanwalls')
        .select('slug')
        .eq('id', artistId)
        .single();

      if (fetchError) throw fetchError;

      setCreatedArtistId(artistId);
      setCreatedSlug(artistData.slug);
      setStep(2);

      toast({
        title: "Artiest aangemaakt",
        description: `${artistName} fanwall pagina is aangemaakt`,
      });
    } catch (error: any) {
      console.error('Create artist error:', error);
      toast({
        title: "Fout",
        description: error.message || "Kon artiest niet aanmaken",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadPhotos = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "Geen foto's",
        description: "Upload minimaal 1 foto",
        variant: "destructive",
      });
      return;
    }

    if (!createdArtistId || !createdSlug) {
      toast({
        title: "Fout",
        description: "Artiest ID ontbreekt",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload each file
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('fanwall-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('fanwall-photos')
          .getPublicUrl(filePath);

        // Create photo record
        const { error: insertError } = await supabase
          .from('photos')
          .insert({
            user_id: user.id,
            source_type: 'upload',
            artist: artistName,
            display_url: publicUrl,
            original_url: publicUrl,
            format: 'other',
            status: 'published',
            published_at: new Date().toISOString(),
            seo_title: `${artistName} - Fan Foto ${i + 1}`,
            seo_slug: `${createdSlug}-fan-photo-${Date.now()}-${i}`,
            seo_description: `Een ${artistName} fan foto gedeeld op MusicScan FanWall`,
            canonical_url: `https://www.musicscan.app/photo/${createdSlug}-fan-photo-${Date.now()}-${i}`,
          });

        if (insertError) throw insertError;

        // Update progress
        setUploadProgress((prev) => {
          const newProgress = [...prev];
          newProgress[i] = 100;
          return newProgress;
        });
      }

      toast({
        title: "Foto's geüpload",
        description: `${uploadedFiles.length} foto's succesvol geüpload`,
      });

      // Navigate to the artist fanwall
      navigate(`/fanwall/${createdSlug}`);
    } catch (error: any) {
      console.error('Upload photos error:', error);
      toast({
        title: "Fout",
        description: error.message || "Kon foto's niet uploaden",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => step === 1 ? navigate('/admin') : setStep(1)}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 1 ? 'Terug naar Admin' : 'Terug naar Stap 1'}
          </Button>
          <h1 className="text-3xl font-bold">Nieuwe Artiest FanWall</h1>
          <p className="text-muted-foreground mt-2">
            Maak een nieuwe artiest fanwall pagina aan en upload de eerste foto's
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step === 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              1
            </div>
            <span className="font-medium">Artiest Info</span>
          </div>
          <div className="flex-1 h-px bg-border" />
          <div className={`flex items-center gap-2 ${step === 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              2
            </div>
            <span className="font-medium">Foto's Uploaden</span>
          </div>
        </div>

        {/* Step 1: Artist Info */}
        {step === 1 && (
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="artistName" className="text-base font-semibold">
                  Artiestnaam *
                </Label>
                <Input
                  id="artistName"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="Bijv. Metallica"
                  className="mt-2"
                  disabled={isLoading}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  De naam van de artiest zoals deze op de fanwall pagina verschijnt
                </p>
              </div>

              <div>
                <Label htmlFor="description" className="text-base font-semibold">
                  Beschrijving (optioneel)
                </Label>
                <Textarea
                  id="description"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Ontdek Metallica fan foto's: live concerten, vinyl collecties, en meer..."
                  className="mt-2"
                  rows={3}
                  disabled={isLoading}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Aangepaste SEO beschrijving (optioneel, anders wordt automatisch gegenereerd)
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                <p className="text-sm">
                  <strong>Let op:</strong> Na het aanmaken wordt automatisch een SEO-vriendelijke URL gegenereerd (bijv. /fanwall/metallica)
                </p>
              </div>

              <Button
                onClick={createArtist}
                disabled={isLoading || !artistName.trim()}
                size="lg"
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Bezig...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-5 w-5" />
                    Artiest Aanmaken
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Upload Photos */}
        {step === 2 && (
          <Card className="p-6">
            <div className="space-y-6">
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
                <p className="text-sm">
                  <strong>✓ Artiest aangemaakt:</strong> {artistName}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  URL: /fanwall/{createdSlug}
                </p>
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Upload Foto's
                </Label>
                
                {/* Dropzone */}
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
                    ${isDragActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                    }
                  `}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">
                    {isDragActive ? 'Drop de foto\'s hier...' : 'Sleep foto\'s hier of klik om te selecteren'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PNG, JPG, GIF tot 10MB
                  </p>
                </div>
              </div>

              {/* Uploaded files preview */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold">
                    Geselecteerde Foto's ({uploadedFiles.length})
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {uploadProgress[index] > 0 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="text-white font-bold">
                              {uploadProgress[index]}%
                            </div>
                          </div>
                        )}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeFile(index)}
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/fanwall/${createdSlug}`)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Overslaan
                </Button>
                <Button
                  onClick={uploadPhotos}
                  disabled={isLoading || uploadedFiles.length === 0}
                  size="lg"
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Uploaden...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-5 w-5" />
                      Upload {uploadedFiles.length} Foto{uploadedFiles.length !== 1 ? "'s" : ''}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
