import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { NewsItem } from '@/hooks/useUnifiedNewsFeed';

interface NewsCategorySectionProps {
  title: string;
  items: NewsItem[];
  viewAllLink: string;
  viewAllText?: string;
}

export const NewsCategorySection = ({ 
  title, 
  items, 
  viewAllLink, 
  viewAllText = 'Bekijk alles' 
}: NewsCategorySectionProps) => {
  if (!items || items.length === 0) return null;

  const [featured, ...listItems] = items;
  const displayListItems = listItems.slice(0, 4);

  return (
    <section className="py-8 md:py-12 border-t border-border/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {title}
          </h2>
          <Link 
            to={viewAllLink}
            className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {viewAllText}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Featured Card - Left Side */}
          <div className="lg:col-span-2">
            <Link to={featured.link} className="block group">
              <div className="relative aspect-square rounded-xl overflow-hidden mb-4">
                <img
                  src={featured.image_url || '/placeholder.svg'}
                  alt={featured.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                {featured.category_label}
              </span>
              <h3 className="text-xl font-bold text-foreground mt-1 line-clamp-2 group-hover:text-primary transition-colors">
                {featured.title}
              </h3>
              {featured.subtitle && (
                <p className="text-muted-foreground mt-1">{featured.subtitle}</p>
              )}
            </Link>
          </div>

          {/* List Items - Right Side */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {displayListItems.map((item) => (
              <Link
                key={item.id}
                to={item.link}
                className="group flex gap-4 py-3 border-b border-border/30 last:border-0 hover:bg-accent/30 -mx-2 px-2 rounded transition-colors"
              >
                <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                  <img
                    src={item.image_url || '/placeholder.svg'}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                    {item.category_label}
                  </span>
                  <h4 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  {item.subtitle && (
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">{item.subtitle}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
