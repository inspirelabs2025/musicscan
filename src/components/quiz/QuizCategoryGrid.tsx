import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Disc3, Users, Album, Flag, Headphones, Calendar, Zap, Target, Music, Gift
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const QUIZ_CATEGORIES = [
  {
    slug: 'kerst',
    name: 'Kerst Quiz',
    description: 'Test je kerstmuziek kennis!',
    icon: Gift,
    color: 'from-red-500 to-green-500',
    badge: '🎄',
    requiresAuth: false,
    isNew: true,
  },
  {
    slug: 'collectie',
    name: 'Mijn Collectie',
    description: 'Quiz over jouw muziekcollectie',
    icon: Disc3,
    color: 'from-purple-500 to-pink-500',
    badge: null,
    requiresAuth: true,
  },
  {
    slug: 'artiesten',
    name: 'Artiesten Quiz',
    description: 'Test je kennis van artiesten',
    icon: Users,
    color: 'from-blue-500 to-cyan-500',
    badge: '🎤',
    requiresAuth: false,
  },
  {
    slug: 'albums',
    name: 'Album Quiz',
    description: 'Hoeveel weet je van albums?',
    icon: Album,
    color: 'from-green-500 to-emerald-500',
    badge: '💿',
    requiresAuth: false,
  },
  {
    slug: 'nederland',
    name: 'Nederlandse Muziek',
    description: 'Nederlandse muziekgeschiedenis',
    icon: Flag,
    color: 'from-orange-500 to-red-500',
    badge: '🇳🇱',
    requiresAuth: false,
  },
  {
    slug: 'frankrijk',
    name: 'Franse Muziek',
    description: 'Franse muziekgeschiedenis',
    icon: Flag,
    color: 'from-blue-600 to-red-500',
    badge: '🇫🇷',
    requiresAuth: false,
  },
  {
    slug: 'dance-house',
    name: 'Dance & House',
    description: 'Electronic muziek kennis',
    icon: Headphones,
    color: 'from-pink-500 to-purple-500',
    badge: '🎧',
    requiresAuth: false,
  },
  {
    slug: 'decennia',
    name: 'Decennia Quiz',
    description: 'Per tijdperk quizzen',
    icon: Calendar,
    color: 'from-amber-500 to-orange-500',
    badge: null,
    requiresAuth: false,
  },
  {
    slug: 'speed',
    name: 'Speed Round',
    description: 'Snelle 5-vragen quiz',
    icon: Zap,
    color: 'from-yellow-500 to-amber-500',
    badge: '⚡',
    requiresAuth: false,
  },
  {
    slug: 'daily',
    name: 'Dagelijkse Challenge',
    description: 'Compete met anderen',
    icon: Target,
    color: 'from-red-500 to-pink-500',
    badge: '🎯',
    requiresAuth: false,
  },
];

export function QuizCategoryGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {QUIZ_CATEGORIES.map((category) => (
        <QuizCategoryCard key={category.slug} category={category} />
      ))}
    </div>
  );
}

function QuizCategoryCard({ category }: { category: typeof QUIZ_CATEGORIES[0] }) {
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
                <Badge className="text-xs bg-gradient-to-r from-red-500 to-green-500 text-white border-0">
                  Nieuw!
                </Badge>
              )}
              {category.badge && (
                <Badge variant="secondary" className="text-xs">
                  {category.badge}
                </Badge>
              )}
            </div>
          </div>
          
          <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
            {category.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {category.description}
          </p>
          
          {category.requiresAuth && (
            <Badge variant="outline" className="mt-3 text-xs">
              Login vereist
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
