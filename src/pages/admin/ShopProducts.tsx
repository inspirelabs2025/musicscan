import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Package, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

interface ShopProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  images: string[];
  category: string;
  stock_quantity: number;
  is_active: boolean;
  weight: number;
  shipping_cost: number;
  created_at: string;
  updated_at: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  stock_quantity: number;
  weight: number;
  shipping_cost: number;
  is_active: boolean;
}

export const ShopProducts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: 0,
    currency: "EUR",
    category: "general",
    stock_quantity: 0,
    weight: 100,
    shipping_cost: 0,
    is_active: true,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["shop-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ShopProduct[];
    },
    enabled: !!user,
  });

  const createProductMutation = useMutation({
    mutationFn: async (productData: ProductFormData) => {
      const { data, error } = await supabase
        .from("shop_products")
        .insert({
          ...productData,
          admin_user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-products"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Product toegevoegd",
        description: "Het product is succesvol toegevoegd aan de shop.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij toevoegen",
        description: "Er is een fout opgetreden bij het toevoegen van het product.",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, productData }: { id: string; productData: ProductFormData }) => {
      const { data, error } = await supabase
        .from("shop_products")
        .update(productData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-products"] });
      setIsDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      toast({
        title: "Product bijgewerkt",
        description: "Het product is succesvol bijgewerkt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij bijwerken",
        description: "Er is een fout opgetreden bij het bijwerken van het product.",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from("shop_products")
        .delete()
        .eq("id", productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-products"] });
      toast({
        title: "Product verwijderd",
        description: "Het product is succesvol verwijderd uit de shop.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van het product.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      currency: "EUR",
      category: "general",
      stock_quantity: 0,
      weight: 100,
      shipping_cost: 0,
      is_active: true,
    });
  };

  const handleEdit = (product: ShopProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price,
      currency: product.currency,
      category: product.category,
      stock_quantity: product.stock_quantity,
      weight: product.weight,
      shipping_cost: product.shipping_cost,
      is_active: product.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, productData: formData });
    } else {
      createProductMutation.mutate(formData);
    }
  };

  const handleDelete = (productId: string) => {
    if (confirm("Weet je zeker dat je dit product wilt verwijderen?")) {
      deleteProductMutation.mutate(productId);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Laden...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Admin
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Shop Producten</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Shop Producten</h1>
          <p className="text-muted-foreground">Beheer je shop producten</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingProduct(null); resetForm(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Product Toevoegen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Product Bewerken" : "Nieuw Product"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? "Bewerk de productgegevens" : "Voeg een nieuw product toe aan je shop"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Naam *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categorie</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Algemeen</SelectItem>
                      <SelectItem value="accessories">Accessoires</SelectItem>
                      <SelectItem value="merchandise">Merchandise</SelectItem>
                      <SelectItem value="books">Boeken</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Beschrijving</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Prijs *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="stock">Voorraad</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Gewicht (g)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 100 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shipping">Verzendkosten</Label>
                  <Input
                    id="shipping"
                    type="number"
                    step="0.01"
                    value={formData.shipping_cost}
                    onChange={(e) => setFormData({ ...formData, shipping_cost: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Valuta</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <Label htmlFor="is_active">Actief</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit" disabled={createProductMutation.isPending || updateProductMutation.isPending}>
                  {editingProduct ? "Bijwerken" : "Toevoegen"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {products?.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nog geen producten toegevoegd</p>
            </CardContent>
          </Card>
        ) : (
          products?.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {product.name}
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? "Actief" : "Inactief"}
                      </Badge>
                      <Badge variant="outline">{product.category}</Badge>
                    </CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Prijs:</span> {product.currency} {product.price}
                  </div>
                  <div>
                    <span className="font-medium">Voorraad:</span> {product.stock_quantity}
                  </div>
                  <div>
                    <span className="font-medium">Gewicht:</span> {product.weight}g
                  </div>
                  <div>
                    <span className="font-medium">Verzending:</span> {product.currency} {product.shipping_cost}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};