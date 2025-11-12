import React from 'react';
import { Helmet } from 'react-helmet';

interface Props {
  name: string;
  description: string;
  image?: string;
  url: string;
  genre?: string[];
  foundingDate?: string;
  albums?: string[];
}

export const MusicGroupStructuredData: React.FC<Props> = ({
  name,
  description,
  image,
  url,
  genre,
  foundingDate,
  albums
}) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "name": name,
    "description": description,
    "image": image,
    "url": url,
    "genre": genre,
    "foundingDate": foundingDate,
    "album": albums?.map(albumName => ({
      "@type": "MusicAlbum",
      "name": albumName
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};
