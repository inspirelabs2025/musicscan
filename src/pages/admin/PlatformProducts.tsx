import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformProducts } from "@/hooks/usePlatformProducts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, RefreshCw, Loader2, Upload, Sparkles, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProductFormModal } from "@/components/admin/ProductFormModal";
import { Badge } from "@/components/ui/badge";
import type { PlatformProduct } from "@/hooks/usePlatformProducts";
import { useNavigate } from "react-router-dom";
import { useRefetchProductArtwork } from "@/hooks/useRefetchProductArtwork";
import { RefetchProgressDialog } from "@/components/admin/RefetchProgressDialog";
import { checkArtworkQuality, filterProductsNeedingRefetch } from "@/utils/artworkQualityCheck";
import { useQueryClient } from "@tanstack/react-query";
import { useBulkFixArtMediaType } from "@/hooks/useBulkFixArtMediaType";

export default function PlatformProducts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PlatformProduct | null>(null);
  const [showLowQualityOnly, setShowLowQualityOnly] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<PlatformProduct | null>(null);
  const [batchProgress, setBatchProgress] = useState({
    current: 0,
    total: 0,
    successCount: 0,
    errorCount: 0,
    noArtworkCount: 0,
    currentProduct: undefined as any,
    isComplete: false,
    results: [] as any[]
  });
  
  const { data: activeProducts = [] } = usePlatformProducts({ });
  const { data: featuredProducts = [] } = usePlatformProducts({ featured: true });
  const { refetchSingle, refetchBatch, isLoading: isRefetching } = useRefetchProductArtwork();
  const { mutate: fixArtMediaType, isPending: isFixing } = useBulkFixArtMediaType();

  const handleRefetchSingle = async (productId: string) => {
    await refetchSingle(productId);
    queryClient.invalidateQueries({ queryKey: ['platform-products'] });
  };

  const handleBatchRefetch = async () => {
    const productsToRefetch = showLowQualityOnly 
      ? filterProductsNeedingRefetch(activeProducts)
      : activeProducts;
    
    if (productsToRefetch.length === 0) {
      return;
    }

    setBatchProgress({
      current: 0,
      total: productsToRefetch.length,
      successCount: 0,
      errorCount: 0,
      noArtworkCount: 0,
      currentProduct: undefined,
      isComplete: false,
      results: []
    });
    setShowProgressDialog(true);

    const productIds = productsToRefetch.map(p => p.id);
    
    const result = await refetchBatch(productIds, (current, total, currentProduct) => {
      setBatchProgress(prev => ({
        ...prev,
        current,
        total,
        currentProduct,
        successCount: prev.results.filter(r => r.status === 'success').length,
        errorCount: prev.results.filter(r => r.status === 'error').length,
        noArtworkCount: prev.results.filter(r => r.status === 'no_artwork').length
      }));
    });

    if (result.success) {
      setBatchProgress(prev => ({
        ...prev,
        isComplete: true,
        results: result.results || [],
        successCount: result.summary?.successCount || 0,
        errorCount: result.summary?.errorCount || 0,
        noArtworkCount: result.summary?.noArtworkCount || 0
      }));
      queryClient.invalidateQueries({ queryKey: ['platform-products'] });
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;

    try {
      const { error } = await supabase
        .from('platform_products')
        .delete()
        .eq('id', deletingProduct.id);

      if (error) throw error;

      toast({
        title: "Product verwijderd",
        description: `${deletingProduct.title} is succesvol verwijderd.`,
      });

      queryClient.invalidateQueries({ queryKey: ['platform-products'] });
      setDeletingProduct(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van het product.",
        variant: "destructive"
      });
    }
  };

  const filteredProducts = showLowQualityOnly 
    ? filterProductsNeedingRefetch(activeProducts)
    : activeProducts;

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
            onClick={() => fixArtMediaType()}
            variant="outline"
            size="sm"
            disabled={isFixing}
          >
            {isFixing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Fixing...</>
            ) : (
              <>🎨 Fix Art Type</>
            )}
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
            variant="outline" 
            onClick={handleBatchRefetch}
            disabled={isRefetching}
            size="lg"
          >
            {isRefetching ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Ophalen...</>
            ) : (
              <><RefreshCw className="w-4 h-4 mr-2" /> Re-fetch Artwork</>
            )}
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

      <div className="flex items-center gap-2">
        <Button
          variant={showLowQualityOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setShowLowQualityOnly(!showLowQualityOnly)}
        >
          {showLowQualityOnly ? '✓' : ''} Alleen lage kwaliteit ({filterProductsNeedingRefetch(activeProducts).length})
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            {showLowQualityOnly ? 'Lage Kwaliteit' : 'Alle Producten'} ({filteredProducts.length})
          </TabsTrigger>
          <TabsTrigger value="featured">
            Featured ({featuredProducts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <ProductsGrid 
            products={filteredProducts} 
            onEdit={setEditingProduct}
            onRefetch={handleRefetchSingle}
            onDelete={setDeletingProduct}
            isRefetching={isRefetching}
          />
        </TabsContent>

        <TabsContent value="featured" className="mt-6">
          <ProductsGrid 
            products={featuredProducts} 
            onEdit={setEditingProduct}
            onRefetch={handleRefetchSingle}
            onDelete={setDeletingProduct}
            isRefetching={isRefetching}
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

      <RefetchProgressDialog 
        open={showProgressDialog}
        onOpenChange={setShowProgressDialog}
        {...batchProgress}
      />

      <AlertDialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Product verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je "{deletingProduct?.title}" wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive hover:bg-destructive/90">
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProductsGrid({ 
  products, 
  onEdit,
  onRefetch,
  onDelete,
  isRefetching
}: { 
  products: PlatformProduct[];
  onEdit: (product: PlatformProduct) => void;
  onRefetch?: (productId: string) => void;
  onDelete?: (product: PlatformProduct) => void;
  isRefetching?: boolean;
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
      {products.map((product) => {
        const artworkQuality = checkArtworkQuality(product.primary_image);
        
        return (
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
              {artworkQuality.quality === 'low' && (
                <Badge 
                  variant="destructive" 
                  className="absolute bottom-2 left-2"
                >
                  ⚠️ Lage kwaliteit
                </Badge>
              )}
              {artworkQuality.quality === 'none' && (
                <Badge 
                  variant="destructive" 
                  className="absolute bottom-2 left-2"
                >
                  ❌ Geen artwork
                </Badge>
              )}
              {product.stock_quantity <= product.low_stock_threshold && (
                <Badge className="absolute bottom-2 right-2 bg-orange-500">
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
                {artworkQuality.dimensions && (
                  <p className="text-xs text-muted-foreground mt-1">
                    📐 {artworkQuality.dimensions}
                  </p>
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
                {onRefetch && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRefetch(product.id)}
                    disabled={isRefetching}
                    title="Re-fetch artwork"
                  >
                    {isRefetching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onEdit(product)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Bewerk
                </Button>
                {onDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(product)}
                    title="Verwijder product"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>

              <div className="text-xs text-muted-foreground flex justify-between pt-2 border-t">
                <span>👁 {product.view_count} views</span>
                <span>🛒 {product.purchase_count} verkocht</span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
