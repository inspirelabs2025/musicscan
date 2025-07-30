import React from 'react';
import { useDirectScans } from '@/hooks/useDirectScans';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Music, Disc, Brain } from 'lucide-react';

const UserScans = () => {
  const { user } = useAuth();
  const { data: scans, isLoading, error } = useDirectScans();

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'cd': return <Disc className="h-4 w-4" />;
      case 'vinyl': return <Music className="h-4 w-4" />;
      case 'ai': return <Brain className="h-4 w-4" />;
      default: return <Music className="h-4 w-4" />;
    }
  };

  const getMediaColor = (mediaType: string) => {
    switch (mediaType) {
      case 'cd': return 'bg-blue-100 text-blue-800';
      case 'vinyl': return 'bg-purple-100 text-purple-800';
      case 'ai': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <p className="text-destructive">Error loading scans: {error.message}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {user ? `${user.email}'s Scans` : 'All Scans (Demo Mode)'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {scans?.length || 0} total scans found
          </p>
        </div>

        <div className="grid gap-4">
          {scans?.map((scan) => (
            <Card key={`${scan.media_type}-${scan.id}`} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getMediaIcon(scan.media_type)}
                    {scan.artist} - {scan.title}
                  </CardTitle>
                  <Badge className={getMediaColor(scan.media_type)}>
                    {scan.media_type.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {(scan.front_image || scan.catalog_image) && (
                      <img 
                        src={scan.front_image || scan.catalog_image} 
                        alt="Album cover"
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(scan.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ID: {scan.id}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {scans?.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                {user ? 'No scans found for your account.' : 'No scans found in the database.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserScans;