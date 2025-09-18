import React from 'react';

interface StructuredDataProps {
  type: 'WebApplication' | 'MobileApplication' | 'Product' | 'Organization' | 'Article' | 'Review' | 'BreadcrumbList';
  data: any;
}

export const StructuredData: React.FC<StructuredDataProps> = ({ type, data }) => {
  const generateStructuredData = () => {
    const baseStructure = {
      '@context': 'https://schema.org',
      '@type': type,
      ...data
    };

    return JSON.stringify(baseStructure, null, 2);
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: generateStructuredData() }}
    />
  );
};

// Predefined structured data generators
export const AppStructuredData = () => (
  <StructuredData
    type="MobileApplication"
    data={{
      name: 'MusicScan',
      description: 'AI-powered vinyl and CD scanner for music collectors',
      applicationCategory: 'MusicApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR'
      },
      author: {
        '@type': 'Organization',
        name: 'MusicScan',
        url: 'https://www.musicscan.app'
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '1247'
      },
      features: [
        'AI-powered vinyl record identification',
        'CD scanning and recognition',
        'Real-time price valuations',
        'Digital collection management',
        'Music discovery and recommendations'
      ]
    }}
  />
);

export const OrganizationStructuredData = () => (
  <StructuredData
    type="Organization"
    data={{
      name: 'MusicScan',
      url: 'https://www.musicscan.app',
      logo: 'https://www.musicscan.app/lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png',
      description: 'MusicScan helps music collectors identify, value, and manage their vinyl and CD collections using AI technology.',
      foundingDate: '2024',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['Dutch', 'English']
      },
      sameAs: [
        'https://twitter.com/musicscan_app'
      ],
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'NL'
      }
    }}
  />
);

export const ProductStructuredData = ({ album, artist, price, image, condition }: {
  album: string;
  artist: string;
  price?: number;
  image?: string;
  condition?: string;
}) => (
  <StructuredData
    type="Product"
    data={{
      name: `${artist} - ${album}`,
      description: `${album} by ${artist} - Vinyl record or CD available for collection`,
      image: image || '/lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png',
      brand: {
        '@type': 'Brand',
        name: artist
      },
      category: 'Music > Vinyl Records',
      condition: condition || 'Used',
      ...(price && {
        offers: {
          '@type': 'Offer',
          price: price.toString(),
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStock',
          seller: {
            '@type': 'Organization',
            name: 'MusicScan Community'
          }
        }
      })
    }}
  />
);

export const BreadcrumbStructuredData = ({ items }: { items: Array<{ name: string; url: string }> }) => (
  <StructuredData
    type="BreadcrumbList"
    data={{
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: `https://www.musicscan.app${item.url}`
      }))
    }}
  />
);

export const ArticleStructuredData = ({ title, description, publishDate, author, image }: {
  title: string;
  description: string;
  publishDate: string;
  author?: string;
  image?: string;
}) => (
  <StructuredData
    type="Article"
    data={{
      headline: title,
      description,
      datePublished: publishDate,
      dateModified: publishDate,
      author: {
        '@type': 'Organization',
        name: author || 'MusicScan'
      },
      publisher: {
        '@type': 'Organization',
        name: 'MusicScan',
        logo: {
          '@type': 'ImageObject',
          url: 'https://www.musicscan.app/lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png'
        }
      },
      image: image || '/lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': 'https://www.musicscan.app'
      }
    }}
  />
);