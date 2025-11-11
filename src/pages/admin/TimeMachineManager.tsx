import { useState } from 'react';
import { useTimeMachineEvents, useDeleteTimeMachineEvent } from '@/hooks/useTimeMachineEvents';
import { useGenerateTimeMachinePoster } from '@/hooks/useGenerateTimeMachinePoster';
import { useGenerateTimeMachineEvent } from '@/hooks/useGenerateTimeMachineEvent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { AlertCircle, Plus, Wand2, Eye, Trash2, Calendar, MapPin, Package, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { TimeMachineEventForm } from '@/components/admin/TimeMachineEventForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function TimeMachineManager() {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [autoGeneratePosterForEvent, setAutoGeneratePosterForEvent] = useState<string | null>(null);
  
  const { data: events, isLoading, error } = useTimeMachineEvents({ published: undefined });
  const { mutate: generatePoster, isPending: isGenerating } = useGenerateTimeMachinePoster();
  const { mutate: deleteEvent, isPending: isDeleting } = useDeleteTimeMachineEvent();
  const { mutate: generateEvent, isPending: isGeneratingEvent } = useGenerateTimeMachineEvent();

  const handleGeneratePoster = (eventId: string) => {
    setAutoGeneratePosterForEvent(eventId);
    generatePoster({ 
      eventId, 
      generateMetal: true,
      createProducts: true 
    }, {
      onSettled: () => {
        setAutoGeneratePosterForEvent(null);
      }
    });
  };

  const handleDelete = () => {
    if (deleteEventId) {
      deleteEvent(deleteEventId, {
        onSuccess: () => setDeleteEventId(null)
      });
    }
  };

  const handleGenerateWithAI = () => {
    if (!aiPrompt.trim()) return;
    
    generateEvent(aiPrompt, {
      onSuccess: (eventData) => {
        setEditingEvent(eventData);
        setShowCreateForm(true);
        setAiPrompt('');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Fout bij laden van Time Machine events: {error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">🕰️ Time Machine Manager</h1>
          <p className="text-muted-foreground">Beheer historische concert experiences</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Nieuw Event
        </Button>
      </div>

      {/* AI Event Generator */}
      <Card className="mb-8 border-primary bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            ✨ AI Event Generator
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Voer een concert beschrijving in en laat AI het event voor je maken
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Bijv: The Beatles - Shea Stadium, New York 15 aug 1965"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateWithAI()}
              disabled={isGeneratingEvent}
              className="flex-1"
            />
            <Button 
              onClick={handleGenerateWithAI}
              disabled={isGeneratingEvent || !aiPrompt.trim()}
              size="lg"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {isGeneratingEvent ? 'Genereren...' : 'Genereer met AI'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Tip: Vermeld artiest, venue, locatie en datum voor de beste resultaten
          </p>
        </CardContent>
      </Card>

      {showCreateForm && (
        <Card className="mb-8 border-primary">
          <CardHeader>
            <CardTitle>{editingEvent ? 'Event Bewerken' : 'Nieuw Time Machine Event'}</CardTitle>
          </CardHeader>
          <CardContent>
            <TimeMachineEventForm
              event={editingEvent}
              onSuccess={(createdEventId?: string) => {
                setShowCreateForm(false);
                
                // Auto-generate poster for newly created AI events
                if (createdEventId && !editingEvent?.id) {
                  setAutoGeneratePosterForEvent(createdEventId);
                  generatePoster({ 
                    eventId: createdEventId, 
                    generateMetal: true,
                    createProducts: true 
                  });
                }
                
                setEditingEvent(null);
              }}
              onCancel={() => {
                setShowCreateForm(false);
                setEditingEvent(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events?.map((event) => {
          // Determine display poster URL with fallback
          const displayPosterUrl = event.poster_source === 'original'
            ? (event.original_poster_url || event.poster_image_url)
            : event.poster_image_url;
          
          return (
          <Card key={event.id} className="overflow-hidden hover:border-primary transition-colors">
            <div className="aspect-[3/4] relative bg-muted">
              {displayPosterUrl ? (
                <img
                  src={displayPosterUrl}
                  alt={event.event_title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
              <div className="absolute top-2 left-2">
                <Badge variant={event.poster_source === 'original' ? 'default' : 'secondary'}>
                  {event.poster_source === 'original' ? '📜 Origineel' : '🤖 AI'}
                </Badge>
                {event.poster_source === 'original' && !event.original_poster_url && (
                  <Badge variant="destructive" className="ml-2">
                    ⚠️ Upload Vereist
                  </Badge>
                )}
              </div>
              <div className="absolute top-2 right-2 flex gap-2">
                <Badge variant={event.is_published ? 'default' : 'secondary'}>
                  {event.is_published ? 'Published' : 'Draft'}
                </Badge>
                {event.is_featured && (
                  <Badge variant="default" className="bg-primary">
                    Featured
                  </Badge>
                )}
              </div>
            </div>
            
            <CardContent className="pt-6">
              <h3 className="font-bold text-lg mb-2 line-clamp-2">{event.event_title}</h3>
              
              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(event.concert_date).toLocaleDateString('nl-NL')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{event.venue_name}, {event.venue_city}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate(`/time-machine/${event.slug}`)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setEditingEvent(event);
                      setShowCreateForm(true);
                    }}
                  >
                    Edit
                  </Button>
                </div>

                {event.poster_source === 'ai' ? (
                  autoGeneratePosterForEvent === event.id && !event.poster_image_url ? (
                    <div className="w-full py-3 px-4 bg-primary/10 border border-primary/20 rounded-md">
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <Wand2 className="w-4 h-4 animate-pulse" />
                        <span>Poster wordt gegenereerd… (30-60s)</span>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleGeneratePoster(event.id)}
                      disabled={isGenerating}
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      {event.poster_image_url ? 'Regenereer AI Poster' : 'Genereer AI Poster'}
                    </Button>
                  )
                ) : event.original_poster_url ? (
                  <div className="w-full py-2 px-3 bg-muted rounded-md text-center">
                    <p className="text-sm text-muted-foreground">
                      📜 Gebruikt originele poster
                    </p>
                  </div>
                ) : (
                  <div className="w-full py-2 px-3 bg-destructive/10 border border-destructive/20 rounded-md text-center">
                    <p className="text-sm text-destructive font-medium">
                      ⚠️ Upload originele poster via Edit
                    </p>
                  </div>
                )}

                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full"
                  onClick={() => setDeleteEventId(event.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Verwijder
                </Button>
              </div>

              {event.views_count !== undefined && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  {event.views_count} views · {event.products_sold || 0} verkocht
                </p>
              )}
            </CardContent>
          </Card>
          );
        })}
      </div>

      {events?.length === 0 && (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Nog geen Time Machine Events</h3>
          <p className="text-muted-foreground mb-6">
            Maak je eerste historisch concert experience aan
          </p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nieuw Event Aanmaken
          </Button>
        </Card>
      )}

      <AlertDialog open={!!deleteEventId} onOpenChange={(open) => !open && setDeleteEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Event Verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Deze actie kan niet ongedaan worden gemaakt. Het event en alle bijbehorende data worden permanent verwijderd.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
