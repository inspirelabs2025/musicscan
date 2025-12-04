import { StructuredData } from './StructuredData';

interface PodcastSeriesStructuredDataProps {
  name: string;
  description: string;
  author: string;
  imageUrl?: string;
  url: string;
  language?: string;
}

export function PodcastSeriesStructuredData({
  name,
  description,
  author,
  imageUrl,
  url,
  language = 'nl',
}: PodcastSeriesStructuredDataProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'PodcastSeries',
    name,
    description,
    author: {
      '@type': 'Organization',
      name: author,
    },
    inLanguage: language,
    url,
    ...(imageUrl && { image: imageUrl }),
    publisher: {
      '@type': 'Organization',
      name: 'MusicScan',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.musicscan.app/logo.png',
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

interface PodcastEpisodeStructuredDataProps {
  name: string;
  description: string;
  datePublished?: string;
  duration?: number;
  audioUrl: string;
  imageUrl?: string;
  url: string;
  podcastName: string;
  podcastUrl: string;
  seasonNumber?: number;
  episodeNumber?: number;
}

export function PodcastEpisodeStructuredData({
  name,
  description,
  datePublished,
  duration,
  audioUrl,
  imageUrl,
  url,
  podcastName,
  podcastUrl,
  seasonNumber,
  episodeNumber,
}: PodcastEpisodeStructuredDataProps) {
  // Convert seconds to ISO 8601 duration format
  const formatDuration = (seconds?: number) => {
    if (!seconds) return undefined;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `PT${hours}H${minutes}M${secs}S`;
    }
    return `PT${minutes}M${secs}S`;
  };

  const data = {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    name,
    description,
    url,
    ...(datePublished && { datePublished }),
    ...(duration && { duration: formatDuration(duration) }),
    ...(imageUrl && { image: imageUrl }),
    ...(seasonNumber && { partOfSeason: { '@type': 'PodcastSeason', seasonNumber } }),
    ...(episodeNumber && { episodeNumber }),
    associatedMedia: {
      '@type': 'MediaObject',
      contentUrl: audioUrl,
      encodingFormat: 'audio/mpeg',
    },
    partOfSeries: {
      '@type': 'PodcastSeries',
      name: podcastName,
      url: podcastUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'MusicScan',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
