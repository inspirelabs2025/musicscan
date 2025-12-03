import { Card, CardContent } from '@/components/ui/card';

export interface PopupTemplate {
  id: string;
  emoji: string;
  name: string;
  description: string;
  popup_type: string;
  trigger_type: 'time_on_page' | 'scroll_depth' | 'exit_intent' | 'page_visit';
  trigger_value: number | null;
  suggested_pages: string[];
  display_frequency: 'once_per_session' | 'once_per_day' | 'once_ever' | 'always';
}

export const POPUP_TEMPLATES: PopupTemplate[] = [
  {
    id: 'news-to-history',
    emoji: '📰→🕐',
    name: 'Nieuws → History',
    description: 'Leid nieuws lezers naar muziekgeschiedenis',
    popup_type: 'contextual_redirect',
    trigger_type: 'scroll_depth',
    trigger_value: 40,
    suggested_pages: ['/nieuws'],
    display_frequency: 'once_per_day',
  },
  {
    id: 'artist-to-quiz',
    emoji: '🎤→🎯',
    name: 'Artist → Quiz',
    description: 'Test kennis na artiest pagina',
    popup_type: 'quiz_prompt',
    trigger_type: 'time_on_page',
    trigger_value: 30,
    suggested_pages: ['/artists'],
    display_frequency: 'once_per_session',
  },
  {
    id: 'country-quiz-nl',
    emoji: '🇳🇱→🎮',
    name: 'NL Quiz',
    description: 'Nederlandse muziek quiz prompt',
    popup_type: 'quiz_prompt',
    trigger_type: 'time_on_page',
    trigger_value: 45,
    suggested_pages: ['/nederland'],
    display_frequency: 'once_per_session',
  },
  {
    id: 'country-quiz-fr',
    emoji: '🇫🇷→🎮',
    name: 'FR Quiz',
    description: 'Franse muziek quiz prompt',
    popup_type: 'quiz_prompt',
    trigger_type: 'time_on_page',
    trigger_value: 45,
    suggested_pages: ['/frankrijk'],
    display_frequency: 'once_per_session',
  },
  {
    id: 'dance-quiz',
    emoji: '🎧→🎮',
    name: 'Dance Quiz',
    description: 'Dance/House quiz prompt',
    popup_type: 'quiz_prompt',
    trigger_type: 'time_on_page',
    trigger_value: 45,
    suggested_pages: ['/dance-house'],
    display_frequency: 'once_per_session',
  },
  {
    id: 'newsletter-signup',
    emoji: '📬',
    name: 'Newsletter',
    description: 'E-mail signup popup',
    popup_type: 'newsletter',
    trigger_type: 'scroll_depth',
    trigger_value: 60,
    suggested_pages: [],
    display_frequency: 'once_per_day',
  },
  {
    id: 'exit-intent-shop',
    emoji: '🛒→💸',
    name: 'Exit Intent',
    description: 'Shop promo bij verlaten',
    popup_type: 'promo',
    trigger_type: 'exit_intent',
    trigger_value: null,
    suggested_pages: ['/shop', '/product'],
    display_frequency: 'once_per_session',
  },
  {
    id: 'gamification',
    emoji: '🏆',
    name: 'Gamification',
    description: 'Motivatie en badges',
    popup_type: 'gamification',
    trigger_type: 'time_on_page',
    trigger_value: 20,
    suggested_pages: ['/quizzen'],
    display_frequency: 'once_per_day',
  },
];

interface PopupTemplateGalleryProps {
  onSelectTemplate: (template: PopupTemplate) => void;
}

export function PopupTemplateGallery({ onSelectTemplate }: PopupTemplateGalleryProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-medium mb-3">🚀 Snel Popup Toevoegen</h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {POPUP_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className="flex flex-col items-center p-2 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-colors text-center"
            >
              <span className="text-2xl mb-1">{template.emoji}</span>
              <span className="text-xs text-muted-foreground truncate w-full">{template.name}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
