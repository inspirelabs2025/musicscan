import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface StructuredStorySectionProps {
  storyMarkdown: string;
  albumInfo?: {
    artist: string;
    title: string;
    label?: string;
    year?: number;
    genre?: string;
    country?: string;
    catalog_number?: string;
  };
}

export function StructuredStorySection({ storyMarkdown, albumInfo }: StructuredStorySectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold">AI Verhaal Analyse</h2>
        <Badge variant="secondary" className="ml-auto">
          <Sparkles className="w-3 h-3 mr-1" />
          Gestructureerd AI Verhaal
        </Badge>
      </div>

      {albumInfo && (
        <Card className="p-4 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="font-medium">{albumInfo.artist} - {albumInfo.title}</span>
            {albumInfo.year && <span>• {albumInfo.year}</span>}
            {albumInfo.label && <span>• {albumInfo.label}</span>}
            {albumInfo.genre && <span>• {albumInfo.genre}</span>}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
            components={{
              h2: ({ children }) => (
                <h2 className="text-lg font-semibold mb-3 mt-6 first:mt-0 text-foreground border-b border-border pb-2">
                  {children}
                </h2>
              ),
              p: ({ children }) => (
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="text-muted-foreground space-y-1 mb-4">
                  {children}
                </ul>
              ),
              li: ({ children }) => (
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>{children}</span>
                </li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic text-muted-foreground">{children}</em>
              )
            }}
          >
            {storyMarkdown}
          </ReactMarkdown>
        </div>
      </Card>
    </div>
  );
}