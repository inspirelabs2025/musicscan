import { cn } from "@/lib/utils";
import sockMaskUrl from "@/assets/sock-mask.svg";

type Props = {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
};

export function SockMaskedImage({ src, alt, className, imgClassName }: Props) {
  const maskStyles: React.CSSProperties = {
    WebkitMaskImage: `url(${sockMaskUrl})`,
    maskImage: `url(${sockMaskUrl})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskSize: "contain",
    maskSize: "contain",
  };

  return (
    <div className={cn("relative w-full h-full", className)} style={maskStyles}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn("w-full h-full object-cover", imgClassName)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-4xl">🧦</span>
        </div>
      )}
    </div>
  );
}
