import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useFollowers, useFollowing } from "@/hooks/useFollows";
import { useUserBlogPosts } from "@/hooks/useUserBlogPosts";
import { useUserQuizResults } from "@/hooks/useUserQuizResults";
import { Profile } from "@/hooks/useProfile";
import { Users, FileText, Trophy, Heart, Eye, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

interface SocialStatsProps {
  profile: Profile;
}

export const SocialStats: React.FC<SocialStatsProps> = ({ profile }) => {
  const { data: followers, isLoading: followersLoading } = useFollowers(profile.user_id);
  const { data: following, isLoading: followingLoading } = useFollowing(profile.user_id);
  const { data: blogPosts, isLoading: blogLoading } = useUserBlogPosts(profile.user_id);
  const { data: quizResults, isLoading: quizLoading } = useUserQuizResults(profile.user_id);

  const isLoading = followersLoading || followingLoading || blogLoading || quizLoading;

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalBlogViews = blogPosts?.reduce((sum, post) => sum + (post.views_count || 0), 0) || 0;
  const averageQuizScore = quizResults?.length 
    ? Math.round(quizResults.reduce((sum, result) => sum + result.score_percentage, 0) / quizResults.length)
    : 0;

  const recentFollowers = followers?.slice(0, 3) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Sociale Statistieken
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Community Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center mb-1">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="font-semibold">{blogPosts?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Blog Posts</div>
          </div>

          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center mb-1">
              <Eye className="h-4 w-4 text-primary" />
            </div>
            <div className="font-semibold">{totalBlogViews}</div>
            <div className="text-xs text-muted-foreground">Blog Views</div>
          </div>

          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center mb-1">
              <Trophy className="h-4 w-4 text-primary" />
            </div>
            <div className="font-semibold">{quizResults?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Quiz Results</div>
          </div>

          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center mb-1">
              <Heart className="h-4 w-4 text-primary" />
            </div>
            <div className="font-semibold">{averageQuizScore}%</div>
            <div className="text-xs text-muted-foreground">Avg Quiz Score</div>
          </div>
        </div>

        {/* Recent Blog Posts */}
        {blogPosts && blogPosts.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Recente Blog Posts
            </h4>
            <div className="space-y-2">
              {blogPosts.slice(0, 3).map((post) => (
                <div key={post.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/plaat-verhaal/${post.slug}`}
                      className="text-sm font-medium hover:text-primary transition-colors truncate block"
                    >
                      {(post.yaml_frontmatter as any)?.title || "Untitled"}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {post.views_count || 0} views
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs ml-2">
                    {post.album_type}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Followers */}
        {recentFollowers.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Recente Volgers
            </h4>
            <div className="flex gap-2">
              {recentFollowers.map((follower) => (
                <Link
                  key={follower.follower_id}
                  to={`/profile/${follower.follower_id}`}
                  className="flex flex-col items-center p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-8 w-8 mb-1">
                    <AvatarFallback className="text-xs">
                      {follower.follower_id.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate max-w-16">
                    Gebruiker
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Engagement Summary */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4">
          <h4 className="font-medium mb-2">Community Engagement</h4>
          <div className="text-sm text-muted-foreground">
            {profile.total_followers > 0 && profile.total_following > 0 ? (
              <>
                Actief in de community met {profile.total_followers} volgers en {profile.total_following} connecties.
                {blogPosts && blogPosts.length > 0 && ` Heeft ${blogPosts.length} blog posts geschreven.`}
                {quizResults && quizResults.length > 0 && ` Gemiddelde quiz score: ${averageQuizScore}%.`}
              </>
            ) : (
              "Nieuwe gebruiker in de community."
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};