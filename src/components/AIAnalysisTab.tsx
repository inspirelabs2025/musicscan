
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { MusicDNAExplorer } from './MusicDNAExplorer';
import { EnhancedCollectionQuiz } from './EnhancedCollectionQuiz';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Trophy } from 'lucide-react';

export function AIAnalysisTab() {
  const [searchParams] = useSearchParams();
  const activeSubtab = searchParams.get('subtab') || 'dna';
  
  return (
    <Tabs value={activeSubtab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-muted border border-border">
        <TabsTrigger 
          value="dna" 
          className="flex items-center gap-2 !bg-vinyl-purple !text-primary-foreground hover:!bg-vinyl-purple hover:!text-primary-foreground data-[state=active]:!bg-vinyl-purple data-[state=active]:!text-primary-foreground"
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
        <EnhancedCollectionQuiz />
      </TabsContent>
    </Tabs>
  );
}
