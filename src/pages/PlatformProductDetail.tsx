import { useParams, Link } from "react-router-dom";
import { usePlatformProductDetail, useSimilarProducts } from "@/hooks/usePlatformProductDetail";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useShoppingCart } from "@/hooks/useShoppingCart";
import { ArrowLeft, ShoppingCart, Check, Package, Clock } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";

export default function PlatformProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = usePlatformProductDetail(slug!);
  const { data: similarProducts = [] } = useSimilarProducts(
    product?.id || "",
    product?.categories?.[0],
    4
  );
  const { addToCart, isInCart } = useShoppingCart();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // SEO optimization for product page
  useSEO({
    title: product ? `${product.title}${product.artist ? ` - ${product.artist}` : ''} | MusicScan Shop` : 'Product | MusicScan Shop',
    description: product ? `${product.title}${product.artist ? ` van ${product.artist}` : ''} - ${product.description || 'Bekijk details en bestel eenvoudig.'} Prijs: €${product.price}` : 'Bekijk productdetails in onze shop',
    keywords: product ? `${product.title}, ${product.artist || ''}, ${product.media_type || ''}, muziek, shop, kopen, ${product.categories?.join(', ') || ''}`.replace(/,\s*,/g, ',').replace(/^,|,$/g, '') : 'muziek shop, producten',
    canonicalUrl: `https://www.musicscan.app/product/${slug}`,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Product niet gevonden</h1>
        <Link to="/">
          <Button>Terug naar home</Button>
        </Link>
      </div>
    );
  }

  const allImages = [product.primary_image, ...(product.images || [])].filter(Boolean);
  const displayImage = selectedImage || product.primary_image;
  const inCart = isInCart(product.id);

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      media_type: 'product',
      artist: product.artist || "",
      title: product.title,
      price: product.price,
      condition_grade: "Nieuw",
      seller_id: "platform",
      image: product.primary_image || undefined,
    });
    toast.success("Toegevoegd aan winkelwagen");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        Terug naar overzicht
      </Link>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
            {displayImage ? (
              <img
                src={displayImage}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Geen afbeelding
              </div>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {allImages.map((image, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(image)}
                  className={`aspect-square bg-muted rounded overflow-hidden border-2 transition-colors ${
                    (selectedImage || product.primary_image) === image
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.title} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            {product.artist && (
              <p className="text-muted-foreground mb-2">{product.artist}</p>
            )}
            <h1 className="text-3xl font-bold mb-4">{product.title}</h1>

            <div className="flex flex-wrap gap-2 mb-4">
              {product.is_new && <Badge>NIEUW</Badge>}
              {product.is_on_sale && <Badge variant="destructive">SALE</Badge>}
              {product.media_type && (
                <Badge variant="outline">{product.media_type}</Badge>
              )}
              {product.categories?.map((cat) => (
                <Badge key={cat} variant="secondary">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          {product.description && (
            <div className="prose max-w-none">
              <p className="text-muted-foreground">{product.description}</p>
            </div>
          )}

          {/* Price & Stock */}
          <Card className="p-6 space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold">
                {product.currency}{product.price}
              </span>
              {product.compare_at_price && (
                <span className="text-xl text-muted-foreground line-through">
                  {product.currency}{product.compare_at_price}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm">
              {product.stock_quantity > 0 ? (
                <>
                  <Package className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">
                    {product.stock_quantity} op voorraad
                  </span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-orange-600">Uitverkocht</span>
                </>
              )}
            </div>

            {product.stock_quantity > 0 && (
              <Button
                size="lg"
                className="w-full"
                onClick={handleAddToCart}
                disabled={inCart}
              >
                {inCart ? (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    In winkelwagen
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Toevoegen aan winkelwagen
                  </>
                )}
              </Button>
            )}
          </Card>

        </div>
      </div>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Vergelijkbare producten</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {similarProducts.map((similar) => (
              <Link key={similar.id} to={`/product/${similar.slug}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-all group">
                  <div className="relative aspect-square bg-muted">
                    {similar.primary_image ? (
                      <img
                        src={similar.primary_image}
                        alt={similar.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        Geen afbeelding
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    {similar.artist && (
                      <p className="text-xs text-muted-foreground truncate">
                        {similar.artist}
                      </p>
                    )}
                    <h3 className="font-semibold line-clamp-2 text-sm">
                      {similar.title}
                    </h3>
                    <p className="font-bold">
                      {similar.currency}{similar.price}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
