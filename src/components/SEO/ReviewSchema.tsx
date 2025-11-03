import React from 'react';
import { Helmet } from 'react-helmet';

interface ReviewSchemaProps {
  itemName: string;
  artist: string;
  reviewBody: string;
  rating?: number;
  bestRating?: number;
  worstRating?: number;
  datePublished: string;
  reviewUrl: string;
  imageUrl?: string;
}

export const ReviewSchema: React.FC<ReviewSchemaProps> = ({
  itemName,
  artist,
  reviewBody,
  rating = 4.5,
  bestRating = 5,
  worstRating = 1,
  datePublished,
  reviewUrl,
  imageUrl
}) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": {
      "@type": "MusicAlbum",
      "name": itemName,
      "byArtist": {
        "@type": "MusicGroup",
        "name": artist
      },
      ...(imageUrl && { "image": imageUrl })
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": rating,
      "bestRating": bestRating,
      "worstRating": worstRating
    },
    "author": {
      "@type": "Organization",
      "name": "MusicScan"
    },
    "reviewBody": reviewBody.substring(0, 200) + "...",
    "datePublished": datePublished,
    "url": reviewUrl,
    "publisher": {
      "@type": "Organization",
      "name": "MusicScan"
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

interface AggregateRatingSchemaProps {
  itemName: string;
  artist: string;
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  imageUrl?: string;
}

export const AggregateRatingSchema: React.FC<AggregateRatingSchemaProps> = ({
  itemName,
  artist,
  ratingValue,
  reviewCount,
  bestRating = 5,
  imageUrl
}) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "MusicAlbum",
    "name": itemName,
    "byArtist": {
      "@type": "MusicGroup",
      "name": artist
    },
    ...(imageUrl && { "image": imageUrl }),
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": ratingValue,
      "reviewCount": reviewCount,
      "bestRating": bestRating
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

interface FAQSchemaProps {
  questions: Array<{
    question: string;
    answer: string;
  }>;
}

export const FAQSchema: React.FC<FAQSchemaProps> = ({ questions }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": questions.map(q => ({
      "@type": "Question",
      "name": q.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": q.answer
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};
