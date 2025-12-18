import { Link } from 'react-router-dom';
import { NewsItem } from '@/hooks/useUnifiedNewsFeed';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface SingleItemCardProps {
  item: NewsItem;
  size?: 'large' | 'medium' | 'small';
}

export const SingleItemCard = ({ item, size = 'medium' }: SingleItemCardProps) => {
  const sizeClasses = {
    large: 'aspect-[16/10]',
    medium: 'aspect-[4/3]',
    small: 'aspect-[3/2]'
  };

  const titleClasses = {
    large: 'text-2xl md:text-4xl',
    medium: 'text-lg md:text-xl',
    small: 'text-base md:text-lg'
  };

  return (
    <Link to={item.link} className="block group">
      <div className={`relative ${sizeClasses[size]} overflow-hidden bg-zinc-900 mb-3`}>
        <img
          src={item.image_url || '/placeholder.svg'}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">
        {item.category_label}
      </span>
      
      <h3 className={`${titleClasses[size]} font-bold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2`}>
        {item.title}
      </h3>
      
      {size !== 'small' && item.subtitle && (
        <p className="text-muted-foreground mt-1 text-sm line-clamp-1">{item.subtitle}</p>
      )}
      
      <p className="text-muted-foreground/60 text-xs mt-2">
        {formatDistanceToNow(new Date(item.date), { addSuffix: true, locale: nl })}
      </p>
    </Link>
  );
};
