import { TimeMachineEvent } from '@/hooks/useTimeMachineEvents';
import { Card, CardContent } from '@/components/ui/card';
import { Quote } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface StoryContentProps {
  event: TimeMachineEvent;
}

export function StoryContent({ event }: StoryContentProps) {
  return (
    <div className="space-y-8">
      {/* Historical Context */}
      {event.historical_context && (
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">📜</span> Historische Context
            </h2>
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{event.historical_context}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Story */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">Het Verhaal van die Nacht</h2>
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown>{event.story_content}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* Cultural Significance */}
      {event.cultural_significance && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">✨</span> Culturele Betekenis
            </h2>
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{event.cultural_significance}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fan Quotes */}
      {event.fan_quotes && Array.isArray(event.fan_quotes) && event.fan_quotes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {event.fan_quotes.map((quote: any, index: number) => (
            <Card key={index} className="bg-secondary/20">
              <CardContent className="pt-6">
                <Quote className="w-8 h-8 text-primary mb-3" />
                <p className="text-foreground/90 italic mb-3">"{quote.quote}"</p>
                <p className="text-sm text-muted-foreground">
                  — {quote.author}
                  {quote.was_present && <span className="ml-2 text-primary">✓ Was erbij</span>}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
