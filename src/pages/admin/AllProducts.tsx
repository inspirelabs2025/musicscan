import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAllProducts, UnifiedProduct } from "@/hooks/useAllProducts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Search, 
  Filter, 
  Grid3x3, 
  List, 
  Edit, 
  Trash2, 
  Eye,
  Loader2,
  X
} from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function AllProducts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [deletingProduct, setDeletingProduct] = useState<UnifiedProduct | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const { data: products = [], isLoading } = useAllProducts({
    search: search || undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;

    try {
      const { error } = await supabase
        .from(deletingProduct.sourceTable)
        .delete()
        .eq('id', deletingProduct.sourceId);

      if (error) throw error;

      toast({
        title: "Product verwijderd",
        description: `${deletingProduct.title} is succesvol verwijderd.`,
      });

      queryClient.invalidateQueries({ queryKey: ['all-products'] });
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

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;

    const confirmDelete = window.confirm(
      `Weet je zeker dat je ${selectedProducts.size} producten wilt verwijderen?`
    );

    if (!confirmDelete) return;

    try {
      const productsToDelete = products.filter(p => selectedProducts.has(p.id));
      
      // Group by source table
      const byTable: Record<string, string[]> = {};
      productsToDelete.forEach(p => {
        if (!byTable[p.sourceTable]) byTable[p.sourceTable] = [];
        byTable[p.sourceTable].push(p.sourceId);
      });

      // Delete from each table
      await Promise.all(
        Object.entries(byTable).map(([table, ids]) =>
          supabase.from(table).delete().in('id', ids)
        )
      );

      toast({
        title: "Producten verwijderd",
        description: `${selectedProducts.size} producten zijn succesvol verwijderd.`,
      });

      queryClient.invalidateQueries({ queryKey: ['all-products'] });
      setSelectedProducts(new Set());
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van producten.",
        variant: "destructive"
      });
    }
  };

  const toggleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  };

  const getProductTypeBadgeColor = (type: UnifiedProduct['type']) => {
    switch (type) {
      case 'poster': return 'bg-blue-500';
      case 'canvas': return 'bg-purple-500';
      case 'metal_print': return 'bg-gray-500';
      case 'tshirt': return 'bg-green-500';
      case 'sock': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getProductTypeLabel = (type: UnifiedProduct['type']) => {
    switch (type) {
      case 'poster': return 'Poster';
      case 'canvas': return 'Canvas';
      case 'metal_print': return 'Metal Print';
      case 'tshirt': return 'T-Shirt';
      case 'sock': return 'Sock';
      default: return type;
    }
  };

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
            <BreadcrumbPage>All Products</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">All Products</h1>
          <p className="text-muted-foreground">Beheer alle producten op één plek</p>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek op titel, artiest of beschrijving..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
            {search && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearch("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Product Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Types</SelectItem>
              <SelectItem value="poster">Posters</SelectItem>
              <SelectItem value="canvas">Canvas</SelectItem>
              <SelectItem value="metal_print">Metal Prints</SelectItem>
              <SelectItem value="tshirt">T-Shirts</SelectItem>
              <SelectItem value="sock">Socks</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Statussen</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("table")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedProducts.size > 0 && (
        <Card className="p-4 bg-primary/10">
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {selectedProducts.size} product{selectedProducts.size > 1 ? 'en' : ''} geselecteerd
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedProducts(new Set())}
              >
                Deselecteer alles
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Verwijder geselecteerde
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Products Count */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{products.length} producten gevonden</span>
        {(search || typeFilter !== 'all' || statusFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setTypeFilter("all");
              setStatusFilter("all");
            }}
          >
            Reset filters
          </Button>
        )}
      </div>

      {/* Products Display */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-2">Geen producten gevonden</p>
          <p className="text-sm text-muted-foreground">
            Probeer andere filters of zoektermen
          </p>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-muted relative">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Geen afbeelding
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <Badge className={getProductTypeBadgeColor(product.type)}>
                    {getProductTypeLabel(product.type)}
                  </Badge>
                </div>
                <div className="absolute top-2 right-2">
                  <Checkbox
                    checked={selectedProducts.has(product.id)}
                    onCheckedChange={() => toggleProductSelection(product.id)}
                    className="bg-background"
                  />
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold line-clamp-1">{product.title}</h3>
                  {product.artist && (
                    <p className="text-sm text-muted-foreground line-clamp-1">{product.artist}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">€{product.price.toFixed(2)}</span>
                  <Badge variant="outline">{product.status}</Badge>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      toast({
                        title: "Edit functie",
                        description: "Edit modal komt binnenkort beschikbaar"
                      });
                    }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Bewerk
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeletingProduct(product)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground flex justify-between pt-2 border-t">
                  <span>👁 {product.view_count} views</span>
                  {product.purchase_count !== undefined && (
                    <span>🛒 {product.purchase_count} verkocht</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left">
                    <Checkbox
                      checked={selectedProducts.size === products.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedProducts(new Set(products.map(p => p.id)));
                        } else {
                          setSelectedProducts(new Set());
                        }
                      }}
                    />
                  </th>
                  <th className="p-4 text-left">Product</th>
                  <th className="p-4 text-left">Type</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Prijs</th>
                  <th className="p-4 text-left">Views</th>
                  <th className="p-4 text-left">Gemaakt</th>
                  <th className="p-4 text-left">Acties</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={() => toggleProductSelection(product.id)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image || '/placeholder.svg'}
                          alt={product.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <div className="font-medium line-clamp-1">{product.title}</div>
                          {product.artist && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {product.artist}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={getProductTypeBadgeColor(product.type)}>
                        {getProductTypeLabel(product.type)}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{product.status}</Badge>
                    </td>
                    <td className="p-4">€{product.price.toFixed(2)}</td>
                    <td className="p-4">{product.view_count}</td>
                    <td className="p-4">
                      {new Date(product.created_at).toLocaleDateString('nl-NL')}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            toast({
                              title: "Edit functie",
                              description: "Edit modal komt binnenkort beschikbaar"
                            });
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeletingProduct(product)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
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
