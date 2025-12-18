import { Link } from 'react-router-dom';
import { NewsItem } from '@/hooks/useUnifiedNewsFeed';

interface NewsHeroGridProps {
  items: NewsItem[];
}

export const NewsHeroGrid = ({ items }: NewsHeroGridProps) => {
  if (!items || items.length === 0) return null;

  const [featured, ...sideItems] = items;
  const displaySideItems = sideItems.slice(0, 3);

  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
          {/* Featured Large Card - 60% */}
          <div className="lg:col-span-3">
            <Link to={featured.link} className="block group relative h-[300px] md:h-[450px] rounded-xl overflow-hidden">
              <img
                src={featured.image_url || '/placeholder.svg'}
                alt={featured.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Gradient Overlay - Purple tint */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-primary/10" />
              
              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <span className="inline-block px-3 py-1 mb-3 text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground rounded">
                  {featured.category_label}
                </span>
                <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 line-clamp-2 group-hover:text-primary-foreground/90 transition-colors">
                  {featured.title}
                </h2>
                {featured.subtitle && (
                  <p className="text-lg text-white/80">{featured.subtitle}</p>
                )}
              </div>
            </Link>
          </div>

          {/* Side Cards - 40% */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {displaySideItems.map((item) => (
              <Link
                key={item.id}
                to={item.link}
                className="group flex gap-4 p-3 rounded-lg bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="w-24 h-24 md:w-28 md:h-28 flex-shrink-0 rounded-lg overflow-hidden">
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
                  <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  {item.subtitle && (
                    <p className="text-sm text-muted-foreground mt-1 truncate">{item.subtitle}</p>
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
