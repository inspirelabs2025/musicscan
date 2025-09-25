import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { useCreateForumTopic, CreateTopicData } from '@/hooks/useForumTopics';

interface CreateTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTopicModal: React.FC<CreateTopicModalProps> = ({ isOpen, onClose }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateTopicData>();
  const createTopicMutation = useCreateForumTopic();

  const onSubmit = async (data: CreateTopicData) => {
    try {
      await createTopicMutation.mutateAsync(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Error creating topic:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nieuwe Discussie Starten</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              {...register('title', { required: 'Titel is verplicht' })}
              placeholder="Waar wil je over discussiëren?"
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Vertel meer over je discussie onderwerp..."
              className="min-h-[100px]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="artist_name">Artiest (optioneel)</Label>
              <Input
                id="artist_name"
                {...register('artist_name')}
                placeholder="The Beatles"
              />
            </div>
            
            <div>
              <Label htmlFor="album_title">Album (optioneel)</Label>
              <Input
                id="album_title"
                {...register('album_title')}
                placeholder="Abbey Road"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuleren
            </Button>
            <Button 
              type="submit" 
              disabled={createTopicMutation.isPending}
            >
              {createTopicMutation.isPending ? 'Bezig...' : 'Discussie Starten'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};