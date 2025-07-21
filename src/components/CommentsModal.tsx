import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { AIScanResult } from '@/hooks/useAIScans';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scan: AIScanResult | null;
  onSuccess: () => void;
}

export function CommentsModal({ isOpen, onClose, scan, onSuccess }: CommentsModalProps) {
  const [comments, setComments] = useState(scan?.comments || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!scan) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('ai_scan_results')
        .update({ comments: comments.trim() || null })
        .eq('id', scan.id);

      if (error) throw error;

      toast({
        title: "Opmerking bijgewerkt",
        description: "De opmerking is succesvol opgeslagen.",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating comments:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het opslaan van de opmerking.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setComments(scan?.comments || '');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Opmerking bewerken</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              {scan?.artist} - {scan?.title}
            </p>
          </div>
          
          <Textarea
            placeholder="Voeg hier je opmerking toe..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={4}
            className="resize-none"
          />
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Annuleren
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}