import { Link } from 'react-router-dom';
import { NewsItem } from '@/hooks/useUnifiedNewsFeed';
import { formatDistanceToNow } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

interface NewsHeroGridProps {
  items: NewsItem[];
}

export const NewsHeroGrid = ({ items }: NewsHeroGridProps) => {
  const { language } = useLanguage();
  const dateLocale = language === 'nl' ? nl : enUS;

  if (!items || items.length === 0) return null;

  const [featured, ...sideItems] = items;
  const displaySideItems = sideItems.slice(0, 4);

  return (
    <section className="bg-black">
      <div className="container mx-auto px-4 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          <div className="lg:col-span-7">
            <Link to={featured.link} className="block group relative h-[350px] md:h-[500px] rounded-none overflow-hidden">
              <img src={featured.image_url || '/placeholder.svg'} alt={featured.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                <span className="inline-block px-3 py-1.5 mb-4 text-xs font-bold uppercase tracking-widest bg-primary text-white">{featured.category_label}</span>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-3 leading-tight">{featured.title}</h1>
                {featured.subtitle && <p className="text-xl md:text-2xl text-white/80 font-light">{featured.subtitle}</p>}
                <p className="text-sm text-white/50 mt-4">{formatDistanceToNow(new Date(featured.date), { addSuffix: true, locale: dateLocale })}</p>
              </div>
            </Link>
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 gap-4">
            {displaySideItems.map((item, index) => (
              <Link key={item.id} to={item.link} className={`group relative overflow-hidden ${index === 0 ? 'h-[200px] md:h-[240px]' : 'h-[120px] md:h-[130px]'}`}>
                <img src={item.image_url || '/placeholder.svg'} alt={item.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                  <span className="inline-block px-2 py-1 mb-2 text-[10px] font-bold uppercase tracking-widest bg-primary text-white">{item.category_label}</span>
                  <h3 className={`font-bold text-white leading-tight ${index === 0 ? 'text-xl md:text-2xl' : 'text-base md:text-lg'}`}>{item.title}</h3>
                  {index === 0 && item.subtitle && <p className="text-sm text-white/70 mt-1">{item.subtitle}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
