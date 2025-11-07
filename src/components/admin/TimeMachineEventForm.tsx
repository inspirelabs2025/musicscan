import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Loader2 } from 'lucide-react';

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
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TimeMachineEventForm({ event, onSuccess, onCancel }: TimeMachineEventFormProps) {
  const { mutate: createEvent, isPending: isCreating } = useCreateTimeMachineEvent();
  const { mutate: updateEvent, isPending: isUpdating } = useUpdateTimeMachineEvent();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
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
      price_poster: event?.price_poster || 149.00,
      price_metal: event?.price_metal || 299.00,
      meta_title: event?.meta_title || '',
      meta_description: event?.meta_description || '',
      tags: event?.tags?.join(', ') || '',
      is_published: event?.is_published || false,
      is_featured: event?.is_featured || false,
    },
  });

  const onSubmit = (values: EventFormValues) => {
    const tagsArray = values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    
    const eventData = {
      ...values,
      tags: tagsArray,
    };

    if (event?.id) {
      updateEvent({ ...eventData, id: event.id } as any, {
        onSuccess: () => onSuccess?.(),
      });
    } else {
      createEvent(eventData as any, {
        onSuccess: () => onSuccess?.(),
      });
    }
  };

  const isPending = isCreating || isUpdating;

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
