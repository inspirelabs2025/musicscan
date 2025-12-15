interface SocksMockupProps {
  imageUrl: string;
  alt: string;
  className?: string;
}

/**
 * Sok-preview met artwork als achtergrond in een sok-silhouet.
 * Simpele CSS clip-path oplossing.
 */
export function SocksMockup({ imageUrl, alt, className }: SocksMockupProps) {
  return (
    <div className={`relative ${className || ''}`} aria-label={alt}>
      {/* Achterste sok (links, iets gedraaid) */}
      <div 
        className="absolute left-[5%] top-[8%] w-[55%] h-[85%] rotate-[-8deg] shadow-lg"
        style={{
          clipPath: 'polygon(20% 0%, 80% 0%, 80% 45%, 100% 55%, 100% 100%, 60% 100%, 60% 55%, 40% 55%, 40% 100%, 0% 100%, 0% 55%, 20% 45%)',
        }}
      >
        <img 
          src={imageUrl} 
          alt="" 
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      
      {/* Voorste sok (rechts, iets gedraaid) */}
      <div 
        className="absolute right-[5%] top-[5%] w-[55%] h-[85%] rotate-[8deg] shadow-xl"
        style={{
          clipPath: 'polygon(20% 0%, 80% 0%, 80% 45%, 100% 55%, 100% 100%, 60% 100%, 60% 55%, 40% 55%, 40% 100%, 0% 100%, 0% 55%, 20% 45%)',
        }}
      >
        <img 
          src={imageUrl} 
          alt={alt} 
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    </div>
  );
}
