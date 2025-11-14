import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, User, Activity, BarChart3, Disc3, ShoppingBag, FileText, Trophy, Users } from "lucide-react";
import { useUserActivities } from "@/hooks/useUserActivities";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

interface UserDetailDialogProps {
  user: {
    user_id: string;
    email: string;
    first_name?: string;
    avatar_url?: string;
    created_at: string;
    last_sign_in_at?: string;
    roles: string[];
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACTIVITY_ICONS = {
  ai_scan: Activity,
  cd_scan: Disc3,
  vinyl_scan: Disc3,
  blog_post: FileText,
  shop_order_buy: ShoppingBag,
  shop_order_sell: ShoppingBag,
  quiz_result: Trophy,
  follow: Users,
};

const ACTIVITY_COLORS = {
  ai_scan: "text-purple-500",
  cd_scan: "text-blue-500",
  vinyl_scan: "text-green-500",
  blog_post: "text-orange-500",
  shop_order_buy: "text-pink-500",
  shop_order_sell: "text-emerald-500",
  quiz_result: "text-yellow-500",
  follow: "text-cyan-500",
};

export function UserDetailDialog({ user, open, onOpenChange }: UserDetailDialogProps) {
  const { data: activities, isLoading } = useUserActivities(user?.user_id || "", 100);

  if (!user) return null;

  const activityCounts = activities?.reduce((acc, activity) => {
    acc[activity.type] = (acc[activity.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <div>{user.first_name || "Naamloze Gebruiker"}</div>
              <div className="text-sm text-muted-foreground font-normal">{user.email}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overzicht</TabsTrigger>
            <TabsTrigger value="activities">Activiteiten</TabsTrigger>
            <TabsTrigger value="statistics">Statistieken</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="p-4 space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">User ID</div>
                <div className="font-mono text-xs">{user.user_id}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Rollen</div>
                <div className="flex gap-2 mt-1">
                  {user.roles.length > 0 ? (
                    user.roles.map(role => (
                      <Badge key={role} variant="secondary">{role}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Geen rollen</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Aangemaakt</div>
                <div className="text-sm">
                  {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: nl })}
                </div>
              </div>
              {user.last_sign_in_at && (
                <div>
                  <div className="text-sm text-muted-foreground">Laatst actief</div>
                  <div className="text-sm">
                    {formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true, locale: nl })}
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {activities.map((activity) => {
                  const Icon = ACTIVITY_ICONS[activity.type];
                  const colorClass = ACTIVITY_COLORS[activity.type];

                  return (
                    <Card key={activity.id} className="p-3">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 ${colorClass}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{activity.description}</div>
                          {activity.details && (
                            <div className="text-sm text-muted-foreground truncate">{activity.details}</div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: nl })}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Geen activiteiten gevonden
              </div>
            )}
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-purple-500" />
                  <div className="text-xs text-muted-foreground">AI Scans</div>
                </div>
                <div className="text-2xl font-bold">{activityCounts.ai_scan || 0}</div>
              </Card>
              
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Disc3 className="h-4 w-4 text-blue-500" />
                  <div className="text-xs text-muted-foreground">CD Scans</div>
                </div>
                <div className="text-2xl font-bold">{activityCounts.cd_scan || 0}</div>
              </Card>
              
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Disc3 className="h-4 w-4 text-green-500" />
                  <div className="text-xs text-muted-foreground">Vinyl Scans</div>
                </div>
                <div className="text-2xl font-bold">{activityCounts.vinyl_scan || 0}</div>
              </Card>
              
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-orange-500" />
                  <div className="text-xs text-muted-foreground">Blog Posts</div>
                </div>
                <div className="text-2xl font-bold">{activityCounts.blog_post || 0}</div>
              </Card>
              
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="h-4 w-4 text-pink-500" />
                  <div className="text-xs text-muted-foreground">Gekocht</div>
                </div>
                <div className="text-2xl font-bold">{activityCounts.shop_order_buy || 0}</div>
              </Card>
              
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="h-4 w-4 text-emerald-500" />
                  <div className="text-xs text-muted-foreground">Verkocht</div>
                </div>
                <div className="text-2xl font-bold">{activityCounts.shop_order_sell || 0}</div>
              </Card>
              
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <div className="text-xs text-muted-foreground">Quizzes</div>
                </div>
                <div className="text-2xl font-bold">{activityCounts.quiz_result || 0}</div>
              </Card>
              
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-cyan-500" />
                  <div className="text-xs text-muted-foreground">Follows</div>
                </div>
                <div className="text-2xl font-bold">{activityCounts.follow || 0}</div>
              </Card>
            </div>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-5 w-5" />
                <h3 className="font-semibold">Totale Activiteit</h3>
              </div>
              <div className="text-3xl font-bold">{activities?.length || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">
                Totaal aantal activiteiten
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
