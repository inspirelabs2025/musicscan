import { useParams } from 'react-router-dom';
import { useTimeMachineEvent } from '@/hooks/useTimeMachineEvents';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeMachineHero } from '@/components/timemachine/TimeMachineHero';
import { StoryContent } from '@/components/timemachine/StoryContent';
import { InteractiveSetlist } from '@/components/timemachine/InteractiveSetlist';
import { ArchiveGallery } from '@/components/timemachine/ArchiveGallery';
import { FanMemoryWall } from '@/components/timemachine/FanMemoryWall';
import { TimeMachineProductCTA } from '@/components/timemachine/TimeMachineProductCTA';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSEO } from '@/hooks/useSEO';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function TimeMachineStory() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading, error } = useTimeMachineEvent(slug);

  useSEO({
    title: event?.meta_title || `${event?.artist_name} – ${event?.venue_name} '${new Date(event?.concert_date || '').getFullYear()}`,
    description: event?.meta_description || event?.historical_context?.substring(0, 160),
    keywords: event?.tags?.join(', '),
  });

  // Track view count
  useEffect(() => {
    if (event?.id) {
      supabase
        .from('time_machine_events')
        .update({ views_count: (event.views_count || 0) + 1 })
        .eq('id', event.id)
        .then(() => console.log('View tracked'));
    }
  }, [event?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-[60vh] w-full" />
        <div className="container mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Deze Time Machine ervaring kon niet worden geladen. Mogelijk bestaat het event niet of is het nog niet gepubliceerd.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TimeMachineHero event={event} />

      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="story" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="story">Het Verhaal</TabsTrigger>
            <TabsTrigger value="music">De Muziek</TabsTrigger>
            <TabsTrigger value="archive">Archief</TabsTrigger>
            <TabsTrigger value="memories">Fan Herinneringen</TabsTrigger>
          </TabsList>

          <TabsContent value="story" className="space-y-8">
            <StoryContent event={event} />
          </TabsContent>

          <TabsContent value="music" className="space-y-8">
            <InteractiveSetlist event={event} />
          </TabsContent>

          <TabsContent value="archive" className="space-y-8">
            <ArchiveGallery event={event} />
          </TabsContent>

          <TabsContent value="memories" className="space-y-8">
            <FanMemoryWall eventId={event.id} />
          </TabsContent>
        </Tabs>

        <TimeMachineProductCTA event={event} />
      </div>
    </div>
  );
}
