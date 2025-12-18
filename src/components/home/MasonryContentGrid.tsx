import { Link } from 'react-router-dom';
import { Play, ExternalLink, MessageCircle, Calendar, Newspaper, Music, Mic, Radio, User, Disc, ShoppingBag, Shirt } from 'lucide-react';
import { NewsItem } from '@/hooks/useUnifiedNewsFeed';

// Type-specific gradient backgrounds for cards without images
const getTypeGradient = (type: string): string => {
  switch(type) {
    case 'anecdote': return 'from-purple-600 via-fuchsia-700 to-purple-900';
    case 'history': return 'from-orange-500 via-amber-600 to-orange-800';
    case 'news': return 'from-emerald-500 via-teal-600 to-emerald-800';
    case 'concert': return 'from-violet-500 via-purple-600 to-indigo-800';
    case 'podcast': return 'from-rose-500 via-pink-600 to-rose-800';
    case 'metal_print': return 'from-amber-400 via-yellow-500 to-amber-700';
    case 'tshirt': return 'from-cyan-400 via-blue-500 to-cyan-700';
    case 'artist': return 'from-blue-500 via-indigo-600 to-blue-800';
    case 'album': return 'from-green-500 via-emerald-600 to-green-800';
    case 'single': return 'from-pink-500 via-rose-600 to-pink-800';
    case 'youtube': return 'from-red-500 via-red-600 to-red-800';
    case 'review': return 'from-sky-500 via-blue-600 to-sky-800';
    default: return 'from-primary via-primary/70 to-zinc-900';
  }
};

// Decorative icon per type
const TypeIcon = ({ type, size }: { type: string; size: 'large' | 'small' }) => {
  const sizeClass = size === 'large' ? 'w-24 h-24' : 'w-16 h-16';
  
  switch(type) {
    case 'anecdote': return <MessageCircle className={sizeClass} />;
    case 'history': return <Calendar className={sizeClass} />;
    case 'news': return <Newspaper className={sizeClass} />;
    case 'concert': return <Music className={sizeClass} />;
    case 'podcast': return <Mic className={sizeClass} />;
    case 'metal_print': return <ShoppingBag className={sizeClass} />;
    case 'tshirt': return <Shirt className={sizeClass} />;
    case 'artist': return <User className={sizeClass} />;
    case 'album': return <Disc className={sizeClass} />;
    case 'single': return <Radio className={sizeClass} />;
    case 'youtube': return <Play className={sizeClass} />;
    case 'review': return <MessageCircle className={sizeClass} />;
    default: return <Music className={sizeClass} />;
  }
};

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
          <>
            <div className={`absolute inset-0 bg-gradient-to-br ${getTypeGradient(item.type)}`} />
            {/* Decorative icon */}
            <div className="absolute inset-0 flex items-center justify-center opacity-15">
              <TypeIcon type={item.type} size={size === 'large' || size === 'tall' ? 'large' : 'small'} />
            </div>
          </>
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
          {/* Category Label with type-specific styling */}
          <span className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${
            item.type === 'metal_print' ? 'text-amber-400' :
            item.type === 'tshirt' ? 'text-cyan-400' :
            item.type === 'socks' ? 'text-pink-400' :
            item.type === 'news' ? 'text-emerald-400' :
            item.type === 'history' ? 'text-orange-400' :
            item.type === 'concert' ? 'text-purple-400' :
            item.type === 'podcast' ? 'text-rose-400' :
            'text-primary'
          }`}>
            {item.type === 'metal_print' && '🖼️ '}
            {item.type === 'tshirt' && '👕 '}
            {item.type === 'socks' && '🧦 '}
            {item.type === 'news' && '📰 '}
            {item.type === 'history' && '📅 '}
            {item.type === 'concert' && '🎸 '}
            {item.type === 'podcast' && '🎙️ '}
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
