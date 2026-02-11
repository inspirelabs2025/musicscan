import React from 'react';
import { Link } from 'react-router-dom';
import { useArtistContent } from '@/hooks/useArtistContent';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Music, BookOpen, Disc3, ShoppingBag, Sparkles } from 'lucide-react';

interface ArtistContentCardsProps {
  artistName: string | null;
}

interface ContentCardProps {
  title: string;
  image?: string | null;
  link: string;
  type: string;
  icon: React.ReactNode;
  badgeColor: string;
}

const ContentCard: React.FC<ContentCardProps> = ({ title, image, link, type, icon, badgeColor }) => (
  <Link
    to={link}
    className="flex-shrink-0 w-36 group cursor-pointer"
  >
    <div className="relative h-36 w-36 rounded-xl overflow-hidden border border-border/40 bg-muted/30 shadow-sm group-hover:shadow-md group-hover:border-primary/30 transition-all">
      {image ? (
        <img src={image} alt={title} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
          {icon}
        </div>
      )}
      <div className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm ${badgeColor}`}>
        {type}
      </div>
    </div>
    <p className="mt-1.5 text-xs font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
      {title}
    </p>
  </Link>
);

export const ArtistContentCards: React.FC<ArtistContentCardsProps> = ({ artistName }) => {
  const { artistStory, albumStories, singles, anecdotes, products, totalCount, isLoading } = useArtistContent(artistName);

  if (isLoading || totalCount === 0) return null;

  const cards: ContentCardProps[] = [];

  if (artistStory) {
    cards.push({
      title: artistStory.title,
      image: artistStory.image_url,
      link: `/artists/${artistStory.slug}`,
      type: 'Artiest',
      icon: <Music className="h-8 w-8 text-primary/40" />,
      badgeColor: 'bg-purple-600/80',
    });
  }

  albumStories.forEach(s => {
    cards.push({
      title: s.title,
      image: s.image_url,
      link: `/muziek-verhaal/${s.slug}`,
      type: 'Verhaal',
      icon: <BookOpen className="h-8 w-8 text-primary/40" />,
      badgeColor: 'bg-blue-600/80',
    });
  });

  singles.forEach(s => {
    cards.push({
      title: s.title,
      image: s.image_url,
      link: `/singles/${s.slug}`,
      type: 'Single',
      icon: <Disc3 className="h-8 w-8 text-primary/40" />,
      badgeColor: 'bg-green-600/80',
    });
  });

  products.slice(0, 4).forEach(p => {
    cards.push({
      title: p.title,
      image: p.image_url,
      link: `/product/${p.slug}`,
      type: 'Shop',
      icon: <ShoppingBag className="h-8 w-8 text-primary/40" />,
      badgeColor: 'bg-orange-600/80',
    });
  });

  anecdotes.forEach(a => {
    cards.push({
      title: a.title,
      image: a.image_url,
      link: `/anekdotes/${a.slug}`,
      type: 'Anekdote',
      icon: <Sparkles className="h-8 w-8 text-primary/40" />,
      badgeColor: 'bg-pink-600/80',
    });
  });

  if (cards.length === 0) return null;

  return (
    <div className="my-3 animate-fadeIn">
      <div className="flex items-center gap-2 mb-2 px-1">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Ontdek meer over {artistName}
        </span>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-3 px-1">
          {cards.map((card, i) => (
            <ContentCard key={i} {...card} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
