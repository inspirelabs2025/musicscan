import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { PlatformProduct } from "@/hooks/usePlatformProducts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  product?: PlatformProduct | null;
}

export function ProductFormModal({ open, onClose, product }: ProductFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<{
    title: string;
    artist: string;
    description: string;
    long_description: string;
    media_type: 'cd' | 'vinyl' | 'merchandise' | 'book' | 'accessory' | 'boxset' | 'art';
    format: string;
    condition_grade: string;
    price: string;
    compare_at_price: string;
    stock_quantity: string;
    primary_image: string;
    slug: string;
    discogs_id: string;
    discogs_url: string;
    categories: string;
    tags: string;
    genre: string;
    label: string;
    catalog_number: string;
    year: string;
    country: string;
    is_featured: boolean;
    is_on_sale: boolean;
    is_new: boolean;
  }>({
    title: "",
    artist: "",
    description: "",
    long_description: "",
    media_type: "vinyl",
    format: "",
    condition_grade: "NM",
    price: "",
    compare_at_price: "",
    stock_quantity: "1",
    primary_image: "",
    slug: "",
    discogs_id: "",
    discogs_url: "",
    categories: "",
    tags: "",
    genre: "",
    label: "",
    catalog_number: "",
    year: "",
    country: "",
    is_featured: false,
    is_on_sale: false,
    is_new: false,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title,
        artist: product.artist || "",
        description: product.description || "",
        long_description: product.long_description || "",
        media_type: product.media_type,
        format: product.format || "",
        condition_grade: product.condition_grade || "NM",
        price: product.price.toString(),
        compare_at_price: product.compare_at_price?.toString() || "",
        stock_quantity: product.stock_quantity.toString(),
        primary_image: product.primary_image || "",
        slug: product.slug,
        discogs_id: product.discogs_id?.toString() || "",
        discogs_url: product.discogs_url || "",
        categories: product.categories.join(", "),
        tags: product.tags.join(", "),
        genre: product.genre || "",
        label: product.label || "",
        catalog_number: product.catalog_number || "",
        year: product.year?.toString() || "",
        country: product.country || "",
        is_featured: product.is_featured,
        is_on_sale: product.is_on_sale,
        is_new: product.is_new,
      });
    } else {
      // Reset form for new product
      setFormData({
        title: "",
        artist: "",
        description: "",
        long_description: "",
        media_type: "vinyl",
        format: "",
        condition_grade: "NM",
        price: "",
        compare_at_price: "",
        stock_quantity: "1",
        primary_image: "",
        slug: "",
        discogs_id: "",
        discogs_url: "",
        categories: "",
        tags: "",
        genre: "",
        label: "",
        catalog_number: "",
        year: "",
        country: "",
        is_featured: false,
        is_on_sale: false,
        is_new: false,
      });
    }
  }, [product, open]);

  const generateSlug = async (title: string, artist: string) => {
    const { data, error } = await supabase.rpc('generate_product_slug', {
      p_title: title,
      p_artist: artist || null
    });
    
    if (error) {
      console.error("Error generating slug:", error);
      return "";
    }
    
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let slug = formData.slug;
      
      // Auto-generate slug if empty
      if (!slug && formData.title) {
        slug = await generateSlug(formData.title, formData.artist);
        if (!slug) {
          toast({
            title: "Fout bij slug genereren",
            variant: "destructive",
          });
          return;
        }
      }

      const productData = {
        title: formData.title,
        artist: formData.artist || null,
        description: formData.description || null,
        long_description: formData.long_description || null,
        media_type: formData.media_type,
        format: formData.format || null,
        condition_grade: formData.condition_grade || null,
        price: parseFloat(formData.price),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        stock_quantity: parseInt(formData.stock_quantity),
        primary_image: formData.primary_image || null,
        images: formData.primary_image ? [formData.primary_image] : [],
        slug: slug,
        discogs_id: formData.discogs_id ? parseInt(formData.discogs_id) : null,
        discogs_url: formData.discogs_url || null,
        categories: formData.categories ? formData.categories.split(",").map(c => c.trim()) : [],
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : [],
        genre: formData.genre || null,
        label: formData.label || null,
        catalog_number: formData.catalog_number || null,
        year: formData.year ? parseInt(formData.year) : null,
        country: formData.country || null,
        is_featured: formData.is_featured,
        is_on_sale: formData.is_on_sale,
        is_new: formData.is_new,
        published_at: new Date().toISOString(),
        status: "active",
      };

      if (product) {
        // Update existing product
        const { error } = await supabase
          .from('platform_products')
          .update(productData)
          .eq('id', product.id);

        if (error) throw error;

        toast({
          title: "Product bijgewerkt",
          description: "Het product is succesvol bijgewerkt",
        });
      } else {
        // Create new product
        const { error } = await supabase
          .from('platform_products')
          .insert(productData);

        if (error) throw error;

        toast({
          title: "Product toegevoegd",
          description: "Het nieuwe product is succesvol toegevoegd",
        });
      }

      queryClient.invalidateQueries({ queryKey: ['platform-products'] });
      onClose();
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast({
        title: "Fout bij opslaan",
        description: error.message || "Er is een fout opgetreden",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? "Product Bewerken" : "Nieuw Product Toevoegen"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basis Info</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="settings">Instellingen</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title">Titel *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="artist">Artiest</Label>
                  <Input
                    id="artist"
                    value={formData.artist}
                    onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="media_type">Media Type *</Label>
                  <Select
                    value={formData.media_type}
                    onValueChange={(value: any) => setFormData({ ...formData, media_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vinyl">Vinyl</SelectItem>
                      <SelectItem value="cd">CD</SelectItem>
                      <SelectItem value="boxset">Boxset</SelectItem>
                      <SelectItem value="merchandise">Merchandise</SelectItem>
                      <SelectItem value="book">Boek</SelectItem>
                      <SelectItem value="accessory">Accessoire</SelectItem>
                      <SelectItem value="art">Art</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="price">Prijs (€) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="stock_quantity">Voorraad *</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="primary_image">Afbeelding URL</Label>
                  <Input
                    id="primary_image"
                    value={formData.primary_image}
                    onChange={(e) => setFormData({ ...formData, primary_image: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Korte Beschrijving</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="format">Format</Label>
                  <Input
                    id="format"
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    placeholder="LP, CD, 12&quot;, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="condition_grade">Conditie</Label>
                  <Select
                    value={formData.condition_grade}
                    onValueChange={(value) => setFormData({ ...formData, condition_grade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sealed">Sealed (Verzegeld)</SelectItem>
                      <SelectItem value="M">M (Mint)</SelectItem>
                      <SelectItem value="NM">NM (Near Mint)</SelectItem>
                      <SelectItem value="VG+">VG+ (Very Good Plus)</SelectItem>
                      <SelectItem value="VG">VG (Very Good)</SelectItem>
                      <SelectItem value="G+">G+ (Good Plus)</SelectItem>
                      <SelectItem value="G">G (Good)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="genre">Genre</Label>
                  <Input
                    id="genre"
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="year">Jaar</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="label">Label</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="catalog_number">Catalogusnummer</Label>
                  <Input
                    id="catalog_number"
                    value={formData.catalog_number}
                    onChange={(e) => setFormData({ ...formData, catalog_number: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="categories">Categorieën (komma gescheiden)</Label>
                  <Input
                    id="categories"
                    value={formData.categories}
                    onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                    placeholder="vinyl, rock, 70s"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="tags">Tags (komma gescheiden)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="rare, collectible, mint"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_featured">Featured Product</Label>
                    <p className="text-sm text-muted-foreground">Toon op homepage</p>
                  </div>
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_on_sale">In de Aanbieding</Label>
                    <p className="text-sm text-muted-foreground">Toon sale badge</p>
                  </div>
                  <Switch
                    id="is_on_sale"
                    checked={formData.is_on_sale}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_on_sale: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_new">Nieuw Product</Label>
                    <p className="text-sm text-muted-foreground">Toon "Nieuw" badge</p>
                  </div>
                  <Switch
                    id="is_new"
                    checked={formData.is_new}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_new: checked })}
                  />
                </div>

                <div>
                  <Label htmlFor="compare_at_price">Vergelijk Prijs (optioneel)</Label>
                  <Input
                    id="compare_at_price"
                    type="number"
                    step="0.01"
                    value={formData.compare_at_price}
                    onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                    placeholder="Voor doorgestreepte 'was' prijs"
                  />
                </div>

                <div>
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="Automatisch gegenereerd als leeg"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Wordt automatisch aangemaakt op basis van titel en artiest
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuleren
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Bezig..." : product ? "Bijwerken" : "Toevoegen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
