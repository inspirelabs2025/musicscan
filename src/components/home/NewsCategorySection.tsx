import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { NewsItem } from '@/hooks/useUnifiedNewsFeed';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface NewsCategorySectionProps {
  title: string;
  items: NewsItem[];
  viewAllLink: string;
  viewAllText?: string;
  variant?: 'default' | 'dark';
}

export const NewsCategorySection = ({ 
  title, 
  items, 
  viewAllLink, 
  viewAllText = 'Bekijk alles',
  variant = 'default'
}: NewsCategorySectionProps) => {
  if (!items || items.length === 0) return null;

  const [featured, ...listItems] = items;
  const displayListItems = listItems.slice(0, 4);
  
  const isDark = variant === 'dark';
  const bgClass = isDark ? 'bg-zinc-900' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-zinc-900';
  const mutedClass = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const borderClass = isDark ? 'border-zinc-800' : 'border-zinc-200';

  return (
    <section className={`${bgClass} py-10 md:py-14`}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-primary">
          <h2 className={`text-2xl md:text-3xl font-black ${textClass} uppercase tracking-tight`}>
            {title}
          </h2>
          <Link 
            to={viewAllLink}
            className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-bold text-sm uppercase tracking-wide transition-colors"
          >
            {viewAllText}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Featured Card - Left Side */}
          <div className="lg:col-span-5">
            <Link to={featured.link} className="block group">
              <div className="relative aspect-[4/3] overflow-hidden mb-4">
                <img
                  src={featured.image_url || '/placeholder.svg'}
                  alt={featured.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="inline-block px-2 py-1 mb-2 text-[10px] font-bold uppercase tracking-widest bg-primary text-white">
                {featured.category_label}
              </span>
              <h3 className={`text-2xl md:text-3xl font-black ${textClass} leading-tight group-hover:text-primary transition-colors`}>
                {featured.title}
              </h3>
              {featured.subtitle && (
                <p className={`${mutedClass} mt-2 text-lg`}>{featured.subtitle}</p>
              )}
              <p className={`${mutedClass} text-sm mt-3`}>
                {formatDistanceToNow(new Date(featured.date), { addSuffix: true, locale: nl })}
              </p>
            </Link>
          </div>

          {/* List Items - Right Side */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayListItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.link}
                  className={`group flex gap-4 pb-4 border-b ${borderClass}`}
                >
                  <div className="w-24 h-24 md:w-28 md:h-28 flex-shrink-0 overflow-hidden">
                    <img
                      src={item.image_url || '/placeholder.svg'}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                      {item.category_label}
                    </span>
                    <h4 className={`font-bold ${textClass} line-clamp-2 group-hover:text-primary transition-colors leading-tight`}>
                      {item.title}
                    </h4>
                    {item.subtitle && (
                      <p className={`text-sm ${mutedClass} mt-1 truncate`}>{item.subtitle}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
