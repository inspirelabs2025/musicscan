import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Share2, FileText } from 'lucide-react';
import { usePlaatVerhaalGenerator } from '@/hooks/usePlaatVerhaalGenerator';

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
}

interface PlaatVerhaalBlogCardProps {
  blog: BlogPost;
  onEdit?: (blog: BlogPost) => void;
  onView?: (blog: BlogPost) => void;
}

export const PlaatVerhaalBlogCard: React.FC<PlaatVerhaalBlogCardProps> = ({
  blog,
  onEdit,
  onView
}) => {
  const { publishBlog } = usePlaatVerhaalGenerator();
  
  const frontmatter = blog.yaml_frontmatter || {};
  const title = frontmatter.title || 'Untitled';
  const artist = frontmatter.artist || 'Unknown Artist';
  const album = frontmatter.album || 'Unknown Album';
  const year = frontmatter.year || '';
  const genre = frontmatter.genre || '';
  const readingTime = frontmatter.reading_time || 5;

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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-2 mb-2">
              {title}
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              <div className="font-medium">{artist} - {album}</div>
              {year && <div>{year}</div>}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Badge variant={blog.is_published ? "default" : "secondary"}>
              {blog.is_published ? "Gepubliceerd" : "Concept"}
            </Badge>
            <Badge variant="outline" className="uppercase text-xs">
              {blog.album_type}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {readingTime} min lezen
            </span>
            {blog.is_published && (
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {blog.views_count || 0} views
              </span>
            )}
            {genre && (
              <Badge variant="outline" className="text-xs">
                {genre}
              </Badge>
            )}
          </div>
          <div className="text-xs">
            {blog.is_published 
              ? `Gepubliceerd ${new Date(blog.published_at!).toLocaleDateString('nl-NL')}`
              : `Gemaakt ${new Date(blog.created_at).toLocaleDateString('nl-NL')}`
            }
          </div>
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
      </CardContent>
    </Card>
  );
};