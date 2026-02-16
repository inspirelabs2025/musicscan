import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Disc3, Users, Album, Flag, Headphones, Calendar, Zap, Target, Music, Gift
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

export function QuizCategoryGrid() {
  const { tr } = useLanguage();
  const q = tr.quizGameUI;

  const QUIZ_CATEGORIES = [
    { slug: 'kerst', name: q.catChristmas, description: q.catChristmasDesc, icon: Gift, color: 'from-red-500 to-green-500', badge: '🎄', requiresAuth: false, isNew: true },
    { slug: 'collectie', name: q.catCollection, description: q.catCollectionDesc, icon: Disc3, color: 'from-purple-500 to-pink-500', badge: null, requiresAuth: true },
    { slug: 'artiesten', name: q.catArtists, description: q.catArtistsDesc, icon: Users, color: 'from-blue-500 to-cyan-500', badge: '🎤', requiresAuth: false },
    { slug: 'albums', name: q.catAlbums, description: q.catAlbumsDesc, icon: Album, color: 'from-green-500 to-emerald-500', badge: '💿', requiresAuth: false },
    { slug: 'nederland', name: q.catNetherlands, description: q.catNetherlandsDesc, icon: Flag, color: 'from-orange-500 to-red-500', badge: '🇳🇱', requiresAuth: false },
    { slug: 'frankrijk', name: q.catFrance, description: q.catFranceDesc, icon: Flag, color: 'from-blue-600 to-red-500', badge: '🇫🇷', requiresAuth: false },
    { slug: 'dance-house', name: q.catDanceHouse, description: q.catDanceHouseDesc, icon: Headphones, color: 'from-pink-500 to-purple-500', badge: '🎧', requiresAuth: false },
    { slug: 'decennia', name: q.catDecades, description: q.catDecadesDesc, icon: Calendar, color: 'from-amber-500 to-orange-500', badge: null, requiresAuth: false },
    { slug: 'speed', name: q.catSpeed, description: q.catSpeedDesc, icon: Zap, color: 'from-yellow-500 to-amber-500', badge: '⚡', requiresAuth: false },
    { slug: 'daily', name: q.catDaily, description: q.catDailyDesc, icon: Target, color: 'from-red-500 to-pink-500', badge: '🎯', requiresAuth: false },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {QUIZ_CATEGORIES.map((category) => (
        <QuizCategoryCard key={category.slug} category={category} newLabel={q.newLabel} loginRequired={q.loginRequired} />
      ))}
    </div>
  );
}

function QuizCategoryCard({ category, newLabel, loginRequired }: { category: any; newLabel: string; loginRequired: string }) {
  const Icon = category.icon;
  const linkTo = category.slug === 'kerst' ? '/kerst#kerst-quiz' : `/quizzen/${category.slug}`;
  
  return (
    <Link to={linkTo}>
      <Card className="group relative overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer h-full">
        <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
        <CardContent className="p-6 relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${category.color} shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex gap-1">
              {category.isNew && (
                <Badge className="text-xs bg-gradient-to-r from-red-500 to-green-500 text-white border-0">{newLabel}</Badge>
              )}
              {category.badge && <Badge variant="secondary" className="text-xs">{category.badge}</Badge>}
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">{category.name}</h3>
          <p className="text-sm text-muted-foreground">{category.description}</p>
          {category.requiresAuth && <Badge variant="outline" className="mt-3 text-xs">{loginRequired}</Badge>}
        </CardContent>
      </Card>
    </Link>
  );
}
