import { useFanMemories, useCreateFanMemory, useLikeFanMemory } from '@/hooks/useTimeMachineFanMemories';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Heart, MessageCircle, Plus, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface FanMemoryWallProps {
  eventId: string;
}

export function FanMemoryWall({ eventId }: FanMemoryWallProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { tr } = useLanguage();
  const c = tr.contentUI;
  const { data: memories = [], isLoading } = useFanMemories({ eventId, approved: true });
  const createMemory = useCreateFanMemory();
  const likeMemory = useLikeFanMemory();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [memoryText, setMemoryText] = useState('');
  const [wasPresent, setWasPresent] = useState(false);
  const [discoveryStory, setDiscoveryStory] = useState('');

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: c.loginRequired, description: c.mustBeLoggedInMemory, variant: 'destructive' });
      return;
    }
    if (!memoryText.trim()) {
      toast({ title: c.fillInMemory, description: c.mustFillMemory, variant: 'destructive' });
      return;
    }
    await createMemory.mutateAsync({
      event_id: eventId, user_id: user.id, memory_text: memoryText,
      was_present: wasPresent, discovery_story: discoveryStory || undefined,
    });
    setMemoryText(''); setWasPresent(false); setDiscoveryStory(''); setIsDialogOpen(false);
  };

  const handleLike = async (memoryId: string) => {
    if (!user) {
      toast({ title: c.loginRequired, description: c.mustBeLoggedInLike, variant: 'destructive' });
      return;
    }
    await likeMemory.mutateAsync(memoryId);
  };

  if (isLoading) {
    return <div className="text-center py-8">{c.loadingMemories}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">{c.fanMemories}</h2>
            <p className="text-sm text-muted-foreground">
              {memories.length} {c.memoriesShared}
            </p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />{c.shareYourMemory}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{c.shareMemoryTitle}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2">
                <Switch id="was-present" checked={wasPresent} onCheckedChange={setWasPresent} />
                <Label htmlFor="was-present" className="cursor-pointer">{c.iWasThere}</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="memory">{wasPresent ? c.yourMemoryOfNight : c.howDiscoveredArtist}</Label>
                <Textarea id="memory" placeholder={wasPresent ? c.shareExperience : c.tellHowDiscovered}
                  value={memoryText} onChange={(e) => setMemoryText(e.target.value)} rows={6} />
              </div>
              {wasPresent && (
                <div className="space-y-2">
                  <Label htmlFor="discovery">{c.howDiscoveredOptional}</Label>
                  <Textarea id="discovery" placeholder={c.tellFirstHeard}
                    value={discoveryStory} onChange={(e) => setDiscoveryStory(e.target.value)} rows={3} />
                </div>
              )}
              <Button onClick={handleSubmit} disabled={createMemory.isPending} className="w-full">
                {createMemory.isPending ? c.sending : c.sendMemory}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {memories.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{c.noMemoriesYet}</p>
            <p className="text-sm text-muted-foreground">{c.beFirst}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {memories.map((memory) => (
            <Card key={memory.id} className={memory.is_featured ? 'border-primary' : ''}>
              <CardContent className="pt-6">
                {memory.is_featured && (
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">{c.featuredMemory}</span>
                  </div>
                )}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    {memory.profiles?.avatar_url ? (
                      <img src={memory.profiles.avatar_url} alt={memory.profiles.first_name || 'User'}
                        className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-primary font-bold">
                        {(memory.profiles?.first_name || 'U')[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{memory.profiles?.first_name || c.musicLover}</span>
                      {memory.was_present && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          ✓ {c.wasPresent}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(memory.created_at).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                </div>
                <p className="text-foreground/90 mb-4 whitespace-pre-wrap">{memory.memory_text}</p>
                {memory.discovery_story && (
                  <div className="border-l-2 border-primary/30 pl-3 mb-4">
                    <p className="text-sm text-muted-foreground italic">{memory.discovery_story}</p>
                  </div>
                )}
                <Button variant="ghost" size="sm" onClick={() => handleLike(memory.id)} className="gap-2">
                  <Heart className="w-4 h-4" />{memory.likes_count || 0}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
