
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { MusicDNAExplorer } from './MusicDNAExplorer';
import { CollectionQuiz } from './CollectionQuiz';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Trophy } from 'lucide-react';

export function AIAnalysisTab() {
  const [searchParams] = useSearchParams();
  const activeSubtab = searchParams.get('subtab') || 'dna';
  
  return (
    <Tabs value={activeSubtab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-md border border-white/20">
        <TabsTrigger 
          value="dna" 
          className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-vinyl-purple data-[state=active]:to-primary data-[state=active]:text-white"
        >
          <Brain className="h-4 w-4" />
          🧠 Muziek DNA
        </TabsTrigger>
        <TabsTrigger 
          value="quiz" 
          className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-vinyl-gold data-[state=active]:to-yellow-500 data-[state=active]:text-black"
        >
          <Trophy className="h-4 w-4" />
          🎯 Collectie Quiz
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="dna" className="mt-6">
        <MusicDNAExplorer />
      </TabsContent>
      
      <TabsContent value="quiz" className="mt-6">
        <CollectionQuiz />
      </TabsContent>
    </Tabs>
  );
}
