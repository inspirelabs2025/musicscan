import { useId } from "react";

interface SocksMockupProps {
  imageUrl: string;
  alt: string;
  className?: string;
}

/**
 * Sok mockup (één sok) met artwork als patroon in een SVG clipPath.
 * Doel: in listings presenteren als echte sok i.p.v. een card-afbeelding.
 */
export function SocksMockup({ imageUrl, alt, className }: SocksMockupProps) {
  const id = useId();
  const clipId = `sock-clip-${id}`;

  return (
    <div className={className} aria-label={alt}>
      <svg
        viewBox="0 0 240 360"
        role="img"
        aria-label={alt}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Sock silhouette */}
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <path d="M78 24c0-8 6-14 14-14h56c8 0 14 6 14 14v130c0 28-10 52-30 72l-26 26c-12 12-18 26-18 42v28c0 12-10 22-22 22H62c-12 0-22-10-22-22v-36c0-28 10-52 30-72l30-30c10-10 14-22 14-38V24z" />
          </clipPath>
        </defs>

        {/* Artwork fill */}
        <image
          href={imageUrl}
          x="0"
          y="0"
          width="240"
          height="360"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
        />

        {/* Sock outline + cuff */}
        <path
          d="M78 24c0-8 6-14 14-14h56c8 0 14 6 14 14v130c0 28-10 52-30 72l-26 26c-12 12-18 26-18 42v28c0 12-10 22-22 22H62c-12 0-22-10-22-22v-36c0-28 10-52 30-72l30-30c10-10 14-22 14-38V24z"
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="3"
        />
        <path
          d="M78 40h84"
          stroke="hsl(var(--border))"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.65"
        />
      </svg>
    </div>
  );
}

