import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlaatVerhaalBlogCard } from '@/components/PlaatVerhaalBlogCard';
import { usePlaatVerhaalGenerator } from '@/hooks/usePlaatVerhaalGenerator';
import { FileText, Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

export const VerhaalTab: React.FC = () => {
  const navigate = useNavigate();
  const { getUserBlogs } = usePlaatVerhaalGenerator();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBlogs = async () => {
    setLoading(true);
    try {
      const allBlogs = await getUserBlogs();
      setBlogs(allBlogs);
    } catch (error) {
      console.error('Error loading blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  const handleView = (blog: BlogPost) => {
    if (blog.is_published) {
      navigate(`/plaat-verhaal/${blog.slug}`);
    } else {
      // For concepts, we could open an edit modal or preview
      // For now, let's navigate to the same URL but show it as preview
      navigate(`/plaat-verhaal/${blog.slug}`);
    }
  };

  const handleEdit = (blog: BlogPost) => {
    // TODO: Implement edit functionality
    console.log('Edit blog:', blog);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2">📚 Plaat & Verhaal</h2>
          <p className="text-muted-foreground">
            Overzicht van alle gegenereerde verhalen over je albums
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadBlogs}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Vernieuwen
          </Button>
        </div>
      </div>

      {/* Blogs Grid */}
      {blogs.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <FileText className="w-12 h-12 text-muted-foreground/50" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Nog geen verhalen</h3>
              <p className="text-muted-foreground mb-4">
                Er zijn nog geen Plaat & Verhaal artikelen gegenereerd. 
                Genereer verhalen door op de "Plaat & Verhaal" knop te klikken bij je albums.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <PlaatVerhaalBlogCard
              key={blog.id}
              blog={blog}
              onView={handleView}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Empty State for Specific Categories */}
      {blogs.length > 0 && (
        <Card className="p-6 bg-muted/50">
          <div className="text-center">
            <h4 className="font-medium text-muted-foreground mb-2">
              💡 Tip: Genereer meer verhalen
            </h4>
            <p className="text-sm text-muted-foreground">
              Je kunt nieuwe Plaat & Verhaal artikelen genereren door naar je collectie te gaan 
              en op de "Plaat & Verhaal" knop te klikken bij albums.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};