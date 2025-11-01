import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformProducts } from "@/hooks/usePlatformProducts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Archive, Copy, Sparkles } from "lucide-react";
import { ProductFormModal } from "@/components/admin/ProductFormModal";
import { Badge } from "@/components/ui/badge";
import type { PlatformProduct } from "@/hooks/usePlatformProducts";
import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";

export default function PlatformProducts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PlatformProduct | null>(null);
  
  const { data: activeProducts = [] } = usePlatformProducts({ });
  const { data: featuredProducts = [] } = usePlatformProducts({ featured: true });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            Je moet ingelogd zijn als admin om producten te beheren.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Platform Producten</h1>
          <p className="text-muted-foreground">Beheer de producten in je webshop</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => navigate('/test-discogs-id')} 
            variant="outline"
            size="sm"
          >
            🧪 Test Discogs ID
          </Button>
          <Button 
            onClick={() => navigate('/admin/bulk-art-generator')} 
            variant="outline"
            size="lg"
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button 
            onClick={() => navigate('/admin/art-generator')} 
            variant="secondary"
            size="lg"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            ART Generator
          </Button>
          <Button onClick={() => setShowAddModal(true)} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Nieuw Product
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            Alle Producten ({activeProducts.length})
          </TabsTrigger>
          <TabsTrigger value="featured">
            Featured ({featuredProducts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <ProductsGrid 
            products={activeProducts} 
            onEdit={setEditingProduct}
          />
        </TabsContent>

        <TabsContent value="featured" className="mt-6">
          <ProductsGrid 
            products={featuredProducts} 
            onEdit={setEditingProduct}
          />
        </TabsContent>
      </Tabs>

      <ProductFormModal
        open={showAddModal || !!editingProduct}
        onClose={() => {
          setShowAddModal(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
      />
    </div>
  );
}

function ProductsGrid({ 
  products, 
  onEdit 
}: { 
  products: PlatformProduct[];
  onEdit: (product: PlatformProduct) => void;
}) {
  if (products.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground mb-4">Nog geen producten</p>
        <p className="text-sm text-muted-foreground">
          Klik op "Nieuw Product" om je eerste product toe te voegen
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="aspect-square bg-muted relative">
            {product.primary_image ? (
              <img
                src={product.primary_image}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Geen afbeelding
              </div>
            )}
            {product.is_featured && (
              <Badge className="absolute top-2 left-2 bg-primary">Featured</Badge>
            )}
            {product.is_on_sale && (
              <Badge className="absolute top-2 right-2 bg-destructive">Sale</Badge>
            )}
            {product.stock_quantity <= product.low_stock_threshold && (
              <Badge className="absolute bottom-2 left-2 bg-orange-500">
                Laag voorraad: {product.stock_quantity}
              </Badge>
            )}
          </div>
          
          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-semibold line-clamp-1">{product.title}</h3>
              {product.artist && (
                <p className="text-sm text-muted-foreground line-clamp-1">{product.artist}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-bold">{product.currency}{product.price}</span>
                {product.compare_at_price && (
                  <span className="text-sm text-muted-foreground line-through ml-2">
                    {product.currency}{product.compare_at_price}
                  </span>
                )}
              </div>
              <Badge variant="outline">{product.media_type}</Badge>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onEdit(product)}
              >
                <Edit className="h-3 w-3 mr-1" />
                Bewerk
              </Button>
            </div>

            <div className="text-xs text-muted-foreground flex justify-between pt-2 border-t">
              <span>👁 {product.view_count} views</span>
              <span>🛒 {product.purchase_count} verkocht</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
