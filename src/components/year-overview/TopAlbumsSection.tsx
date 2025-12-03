import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Disc3 } from 'lucide-react';
import { TopAlbum } from '@/hooks/useYearOverview';

interface TopAlbumsSectionProps {
  albums: TopAlbum[];
}

export const TopAlbumsSection: React.FC<TopAlbumsSectionProps> = ({ albums }) => {
  if (!albums || albums.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Disc3 className="h-5 w-5 text-primary" />
          💿 Albums van het Jaar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {albums.slice(0, 10).map((album, index) => (
            <div 
              key={index}
              className="group cursor-pointer"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2 relative">
                {album.image_url ? (
                  <img 
                    src={album.image_url} 
                    alt={`${album.artist} - ${album.title}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <Disc3 className="h-12 w-12 text-primary/50" />
                  </div>
                )}
                <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
              </div>
              <h3 className="font-medium text-sm truncate">{album.title}</h3>
              <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
              {album.label && (
                <p className="text-xs text-muted-foreground truncate">📀 {album.label}</p>
              )}
              {album.certifications && album.certifications.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {album.certifications.slice(0, 2).map((cert, i) => (
                    <span key={i} className="text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded">
                      {cert}
                    </span>
                  ))}
                </div>
              )}
              {album.weeks_on_chart && (
                <p className="text-xs text-green-500 mt-1">📊 {album.weeks_on_chart} weken in chart</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
