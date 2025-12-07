import { Helmet } from 'react-helmet';
import { Rss, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const SUPABASE_URL = 'https://ssxbpyqnjfiyubsuonar.supabase.co';

const feeds = [
  {
    title: 'Plaat Verhalen RSS',
    description: 'De nieuwste album verhalen en recensies van MusicScan',
    url: `${SUPABASE_URL}/functions/v1/generate-content-rss?type=blog_posts&limit=50`,
    type: 'blog_posts',
  },
];

const Feeds = () => {
  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL gekopieerd naar klembord');
  };

  return (
    <>
      <Helmet>
        <title>RSS Feeds | MusicScan</title>
        <meta name="description" content="RSS feeds van MusicScan voor automatische content updates" />
      </Helmet>

      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Rss className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4">RSS Feeds</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Gebruik deze RSS feeds om automatisch op de hoogte te blijven van nieuwe content of om te integreren met social media tools zoals Metricool.
            </p>
          </div>

          <div className="space-y-6">
            {feeds.map((feed) => (
              <Card key={feed.type}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Rss className="w-5 h-5 text-primary" />
                    {feed.title}
                  </CardTitle>
                  <CardDescription>{feed.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <div className="bg-muted rounded-lg p-3 font-mono text-sm break-all">
                      {feed.url}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => copyToClipboard(feed.url)}
                        className="flex-1"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Kopieer URL
                      </Button>
                      <Button 
                        variant="default"
                        onClick={() => window.open(feed.url, '_blank')}
                        className="flex-1"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Feed
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 p-6 bg-muted/50 rounded-lg">
            <h2 className="font-semibold mb-2">Hoe gebruik je deze feeds?</h2>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• <strong>RSS Reader:</strong> Voeg de URL toe aan je favoriete RSS reader (Feedly, Inoreader, etc.)</li>
              <li>• <strong>Metricool:</strong> Ga naar Content → Autolists → Create Autolist → RSS Feed</li>
              <li>• <strong>Zapier/Make:</strong> Gebruik de RSS trigger met deze feed URL</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default Feeds;
