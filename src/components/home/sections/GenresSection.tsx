import { Link } from 'react-router-dom';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import promoNederlandBg from '@/assets/promo-nederland-bg.jpg';
import promoDanceBg from '@/assets/promo-dance-bg.jpg';
import promoFilmmuziekBg from '@/assets/promo-filmmuziek-bg.jpg';
import promoFrankrijkBg from '@/assets/promo-franse-bg.jpg';

const genres = [
  {
    label: 'Nederlandse Muziek',
    href: '/nederland',
    emoji: '🇳🇱',
    image: promoNederlandBg,
  },
  {
    label: 'Dance & House',
    href: '/dance-house',
    emoji: '🎧',
    image: promoDanceBg,
  },
  {
    label: 'Filmmuziek',
    href: '/filmmuziek',
    emoji: '🎬',
    image: promoFilmmuziekBg,
  },
  {
    label: 'Franse Muziek',
    href: '/frankrijk',
    emoji: '🇫🇷',
    image: promoFrankrijkBg,
  },
];

export function GenresSection() {
  return (
    <section className="py-14 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-foreground mb-6">Ontdek op Genre</h2>

        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            {genres.map((genre) => (
              <Link
                key={genre.href}
                to={genre.href}
                className="flex-shrink-0 w-52 md:w-64 group"
              >
                <div className="aspect-[16/9] rounded-xl overflow-hidden relative group-hover:scale-[1.02] transition-transform duration-300 shadow-lg">
                  <img
                    src={genre.image}
                    alt={`${genre.label} muziek ontdekken`}
                    loading="lazy"
                    decoding="async"
                    width={256}
                    height={144}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl md:text-5xl mb-1">{genre.emoji}</span>
                    <span className="text-primary-foreground font-bold text-base md:text-lg text-center px-4 drop-shadow-lg">
                      {genre.label}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </section>
  );
}
