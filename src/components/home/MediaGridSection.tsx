import { Link } from 'react-router-dom';
import { NewsItem } from '@/hooks/useUnifiedNewsFeed';
import { ChevronRight, Play } from 'lucide-react';

interface MediaGridSectionProps {
  title: string;
  items: NewsItem[];
  viewAllLink: string;
}

export const MediaGridSection = ({ title, items, viewAllLink }: MediaGridSectionProps) => {
  if (!items || items.length === 0) return null;

  const displayItems = items.slice(0, 6);

  return (
    <section className="bg-zinc-900 py-10 md:py-14">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-primary">
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
            {title}
          </h2>
          <Link 
            to={viewAllLink}
            className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-bold text-sm uppercase tracking-wide transition-colors"
          >
            Bekijk alles
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {displayItems.map((item) => (
            <Link
              key={item.id}
              to={item.link}
              target={item.link.startsWith('http') ? '_blank' : undefined}
              className="group relative aspect-video overflow-hidden"
            >
              <img
                src={item.image_url || '/placeholder.svg'}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors" />
              
              {/* Play icon for videos */}
              {item.type === 'youtube' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 text-white fill-white ml-1" />
                  </div>
                </div>
              )}
              
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="inline-block px-2 py-1 mb-2 text-[10px] font-bold uppercase tracking-widest bg-primary text-white">
                  {item.category_label}
                </span>
                <h3 className="font-bold text-white text-sm md:text-base line-clamp-2 leading-tight">
                  {item.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
