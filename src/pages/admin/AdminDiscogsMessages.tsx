import { useState } from "react";

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
import { Send, Users, CheckCircle2, XCircle, Loader2, MessageSquare, Filter, Inbox, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DiscogsOrder {
  id: string;
  discogs_order_id: string;
  buyer_username: string;
  buyer_email: string | null;
  status: string | null;
  total_value: number | null;
  total_currency: string | null;
  shipping_address: string | null;
  items: any;
  discogs_created_at: string | null;
}

const ACTIVE_DISCOGS_STATUSES = new Set([
  "New Order",
  "Buyer Contacted",
  "Invoice Sent",
  "Payment Pending",
  "Payment Received",
  "In Progress",
  "Order Changed",
]);

export default function AdminDiscogsMessages() {
  const { toast } = useToast();
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("Musicscan");
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState<{ sent: number; failed: number; total: number; errors: { orderId: string; error: string }[] } | null>(null);
  const [sendProgress, setSendProgress] = useState(0);

  const isActiveOrderStatus = (status: string | null) => !!status && ACTIVE_DISCOGS_STATUSES.has(status);
  const hasRestrictedStatus = (status: string | null) => !isActiveOrderStatus(status);
  // Eigen Discogs username (voor outbox-filter)
  const { data: myDiscogsUsername } = useQuery({
    queryKey: ["my-discogs-username"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("discogs_user_tokens")
        .select("discogs_username")
        .eq("user_id", user.id)
        .maybeSingle();
      return data?.discogs_username || null;
    },
  });

  // Outbox: verzonden berichten (sender = ik)
  const { data: outbox, isLoading: outboxLoading, refetch: refetchOutbox } = useQuery({
    queryKey: ["discogs-outbox", myDiscogsUsername],
    enabled: !!myDiscogsUsername,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discogs_order_messages")
        .select("id, discogs_order_id, message, subject, message_timestamp, created_at, sender_username")
        .eq("sender_username", myDiscogsUsername!)
        .order("message_timestamp", { ascending: false, nullsFirst: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Refresh: trekt voor een order alle Discogs-berichten op (vult outbox aan met net verzonden berichten)
  const [refreshingOrder, setRefreshingOrder] = useState<string | null>(null);
  const refreshOrderMessages = async (orderId: string) => {
    setRefreshingOrder(orderId);
    try {
      const res = await supabase.functions.invoke("discogs-order-message", {
        body: { order_id: orderId, mode: "list" },
      });
      if (res.error) throw res.error;
      await refetchOutbox();
      toast({ title: `Berichten voor #${orderId} ververst` });
    } catch (err: any) {
      toast({ title: "Refresh mislukt", description: err?.message || String(err), variant: "destructive" });
    } finally {
      setRefreshingOrder(null);
    }
  };


  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-discogs-orders", statusFilter, countryFilter],
    queryFn: async () => {
      let query = supabase
        .from("discogs_orders")
        .select("id, discogs_order_id, buyer_username, buyer_email, status, total_value, total_currency, shipping_address, items, discogs_created_at")
        .order("discogs_created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      let filtered = data as DiscogsOrder[];
      if (countryFilter === "nl") {
        filtered = filtered.filter((o) => 
          o.shipping_address?.toLowerCase().includes("netherlands") ||
          o.shipping_address?.toLowerCase().includes("nederland")
        );
      } else if (countryFilter === "international") {
        filtered = filtered.filter((o) => 
          o.shipping_address && 
          !o.shipping_address.toLowerCase().includes("netherlands") &&
          !o.shipping_address.toLowerCase().includes("nederland")
        );
      }
      return filtered;
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

  const getDiscogsSendError = async (res: any) => {
    if (!res.error && !res.data?.error) return null;

    const response = res.error?.context;
    if (response?.json) {
      try {
        const body = await response.clone().json();
        return [body?.error, body?.details].filter(Boolean).join(" — ") || res.error.message;
      } catch (_) {
        // Fallback below
      }
    }

    if (res.data?.error) {
      return [res.data.error, res.data.details].filter(Boolean).join(" — ");
    }

    return res.error?.message || "Onbekende Discogs fout";
  };

  const selectAll = () => {
    if (!orders) return;
    const allOrderIds = orders.map((o) => o.discogs_order_id);
    if (selectedOrders.size === allOrderIds.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(allOrderIds));
    }
  };

  const selectActive = () => {
    if (!orders) return;
    const activeIds = orders.filter((o) => isActiveOrderStatus(o.status)).map((o) => o.discogs_order_id);
    setSelectedOrders(new Set(activeIds));
  };

  const handleBulkSend = async () => {
    if (!subject.trim() || !message.trim() || selectedOrders.size === 0) {
      toast({ title: "Vul onderwerp, bericht in en selecteer contacten", variant: "destructive" });
      return;
    }

    setSending(true);
    setSendResults(null);
    setSendProgress(0);

    const orderIds = Array.from(selectedOrders);
    const ordersByDiscogsId = new Map((orders || []).map((order) => [order.discogs_order_id, order]));
    let sent = 0;
    let failed = 0;
    const errors: { orderId: string; error: string }[] = [];

    const sentOrderIds: string[] = [];
    for (let i = 0; i < orderIds.length; i++) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Niet ingelogd");

        const order = ordersByDiscogsId.get(orderIds[i]);
        if (!order?.buyer_username) throw new Error("Geen Discogs gebruikersnaam gevonden");

        const res = await supabase.functions.invoke("discogs-order-message", {
          body: {
            mode: "private",
            order_id: orderIds[i],
            buyer_username: order.buyer_username,
            subject: subject.trim(),
            message: message.trim(),
          },
        });

        const sendError = await getDiscogsSendError(res);
        if (sendError) throw new Error(sendError);
        if (!(res.data as any)?.success) {
          throw new Error("Geen success-respons van edge function");
        }
        if (!(res.data as any)?.confirmed) {
          throw new Error("Discogs heeft het privébericht niet bevestigd");
        }
        sent++;
        sentOrderIds.push(orderIds[i]);
      } catch (err: any) {
        const msg = err?.message || String(err) || "Unknown error";
        console.error(`Failed to send to order ${orderIds[i]}:`, err);
        failed++;
        errors.push({ orderId: orderIds[i], error: msg });
      }

      setSendProgress(Math.round(((i + 1) / orderIds.length) * 100));
      
      // Rate limiting: wait 1 second between messages
      if (i < orderIds.length - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // Auto-sync verzonden berichten terug vanuit Discogs zodat outbox altijd actueel is
    for (const oid of sentOrderIds) {
      try {
        await supabase.functions.invoke("discogs-order-message", {
          body: { order_id: oid, mode: "list" },
        });
      } catch (e) {
        console.warn(`Auto-sync mislukt voor order ${oid}`, e);
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    await refetchOutbox();

    setSendResults({ sent, failed, total: orderIds.length, errors });
    setSending(false);

    toast({
      title: `Bulk verzending voltooid`,
      description: `${sent} verzonden, ${failed} mislukt van ${orderIds.length} orders${failed > 0 ? " — zie foutenlijst onder de knop" : ""}`,
      variant: failed > 0 && sent === 0 ? "destructive" : "default",
      duration: 8000,
    });
  };


  const statusOptions = ["all", "New Order", "Payment Pending", "Payment Received", "In Progress", "Shipped", "Merged", "Order Changed", "Cancelled (Non-Payment)", "Cancelled (Item Unavailable)", "Cancelled (Per Buyer's Request)"];


  return (
    <AdminGuard>
      <div className="p-4 md:p-6 space-y-6">
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
                <div className="space-y-2">
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
                  {sendResults.errors.length > 0 && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 max-h-60 overflow-y-auto space-y-1">
                      <p className="text-xs font-medium text-destructive mb-1">Foutdetails:</p>
                      {sendResults.errors.map((e, idx) => (
                        <div key={idx} className="text-xs font-mono">
                          <span className="text-muted-foreground">#{e.orderId}</span>{" "}
                          <span className="text-destructive">{e.error}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Outbox: verzonden berichten */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Inbox className="h-5 w-5" />
                    Outbox — verzonden berichten
                  </CardTitle>
                  <CardDescription>
                    Recent verzonden berichten vanuit dit account
                    {myDiscogsUsername ? ` (${myDiscogsUsername})` : ""}.
                    Nieuwe sends worden automatisch gelogd; klik Refresh op een order om Discogs opnieuw op te halen.
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => refetchOutbox()} disabled={outboxLoading}>
                  <RefreshCw className={`h-4 w-4 ${outboxLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {outboxLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : outbox && outbox.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {outbox.map((m) => (
                    <div key={m.id} className="rounded-lg border p-3 bg-card">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">#{m.discogs_order_id}</Badge>
                          {m.subject && <Badge variant="outline" className="text-xs">{m.subject}</Badge>}
                          <span className="text-xs text-muted-foreground">
                            {m.message_timestamp
                              ? new Date(m.message_timestamp).toLocaleString("nl-NL")
                              : new Date(m.created_at).toLocaleString("nl-NL")}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => refreshOrderMessages(m.discogs_order_id)}
                          disabled={refreshingOrder === m.discogs_order_id}
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${refreshingOrder === m.discogs_order_id ? "animate-spin" : ""}`} />
                        </Button>
                      </div>
                      <p className="text-sm whitespace-pre-wrap line-clamp-4">{m.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  Nog geen verzonden berichten in de outbox.
                  {selectedOrders.size === 1 && (
                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => refreshOrderMessages(Array.from(selectedOrders)[0])}
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-2" />
                        Refresh berichten voor geselecteerde order
                      </Button>
                    </div>
                  )}
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
            <div className="flex items-center gap-2">
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter op land" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🌍 Alle landen</SelectItem>
                  <SelectItem value="nl">🇳🇱 Nederland</SelectItem>
                  <SelectItem value="international">🌐 Internationaal (Engels)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={selectAll}>
              {selectedOrders.size === (orders?.length || 0) && (orders?.length || 0) > 0 ? "Deselecteer alles" : "Selecteer alles"}
            </Button>
            <Button variant="outline" size="sm" onClick={selectActive}>
              Selecteer actieve orders
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
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
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
                        {hasRestrictedStatus(order.status) && (
                          <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                            ⚠ status kan beperkt zijn
                          </Badge>
                        )}
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
      </div>
    </AdminGuard>
  );
}
