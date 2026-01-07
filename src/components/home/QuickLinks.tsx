import { Link } from 'react-router-dom';
import { 
  Music, 
  Disc, 
  Users, 
  History, 
  Youtube, 
  ShoppingBag,
  Gamepad2,
  Mic
} from 'lucide-react';

const links = [
  { icon: Music, label: 'Albums', href: '/verhalen', color: 'text-purple-400' },
  { icon: Disc, label: 'Singles', href: '/singles', color: 'text-pink-400' },
  { icon: Users, label: 'Artiesten', href: '/artists', color: 'text-blue-400' },
  { icon: History, label: 'Geschiedenis', href: '/vandaag-in-de-muziekgeschiedenis', color: 'text-amber-400' },
  { icon: Youtube, label: 'Video\'s', href: '/youtube', color: 'text-red-400' },
  { icon: Mic, label: 'Podcasts', href: '/podcasts', color: 'text-green-400' },
  { icon: Gamepad2, label: 'Quiz', href: '/quizzen', color: 'text-cyan-400' },
  { icon: ShoppingBag, label: 'Shop', href: '/shop', color: 'text-orange-400' },
];

export const QuickLinks = () => {
  return (
    <section className="bg-white dark:bg-zinc-900 py-4 border-b border-zinc-200 dark:border-zinc-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-start md:justify-center gap-4 md:gap-8 overflow-x-auto pb-2 scrollbar-hide">
          {links.map(({ icon: Icon, label, href, color }) => (
            <Link
              key={href}
              to={href}
              className="flex flex-col items-center gap-1 min-w-[60px] group"
            >
              <div className={`p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors whitespace-nowrap">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
