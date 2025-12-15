import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArtistQuiz } from '@/components/quiz/ArtistQuiz';
import { AlbumQuiz } from '@/components/quiz/AlbumQuiz';
import { CollectionQuiz } from '@/components/CollectionQuiz';
import { NederlandseMuziekQuiz } from '@/components/nederland/NederlandseMuziekQuiz';
import { DanceHouseMuziekQuiz } from '@/components/dance-house/DanceHouseMuziekQuiz';
import { DailyChallengeQuiz } from '@/components/quiz/DailyChallengeQuiz';
import { useAuth } from '@/contexts/AuthContext';

const CATEGORY_META: Record<string, { title: string; description: string }> = {
  kerst: {
    title: 'Kerst Quiz',
    description: 'Test je kerstmuziek kennis!',
  },
  artiesten: {
    title: 'Artiesten Quiz',
    description: 'Test je kennis over muziekartiesten, genres en biografieën.',
  },
  albums: {
    title: 'Album Quiz',
    description: 'Hoeveel weet je van albums, jaartallen en labels?',
  },
  collectie: {
    title: 'Mijn Collectie Quiz',
    description: 'Quiz over jouw persoonlijke muziekcollectie.',
  },
  nederland: {
    title: 'Nederlandse Muziek Quiz',
    description: 'Test je kennis van Nederlandse muziekgeschiedenis.',
  },
  frankrijk: {
    title: 'Franse Muziek Quiz',
    description: 'Test je kennis van Franse muziekgeschiedenis.',
  },
  'dance-house': {
    title: 'Dance & House Quiz',
    description: 'Hoeveel weet je van elektronische muziek?',
  },
  decennia: {
    title: 'Decennia Quiz',
    description: 'Quiz per tijdperk - van de jaren 50 tot nu.',
  },
  speed: {
    title: 'Speed Round',
    description: 'Snelle 5-vragen quiz - 15 seconden per vraag!',
  },
  daily: {
    title: 'Dagelijkse Challenge',
    description: 'Compete met andere spelers voor de hoogste score van vandaag.',
  },
};

export default function CategoryQuiz() {
  const { category } = useParams<{ category: string }>();
  const { user } = useAuth();
  
  if (!category || !CATEGORY_META[category]) {
    return <Navigate to="/quizzen" replace />;
  }

  const meta = CATEGORY_META[category];

  // Redirect to kerst page for Christmas quiz
  if (category === 'kerst') {
    return <Navigate to="/kerst#kerst-quiz" replace />;
  }

  // Redirect to auth for collection quiz if not logged in
  if (category === 'collectie' && !user) {
    return <Navigate to="/auth?redirect=/quizzen/collectie" replace />;
  }

  const renderQuiz = () => {
    switch (category) {
      case 'artiesten':
        return <ArtistQuiz />;
      case 'albums':
        return <AlbumQuiz />;
      case 'collectie':
        return <CollectionQuiz />;
      case 'nederland':
        return <NederlandseMuziekQuiz />;
      case 'dance-house':
        return <DanceHouseMuziekQuiz />;
      case 'frankrijk':
        // TODO: Franse muziek quiz
        return <NederlandseMuziekQuiz />; // Temporary fallback
      case 'decennia':
        return <AlbumQuiz />; // With decade filter
      case 'speed':
        return <ArtistQuiz />; // Speed mode
      case 'daily':
        return <DailyChallengeQuiz />;
      default:
        return <Navigate to="/quizzen" replace />;
    }
  };

  return (
    <>
      <Helmet>
        <title>{meta.title} | MusicScan Quizzen</title>
        <meta name="description" content={meta.description} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="container mx-auto px-4 py-8">
          {renderQuiz()}
        </div>
      </div>
    </>
  );
}
