import { Link } from 'react-router-dom';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const genres = [
  {
    label: 'Nederlandse Muziek',
    href: '/nederland',
    gradient: 'from-orange-600/80 to-red-700/80',
    emoji: '🇳🇱',
  },
  {
    label: 'Dance & House',
    href: '/dance-house',
    gradient: 'from-purple-600/80 to-pink-600/80',
    emoji: '🎧',
  },
  {
    label: 'Filmmuziek',
    href: '/filmmuziek',
    gradient: 'from-indigo-700/80 to-blue-600/80',
    emoji: '🎬',
  },
  {
    label: 'Franse Muziek',
    href: '/frankrijk',
    gradient: 'from-blue-600/80 via-white/20 to-red-600/80',
    emoji: '🇫🇷',
  },
];

export function GenresSection() {
  return (
    <section className="py-10 bg-muted/30">
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
                <div className={`aspect-[16/9] rounded-xl overflow-hidden bg-gradient-to-br ${genre.gradient} flex items-center justify-center relative group-hover:scale-[1.02] transition-transform duration-300 shadow-lg`}>
                  <span className="text-5xl md:text-6xl opacity-20 absolute">{genre.emoji}</span>
                  <span className="relative z-10 text-white font-bold text-base md:text-lg text-center px-4 drop-shadow-lg">
                    {genre.label}
                  </span>
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
