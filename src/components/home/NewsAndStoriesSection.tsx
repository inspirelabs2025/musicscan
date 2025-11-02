import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePaginatedBlogs } from '@/hooks/usePaginatedBlogs';
import { useForumTopics } from '@/hooks/useForumTopics';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

export const NewsAndStoriesSection = () => {
  const [activeTab, setActiveTab] = useState('nieuws');
  
  const { blogs, isLoading: blogsLoading } = usePaginatedBlogs({ 
    albumType: activeTab === 'verhalen' ? 'vinyl' : undefined 
  });
  
  const { data: forumTopics, isLoading: forumLoading } = useForumTopics('recent');

  const renderNewsContent = () => {
    if (blogsLoading) {
      return (
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </Card>
          ))}
        </div>
      );
    }

    const displayBlogs = blogs.slice(0, 3);

    if (!displayBlogs || displayBlogs.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Geen artikelen beschikbaar</p>
          <p className="text-sm text-muted-foreground">Kom later terug voor nieuwe verhalen!</p>
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-3 gap-6">
        {displayBlogs.map((blog) => {
          const title = blog.yaml_frontmatter?.title || blog.yaml_frontmatter?.album || 'Muziekverhaal';
          const description = blog.yaml_frontmatter?.description || blog.yaml_frontmatter?.excerpt || '';
          
          return (
            <Link key={blog.id} to={`/news/${blog.slug}`}>
              <Card className="overflow-hidden hover:shadow-xl transition-all hover:scale-105 group h-full">
                {/* Cover Image */}
                <div className="aspect-video overflow-hidden bg-gradient-to-br from-vinyl-purple/20 to-vinyl-gold/20">
                  {blog.album_cover_url ? (
                    <img 
                      src={blog.album_cover_url} 
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      {activeTab === 'verhalen' ? '📖' : '📰'}
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {blog.album_type && (
                      <Badge variant="secondary" className="text-xs">
                        {blog.album_type}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(blog.created_at), { 
                        addSuffix: true, 
                        locale: nl 
                      })}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                  
                  {description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {description}
                    </p>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    );
  };

  const renderForumContent = () => {
    if (forumLoading) {
      return (
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-8 w-24" />
            </Card>
          ))}
        </div>
      );
    }

    if (!forumTopics || forumTopics.length === 0) {
      return <p className="text-center text-muted-foreground py-12">Geen discussies gevonden</p>;
    }

    return (
      <div className="grid md:grid-cols-3 gap-6">
        {forumTopics.slice(0, 3).map((topic) => (
          <Link key={topic.id} to={`/forum/${topic.id}`}>
            <Card className="p-6 hover:shadow-xl transition-all hover:scale-105 group h-full">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-vinyl-purple to-accent flex items-center justify-center text-white font-bold">
                    {topic.profiles?.first_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {topic.profiles?.first_name || 'Anoniem'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {topic.created_at && formatDistanceToNow(new Date(topic.created_at), { 
                        addSuffix: true, 
                        locale: nl 
                      })}
                    </p>
                  </div>
                </div>

                <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                  {topic.title}
                </h3>

                {topic.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {topic.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>💬 {topic.reply_count || 0} reacties</span>
                  {topic.view_count > 0 && <span>👁️ {topic.view_count}</span>}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">📰 Laatste Nieuws & Verhalen</h2>
          <p className="text-xl text-muted-foreground">
            Blijf op de hoogte van het laatste muzieknieuws en verhalen
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="nieuws">Nieuws</TabsTrigger>
            <TabsTrigger value="verhalen">Plaat Verhalen</TabsTrigger>
            <TabsTrigger value="forum">Forum</TabsTrigger>
          </TabsList>

          <TabsContent value="nieuws">
            {renderNewsContent()}
          </TabsContent>

          <TabsContent value="verhalen">
            {renderNewsContent()}
          </TabsContent>

          <TabsContent value="forum">
            {renderForumContent()}
          </TabsContent>
        </Tabs>

        {/* View All Link */}
        <div className="text-center mt-12">
          <Link 
            to={activeTab === 'forum' ? '/forum' : '/music-news'}
            className="inline-flex items-center gap-2 text-lg font-semibold text-primary hover:underline"
          >
            Bekijk Alles →
          </Link>
        </div>
      </div>
    </section>
  );
};
