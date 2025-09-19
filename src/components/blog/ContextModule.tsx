import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Globe, Music, Sparkles, Calendar, TrendingUp, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface ContextData {
  historical_events?: {
    title: string;
    description: string;
    date?: string;
  }[];
  music_scene_context?: {
    title: string;
    description: string;
    artists?: string[];
  }[];
  cultural_context?: {
    title: string;
    description: string;
    impact?: string;
  }[];
}

interface ContextModuleProps {
  blogPostId: string;
  albumYear?: number;
  albumTitle: string;
  albumArtist: string;
}

export function ContextModule({ blogPostId, albumYear, albumTitle, albumArtist }: ContextModuleProps) {
  const [contextData, setContextData] = useState<ContextData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'historical' | 'music' | 'cultural'>('historical');
  const [error, setError] = useState<string | null>(null);

  const loadContext = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_context')
        .select('historical_events, music_scene_context, cultural_context, cached_until')
        .eq('blog_post_id', blogPostId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        // Check if data is still valid
        const cachedUntil = new Date(data.cached_until);
        const now = new Date();
        
        if (now < cachedUntil) {
          setContextData({
            historical_events: Array.isArray(data.historical_events) ? data.historical_events as any[] : [],
            music_scene_context: Array.isArray(data.music_scene_context) ? data.music_scene_context as any[] : [],
            cultural_context: Array.isArray(data.cultural_context) ? data.cultural_context as any[] : [],
          });
        } else {
          // Data expired, will need to regenerate
          setContextData(null);
        }
      }
    } catch (error) {
      console.error('Error loading context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateContext = async (forceRegenerate = false) => {
    if (!albumYear) {
      console.warn('No album year provided for context generation');
      setError('Geen jaartal beschikbaar voor context generatie');
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-context', {
        body: {
          blogPostId,
          albumYear,
          albumTitle,
          albumArtist,
          force: forceRegenerate,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Fout bij het genereren van context');
      }

      if (data?.success) {
        setContextData(data.context);
        // Reload fresh data from database
        await loadContext();
      } else {
        throw new Error(data?.error || 'Onbekende fout bij context generatie');
      }
    } catch (error) {
      console.error('Error generating context:', error);
      setError(error instanceof Error ? error.message : 'Er is een fout opgetreden bij het genereren van de context');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    loadContext();
  }, [blogPostId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={20} />
            De Context laden...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!contextData && !isGenerating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={20} />
            De Context
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Clock size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground mb-4">
            Ontdek wat er gebeurde in {albumYear || 'het jaar'} waarin dit album uitkwam.
          </p>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
              {error}
            </div>
          )}
          <Button onClick={() => generateContext()} disabled={!albumYear}>
            <Sparkles size={16} className="mr-2" />
            Context Genereren
          </Button>
          {!albumYear && (
            <p className="text-xs text-muted-foreground mt-2">
              Geen jaartal beschikbaar voor dit album.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (isGenerating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles size={20} className="animate-spin" />
            Context genereren...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Dit kan een paar seconden duren terwijl we historische informatie ophalen...
          </p>
        </CardContent>
      </Card>
    );
  }

  const tabs = [
    { id: 'historical', label: 'Geschiedenis', icon: Globe, data: contextData?.historical_events },
    { id: 'music', label: 'Muziekscene', icon: Music, data: contextData?.music_scene_context },
    { id: 'cultural', label: 'Cultuur', icon: Users, data: contextData?.cultural_context },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock size={20} />
          De Context - {albumYear}
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const hasData = tab.data && tab.data.length > 0;
            
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab(tab.id as any)}
                disabled={!hasData}
                className="flex items-center gap-2"
              >
                <Icon size={14} />
                {tab.label}
                {hasData && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {tab.data.length}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </CardHeader>
      
      <CardContent>
        {activeTabData?.data && activeTabData.data.length > 0 ? (
          <div className="space-y-4">
            {activeTabData.data.map((item, index) => (
              <div key={index} className="border-l-2 border-primary/20 pl-4 pb-4">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.description}
                    </p>
                    
                    {/* Additional context based on type */}
                    {activeTab === 'historical' && (item as any).date && (
                      <Badge variant="outline" className="text-xs">
                        <Calendar size={12} className="mr-1" />
                        {(item as any).date}
                      </Badge>
                    )}
                    
                    {activeTab === 'music' && (item as any).artists && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(item as any).artists.map((artist: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {artist}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {activeTab === 'cultural' && (item as any).impact && (
                      <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                        <div className="flex items-center gap-1 mb-1">
                          <TrendingUp size={12} />
                          <span className="font-medium">Impact:</span>
                        </div>
                        <p>{(item as any).impact}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <activeTabData.icon size={48} className="mx-auto mb-2 opacity-50" />
            <p>Geen {activeTabData?.label.toLowerCase()} informatie beschikbaar.</p>
          </div>
        )}
        
        {/* Regenerate buttons */}
        <div className="flex justify-center gap-2 pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => generateContext()}
            disabled={isGenerating}
          >
            <Sparkles size={14} className="mr-1" />
            Context Vernieuwen
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateContext(true)}
            disabled={isGenerating}
          >
            <Clock size={14} className="mr-1" />
            Forceer Vernieuwen
          </Button>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}