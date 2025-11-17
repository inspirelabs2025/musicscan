import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Plus, X, Image as ImageIcon } from "lucide-react";
import { generateButtonAltTag } from "@/utils/generateAltTag";

export default function ButtonGenerator() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [artistName, setArtistName] = useState("");
  const [buttonTitle, setButtonTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const createButtonMutation = useMutation({
    mutationFn: async () => {
      if (!imageFile || !artistName || !buttonTitle) {
        throw new Error("Vul alle verplichte velden in");
      }

      // STAP 1: Upload originele image naar storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `button-designs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      console.log('📤 Original image uploaded:', publicUrl);

      // STAP 2: Generate circular base + 7 style variants
      const { data: stylesData, error: stylesError } = await supabase.functions.invoke(
        'batch-generate-button-styles',
        {
          body: {
            baseDesignUrl: publicUrl,
            buttonId: `manual-${Date.now()}`
          }
        }
      );

      if (stylesError) throw stylesError;

      const styleVariants = stylesData.styleVariants || [];
      const expected = 8; // 1 original + 7 styles
      if (!styleVariants || styleVariants.length < expected) {
        const got = Math.max((styleVariants?.length || 0) - 1, 0);
        throw new Error(`Onvoldoende styles gegenereerd (${got}/7). Probeer opnieuw.`);
      }
      console.log(`✅ Generated ${styleVariants.length} style variants`);

      // STAP 3: Create 2 button products (35mm + 45mm) with style variants
      const { data: productsData, error: productsError } = await supabase.functions.invoke(
        'create-button-products',
        {
          body: {
            baseDesignUrl: styleVariants.find(v => v.style === 'original')?.url || publicUrl,
            artist: artistName,
            title: buttonTitle,
            description: description || undefined,
            styleVariants: styleVariants
          }
        }
      );

      if (productsError) throw productsError;

      console.log('✅ Created button products:', productsData.product_slugs);
      return productsData;
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Buttons aangemaakt!",
        description: `${buttonTitle} (35mm + 45mm) met 7 styles toegevoegd`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['platform-products'] });
      
      // Reset form
      setImageFile(null);
      setImagePreview("");
      setArtistName("");
      setButtonTitle("");
      setDescription("");
      setTags([]);
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Fout bij aanmaken",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">📌 Button Generator</h1>
        <p className="text-muted-foreground">
          Creëer artist buttons en badges voor in de merchandise shop
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column: Image Upload & Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🖼️ Button Artwork</CardTitle>
              <CardDescription>Upload een afbeelding voor de button (minimaal 800x800px)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-accent/50 transition-colors cursor-pointer"
                   onClick={() => document.getElementById('button-image-upload')?.click()}>
                {imagePreview ? (
                  <div className="space-y-4">
                    <div className="w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-primary shadow-lg">
                      <img src={imagePreview} alt="Button preview" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-sm text-muted-foreground">Klik om een andere afbeelding te uploaden</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-lg font-medium">Upload Button Artwork</p>
                      <p className="text-sm text-muted-foreground">PNG, JPG tot 5MB</p>
                    </div>
                  </div>
                )}
              </div>
              <input
                id="button-image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />

              {imagePreview && (
                <div className="p-4 bg-accent rounded-lg">
                  <h4 className="font-semibold mb-2">Preview als button:</h4>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border shadow">
                      <img src={imagePreview} alt="3.5cm preview" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm text-muted-foreground">3.5cm (klein)</span>
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border shadow">
                      <img src={imagePreview} alt="4cm preview" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm text-muted-foreground">4cm (standaard)</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Product Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>📝 Product Details</CardTitle>
              <CardDescription>
                Upload een design, AI genereert automatisch een circulaire base + 7 artistieke styles. 
                Creëert 2 producten: 35mm (€4.50) en 45mm (€5.50).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="artist">Artiest / Band *</Label>
                <Input
                  id="artist"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="Bijv. Miles Davis"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Button Titel *</Label>
                <Input
                  id="title"
                  value={buttonTitle}
                  onChange={(e) => setButtonTitle(e.target.value)}
                  placeholder="Bijv. Kind of Blue Button"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Korte Beschrijving</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optionele beschrijving..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Bijv. jazz, vintage, blue"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
              </div>

              <Button 
                onClick={() => createButtonMutation.mutate()} 
                disabled={createButtonMutation.isPending || !imageFile || !artistName || !buttonTitle}
                className="w-full"
              >
                {createButtonMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Circulaire base + 7 styles genereren...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Buttons Aanmaken (35mm + 45mm)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
