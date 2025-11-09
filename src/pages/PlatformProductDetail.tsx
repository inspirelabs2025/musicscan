import { useParams, Link } from "react-router-dom";
import { usePlatformProductDetail, useSimilarProducts } from "@/hooks/usePlatformProductDetail";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/contexts/CartContext";
import { ArrowLeft, ShoppingCart, Check, Package, Clock, BookOpen, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Helmet } from "react-helmet";
import { useBlogPostByProduct } from "@/hooks/useBlogPostByProduct";
import { ReviewSchema, AggregateRatingSchema } from "@/components/SEO/ReviewSchema";
import { PosterStructuredData } from "@/components/SEO/PosterStructuredData";
import { generatePosterAltTag } from "@/utils/generateAltTag";
import { BreadcrumbNavigation } from "@/components/SEO/BreadcrumbNavigation";
import { PosterStyleSelector } from "@/components/timemachine/PosterStyleSelector";

export default function PlatformProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = usePlatformProductDetail(slug!);
  const { data: similarProducts = [] } = useSimilarProducts(
    product?.id || "",
    product?.categories?.[0],
    4
  );
  const { addToCart, isInCart } = useCart();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  
  // Find related blog post
  const { data: blogPost } = useBlogPostByProduct(
    product?.id || null,
    product?.artist || null,
    product?.title || "",
    product?.discogs_id
  );

  const isPoster = product?.categories?.includes('POSTER');
  const posterStyle = product?.tags?.find(t => 
    ['posterize', 'vectorcartoon', 'oilpainting', 'watercolor', 'pencilsketch', 'comicbook', 'abstract'].includes(t.toLowerCase())
  );

  // Check for style options
  const hasStyleOptions = product?.metadata?.has_style_options === true;
  const styleVariants = product?.metadata?.style_variants || [];

  // Set default style when product loads
  useEffect(() => {
    if (product && !selectedStyle && styleVariants.length > 0) {
      const defaultStyle = product.metadata?.default_style || styleVariants[0]?.style;
      if (defaultStyle) {
        setSelectedStyle(defaultStyle);
        const defaultVariant = styleVariants.find((v: any) => v.style === defaultStyle);
        if (defaultVariant?.url) {
          setSelectedImage(defaultVariant.url);
        }
      }
    }
  }, [product, styleVariants, selectedStyle]);

  // Generate POSTER-specific meta description
  const generateMetaDescription = () => {
    if (!product) return 'Bekijk productdetails in onze shop';
    
    if (isPoster) {
      const styleText = posterStyle ? ` in ${posterStyle} stijl` : '';
      return `Koop ${product.artist} - ${product.title}${styleText}. Premium kunst poster. Museum kwaliteit. Gratis verzending vanaf €50. Nu beschikbaar voor €${product.price}`;
    }
    
    return `${product.title}${product.artist ? ` van ${product.artist}` : ''} - ${product.description || 'Bekijk details en bestel eenvoudig.'} Prijs: €${product.price}`;
  };

  // SEO optimization for product page
  useSEO({
    title: product ? `${product.title}${product.artist ? ` - ${product.artist}` : ''}${isPoster ? ' | Premium Art Poster' : ''} | MusicScan Shop` : 'Product | MusicScan Shop',
    description: generateMetaDescription(),
    keywords: product ? `${product.title}, ${product.artist || ''}, ${isPoster ? 'poster, AI art, kunstposter, wanddecoratie,' : ''} ${product.media_type || ''}, muziek, shop, kopen, ${product.tags?.join(', ') || ''}, ${product.categories?.join(', ') || ''}`.replace(/,\s*,/g, ',').replace(/^,|,$/g, '') : 'muziek shop, producten',
    canonicalUrl: `https://www.musicscan.app/product/${slug}`,
    image: product?.primary_image,
    type: isPoster ? 'product.item' : 'product'
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
    const styleLabel = styleVariants.find((v: any) => v.style === selectedStyle)?.label;
    addToCart({
      id: product.id,
      media_type: 'product',
      artist: product.artist || "",
      title: product.title,
      price: product.price,
      condition_grade: "Nieuw",
      seller_id: "platform",
      image: selectedImage || product.primary_image || undefined,
      selected_style: selectedStyle || product.metadata?.default_style,
    });
    toast.success(`Toegevoegd: ${styleLabel || selectedStyle || 'Standaard'} style`);
  };

  // Structured data for Product schema
  const structuredData = product ? {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.title,
    "image": product.primary_image || "",
    "description": product.description || `${product.title}${product.artist ? ` van ${product.artist}` : ''}`,
    "brand": {
      "@type": "Brand",
      "name": product.artist || "MusicScan"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://www.musicscan.app/product/${slug}`,
      "priceCurrency": "EUR",
      "price": product.price,
      "availability": product.stock_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "MusicScan"
      }
    },
    "category": product.categories?.join(", ") || product.media_type || "Music"
  } : null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb Navigation */}
      <BreadcrumbNavigation items={[
        { name: "Home", url: "/" },
        ...(isPoster ? [
          { name: "Posters", url: "/posters" }
        ] : [
          { name: "Art Shop", url: "/art-shop" }
        ]),
        { name: `${product.artist} - ${product.title}`, url: `/product/${slug}` }
      ]} />

      {/* Enhanced Structured Data for POSTER products */}
      {isPoster ? (
        <PosterStructuredData product={product} slug={slug!} />
      ) : (
        structuredData && (
          <Helmet>
            <script type="application/ld+json">
              {JSON.stringify(structuredData)}
            </script>
          </Helmet>
        )
      )}

      {/* Enhanced Social Media Meta Tags for POSTER */}
      {isPoster && (
        <Helmet>
          <meta property="product:brand" content={product.artist || "MusicScan"} />
          <meta property="product:availability" content="in stock" />
          <meta property="product:condition" content="new" />
          <meta property="product:price:amount" content={product.price.toString()} />
          <meta property="product:price:currency" content="EUR" />
          <meta property="product:category" content="Posters & Prints" />
          
          {/* Pinterest Rich Pins */}
          <meta property="og:type" content="product" />
          <meta name="pinterest:price:amount" content={product.price.toString()} />
          <meta name="pinterest:price:currency" content="EUR" />
          
          {/* Twitter Product Card */}
          <meta name="twitter:card" content="product" />
          <meta name="twitter:data1" content={`€${product.price}`} />
          <meta name="twitter:label1" content="Prijs" />
          <meta name="twitter:data2" content={product.stock_quantity > 0 ? "Op voorraad" : "Uitverkocht"} />
          <meta name="twitter:label2" content="Beschikbaarheid" />
        </Helmet>
      )}
      
      <ReviewSchema
        itemName={`${product.artist ? product.artist + ' - ' : ''}${product.title}`}
        artist={product.artist || 'MusicScan'}
        reviewBody={product.description || `${product.title} beschikbaar in onze shop. Hoge kwaliteit en snelle verzending gegarandeerd.`}
        rating={4.5}
        datePublished={product.published_at || product.created_at}
        reviewUrl={`https://www.musicscan.app/product/${slug}`}
        imageUrl={product.primary_image || undefined}
        itemType="Product"
      />
      
      {product.view_count > 20 && (
        <AggregateRatingSchema
          itemName={`${product.artist ? product.artist + ' - ' : ''}${product.title}`}
          artist={product.artist || 'MusicScan'}
          ratingValue={4.4}
          reviewCount={Math.floor(product.view_count / 15)}
          imageUrl={product.primary_image || undefined}
        />
      )}

      {/* Back button */}
      <Link to={isPoster ? "/posters" : "/art-shop"} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        Terug naar {isPoster ? "Posters" : "Art Shop"}
      </Link>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
            {displayImage ? (
              <img
                src={displayImage}
                alt={isPoster 
                  ? generatePosterAltTag(
                      product.artist || 'Unknown Artist', 
                      product.title, 
                      posterStyle
                    )
                  : product.title
                }
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

          {/* Style Selector - only for products with style options */}
          {hasStyleOptions && styleVariants.length > 0 && (
            <Card className="p-6">
              <PosterStyleSelector
                styleVariants={styleVariants}
                currentStyle={selectedStyle || product.metadata?.default_style}
                onStyleSelect={(url, style) => {
                  setSelectedImage(url);
                  setSelectedStyle(style);
                }}
              />
            </Card>
          )}

        </div>
      </div>

      {/* Related Blog Post */}
      {blogPost && (
        <Card className="p-6 md:p-8 mb-12 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 border-2">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Blog thumbnail */}
            <div className="w-full md:w-48 aspect-square flex-shrink-0 rounded-lg overflow-hidden shadow-lg">
              <img
                src={blogPost.album_cover_url || product.primary_image || '/placeholder.svg'}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold uppercase tracking-wide text-primary">
                  Verhaal over dit album
                </span>
              </div>
              
              <h3 className="text-2xl font-bold">
                {blogPost.yaml_frontmatter?.title || `Het verhaal achter ${product.title}`}
              </h3>
              
              <p className="text-muted-foreground line-clamp-3">
                {blogPost.yaml_frontmatter?.description || 
                 `Ontdek het fascinerende verhaal achter ${product.title}${product.artist ? ` van ${product.artist}` : ''}. Lees over de geschiedenis, de impact en wat dit album zo bijzonder maakt.`}
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="secondary" className="bg-white/60 dark:bg-black/20">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Verhaal
                </Badge>
                {blogPost.yaml_frontmatter?.genre && (
                  <Badge variant="outline">{blogPost.yaml_frontmatter.genre}</Badge>
                )}
              </div>
            </div>

            {/* CTA */}
            <Link to={`/plaat-verhaal/${blogPost.slug}`} className="w-full md:w-auto flex-shrink-0">
              <Button 
                size="lg"
                className="w-full bg-gradient-to-r from-vinyl-purple to-accent hover:from-vinyl-purple/90 hover:to-accent/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Lees verhaal
              </Button>
            </Link>
          </div>
        </Card>
      )}

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
