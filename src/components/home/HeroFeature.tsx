import { Link } from 'react-router-dom';
import { NewsItem } from '@/hooks/useUnifiedNewsFeed';
import { formatDistanceToNow } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

interface HeroFeatureProps {
  item: NewsItem;
}

export const HeroFeature = ({ item }: HeroFeatureProps) => {
  const { language } = useLanguage();
  const dateLocale = language === 'nl' ? nl : enUS;

  return (
    <Link 
      to={item.link} 
      className="block group relative h-[400px] md:h-[500px] overflow-hidden bg-zinc-900"
    >
      <img
        src={item.image_url || '/placeholder.svg'}
        alt={item.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
        <span className="inline-block px-3 py-1.5 mb-4 text-xs font-bold uppercase tracking-widest bg-primary text-primary-foreground">
          {item.category_label}
        </span>
        
        <h1 className="text-3xl md:text-5xl font-black text-white mb-2 leading-tight max-w-3xl">
          {item.title}
        </h1>
        
        {item.subtitle && (
          <p className="text-lg md:text-xl text-white/80 max-w-2xl">{item.subtitle}</p>
        )}
        
        <p className="text-sm text-white/50 mt-4">
          {formatDistanceToNow(new Date(item.date), { addSuffix: true, locale: dateLocale })}
        </p>
      </div>
    </Link>
  );
};
