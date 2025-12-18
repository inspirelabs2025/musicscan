import { Link } from 'react-router-dom';
import { ChevronRight, Play, ExternalLink } from 'lucide-react';
import { NewsItem } from '@/hooks/useUnifiedNewsFeed';

interface MasonryContentGridProps {
  items: NewsItem[];
  title?: string;
}

// Different card sizes for variety
type CardSize = 'large' | 'wide' | 'tall' | 'small';

// Assign sizes based on index for visual variety
const getSizeForIndex = (index: number): CardSize => {
  const pattern: CardSize[] = ['large', 'small', 'tall', 'small', 'wide', 'small', 'small', 'tall', 'small', 'large'];
  return pattern[index % pattern.length];
};

const MasonryCard = ({ item, size }: { item: NewsItem; size: CardSize }) => {
  const isExternal = item.link.startsWith('http');
  const LinkComponent = isExternal ? 'a' : Link;
  const linkProps = isExternal 
    ? { href: item.link, target: '_blank', rel: 'noopener noreferrer' }
    : { to: item.link };

  const sizeClasses = {
    large: 'col-span-2 row-span-2',
    wide: 'col-span-2 row-span-1',
    tall: 'col-span-1 row-span-2',
    small: 'col-span-1 row-span-1',
  };

  const aspectClasses = {
    large: 'aspect-square',
    wide: 'aspect-[2/1]',
    tall: 'aspect-[1/2]',
    small: 'aspect-square',
  };

  const isVideo = item.type === 'youtube';

  return (
    <LinkComponent
      {...(linkProps as any)}
      className={`group relative overflow-hidden bg-zinc-900 ${sizeClasses[size]} block`}
    >
      {/* Background Image */}
      <div className={`relative w-full h-full ${aspectClasses[size]}`}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-zinc-900" />
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        
        {/* Video Play Icon */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-primary-foreground fill-current ml-1" />
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className="absolute inset-0 p-4 flex flex-col justify-end">
          {/* Category Label */}
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">
            {item.category_label}
          </span>
          
          {/* Title */}
          <h3 className={`font-bold text-white leading-tight mb-1 ${
            size === 'large' ? 'text-2xl md:text-3xl' : 
            size === 'wide' ? 'text-xl md:text-2xl' :
            size === 'tall' ? 'text-lg md:text-xl' : 
            'text-sm md:text-base'
          }`}>
            {item.title}
          </h3>
          
          {/* Subtitle */}
          {item.subtitle && (size === 'large' || size === 'wide' || size === 'tall') && (
            <p className="text-sm text-zinc-300 line-clamp-1">
              {item.subtitle}
            </p>
          )}
          
          {/* External Link Icon */}
          {isExternal && (
            <ExternalLink className="absolute top-4 right-4 w-4 h-4 text-white/60" />
          )}
        </div>
        
        {/* Hover Effect */}
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary transition-colors" />
      </div>
    </LinkComponent>
  );
};

export const MasonryContentGrid = ({ items, title = "Ontdek Meer" }: MasonryContentGridProps) => {
  if (!items.length) return null;

  return (
    <section className="bg-zinc-950 py-10 md:py-14">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary border-b-2 border-primary pb-2">
            {title}
          </h2>
        </div>
        
        {/* Masonry Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3 auto-rows-[minmax(120px,1fr)] md:auto-rows-[minmax(150px,1fr)]">
          {items.map((item, index) => (
            <MasonryCard 
              key={`${item.type}-${item.id}`} 
              item={item} 
              size={getSizeForIndex(index)} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};
