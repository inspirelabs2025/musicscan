import React from 'react';
import { CollectionQuiz } from '@/components/CollectionQuiz';

export default function Quiz() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <CollectionQuiz />
      </div>
    </div>
  );
}