import { useId } from "react";

interface SocksMockupProps {
  imageUrl: string;
  alt: string;
  className?: string;
}

/**
 * Lichte (niet-base64) sok-preview door artwork in een sok-silhouet te clippen.
 * Werkt met gewone image URLs (bijv. album_cover_url / primary_image).
 */
export function SocksMockup({ imageUrl, alt, className }: SocksMockupProps) {
  const id = useId();
  const clipId = `sock-clip-${id}`;

  return (
    <div className={className} aria-label={alt}>
      <svg
        viewBox="0 0 240 240"
        role="img"
        aria-label={alt}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Eenvoudige sok-silhouet */}
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <path d="M92 22c0-6 5-11 11-11h39c6 0 11 5 11 11v82c0 20-7 37-21 51l-16 16c-9 9-14 20-14 32v14c0 8-6 14-14 14H74c-8 0-14-6-14-14v-18c0-20 7-38 21-52l19-19c8-8 12-18 12-30V22z" />
          </clipPath>
          <filter id={`shadow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="8" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Achterste sok */}
        <g transform="translate(18, 10) rotate(-6 120 120)" filter={`url(#shadow-${id})`}>
          <rect x="0" y="0" width="240" height="240" fill="hsl(var(--muted))" />
          <image
            href={imageUrl}
            x="0"
            y="0"
            width="240"
            height="240"
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipId})`}
          />
          <path
            d="M92 22c0-6 5-11 11-11h39c6 0 11 5 11 11v82c0 20-7 37-21 51l-16 16c-9 9-14 20-14 32v14c0 8-6 14-14 14H74c-8 0-14-6-14-14v-18c0-20 7-38 21-52l19-19c8-8 12-18 12-30V22z"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="2"
          />
        </g>

        {/* Voorste sok */}
        <g transform="translate(70, 18) rotate(10 120 120)" filter={`url(#shadow-${id})`}>
          <rect x="0" y="0" width="240" height="240" fill="hsl(var(--muted))" />
          <image
            href={imageUrl}
            x="0"
            y="0"
            width="240"
            height="240"
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipId})`}
            opacity="0.98"
          />
          <path
            d="M92 22c0-6 5-11 11-11h39c6 0 11 5 11 11v82c0 20-7 37-21 51l-16 16c-9 9-14 20-14 32v14c0 8-6 14-14 14H74c-8 0-14-6-14-14v-18c0-20 7-38 21-52l19-19c8-8 12-18 12-30V22z"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="2"
          />
        </g>
      </svg>
    </div>
  );
}
