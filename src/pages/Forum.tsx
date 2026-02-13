import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, TrendingUp, Clock, Star } from 'lucide-react';
import { useForumTopics } from '@/hooks/useForumTopics';
import { ForumTopicCard } from '@/components/forum/ForumTopicCard';
import { CreateTopicModal } from '@/components/forum/CreateTopicModal';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { triggerWeeklyDiscussion } from '@/utils/triggerWeeklyDiscussion';
import { toast } from '@/hooks/use-toast';

const Forum: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'featured' | 'recent'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: topics, isLoading } = useForumTopics(filter);

  const filteredTopics = topics?.filter(topic =>
    topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.artist_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.album_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTopicClick = (topicId: string) => {
    navigate(`/forum/topic/${topicId}`);
  };

  const handleCreateWeeklyDiscussion = async () => {
    try {
      toast({ title: "Wekelijkse discussie wordt aangemaakt..." });
      await triggerWeeklyDiscussion();
      toast({ 
        title: "Wekelijkse discussie aangemaakt!", 
        description: "De nieuwe discussie is nu beschikbaar." 
      });
      // Refresh the topics
      window.location.reload();
    } catch (error) {
      toast({ 
        title: "Fout bij aanmaken discussie", 
        description: "Er ging iets mis bij het aanmaken van de wekelijkse discussie.",
        variant: "destructive" 
      });
    }
  };

  const filterButtons = [
    { key: 'all', label: 'Alle Discussies', icon: Clock },
    { key: 'featured', label: 'Uitgelicht', icon: Star },
    { key: 'recent', label: 'Recent', icon: TrendingUp },
  ] as const;

  return (
    <div className="container mx-auto px-4 py-4 max-w-4xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h1 className="text-2xl font-bold text-foreground">Muziek Forum</h1>
        
        {user && (
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nieuwe Discussie</span>
              <span className="sm:hidden">Nieuw</span>
            </Button>
            <Button
              size="sm"
              onClick={handleCreateWeeklyDiscussion}
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              🎵 <span className="hidden sm:inline">Wekelijkse Discussie</span>
              <span className="sm:hidden">Wekelijks</span>
            </Button>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek discussies, artiesten, albums..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex space-x-2">
          {filterButtons.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={filter === key ? 'default' : 'outline'}
              onClick={() => setFilter(key)}
              className="flex items-center space-x-1"
            >
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Topics List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredTopics?.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              Geen discussies gevonden
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm ? 'Probeer een andere zoekterm' : 'Wees de eerste om een discussie te starten!'}
            </p>
            {!searchTerm && user && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Start een Discussie
              </Button>
            )}
          </div>
        ) : (
          filteredTopics?.map((topic) => (
            <ForumTopicCard
              key={topic.id}
              topic={topic}
              onClick={() => handleTopicClick(topic.id)}
            />
          ))
        )}
      </div>

      {/* Stats Footer */}
      <div className="mt-12 p-6 bg-muted/50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <h3 className="text-2xl font-bold text-foreground">{topics?.length || 0}</h3>
            <p className="text-sm text-muted-foreground">Actieve Discussies</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">
              {topics?.reduce((sum, topic) => sum + topic.reply_count, 0) || 0}
            </h3>
            <p className="text-sm text-muted-foreground">Totaal Reacties</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">
              {topics?.filter(topic => topic.topic_type === 'auto_generated').length || 0}
            </h3>
            <p className="text-sm text-muted-foreground">Wekelijkse Discussies</p>
          </div>
        </div>
      </div>

      {/* Create Topic Modal */}
      <CreateTopicModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

export default Forum;