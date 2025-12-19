import React from 'react';
import { Helmet } from 'react-helmet';

interface Props {
  name: string;
  description: string;
  image?: string;
  url: string;
  location?: string;
  foundingDate?: string;
  notableArtists?: string[];
  famousRecordings?: string[];
}

export const StudioStructuredData: React.FC<Props> = ({
  name,
  description,
  image,
  url,
  location,
  foundingDate,
  notableArtists,
  famousRecordings
}) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MusicVenue",
    "additionalType": "https://schema.org/LocalBusiness",
    "name": name,
    "description": description,
    "image": image,
    "url": url,
    ...(location && {
      "address": {
        "@type": "PostalAddress",
        "addressLocality": location
      }
    }),
    ...(foundingDate && { "foundingDate": foundingDate }),
    ...(notableArtists && notableArtists.length > 0 && {
      "performer": notableArtists.map(artist => ({
        "@type": "MusicGroup",
        "name": artist
      }))
    }),
    ...(famousRecordings && famousRecordings.length > 0 && {
      "event": famousRecordings.map(recording => ({
        "@type": "Event",
        "name": recording,
        "description": `Recording session at ${name}`
      }))
    }),
    "sameAs": [],
    "priceRange": "$$"
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};
