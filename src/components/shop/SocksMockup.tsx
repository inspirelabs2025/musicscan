import { useId } from "react";

interface SocksMockupProps {
  imageUrl: string;
  alt: string;
  className?: string;
}

/**
 * Twee sokken met voet, zoals op de referentiefoto.
 * De albumart wordt als patroon over de sok-silhouetten geplaatst.
 */
export function SocksMockup({ imageUrl, alt, className }: SocksMockupProps) {
  const id = useId();
  const clipIdLeft = `sock-clip-left-${id}`;
  const clipIdRight = `sock-clip-right-${id}`;

  // Realistische sok-met-voet silhouet (L-shape)
  const sockPath = `
    M 30 10
    C 30 4, 35 0, 42 0
    L 78 0
    C 85 0, 90 4, 90 10
    L 90 100
    C 90 115, 88 125, 82 135
    L 75 145
    C 70 152, 68 160, 68 170
    L 68 175
    C 68 182, 72 188, 80 190
    L 135 195
    C 145 196, 150 200, 150 208
    L 150 215
    C 150 225, 142 230, 130 230
    L 45 225
    C 32 224, 22 218, 22 205
    L 22 180
    C 22 168, 28 158, 38 148
    L 45 140
    C 52 132, 55 122, 55 110
    L 55 10
    C 55 4, 48 4, 42 4
    L 38 4
    C 34 4, 30 6, 30 10
    Z
  `;

  return (
    <div className={className} aria-label={alt}>
      <svg
        viewBox="0 0 280 260"
        role="img"
        aria-label={alt}
        className="h-full w-full drop-shadow-lg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Linker sok silhouet */}
          <clipPath id={clipIdLeft} clipPathUnits="userSpaceOnUse">
            <path d={sockPath} transform="translate(10, 15) rotate(-8, 75, 115)" />
          </clipPath>
          {/* Rechter sok silhouet */}
          <clipPath id={clipIdRight} clipPathUnits="userSpaceOnUse">
            <path d={sockPath} transform="translate(105, 8) rotate(5, 75, 115)" />
          </clipPath>
        </defs>

        {/* Linker sok (achter) */}
        <g>
          <image
            href={imageUrl}
            x="-30"
            y="-20"
            width="220"
            height="300"
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipIdLeft})`}
          />
          <path
            d={sockPath}
            transform="translate(10, 15) rotate(-8, 75, 115)"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="2"
          />
        </g>

        {/* Rechter sok (vooraan) */}
        <g>
          <image
            href={imageUrl}
            x="65"
            y="-25"
            width="220"
            height="300"
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipIdRight})`}
          />
          <path
            d={sockPath}
            transform="translate(105, 8) rotate(5, 75, 115)"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="2"
          />
        </g>
      </svg>
    </div>
  );
}

