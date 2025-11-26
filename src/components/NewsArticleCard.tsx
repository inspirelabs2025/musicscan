import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, FileText, Newspaper } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface NewsArticle {
  id: string;
  slug: string;
  yaml_frontmatter: {
    title?: string;
    category?: string;
    source?: string;
    description?: string;
  };
  album_cover_url?: string;
  is_published: boolean;
  views_count: number;
  created_at: string;
  published_at?: string;
}

interface NewsArticleCardProps {
  article: NewsArticle;
  onEdit?: (article: NewsArticle) => void;
  onDelete?: (id: string) => void;
  onTogglePublish?: (id: string, currentStatus: boolean) => void;
}

export const NewsArticleCard: React.FC<NewsArticleCardProps> = ({
  article,
  onEdit,
  onDelete,
  onTogglePublish
}) => {
  const frontmatter = article.yaml_frontmatter || {};
  const title = frontmatter.title || 'Untitled';
  const category = frontmatter.category || 'Nieuws';
  const source = frontmatter.source || '';
  const description = frontmatter.description || '';

  const handleView = () => {
    window.open(`/nieuws/${article.slug}`, '_blank');
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* Article Image or Icon */}
        <div className="w-24 h-24 flex-shrink-0 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden">
          {article.album_cover_url ? (
            <img
              src={article.album_cover_url}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <Newspaper className="w-10 h-10 text-primary/40" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <CardHeader className="p-0 pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base font-semibold line-clamp-2 leading-tight">
                {title}
              </CardTitle>
              <Badge variant={article.is_published ? "default" : "secondary"} className="text-xs flex-shrink-0">
                {article.is_published ? "Live" : "Concept"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Metadata */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Badge variant="outline" className="text-xs">
                {category}
              </Badge>
              {source && (
                <>
                  <span>•</span>
                  <span>{source}</span>
                </>
              )}
              <span>•</span>
              <span>
                {format(new Date(article.created_at), "d MMM yyyy", { locale: nl })}
              </span>
              {article.is_published && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {article.views_count || 0}
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {description}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleView}
                className="h-8 text-xs"
              >
                <Eye className="w-3 h-3 mr-1" />
                Bekijk
              </Button>
              
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(article)}
                  className="h-8 text-xs"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Bewerk
                </Button>
              )}

              {onTogglePublish && (
                <Button
                  variant={article.is_published ? "outline" : "default"}
                  size="sm"
                  onClick={() => onTogglePublish(article.id, article.is_published)}
                  className="h-8 text-xs"
                >
                  {article.is_published ? "Depubliceer" : "Publiceer"}
                </Button>
              )}

              {onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Weet je zeker dat je "${title}" wilt verwijderen?`)) {
                      onDelete(article.id);
                    }
                  }}
                  className="h-8 px-2 ml-auto"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
};
