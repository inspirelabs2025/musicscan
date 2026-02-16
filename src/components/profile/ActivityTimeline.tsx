import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUserActivity } from "@/hooks/useUserActivity";
import { Activity, Disc3, FileText, Trophy, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { nl, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

interface ActivityTimelineProps {
  userId: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ userId }) => {
  const { tr, language } = useLanguage();
  const p = tr.profile;
  const dateLocale = language === 'nl' ? nl : enUS;
  const { data: activities, isLoading } = useUserActivity(userId);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-8 w-8 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "collection_add": return <Disc3 className="h-4 w-4" />;
      case "blog_post": return <FileText className="h-4 w-4" />;
      case "quiz_completed": return <Trophy className="h-4 w-4" />;
      case "follow": return <Users className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "collection_add": return "bg-blue-500";
      case "blog_post": return "bg-green-500";
      case "quiz_completed": return "bg-yellow-500";
      case "follow": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case "collection_add": return p.collection;
      case "blog_post": return p.blog;
      case "quiz_completed": return p.quiz;
      case "follow": return p.social;
      default: return "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {p.recentActivities}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!activities || activities.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {p.noActivities}
          </p>
        ) : (
          <div className="space-y-4">
            {activities.slice(0, 5).map((activity, index) => (
              <div key={`${activity.type}-${index}`} className="flex gap-3 items-start">
                <div className={`p-2 rounded-full ${getActivityColor(activity.type)} text-white flex-shrink-0`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">
                    {activity.description}
                  </div>
                  {activity.details && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {activity.details}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {getActivityLabel(activity.type)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { 
                        locale: dateLocale, 
                        addSuffix: true 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {activities.length > 5 && (
              <div className="text-center pt-4">
                <Badge variant="secondary" className="text-xs">
                  {p.moreActivities.replace('{count}', String(activities.length - 5))}
                </Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
