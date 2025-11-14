import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EmailTemplatePreviewProps {
  html: string;
  isLoading?: boolean;
}

export const EmailTemplatePreview = ({ html, isLoading }: EmailTemplatePreviewProps) => {
  return (
    <Card className="h-[600px] overflow-hidden">
      <div className="bg-muted/50 p-3 border-b">
        <p className="text-sm font-medium">Email Preview</p>
      </div>
      <ScrollArea className="h-[calc(600px-52px)]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div 
            className="p-4"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </ScrollArea>
    </Card>
  );
};
