import React from 'react';
import { Disc3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MediaTypeSelectorProps {
  onSelectMediaType: (type: 'vinyl' | 'cd') => void;
}

export const MediaTypeSelector = React.memo(({ onSelectMediaType }: MediaTypeSelectorProps) => {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center gap-2 justify-center">
            <Disc3 className="h-6 w-6" />
            Wat ga je scannen?
          </CardTitle>
          <CardDescription>
            Kies het type media dat je wilt scannen en waarderen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2"
              onClick={() => onSelectMediaType('vinyl')}
            >
              <Disc3 className="h-8 w-8" />
              <span className="font-medium">Vinyl</span>
              <span className="text-sm text-muted-foreground">LP / Single / EP</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2"
              onClick={() => onSelectMediaType('cd')}
            >
              <Disc3 className="h-8 w-8" />
              <span className="font-medium">CD</span>
              <span className="text-sm text-muted-foreground">Album / Single / EP</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

MediaTypeSelector.displayName = 'MediaTypeSelector';