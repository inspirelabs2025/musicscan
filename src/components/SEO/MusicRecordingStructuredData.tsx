import React from 'react';
import { Helmet } from 'react-helmet';

interface Props {
  name: string;
  artist: string;
  description: string;
  image?: string;
  url: string;
  datePublished: string;
  genre?: string;
  duration?: string;
  recordLabel?: string;
}

export const MusicRecordingStructuredData: React.FC<Props> = ({
  name,
  artist,
  description,
  image,
  url,
  datePublished,
  genre,
  duration,
  recordLabel
}) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    "name": name,
    "byArtist": {
      "@type": "MusicGroup",
      "name": artist
    },
    "description": description,
    "image": image,
    "url": url,
    "datePublished": datePublished,
    "genre": genre,
    "duration": duration,
    "recordLabel": recordLabel,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.5",
      "reviewCount": "1"
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};
