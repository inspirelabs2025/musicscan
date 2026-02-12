import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useCreateTimeMachineEvent, useUpdateTimeMachineEvent, TimeMachineEvent } from '@/hooks/useTimeMachineEvents';
import { useUploadOriginalPoster } from '@/hooks/useUploadOriginalPoster';
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react';

const eventFormSchema = z.object({
  event_title: z.string().min(3, 'Titel moet minimaal 3 karakters zijn'),
  event_subtitle: z.string().optional(),
  artist_name: z.string().min(2, 'Artiestnaam is verplicht'),
  venue_name: z.string().min(2, 'Venue naam is verplicht'),
  venue_city: z.string().min(2, 'Stad is verplicht'),
  venue_country: z.string().default('Nederland'),
  concert_date: z.string().min(1, 'Datum is verplicht'),
  tour_name: z.string().optional(),
  historical_context: z.string().optional(),
  cultural_significance: z.string().optional(),
  story_content: z.string().min(50, 'Verhaal moet minimaal 50 karakters zijn'),
  attendance_count: z.number().optional(),
  ticket_price_original: z.number().optional(),
  poster_style: z.string().optional(),
  typography_style: z.string().optional(),
  edition_size: z.number().default(100),
  price_poster: z.number().default(149.00),
  price_metal: z.number().default(299.00),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  tags: z.string().optional(),
  is_published: z.boolean().default(false),
  is_featured: z.boolean().default(false),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface TimeMachineEventFormProps {
  event?: TimeMachineEvent | null;
  onSuccess?: (eventId?: string) => void;
  onCancel?: () => void;
}

export function TimeMachineEventForm({ event, onSuccess, onCancel }: TimeMachineEventFormProps) {
  const { mutate: createEvent, isPending: isCreating } = useCreateTimeMachineEvent();
  const { mutate: updateEvent, isPending: isUpdating } = useUpdateTimeMachineEvent();
  const { mutate: uploadPoster, isPending: isUploading } = useUploadOriginalPoster();

  const [posterSource, setPosterSource] = useState<'ai' | 'original'>(event?.poster_source as 'ai' | 'original' || 'ai');
  const [originalPosterFile, setOriginalPosterFile] = useState<File | null>(null);
  const [originalPosterPreview, setOriginalPosterPreview] = useState<string | null>(event?.original_poster_url || null);
  const [posterMetadata, setPosterMetadata] = useState({
    year: event?.original_poster_metadata?.year || '',
    source: event?.original_poster_metadata?.source || '',
  });
  const [autoUpscale, setAutoUpscale] = useState(true);

  const form = useForm({
    resolver: zodResolver(eventFormSchema) as any,
    defaultValues: {
      event_title: event?.event_title || '',
      event_subtitle: event?.event_subtitle || '',
      artist_name: event?.artist_name || '',
      venue_name: event?.venue_name || '',
      venue_city: event?.venue_city || '',
      venue_country: event?.venue_country || 'Nederland',
      concert_date: event?.concert_date ? new Date(event.concert_date).toISOString().split('T')[0] : '',
      tour_name: event?.tour_name || '',
      historical_context: event?.historical_context || '',
      cultural_significance: event?.cultural_significance || '',
      story_content: event?.story_content || '',
      attendance_count: event?.attendance_count,
      ticket_price_original: event?.ticket_price_original,
      poster_style: event?.poster_style || '',
      typography_style: event?.typography_style || '',
      edition_size: event?.edition_size || 100,
      price_poster: event?.price_poster || 39.95,
      price_metal: event?.price_metal || 79.95,
      meta_title: event?.meta_title || '',
      meta_description: event?.meta_description || '',
      tags: event?.tags?.join(', ') || '',
      is_published: event?.is_published || false,
      is_featured: event?.is_featured || false,
    },
  });

  const handleOriginalPosterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOriginalPosterFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalPosterPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (values: EventFormValues) => {
    const tagsArray = values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    
    const eventData = {
      ...values,
      tags: tagsArray,
      poster_source: posterSource,
    };

    const handleSuccess = (eventId?: string) => {
      // If original poster is selected and file is uploaded, upload it
      if (posterSource === 'original' && originalPosterFile && eventId) {
        uploadPoster({
          eventId: eventId,
          imageFile: originalPosterFile,
          metadata: posterMetadata.year || posterMetadata.source ? posterMetadata : undefined,
          autoUpscale,
        }, {
          onSuccess: () => onSuccess?.(eventId),
          onError: () => onSuccess?.(eventId), // Still call success even if upload fails
        });
      } else {
        onSuccess?.(eventId);
      }
    };

    if (event?.id) {
      // For updates, if original poster file is selected, upload it first
      if (posterSource === 'original' && originalPosterFile) {
        uploadPoster({
          eventId: event.id,
          imageFile: originalPosterFile,
          metadata: posterMetadata.year || posterMetadata.source ? posterMetadata : undefined,
          autoUpscale,
        }, {
          onSuccess: () => {
            updateEvent({ ...eventData, id: event.id } as any, {
              onSuccess: () => onSuccess?.(),
            });
          },
        });
      } else {
        updateEvent({ ...eventData, id: event.id } as any, {
          onSuccess: () => onSuccess?.(),
        });
      }
    } else {
      createEvent(eventData as any, {
        onSuccess: (data: any) => {
          handleSuccess(data?.id);
        },
      });
    }
  };

  const isPending = isCreating || isUpdating || isUploading;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="event_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Titel *</FormLabel>
                <FormControl>
                  <Input placeholder="The Rolling Stones – Legendary Night" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="event_subtitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subtitel</FormLabel>
                <FormControl>
                  <Input placeholder="A Night That Changed Rock Forever" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="artist_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Artiest *</FormLabel>
                <FormControl>
                  <Input placeholder="The Rolling Stones" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tour_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tour Naam</FormLabel>
                <FormControl>
                  <Input placeholder="Voodoo Lounge Tour" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="venue_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Venue *</FormLabel>
                <FormControl>
                  <Input placeholder="Ahoy Rotterdam" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="venue_city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stad *</FormLabel>
                <FormControl>
                  <Input placeholder="Rotterdam" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="venue_country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Land</FormLabel>
                <FormControl>
                  <Input placeholder="Nederland" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="concert_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Concert Datum *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="attendance_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aantal Bezoekers</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="15000" 
                    {...field} 
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ticket_price_original"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Originele Ticketprijs (€)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="45.00" 
                    {...field} 
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="historical_context"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Historische Context</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Beschrijf de historische context van dit concert..."
                  rows={4}
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Wat maakte dit concert speciaal in zijn tijd?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="story_content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hoofdverhaal *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Vertel het verhaal van deze magische avond..."
                  rows={8}
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Markdown wordt ondersteund
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cultural_significance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Culturele Betekenis</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Wat was de impact van dit concert op de muziekgeschiedenis?"
                  rows={4}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-3">
          <FormField
            control={form.control}
            name="edition_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Editie Grootte</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price_poster"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prijs Fine Art (€)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    {...field} 
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price_metal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prijs Metal (€)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    {...field} 
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <Input placeholder="rock, Rolling Stones, jaren 90, Ahoy" {...field} />
              </FormControl>
              <FormDescription>
                Komma gescheiden
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Poster Source Selection */}
        <div className="space-y-4 border rounded-lg p-6 bg-muted/30">
          <Label className="text-base font-semibold">Poster Type</Label>
          <RadioGroup value={posterSource} onValueChange={(v) => setPosterSource(v as 'ai' | 'original')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ai" id="ai" />
              <Label htmlFor="ai" className="font-normal cursor-pointer">
                🤖 AI Gegenereerde Poster
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="original" id="original" />
              <Label htmlFor="original" className="font-normal cursor-pointer">
                📜 Originele Concertposter Uploaden
              </Label>
            </div>
          </RadioGroup>

          {posterSource === 'original' && (
            <div className="space-y-4 mt-4 pt-4 border-t">
              <div>
                <Label htmlFor="poster-upload" className="mb-2 block">Upload Originele Poster</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="poster-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleOriginalPosterUpload}
                    className="flex-1"
                  />
                  {originalPosterPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setOriginalPosterFile(null);
                        setOriginalPosterPreview(null);
                      }}
                    >
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Max 10MB · JPG, PNG of WebP · Min 1500x2100px
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-2 pb-3 border-b">
                <Switch
                  id="autoUpscale"
                  checked={autoUpscale}
                  onCheckedChange={setAutoUpscale}
                />
                <Label htmlFor="autoUpscale" className="cursor-pointer font-normal">
                  🎨 Automatisch upscalen met AI indien nodig (aanbevolen)
                </Label>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                AI verhoogt de resolutie zonder de poster te veranderen. Duurt 10-20 seconden bij lage resolutie.
              </p>

              {originalPosterPreview && (
                <div className="relative aspect-[3/4] w-48 rounded-lg overflow-hidden border">
                  <img 
                    src={originalPosterPreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="poster-year" className="text-sm">Poster Jaar (optioneel)</Label>
                  <Input
                    id="poster-year"
                    placeholder="1975"
                    value={posterMetadata.year}
                    onChange={(e) => setPosterMetadata({...posterMetadata, year: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="poster-source" className="text-sm">Bron/Collectie (optioneel)</Label>
                  <Input
                    id="poster-source"
                    placeholder="Privé collectie"
                    value={posterMetadata.source}
                    onChange={(e) => setPosterMetadata({...posterMetadata, source: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-6">
          <FormField
            control={form.control}
            name="is_published"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3 space-y-0">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Gepubliceerd</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_featured"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3 space-y-0">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Featured</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-3 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuleren
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {event ? 'Bijwerken' : 'Aanmaken'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
