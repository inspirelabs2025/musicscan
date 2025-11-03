import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIndexNowQueue } from "@/hooks/useIndexNowQueue";
import { Clock, CheckCircle2, XCircle, Send, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

export const IndexNowMonitor = () => {
  const { queueItems, submissions, stats, isLoading, submitToIndexNow, isSubmitting } = useIndexNowQueue();

  const handleManualSubmit = () => {
    if (queueItems && queueItems.length > 0) {
      const urls = queueItems.slice(0, 100).map(item => item.url);
      submitToIndexNow(urls);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Wachtrij</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">URLs wachten op indexing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Succesvol</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.successful || 0}</div>
            <p className="text-xs text-muted-foreground">Gesubmit aan IndexNow</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mislukt</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.failed || 0}</div>
            <p className="text-xs text-muted-foreground">Submission errors</p>
          </CardContent>
        </Card>
      </div>

      {/* Queue Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>IndexNow Wachtrij</CardTitle>
              <CardDescription>URLs die wachten op indexing submission</CardDescription>
            </div>
            <Button 
              onClick={handleManualSubmit} 
              disabled={!queueItems || queueItems.length === 0 || isSubmitting}
              size="sm"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Nu ({queueItems?.length || 0})
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : queueItems && queueItems.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {queueItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono truncate">{item.url}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.created_at), {
                        addSuffix: true,
                        locale: nl,
                      })}
                    </p>
                  </div>
                  <Badge variant="secondary">{item.content_type}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Geen items in wachtrij</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recente Submissions</CardTitle>
          <CardDescription>Laatste IndexNow API calls</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : submissions && submissions.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="p-4 bg-muted/50 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant={submission.status_code === 200 || submission.status_code === 202 ? "default" : "destructive"}>
                      {submission.status_code ? `HTTP ${submission.status_code}` : 'Pending'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(submission.submitted_at), {
                        addSuffix: true,
                        locale: nl,
                      })}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">
                      {submission.urls.length} URLs • {submission.content_type}
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {submission.urls.slice(0, 3).map((url, i) => (
                        <div key={i} className="font-mono truncate">{url}</div>
                      ))}
                      {submission.urls.length > 3 && (
                        <div className="italic">+{submission.urls.length - 3} meer...</div>
                      )}
                    </div>
                  </div>
                  {submission.response_body && (
                    <p className="text-xs text-muted-foreground italic">
                      {submission.response_body}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Send className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nog geen submissions</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
