import { Link } from 'react-router-dom';
import promoNederlandBg from '@/assets/promo-nederland-bg.jpg';
import promoDanceBg from '@/assets/promo-dance-bg.jpg';
import promoFilmmuziekBg from '@/assets/promo-filmmuziek-bg.jpg';
import promoFrankrijkBg from '@/assets/promo-frankrijk-bg.jpg';

const genres = [
  { label: 'Nederlandse Muziek', href: '/nederland', emoji: '🇳🇱', image: promoNederlandBg },
  { label: 'Dance & House', href: '/dance-house', emoji: '🎧', image: promoDanceBg },
  { label: 'Filmmuziek', href: '/filmmuziek', emoji: '🎬', image: promoFilmmuziekBg },
  { label: 'Franse Muziek', href: '/frankrijk', emoji: '🇫🇷', image: promoFrankrijkBg },
];

export function GenresSection() {
  return (
    <section className="py-12 md:py-16 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 md:mb-8">Ontdek op Genre</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {genres.map((genre) => (
            <Link
              key={genre.href}
              to={genre.href}
              className="group min-h-[44px]"
            >
              <div className="h-32 md:h-40 rounded-xl overflow-hidden relative shadow-md group-hover:shadow-lg group-hover:scale-[1.02] transition-all duration-300 border border-border">
                <img
                  src={genre.image}
                  alt={`${genre.label} muziek ontdekken`}
                  loading="lazy"
                  decoding="async"
                  width={256}
                  height={192}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent group-hover:from-black/60 transition-colors" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl md:text-5xl mb-1">{genre.emoji}</span>
                  <span className="text-white font-bold text-xs md:text-lg text-center px-2 md:px-4 drop-shadow-lg leading-tight">
                    {genre.label}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
