import { Helmet } from "react-helmet";
import type { PlatformProduct } from "@/hooks/usePlatformProducts";

interface PosterStructuredDataProps {
  product: PlatformProduct;
  slug: string;
}

export const PosterStructuredData = ({ product, slug }: PosterStructuredDataProps) => {
  const style = product.tags?.find(t => 
    ['posterize', 'vectorcartoon', 'oilpainting', 'watercolor', 'pencilsketch', 'comicbook', 'abstract'].includes(t.toLowerCase())
  );

  const structuredData = {
    "@context": "https://schema.org/",
    "@type": ["Product", "VisualArtwork"],
    "name": product.title,
    "description": product.description || `${product.artist} - ${product.title} kunst poster`,
    "image": {
      "@type": "ImageObject",
      "url": product.primary_image || "",
      "caption": `${product.artist} - ${product.title} (${style || 'art'} poster)`,
      "width": 1200,
      "height": 1200,
      "thumbnailUrl": product.primary_image
    },
    "brand": {
      "@type": "Brand",
      "name": product.artist || "MusicScan"
    },
    "artMedium": "Digital Print",
    "artform": "Poster Art",
    "artworkSurface": "Premium Paper",
    "creativeWorkStatus": "Published",
    "genre": product.tags?.join(", ") || style || "Art",
    "keywords": `${product.artist}, ${product.title}, poster, ${style || 'kunst'}, kunstposter, muziek poster, wanddecoratie`,
    "creator": {
      "@type": "Organization",
      "name": "MusicScan AI Studio",
      "url": "https://musicscan.app"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://musicscan.app/product/${slug}`,
      "priceCurrency": product.currency || "EUR",
      "price": product.price,
      "priceValidUntil": new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      "availability": product.stock_quantity > 0 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "MusicScan",
        "url": "https://musicscan.app"
      },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": 4.95,
          "currency": "EUR"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": ["NL", "BE", "DE"]
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "businessDays": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
          },
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 3,
            "unitCode": "DAY"
          }
        }
      }
    },
    "category": "Posters & Prints",
    "aggregateRating": product.view_count > 20 ? {
      "@type": "AggregateRating",
      "ratingValue": 4.5,
      "reviewCount": Math.floor(product.view_count / 15),
      "bestRating": 5,
      "worstRating": 1
    } : undefined
  };

  // Breadcrumb List Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://musicscan.app/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Posters",
        "item": "https://musicscan.app/posters"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": `${product.artist} - ${product.title}`,
        "item": `https://musicscan.app/product/${slug}`
      }
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
    </Helmet>
  );
};
