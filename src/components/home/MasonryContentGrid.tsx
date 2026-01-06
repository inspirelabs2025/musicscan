import { Link } from 'react-router-dom';
import { Play, ExternalLink, MessageCircle, Calendar, Newspaper, Music, Mic, Radio, User, Disc, ShoppingBag, Shirt, Gamepad2, Camera, Bot, Snowflake, Flag, Headphones, Film, Star, Building2 } from 'lucide-react';
import { NewsItem } from '@/hooks/useUnifiedNewsFeed';
import promoScanBg from '@/assets/promo-scan-bg.jpg';
import echoAvatar from '@/assets/echo-avatar.png';
import blogPlaceholder1 from '@/assets/blog-placeholder-1.jpg';
import blogPlaceholder2 from '@/assets/blog-placeholder-2.jpg';
import blogPlaceholder3 from '@/assets/blog-placeholder-3.jpg';
import promoNederlandBg from '@/assets/promo-nederland-bg.jpg';
import promoFrankrijkBg from '@/assets/promo-frankrijk-bg.jpg';
import promoKerstBg from '@/assets/promo-kerst-bg.jpg';
import promoFilmmuziekBg from '@/assets/promo-filmmuziek-bg.jpg';
import promoDanceBg from '@/assets/promo-dance-bg.jpg';
// News placeholder selection based on item ID for consistency
const NEWS_PLACEHOLDERS = [blogPlaceholder1, blogPlaceholder2, blogPlaceholder3];
const getNewsPlaceholder = (itemId: string): string => {
  const hash = itemId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return NEWS_PLACEHOLDERS[hash % NEWS_PLACEHOLDERS.length];
};
// Extended type for promo blocks
type PromoType = 'quiz' | 'scan' | 'echo' | 'nederland' | 'frankrijk' | 'dance' | 'filmmuziek' | 'kerst';

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
    case 'poster': return 'from-violet-500 via-fuchsia-600 to-purple-800';
    case 'canvas': return 'from-amber-500 via-orange-600 to-red-700';
    case 'artist': return 'from-blue-500 via-indigo-600 to-blue-800';
    case 'album': return 'from-green-500 via-emerald-600 to-green-800';
    case 'single': return 'from-pink-500 via-rose-600 to-pink-800';
    case 'youtube': return 'from-red-500 via-red-600 to-red-800';
    case 'review': return 'from-sky-500 via-blue-600 to-sky-800';
    case 'fanwall': return 'from-pink-500 via-purple-600 to-indigo-700';
    case 'spotlight': return 'from-amber-400 via-yellow-500 to-orange-600';
    case 'studio': return 'from-slate-500 via-zinc-600 to-slate-800';
    case 'daily_quiz': return 'from-yellow-400 via-orange-500 to-red-600';
    // Promo types
    case 'quiz': return 'from-yellow-400 via-orange-500 to-red-600';
    case 'scan': return 'from-indigo-500 via-purple-600 to-pink-600';
    case 'echo': return 'from-teal-400 via-cyan-500 to-blue-600';
    case 'nederland': return 'from-orange-500 via-orange-600 to-red-600';
    case 'frankrijk': return 'from-blue-600 via-blue-200 to-red-500';
    case 'dance': return 'from-fuchsia-500 via-purple-600 to-indigo-700';
    case 'filmmuziek': return 'from-slate-600 via-zinc-700 to-slate-900';
    case 'kerst': return 'from-red-600 via-green-600 to-red-700';
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
    case 'poster': return <ShoppingBag className={sizeClass} />;
    case 'canvas': return <ShoppingBag className={sizeClass} />;
    case 'artist': return <User className={sizeClass} />;
    case 'album': return <Disc className={sizeClass} />;
    case 'single': return <Radio className={sizeClass} />;
    case 'youtube': return <Play className={sizeClass} />;
    case 'review': return <MessageCircle className={sizeClass} />;
    case 'fanwall': return <Camera className={sizeClass} />;
    case 'daily_quiz': return <Gamepad2 className={sizeClass} />;
    case 'spotlight': return <Star className={sizeClass} />;
    case 'studio': return <Building2 className={sizeClass} />;
    // Promo types
    case 'quiz': return <Gamepad2 className={sizeClass} />;
    case 'scan': return <Camera className={sizeClass} />;
    case 'echo': return <Bot className={sizeClass} />;
    case 'nederland': return <Flag className={sizeClass} />;
    case 'frankrijk': return <Flag className={sizeClass} />;
    case 'dance': return <Headphones className={sizeClass} />;
    case 'filmmuziek': return <Film className={sizeClass} />;
    case 'kerst': return <Snowflake className={sizeClass} />;
    default: return <Music className={sizeClass} />;
  }
};

// Country promo options (randomly pick one)
const COUNTRY_PROMOS = [
  { id: 'promo-nederland', type: 'nederland' as PromoType, title: 'Nederlandse Muziek', subtitle: 'Ontdek NL hits', link: '/nederland', emoji: '🇳🇱', image: promoNederlandBg },
  { id: 'promo-frankrijk', type: 'frankrijk' as PromoType, title: 'Franse Muziek', subtitle: 'Vive la musique!', link: '/frankrijk', emoji: '🇫🇷', image: promoFrankrijkBg },
];

// Pick one country randomly (seeded by day so it's consistent within a session)
const selectedCountry = COUNTRY_PROMOS[Math.floor(Math.random() * COUNTRY_PROMOS.length)];

// Fixed promotional blocks (will be shuffled)
const BASE_PROMO_BLOCKS: Array<{
  id: string;
  type: PromoType;
  title: string;
  subtitle: string;
  link: string;
  emoji: string;
  image?: string;
  forceSmall?: boolean;
}> = [
  { id: 'promo-quiz', type: 'quiz', title: 'Speel Muziek Quiz', subtitle: 'Test je kennis!', link: '/quizzen', emoji: '🎯', forceSmall: true },
  { id: 'promo-scan', type: 'scan', title: 'Scan Je Albums', subtitle: 'Digitaliseer je collectie', link: '/scan', emoji: '📷', image: promoScanBg },
  { id: 'promo-echo', type: 'echo', title: 'Chat met Echo', subtitle: 'Onze muziekexpert', link: '/echo', emoji: '🤖', image: echoAvatar, forceSmall: true },
  selectedCountry,
  { id: 'promo-dance', type: 'dance', title: 'Dance & House', subtitle: 'Feel the beat', link: '/dance-house', emoji: '🎧', image: promoDanceBg },
  { id: 'promo-film', type: 'filmmuziek', title: 'Filmmuziek', subtitle: 'Soundtracks & scores', link: '/filmmuziek', emoji: '🎬', image: promoFilmmuziekBg },
  
];

// Shuffle helper
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Shuffle promo blocks on module load (random order each page load)
const PROMO_BLOCKS = shuffleArray(BASE_PROMO_BLOCKS);

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
        ) : item.type === 'news' ? (
          <>
            <img
              src={getNewsPlaceholder(item.id)}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Groene tint overlay voor nieuws branding */}
            <div className="absolute inset-0 bg-emerald-900/40" />
          </>
        ) : (
          <>
            <div className={`absolute inset-0 bg-gradient-to-br ${getTypeGradient(item.type)}`} />
            {/* Decorative icon - smaller and positioned in corner for text-heavy cards */}
            <div className="absolute top-4 right-4 opacity-20">
              <TypeIcon type={item.type} size="small" />
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
        
        {/* Content - centered for cards without image, bottom for cards with image */}
        <div className={`absolute inset-0 p-4 flex flex-col ${item.image_url ? 'justify-end' : 'justify-center'}`}>
          {/* Category Label with type-specific styling */}
          <span className={`text-xs md:text-sm font-bold uppercase tracking-wider mb-2 ${
            item.type === 'metal_print' ? 'text-amber-400' :
            item.type === 'tshirt' ? 'text-cyan-400' :
            item.type === 'socks' ? 'text-pink-400' :
            item.type === 'poster' ? 'text-violet-400' :
            item.type === 'canvas' ? 'text-amber-400' :
            item.type === 'news' ? 'text-emerald-400' :
            item.type === 'history' ? 'text-orange-400' :
            item.type === 'concert' ? 'text-purple-400' :
            item.type === 'podcast' ? 'text-rose-400' :
            item.type === 'fanwall' ? 'text-pink-400' :
            item.type === 'quiz' ? 'text-yellow-400' :
            item.type === 'spotlight' ? 'text-amber-400' :
            item.type === 'studio' ? 'text-slate-300' :
            'text-primary'
          }`}>
            {item.type === 'metal_print' && '🖼️ '}
            {item.type === 'tshirt' && '👕 '}
            {item.type === 'socks' && '🧦 '}
            {item.type === 'poster' && '🎨 '}
            {item.type === 'canvas' && '🎨 '}
            {item.type === 'news' && '📰 '}
            {item.type === 'history' && '📅 '}
            {item.type === 'concert' && '🎸 '}
            {item.type === 'podcast' && '🎙️ '}
            {item.type === 'fanwall' && '📸 '}
            {item.type === 'quiz' && '🎯 '}
            {item.type === 'spotlight' && '⭐ '}
            {item.type === 'studio' && '🎛️ '}
            {item.category_label}
          </span>
          
          {/* Title - larger for cards without image */}
          <h3 className={`font-bold text-white leading-tight mb-1 ${
            !item.image_url ? (
              size === 'large' ? 'text-3xl md:text-4xl' : 
              size === 'wide' ? 'text-2xl md:text-3xl' :
              size === 'tall' ? 'text-xl md:text-2xl' : 
              'text-lg md:text-xl'
            ) : (
              size === 'large' ? 'text-2xl md:text-3xl' : 
              size === 'wide' ? 'text-xl md:text-2xl' :
              size === 'tall' ? 'text-lg md:text-xl' : 
              'text-sm md:text-base'
            )
          }`}>
            {item.title}
          </h3>
          
          {/* Subtitle - always show for cards without image */}
          {item.subtitle && (!item.image_url || size === 'large' || size === 'wide' || size === 'tall') && (
            <p className={`text-zinc-300 ${!item.image_url ? 'text-base line-clamp-2' : 'text-sm line-clamp-1'}`}>
              {item.subtitle}
            </p>
          )}
          
          {/* Description for text-heavy cards */}
          {!item.image_url && item.description && (size === 'large' || size === 'tall') && (
            <p className="text-sm text-zinc-400 mt-2 line-clamp-3">
              {item.description}
            </p>
          )}
          
          {/* Quiz Question Preview */}
          {item.type === 'quiz' && item.quiz_question && (
            <p className="text-xs text-yellow-200/90 mt-1 line-clamp-2 italic">
              "{item.quiz_question}"
            </p>
          )}
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

// Promo Card for fixed blocks
const PromoCard = ({ promo, size }: { promo: typeof PROMO_BLOCKS[0]; size: CardSize }) => {
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

  return (
    <Link
      to={promo.link}
      className={`group relative overflow-hidden ${sizeClasses[size]} block`}
    >
      <div className={`relative w-full h-full ${aspectClasses[size]}`}>
        {/* Background - Image or Gradient */}
        {promo.image ? (
          <img
            src={promo.image}
            alt={promo.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <>
            <div className={`absolute inset-0 bg-gradient-to-br ${getTypeGradient(promo.type)}`} />
            {/* Decorative icon */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <TypeIcon type={promo.type} size={size === 'large' || size === 'tall' ? 'large' : 'small'} />
            </div>
          </>
        )}
        
        {/* Overlay for text readability */}
        <div className={`absolute inset-0 ${promo.image ? 'bg-gradient-to-t from-black/80 via-black/40 to-transparent' : 'bg-gradient-to-t from-black/60 via-transparent to-transparent'}`} />
        
        {/* Content */}
        <div className="absolute inset-0 p-4 flex flex-col justify-end items-start">
          <span className="text-3xl md:text-4xl mb-2">{promo.emoji}</span>
          <h3 className={`font-bold text-white leading-tight mb-1 ${
            size === 'large' ? 'text-2xl md:text-3xl' : 
            size === 'wide' ? 'text-xl md:text-2xl' :
            size === 'tall' ? 'text-lg md:text-xl' : 
            'text-sm md:text-base'
          }`}>
            {promo.title}
          </h3>
          {(size === 'large' || size === 'wide' || size === 'tall') && (
            <p className="text-sm text-white/80">{promo.subtitle}</p>
          )}
        </div>
        
        {/* Hover Effect */}
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/50 transition-colors" />
      </div>
    </Link>
  );
};

export const MasonryContentGrid = ({ items, title = "Ontdek Meer" }: MasonryContentGridProps) => {
  if (!items.length) return null;

  // Interleave promo blocks with regular items at random positions
  const promoPositions = [0, 4, 9, 14, 19, 24, 29, 34];
  
  const combinedItems: Array<{ type: 'content' | 'promo'; data: NewsItem | typeof PROMO_BLOCKS[0] }> = [];
  let itemIndex = 0;
  let promoIndex = 0;
  
  for (let i = 0; i < items.length + Math.min(PROMO_BLOCKS.length, promoPositions.length); i++) {
    if (promoPositions.includes(i) && promoIndex < PROMO_BLOCKS.length) {
      combinedItems.push({ type: 'promo', data: PROMO_BLOCKS[promoIndex] });
      promoIndex++;
    } else if (itemIndex < items.length) {
      combinedItems.push({ type: 'content', data: items[itemIndex] });
      itemIndex++;
    }
  }

  return (
    <section className="bg-background py-12 md:py-20">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-10 md:mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary border-b-2 border-primary pb-2">
            {title}
          </h2>
        </div>
        
        {/* Masonry Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 lg:gap-5 auto-rows-[minmax(140px,1fr)] md:auto-rows-[minmax(160px,1fr)] lg:auto-rows-[minmax(180px,1fr)]">
          {combinedItems.map((item, index) => {
            let size = getSizeForIndex(index);
            
            if (item.type === 'promo') {
              const promo = item.data as typeof PROMO_BLOCKS[0];
              // Force small size if promo has forceSmall flag
              if (promo.forceSmall) size = 'small';
              return <PromoCard key={promo.id} promo={promo} size={size} />;
            }
            
            const newsItem = item.data as NewsItem;
            return (
              <MasonryCard 
                key={`${newsItem.type}-${newsItem.id}`} 
                item={newsItem} 
                size={size} 
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};
