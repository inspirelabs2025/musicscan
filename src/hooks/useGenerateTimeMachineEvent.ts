import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const FUNCTIONS_BASE = 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4';

interface GeneratedEventData {
  event_title: string;
  event_subtitle?: string;
  artist_name: string;
  venue_name: string;
  venue_city: string;
  venue_country: string;
  concert_date: string;
  tour_name?: string;
  historical_context?: string;
  cultural_significance?: string;
  story_content: string;
  attendance_count?: number;
  ticket_price_original?: number;
  poster_style?: string;
  tags?: string[];
  is_published?: boolean;
  is_featured?: boolean;
  enable_metal_print?: boolean;
  enable_standard_print?: boolean;
  metal_price?: number;
  standard_price?: number;
}

export const useGenerateTimeMachineEvent = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (prompt: string): Promise<GeneratedEventData> => {
      const res = await fetch(`${FUNCTIONS_BASE}/generate-time-machine-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({ prompt }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('Te veel verzoeken. Probeer het over een minuut opnieuw.');
        }
        if (res.status === 402) {
          throw new Error('Lovable AI credits opgebruikt. Voeg credits toe aan je workspace.');
        }
        throw new Error(json.error || 'Fout bij genereren van event data');
      }

      if (!json.success || !json.eventData) {
        throw new Error('Ongeldige response van AI');
      }

      return json.eventData;
    },
    onSuccess: () => {
      toast({
        title: "✨ Event data gegenereerd",
        description: "De AI heeft het formulier ingevuld. Bekijk en pas aan indien nodig.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fout bij genereren",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
