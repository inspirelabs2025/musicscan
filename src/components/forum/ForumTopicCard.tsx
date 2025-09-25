import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Eye, Pin, Star } from 'lucide-react';
import { ForumTopic } from '@/hooks/useForumTopics';
import { formatDistanceToNow } from 'date-fns';

interface ForumTopicCardProps {
  topic: ForumTopic;
  onClick: () => void;
}

export const ForumTopicCard: React.FC<ForumTopicCardProps> = ({ topic, onClick }) => {
  const getTopicBadgeVariant = (type: string) => {
    switch (type) {
      case 'auto_generated':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between space-x-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              {topic.is_pinned && (
                <Pin className="h-4 w-4 text-primary" />
              )}
              {topic.is_featured && (
                <Star className="h-4 w-4 text-amber-500" />
              )}
              <Badge variant={getTopicBadgeVariant(topic.topic_type)}>
                {topic.topic_type === 'auto_generated' ? 'Wekelijkse Discussie' : 'Community'}
              </Badge>
            </div>
            
            <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
              {topic.title}
            </h3>
            
            {topic.description && (
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                {topic.description}
              </p>
            )}
            
            {(topic.artist_name || topic.album_title) && (
              <div className="flex items-center space-x-2 mb-3">
                {topic.artist_name && (
                  <Badge variant="outline" className="text-xs">
                    🎤 {topic.artist_name}
                  </Badge>
                )}
                {topic.album_title && (
                  <Badge variant="outline" className="text-xs">
                    💿 {topic.album_title}
                  </Badge>
                )}
              </div>
            )}
            
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <MessageCircle className="h-4 w-4" />
                <span>{topic.reply_count}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{topic.view_count}</span>
              </div>
              
              <span>
                {formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={topic.profiles?.avatar_url} />
                <AvatarFallback>
                  {topic.profiles?.first_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="text-xs text-muted-foreground">
                {topic.profiles?.first_name || 'Unknown'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};