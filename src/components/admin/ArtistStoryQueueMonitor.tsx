import { Music, Clock, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useArtistStoryQueue } from "@/hooks/useArtistStoryQueue";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

export const ArtistStoryQueueMonitor = () => {
  const { queueItems, stats, batchStatus, isLoading } = useArtistStoryQueue();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      processing: "default",
      completed: "outline",
      failed: "destructive",
    };

    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status === "pending" && "Wachtend"}
        {status === "processing" && "Verwerken"}
        {status === "completed" && "Voltooid"}
        {status === "failed" && "Mislukt"}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Wachtend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.pending || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-orange-500" />
              Verwerken
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.processing || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Voltooid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.completed || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Mislukt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.failed || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Batch Status */}
      {batchStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Batch Status</span>
              <Badge variant={batchStatus.status === "processing" ? "default" : "secondary"}>
                {batchStatus.status === "processing" ? "Actief" : batchStatus.status}
              </Badge>
            </CardTitle>
            <CardDescription>
              {batchStatus.processed_items} van {batchStatus.total_items} artiesten verwerkt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Laatste update: {formatDistanceToNow(new Date(batchStatus.last_heartbeat), { 
                addSuffix: true,
                locale: nl 
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queue Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Artiest Verhalen Queue
          </CardTitle>
          <CardDescription>
            Recente artiesten in de verwerkings queue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!queueItems || queueItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Geen artiesten in de queue</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Artiest</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pogingen</TableHead>
                    <TableHead>Aangemaakt</TableHead>
                    <TableHead>Verwerkt</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queueItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {getStatusIcon(item.status)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.metadata?.artist_name || "Onbekend"}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.status)}
                      </TableCell>
                      <TableCell>
                        <span className={item.attempts > 1 ? "text-orange-500 font-medium" : ""}>
                          {item.attempts}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), { 
                          addSuffix: true,
                          locale: nl 
                        })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.processed_at ? (
                          formatDistanceToNow(new Date(item.processed_at), { 
                            addSuffix: true,
                            locale: nl 
                          })
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {item.error_message && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm">
                                <p className="text-sm">{item.error_message}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
