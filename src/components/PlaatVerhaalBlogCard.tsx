import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Eye, Edit, Share2, FileText, Music, Disc3 } from 'lucide-react';
import { usePlaatVerhaalGenerator } from '@/hooks/usePlaatVerhaalGenerator';
import { SpotifyAlbumLink } from '@/components/SpotifyAlbumLink';

interface BlogPost {
  id: string;
  album_id: string;
  album_type: 'cd' | 'vinyl';
  yaml_frontmatter: Record<string, any>;
  markdown_content: string;
  social_post?: string;
  product_card?: Record<string, any>;
  slug: string;
  is_published: boolean;
  views_count: number;
  created_at: string;
  published_at?: string;
  album_cover_url?: string;
}

interface PlaatVerhaalBlogCardProps {
  blog: BlogPost;
  onEdit?: (blog: BlogPost) => void;
  onView?: (blog: BlogPost) => void;
  viewMode?: 'grid' | 'list';
  searchTerm?: string;
}

export const PlaatVerhaalBlogCard: React.FC<PlaatVerhaalBlogCardProps> = ({
  blog,
  onEdit,
  onView,
  viewMode = 'grid',
  searchTerm = ''
}) => {
  const { publishBlog } = usePlaatVerhaalGenerator();
  
  const frontmatter = blog.yaml_frontmatter || {};
  const title = frontmatter.title || 'Untitled';
  const artist = frontmatter.artist || 'Unknown Artist';
  const album = frontmatter.album || 'Unknown Album';
  const year = frontmatter.year || '';
  const genre = frontmatter.genre || '';
  const readingTime = frontmatter.reading_time || 5;

  // Highlight search terms
  const highlightText = (text: string) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
  };

  const handlePublish = async () => {
    await publishBlog(blog.id);
  };

  const handleShare = async () => {
    if (navigator.share && blog.is_published) {
      try {
        await navigator.share({
          title: title,
          text: `Check out this article about ${artist} - ${album}`,
          url: `/plaat-verhaal/${blog.slug}`
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(`${window.location.origin}/plaat-verhaal/${blog.slug}`);
      }
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/plaat-verhaal/${blog.slug}`);
    }
  };

  // Album Cover Component with Fallback
  const AlbumCover = ({ size }: { size: 'large' | 'small' }) => {
    const [imageError, setImageError] = React.useState(false);
    const [imageLoaded, setImageLoaded] = React.useState(false);
    
    const sizeClasses = size === 'large' ? 'w-full h-full' : 'w-20 h-20';
    const iconSize = size === 'large' ? 'w-16 h-16' : 'w-8 h-8';
    
    const FallbackIcon = blog.album_type === 'vinyl' ? Disc3 : Music;
    
    if (!blog.album_cover_url || imageError) {
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center ${
          blog.album_type === 'vinyl' ? 'rounded-full' : 'rounded-lg'
        } ${size === 'large' ? 'group-hover:scale-105 transition-transform duration-300' : ''}`}>
          <FallbackIcon className={`${iconSize} text-muted-foreground/60`} />
        </div>
      );
    }

    return (
      <div className={`${sizeClasses} relative overflow-hidden ${
        blog.album_type === 'vinyl' ? 'rounded-full' : 'rounded-lg'
      }`}>
        {!imageLoaded && (
          <div className={`absolute inset-0 bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center`}>
            <FallbackIcon className={`${iconSize} text-muted-foreground/60 animate-pulse`} />
          </div>
        )}
        <img
          src={blog.album_cover_url}
          alt={`${artist} - ${album} album cover`}
          className={`${sizeClasses} object-cover ${
            size === 'large' ? 'group-hover:scale-105 transition-all duration-300' : ''
          } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          loading="lazy"
        />
      </div>
    );
  };

  if (viewMode === 'list') {
    return (
      <Card className="group hover:shadow-lg transition-all duration-300 hover:shadow-primary/10 flex overflow-hidden">
        {/* Album Cover - List View */}
        <div className="w-20 h-20 flex-shrink-0 m-4">
          <AlbumCover size="small" />
        </div>
        
        {/* Content */}
        <div className="flex-1 flex flex-col">
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base font-semibold line-clamp-1 mb-1">
                  {searchTerm ? (
                    <span dangerouslySetInnerHTML={{ __html: highlightText(title) }} />
                  ) : (
                    title
                  )}
                </CardTitle>
                <div className="text-sm text-muted-foreground font-medium">
                  {searchTerm ? (
                    <span dangerouslySetInnerHTML={{ __html: highlightText(`${artist} - ${album}`) }} />
                  ) : (
                    `${artist} - ${album}`
                  )}
                </div>
                {year && <div className="text-xs text-muted-foreground mt-1">{year}</div>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Badge variant={blog.is_published ? "default" : "secondary"} className="text-xs">
                  {blog.is_published ? "Live" : "Draft"}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0 pb-4 flex-1 flex flex-col justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {readingTime}m
              </span>
              {blog.is_published && (
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {blog.views_count || 0}
                </span>
              )}
              {genre && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {genre}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <SpotifyAlbumLink 
                artist={artist} 
                album={album} 
                audioLinks={frontmatter?.audio_links}
                size="sm"
                className="h-8 text-xs"
              />
              {onView && (
                <Button variant="outline" size="sm" onClick={() => onView(blog)} className="h-8 text-xs">
                  <Eye className="w-3 h-3 mr-1" />
                  Bekijk
                </Button>
              )}
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(blog)} className="h-8 text-xs">
                  <Edit className="w-3 h-3 mr-1" />
                  Bewerk
                </Button>
              )}
              {!blog.is_published && (
                <Button size="sm" onClick={handlePublish} className="h-8 text-xs">
                  Publiceer
                </Button>
              )}
              {blog.is_published && (
                <Button variant="outline" size="sm" onClick={handleShare} className="h-8 px-2">
                  <Share2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  // Grid View
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 hover:shadow-primary/20 hover:-translate-y-1 overflow-hidden">
      {/* Album Cover - Grid View */}
      <div className="relative">
        <AspectRatio ratio={1} className="bg-gradient-to-br from-muted/30 to-muted/60">
          <AlbumCover size="large" />
        </AspectRatio>
        
        {/* Overlay Badges */}
        <div className="absolute top-3 right-3 flex gap-2">
          <Badge variant={blog.is_published ? "default" : "secondary"} className="text-xs shadow-sm">
            {blog.is_published ? "Live" : "Draft"}
          </Badge>
          <Badge 
            variant="outline" 
            className={`text-xs shadow-sm backdrop-blur-sm ${
              blog.album_type === 'vinyl' 
                ? 'bg-purple-500/10 border-purple-500/30' 
                : 'bg-blue-500/10 border-blue-500/30'
            }`}
          >
            {blog.album_type.toUpperCase()}
          </Badge>
        </div>

        {/* Gradient Overlay for Better Text Contrast */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Content */}
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold line-clamp-2 mb-2 leading-tight">
          {searchTerm ? (
            <span dangerouslySetInnerHTML={{ __html: highlightText(title) }} />
          ) : (
            title
          )}
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          <div className="font-medium line-clamp-1">
            {searchTerm ? (
              <span dangerouslySetInnerHTML={{ __html: highlightText(`${artist} - ${album}`) }} />
            ) : (
              `${artist} - ${album}`
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {year && <span className="text-xs">{year}</span>}
            {genre && (
              <Badge variant="outline" className="text-xs">
                {genre}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {readingTime} min
            </span>
            {blog.is_published && (
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {blog.views_count || 0}
              </span>
            )}
          </div>
          <div className="text-xs">
            {blog.is_published 
              ? new Date(blog.published_at!).toLocaleDateString('nl-NL')
              : new Date(blog.created_at).toLocaleDateString('nl-NL')
            }
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <SpotifyAlbumLink 
              artist={artist} 
              album={album} 
              audioLinks={frontmatter?.audio_links}
              className="flex-1"
            />
            {blog.is_published && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(blog)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                Bekijk
              </Button>
            )}
            
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(blog)}
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-2" />
                Bewerk
              </Button>
            )}
            
            {!blog.is_published && (
              <Button
                size="sm"
                onClick={handlePublish}
                className="flex-1"
              >
                Publiceer
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};