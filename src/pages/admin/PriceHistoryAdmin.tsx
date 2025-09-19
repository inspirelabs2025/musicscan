import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TestPriceCollection } from '@/components/TestPriceCollection';
import { BlogPriceDataBackfill } from '@/components/admin/BlogPriceDataBackfill';
import { TrendingUp } from 'lucide-react';

export default function PriceHistoryAdmin() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <TrendingUp className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Prijshistorie Beheer</h1>
            <p className="text-muted-foreground">
              Beheer en verzamel prijsdata voor albums en blog posts
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TestPriceCollection />
          <BlogPriceDataBackfill />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Status & Informatie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium text-primary">Cron Job</h4>
                <p className="text-muted-foreground">Dagelijks om 06:00</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium text-primary">Rate Limiting</h4>
                <p className="text-muted-foreground">2 sec tussen requests</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium text-primary">Backups</h4>
                <p className="text-muted-foreground">24h duplicate check</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Gebruik:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Test Collection:</strong> Handmatige trigger voor 20 recente albums</li>
                <li>• <strong>Blog Backfill:</strong> Verzamel data voor albums die in blog posts staan</li>
                <li>• <strong>Auto Collection:</strong> Dagelijkse automatische verzameling via cron</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}