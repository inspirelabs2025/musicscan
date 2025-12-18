import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { NewsItem } from '@/hooks/useUnifiedNewsFeed';
import { SingleItemCard } from './SingleItemCard';

interface ContentGridProps {
  items: {
    title: string;
    item: NewsItem | undefined;
    viewAllLink: string;
  }[];
  columns?: 2 | 3 | 4;
}

export const ContentGrid = ({ items, columns = 4 }: ContentGridProps) => {
  const validItems = items.filter(i => i.item);
  
  if (validItems.length === 0) return null;

  const gridClass = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <section className="bg-background py-10 md:py-14">
      <div className="container mx-auto px-4">
        <div className={`grid ${gridClass[columns]} gap-6 md:gap-8`}>
          {validItems.map(({ title, item, viewAllLink }) => (
            <div key={title}>
              {/* Section mini-header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-primary/30">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary">
                  {title}
                </h3>
                <Link 
                  to={viewAllLink}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              
              {item && <SingleItemCard item={item} size="medium" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
