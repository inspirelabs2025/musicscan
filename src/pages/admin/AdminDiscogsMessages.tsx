import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, Users, CheckCircle2, XCircle, Loader2, MessageSquare, Filter } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DiscogsOrder {
  id: string;
  discogs_order_id: string;
  buyer_username: string;
  buyer_email: string | null;
  status: string | null;
  total_value: number | null;
  total_currency: string | null;
  items: any;
  discogs_created_at: string | null;
}

export default function AdminDiscogsMessages() {
  const { toast } = useToast();
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [sendProgress, setSendProgress] = useState(0);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-discogs-orders", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("discogs_orders")
        .select("id, discogs_order_id, buyer_username, buyer_email, status, total_value, total_currency, items, discogs_created_at")
        .order("discogs_created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DiscogsOrder[];
    },
  });

  // Get unique buyers (deduplicate by username)
  const uniqueBuyers = orders
    ? Array.from(
        new Map(orders.map((o) => [o.buyer_username, o])).values()
      )
    : [];

  const toggleOrder = (orderId: string) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const selectAll = () => {
    if (!orders) return;
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map((o) => o.discogs_order_id)));
    }
  };

  const handleBulkSend = async () => {
    if (!message.trim() || selectedOrders.size === 0) {
      toast({ title: "Vul een bericht in en selecteer orders", variant: "destructive" });
      return;
    }

    setSending(true);
    setSendResults(null);
    setSendProgress(0);

    const orderIds = Array.from(selectedOrders);
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < orderIds.length; i++) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Niet ingelogd");

        const res = await supabase.functions.invoke("discogs-order-message", {
          body: { order_id: orderIds[i], message: message.trim() },
        });

        if (res.error) throw res.error;
        sent++;
      } catch (err) {
        console.error(`Failed to send to order ${orderIds[i]}:`, err);
        failed++;
      }

      setSendProgress(Math.round(((i + 1) / orderIds.length) * 100));
      
      // Rate limiting: wait 1 second between messages
      if (i < orderIds.length - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    setSendResults({ sent, failed, total: orderIds.length });
    setSending(false);

    toast({
      title: `Bulk verzending voltooid`,
      description: `${sent} verzonden, ${failed} mislukt van ${orderIds.length} orders`,
      variant: failed > 0 ? "destructive" : "default",
    });
  };

  const statusOptions = ["all", "New Order", "Payment Pending", "Payment Received", "In Progress", "Shipped", "Merged", "Order Changed", "Cancelled (Non-Payment)", "Cancelled (Item Unavailable)", "Cancelled (Per Buyer's Request)"];

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-4 md:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <MessageSquare className="h-6 w-6" />
                Discogs Bulk Berichten
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Verstuur berichten naar meerdere Discogs kopers tegelijk
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              <Users className="h-3.5 w-3.5 mr-1" />
              {orders?.length || 0} orders
            </Badge>
          </div>

          {/* Message composer */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Bericht opstellen</CardTitle>
              <CardDescription>
                Dit bericht wordt naar alle geselecteerde orders verzonden via de Discogs API.
                Er wordt automatisch een MusicScan promotie-banner toegevoegd.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Typ hier je bericht voor de kopers..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {selectedOrders.size} order(s) geselecteerd
                </span>
                <Button
                  onClick={handleBulkSend}
                  disabled={sending || !message.trim() || selectedOrders.size === 0}
                  className="gap-2"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Verstuur naar {selectedOrders.size} orders
                </Button>
              </div>

              {sending && (
                <div className="space-y-2">
                  <Progress value={sendProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">{sendProgress}% voltooid</p>
                </div>
              )}

              {sendResults && (
                <div className="flex gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-1 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {sendResults.sent} verzonden
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <XCircle className="h-4 w-4 text-red-500" />
                    {sendResults.failed} mislukt
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filter & select */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Filter op status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === "all" ? "Alle statussen" : s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={selectAll}>
              {selectedOrders.size === (orders?.length || 0) ? "Deselecteer alles" : "Selecteer alles"}
            </Button>
          </div>

          {/* Orders list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="grid gap-2">
              {orders.map((order) => {
                const items = Array.isArray(order.items) ? order.items : [];
                const itemSummary = items
                  .slice(0, 2)
                  .map((i: any) => i?.release?.description || i?.release?.title || "Item")
                  .join(", ");

                return (
                  <div
                    key={order.discogs_order_id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedOrders.has(order.discogs_order_id)
                        ? "bg-primary/5 border-primary/30"
                        : "bg-card hover:bg-muted/50"
                    }`}
                    onClick={() => toggleOrder(order.discogs_order_id)}
                  >
                    <Checkbox
                      checked={selectedOrders.has(order.discogs_order_id)}
                      onCheckedChange={() => toggleOrder(order.discogs_order_id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{order.buyer_username}</span>
                        <Badge variant="secondary" className="text-xs">
                          #{order.discogs_order_id}
                        </Badge>
                        <Badge
                          variant={
                            order.status === "Shipped" ? "default" :
                            order.status?.includes("Cancelled") ? "destructive" : "outline"
                          }
                          className="text-xs"
                        >
                          {order.status || "Unknown"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {itemSummary || "Geen items"}
                        {items.length > 2 && ` +${items.length - 2} meer`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">
                        {order.total_currency} {order.total_value?.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.discogs_created_at
                          ? new Date(order.discogs_created_at).toLocaleDateString("nl-NL")
                          : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Geen orders gevonden
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
