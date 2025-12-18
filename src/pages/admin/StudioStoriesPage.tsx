import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, Plus, Loader2, CheckCircle, XCircle, Clock, ExternalLink, RefreshCw, Music } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface StudioInput {
  name: string;
  location: string;
  foundedYear: string;
  notes: string;
  specialNotes: string;
}

interface RegenerateDialogState {
  open: boolean;
  story: any | null;
  specialNotes: string;
}

export default function StudioStoriesPage() {
  const queryClient = useQueryClient();
  const [studioInput, setStudioInput] = useState<StudioInput>({
    name: "",
    location: "",
    foundedYear: "",
    notes: "",
    specialNotes: "",
  });
  const [bulkInput, setBulkInput] = useState("");
  const [regenerateDialog, setRegenerateDialog] = useState<RegenerateDialogState>({
    open: false,
    story: null,
    specialNotes: "",
  });

  // Fetch queue items
  const { data: queueItems, isLoading: queueLoading } = useQuery({
    queryKey: ['studio-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('studio_import_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  // Fetch published stories
  const { data: stories, isLoading: storiesLoading } = useQuery({
    queryKey: ['studio-stories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('studio_stories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Add single studio to queue
  const addToQueue = useMutation({
    mutationFn: async (studio: StudioInput) => {
      const { error } = await supabase
        .from('studio_import_queue')
        .insert({
          studio_name: studio.name,
          location: studio.location || null,
          founded_year: studio.foundedYear ? parseInt(studio.foundedYear) : null,
          notes: studio.notes || null,
          special_notes: studio.specialNotes || null,
          status: 'pending',
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Studio toegevoegd aan queue');
      setStudioInput({ name: "", location: "", foundedYear: "", notes: "", specialNotes: "" });
      queryClient.invalidateQueries({ queryKey: ['studio-queue'] });
    },
    onError: (error) => {
      toast.error(`Fout: ${error.message}`);
    },
  });

  // Bulk add studios
  const bulkAddToQueue = useMutation({
    mutationFn: async (studios: string[]) => {
      const insertData = studios.map(name => ({
        studio_name: name.trim(),
        status: 'pending',
      }));
      const { error } = await supabase
        .from('studio_import_queue')
        .insert(insertData);
      if (error) throw error;
      return studios.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} studio's toegevoegd aan queue`);
      setBulkInput("");
      queryClient.invalidateQueries({ queryKey: ['studio-queue'] });
    },
    onError: (error) => {
      toast.error(`Fout: ${error.message}`);
    },
  });

  // Generate story for single studio (test)
  const generateStory = useMutation({
    mutationFn: async (queueItem: any) => {
      const { data, error } = await supabase.functions.invoke('generate-studio-story', {
        body: {
          studioName: queueItem.studio_name,
          location: queueItem.location,
          foundedYear: queueItem.founded_year,
          notes: queueItem.notes,
          specialNotes: queueItem.special_notes,
          queueItemId: queueItem.id,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Story gegenereerd: ${data.wordCount} woorden`);
      queryClient.invalidateQueries({ queryKey: ['studio-queue'] });
      queryClient.invalidateQueries({ queryKey: ['studio-stories'] });
    },
    onError: (error) => {
      toast.error(`Fout: ${error.message}`);
    },
  });

  // Regenerate story for existing story
  const regenerateStory = useMutation({
    mutationFn: async ({ story, specialNotes }: { story: any; specialNotes: string }) => {
      // First delete the old story
      const { error: deleteError } = await supabase
        .from('studio_stories')
        .delete()
        .eq('id', story.id);
      
      if (deleteError) throw deleteError;

      // Generate new story
      const { data, error } = await supabase.functions.invoke('generate-studio-story', {
        body: {
          studioName: story.studio_name,
          location: story.location,
          foundedYear: story.founded_year,
          specialNotes: specialNotes,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Story opnieuw gegenereerd: ${data.wordCount} woorden`);
      setRegenerateDialog({ open: false, story: null, specialNotes: "" });
      queryClient.invalidateQueries({ queryKey: ['studio-stories'] });
    },
    onError: (error) => {
      toast.error(`Fout: ${error.message}`);
    },
  });

  const handleBulkAdd = () => {
    const studios = bulkInput
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    if (studios.length === 0) {
      toast.error('Voer minimaal 1 studio in');
      return;
    }
    
    bulkAddToQueue.mutate(studios);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Klaar</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Mislukt</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Bezig</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Wachtend</Badge>;
    }
  };

  const openRegenerateDialog = (story: any) => {
    setRegenerateDialog({
      open: true,
      story,
      specialNotes: "",
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Studio Verhalen</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-3 mb-8">
        <Building2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Studio Verhalen</h1>
          <p className="text-muted-foreground">Beheer opnamestudio verhalen</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Single Studio Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Studio Toevoegen
            </CardTitle>
            <CardDescription>Voeg een enkele studio toe met details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Studio naam (bijv. Abbey Road)"
              value={studioInput.name}
              onChange={(e) => setStudioInput({ ...studioInput, name: e.target.value })}
            />
            <Input
              placeholder="Locatie (bijv. London, UK)"
              value={studioInput.location}
              onChange={(e) => setStudioInput({ ...studioInput, location: e.target.value })}
            />
            <Input
              placeholder="Opgericht (jaar)"
              type="number"
              value={studioInput.foundedYear}
              onChange={(e) => setStudioInput({ ...studioInput, foundedYear: e.target.value })}
            />
            <Textarea
              placeholder="Extra notities (optioneel)"
              value={studioInput.notes}
              onChange={(e) => setStudioInput({ ...studioInput, notes: e.target.value })}
              rows={2}
            />
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Music className="w-4 h-4 text-primary" />
                Bijzondere instrumenten & apparatuur
              </Label>
              <Textarea
                placeholder="Bijv: 100 jaar oude Bechstein vleugel waarop Elton John speelde, vintage Neve 1073 preamps, originele Fairchild 670 compressor..."
                value={studioInput.specialNotes}
                onChange={(e) => setStudioInput({ ...studioInput, specialNotes: e.target.value })}
                rows={3}
                className="border-primary/30"
              />
              <p className="text-xs text-muted-foreground">
                Deze details worden prominent opgenomen in het verhaal onder "Iconische Instrumenten & Apparatuur"
              </p>
            </div>
            <Button 
              onClick={() => addToQueue.mutate(studioInput)}
              disabled={!studioInput.name || addToQueue.isPending}
              className="w-full"
            >
              {addToQueue.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Toevoegen aan Queue
            </Button>
          </CardContent>
        </Card>

        {/* Bulk Input */}
        <Card>
          <CardHeader>
            <CardTitle>Bulk Import</CardTitle>
            <CardDescription>Voeg meerdere studio's toe (1 per regel)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Abbey Road Studios&#10;Wisseloord Studios&#10;Electric Lady Studios&#10;Sunset Sound&#10;..."
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              rows={8}
            />
            <Button 
              onClick={handleBulkAdd}
              disabled={!bulkInput.trim() || bulkAddToQueue.isPending}
              className="w-full"
            >
              {bulkAddToQueue.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Bulk Toevoegen
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Queue */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Import Queue</CardTitle>
          <CardDescription>
            {queueItems?.filter(q => q.status === 'pending').length || 0} wachtend, {' '}
            {queueItems?.filter(q => q.status === 'completed').length || 0} klaar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {queueLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : queueItems?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Geen items in queue</p>
          ) : (
            <div className="space-y-2">
              {queueItems?.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <span className="font-medium">{item.studio_name}</span>
                    {item.location && <span className="text-muted-foreground ml-2">({item.location})</span>}
                    {item.special_notes && (
                      <p className="text-xs text-primary mt-1 flex items-center gap-1">
                        <Music className="w-3 h-3" />
                        {item.special_notes.length > 60 ? item.special_notes.substring(0, 60) + '...' : item.special_notes}
                      </p>
                    )}
                    {item.error_message && (
                      <p className="text-sm text-destructive">{item.error_message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(item.status)}
                    {item.status === 'pending' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => generateStory.mutate(item)}
                        disabled={generateStory.isPending}
                      >
                        {generateStory.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test Generate'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Published Stories */}
      <Card>
        <CardHeader>
          <CardTitle>Gepubliceerde Verhalen</CardTitle>
          <CardDescription>{stories?.length || 0} studio verhalen</CardDescription>
        </CardHeader>
        <CardContent>
          {storiesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : stories?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nog geen verhalen gepubliceerd</p>
          ) : (
            <div className="grid gap-3">
              {stories?.map((story) => (
                <div key={story.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <span className="font-medium">{story.studio_name}</span>
                    <span className="text-muted-foreground ml-2">
                      {story.word_count} woorden • {story.reading_time} min
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openRegenerateDialog(story)}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Regenereer
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/studio/${story.slug}`} target="_blank">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Bekijk
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regenerate Dialog */}
      <Dialog open={regenerateDialog.open} onOpenChange={(open) => setRegenerateDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Verhaal Regenereren: {regenerateDialog.story?.studio_name}
            </DialogTitle>
            <DialogDescription>
              Voeg specifieke details toe die je in het nieuwe verhaal wilt zien. Het huidige verhaal wordt vervangen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Music className="w-4 h-4 text-primary" />
                Bijzondere instrumenten & apparatuur
              </Label>
              <Textarea
                placeholder="Bijv: 100 jaar oude Bechstein vleugel waarop Elton John 'Your Song' speelde, vintage Neve 1073 preamps uit 1972, EMI TG12345 console..."
                value={regenerateDialog.specialNotes}
                onChange={(e) => setRegenerateDialog(prev => ({ ...prev, specialNotes: e.target.value }))}
                rows={5}
                className="border-primary/30"
              />
              <p className="text-xs text-muted-foreground">
                Voeg hier iconische piano's, versterkers, mengpanelen of andere legendarische apparatuur toe. Deze worden uitgebreid beschreven in het nieuwe verhaal.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRegenerateDialog({ open: false, story: null, specialNotes: "" })}
            >
              Annuleren
            </Button>
            <Button 
              onClick={() => regenerateDialog.story && regenerateStory.mutate({
                story: regenerateDialog.story,
                specialNotes: regenerateDialog.specialNotes,
              })}
              disabled={regenerateStory.isPending}
            >
              {regenerateStory.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Bezig...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenereer Verhaal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
