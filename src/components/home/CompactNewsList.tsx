import { Link } from 'react-router-dom';
import { NewsItem } from '@/hooks/useUnifiedNewsFeed';
import { ChevronRight, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface CompactNewsListProps {
  title: string;
  items: NewsItem[];
  viewAllLink: string;
}

export const CompactNewsList = ({ title, items, viewAllLink }: CompactNewsListProps) => {
  if (!items || items.length === 0) return null;

  const displayItems = items.slice(0, 5);

  return (
    <div className="bg-zinc-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-zinc-700">
        <h3 className="text-lg font-black text-white uppercase tracking-tight">
          {title}
        </h3>
        <Link 
          to={viewAllLink}
          className="text-primary hover:text-primary/80 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>

      <div className="space-y-4">
        {displayItems.map((item, index) => (
          <Link
            key={item.id}
            to={item.link}
            className="group flex gap-3 items-start"
          >
            <span className="text-3xl font-black text-zinc-600 group-hover:text-primary transition-colors leading-none">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                {item.category_label}
              </span>
              <h4 className="font-bold text-white text-sm line-clamp-2 group-hover:text-primary transition-colors leading-tight mt-0.5">
                {item.title}
              </h4>
              <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(item.date), { addSuffix: true, locale: nl })}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
