import { AiNudgeVariant } from '@/types/aiNudge';

export const aiNudgeVariants: Record<string, AiNudgeVariant> = {
  nudge: {
    text: 'Deel je gedachten met ons om MusicScan nog beter te maken! 🤔',
    linkText: 'Deel feedback',
    linkHref: 'https://forms.gle/XXXXYYYYZZZZAAAAB',
  },
  chat_encouragement: {
    text: 'Er zijn pas 0 chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen! 💬',
    linkText: 'Open chat',
    linkHref: '/chat',
  },
  // Add more variants as needed
};
