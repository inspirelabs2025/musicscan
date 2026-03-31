import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Send, MessageSquare, Package, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDiscogsConnection } from "@/hooks/useDiscogsConnection";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DiscogsOrder {
  id: string;
  status: string;
  buyer: { username: string };
  seller: { username: string };
  created: string;
  last_activity: string;
  total: { value: number; currency: string };
  items: Array<{
    release: { id: number; description: string };
    price: { value: number; currency: string };
  }>;
}

interface DiscogsMessage {
  subject?: string;
  message?: string;
  from?: { username: string };
  timestamp?: string;
  status_id?: number;
  original?: string;
  actor?: { username: string };
}

const SUPABASE_URL = "https://ssxbpyqnjfiyubsuonar.supabase.co";

const DiscogsMessages = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isConnected, isLoading: connLoading, connection } = useDiscogsConnection();
  const isMobile = useIsMobile();
  const [orders, setOrders] = useState<DiscogsOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DiscogsOrder | null>(null);
  const [messages, setMessages] = useState<DiscogsMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Niet ingelogd");
    return session;
  };

  const fetchOrders = async (p = 1) => {
    setLoadingOrders(true);
    try {
      const session = await getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/discogs-fetch-orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ page: p, per_page: 25 }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Orders ophalen mislukt");
      }

      const data = await res.json();
      setOrders(data.orders || []);
      setTotalPages(data.pagination?.pages || 1);
      setPage(p);
    } catch (error: any) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchMessages = async (orderId: string) => {
    setLoadingMessages(true);
    setMessages([]);
    try {
      const session = await getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/discogs-order-message`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order_id: orderId, mode: "list" }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errData.error || "Berichten ophalen mislukt");
      }

      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error: any) {
      toast({ title: "Fout bij laden berichten", description: error.message, variant: "destructive" });
    } finally {
      setLoadingMessages(false);
    }
  };

  const PROMO_BANNER = `\n\n---\n🎵 Sent via MusicScan — The smart platform for music collectors.\nDiscover stories, scan your vinyl & CDs, and manage your collection.\n👉 www.musicscan.app`;

  const sendMessage = async () => {
    if (!selectedOrder || !newMessage.trim()) return;
    setSending(true);
    try {
      const session = await getSession();
      const messageWithPromo = newMessage.trim() + PROMO_BANNER;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/discogs-order-message`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order_id: selectedOrder.id, message: messageWithPromo }),
      });

      if (!res.ok) throw new Error("Bericht versturen mislukt");

      toast({ title: "Verzonden!", description: "Je bericht is verstuurd naar Discogs." });
      setNewMessage("");
      await fetchMessages(selectedOrder.id);
    } catch (error: any) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (isConnected) fetchOrders();
  }, [isConnected]);

  const handleSelectOrder = (order: DiscogsOrder) => {
    setSelectedOrder(order);
    fetchMessages(order.id);
  };

  const statusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "shipped") return "bg-blue-500/10 text-blue-600 border-blue-500/30";
    if (s === "payment received") return "bg-green-500/10 text-green-600 border-green-500/30";
    if (s === "cancelled") return "bg-red-500/10 text-red-600 border-red-500/30";
    if (s === "new order") return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
    return "bg-muted text-muted-foreground";
  };

  if (connLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] pt-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="w-full pt-16 pb-24 py-6 overflow-x-hidden">
        <div className="px-4 mx-auto max-w-screen-xl">
          <Card className="mx-auto max-w-xl rounded-[1.75rem] overflow-hidden">
            <div className="px-4 py-4 border-b bg-muted/40 flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 rounded-xl bg-background border flex items-center justify-center shrink-0">
                <MessageSquare className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold truncate">Discogs Messages</h1>
                <p className="text-xs text-muted-foreground truncate">Koppeling vereist</p>
              </div>
            </div>

            <CardContent className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Koppel eerst je Discogs account om je order berichten te bekijken.
              </p>

              <div className="grid gap-2 text-xs text-muted-foreground">
                <div className="rounded-lg bg-muted px-3 py-2">• Bekijk en beheer ordergesprekken</div>
                <div className="rounded-lg bg-muted px-3 py-2">• Reageer direct vanuit MusicScan</div>
              </div>

              <Button className="w-full h-11" onClick={() => navigate("/mijn-discogs")}>Ga naar Mijn Discogs</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      {/* Header */}
      <div className="shrink-0 pt-16 px-3 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2 min-w-0">
              <MessageSquare className="w-5 h-5 text-primary shrink-0" />
              <span className="truncate">Discogs Messages</span>
            </h1>
            <p className="text-xs text-muted-foreground truncate">{connection?.discogs_username || "Orders"}</p>
          </div>
          <Button size="icon" className="h-9 w-9 shrink-0" onClick={() => fetchOrders(page)} disabled={loadingOrders}>
            <RefreshCw className={`w-4 h-4 ${loadingOrders ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-hidden px-3 pb-24 ${
        isMobile ? 'flex flex-col' : 'grid grid-cols-[320px_minmax(0,1fr)] gap-3'
      }`}>
        {/* Orders list */}
        {(!isMobile || !selectedOrder) && (
          <div className="flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <h2 className="font-semibold text-sm">Orders ({orders.length})</h2>
            </div>

            {loadingOrders ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-2xl border bg-card py-8 text-center text-muted-foreground">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Geen orders gevonden</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-2 pb-2">
                  {orders.map((order) => (
                    <button
                      key={order.id}
                      className={`w-full text-left rounded-2xl border bg-card p-3 transition-all hover:shadow-md ${
                        selectedOrder?.id === order.id ? "ring-2 ring-primary border-primary" : "hover:border-primary/30"
                      }`}
                      onClick={() => handleSelectOrder(order)}
                    >
                      <div className="flex min-w-0 flex-wrap items-start justify-between gap-1">
                        <span className="font-mono text-xs font-medium truncate min-w-0 flex-1">#{order.id}</span>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">Koper: {order.buyer?.username || "—"}</p>
                      <div className="flex items-center justify-between text-xs mt-1 gap-2 min-w-0">
                        <span className="text-muted-foreground truncate">
                          {order.created ? new Date(order.created).toLocaleDateString("nl-NL") : "—"}
                        </span>
                        <span className="font-semibold shrink-0">
                          {order.total?.currency} {order.total?.value?.toFixed(2)}
                        </span>
                      </div>
                      {order.items?.[0] && (
                        <p className="text-[11px] text-muted-foreground truncate mt-1">{order.items[0].release?.description}</p>
                      )}
                    </button>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2 shrink-0">
                    <Button size="icon" className="h-8 w-8" onClick={() => fetchOrders(page - 1)} disabled={page <= 1 || loadingOrders}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
                    <Button size="icon" className="h-8 w-8" onClick={() => fetchOrders(page + 1)} disabled={page >= totalPages || loadingOrders}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Messages panel */}
        {(!isMobile || selectedOrder) && (
          <div className="flex flex-col min-w-0 min-h-0 overflow-hidden flex-1">
            {!selectedOrder ? (
              <div className="flex-1 flex items-center justify-center rounded-2xl border bg-card">
                <div className="text-center text-muted-foreground p-4">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Selecteer een order</p>
                  <p className="text-sm">Klik op een order om de berichten te bekijken</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 rounded-2xl border bg-card overflow-hidden">
                {/* Message header */}
                <div className="shrink-0 p-3 border-b">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      {isMobile && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setSelectedOrder(null)}>
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                      )}
                      <span className="text-sm font-semibold truncate min-w-0">Order #{selectedOrder.id}</span>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                    <span className="truncate">Koper: <strong>{selectedOrder.buyer?.username}</strong></span>
                    <span className="shrink-0">{selectedOrder.total?.currency} {selectedOrder.total?.value?.toFixed(2)}</span>
                  </div>
                  {selectedOrder.items?.[0] && (
                    <p className="text-xs text-muted-foreground truncate mt-1">📦 {selectedOrder.items[0].release?.description}</p>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3">
                  {loadingMessages ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>Nog geen berichten</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg, i) => {
                        const isMe = msg.from?.username === connection?.discogs_username || msg.actor?.username === connection?.discogs_username;
                        const senderName = msg.from?.username || msg.actor?.username || "Systeem";
                        const content = msg.message || msg.original || "";
                        return (
                          <div key={i} className={`flex min-w-0 ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] rounded-xl px-3 py-2 ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
                                <span className="text-[11px] font-semibold opacity-80 truncate">{senderName}</span>
                                {msg.timestamp && (
                                  <span className="text-[10px] opacity-60 shrink-0">
                                    {new Date(msg.timestamp).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                )}
                              </div>
                              {content && <p className="text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{content}</p>}
                              {msg.subject && <p className="text-[11px] opacity-60 mt-1 italic break-words [overflow-wrap:anywhere]">{msg.subject}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="shrink-0 p-2.5 border-t space-y-2">
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-primary/10 border border-primary/20 text-[10px] text-muted-foreground">
                    <span className="shrink-0">🎵</span>
                    <span className="truncate italic">Auto: <span className="text-primary/80 font-medium">Sent via MusicScan</span></span>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end min-w-0">
                    <Textarea
                      placeholder="Typ je bericht..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="min-h-[56px] resize-none flex-1 min-w-0 text-base"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                      }}
                    />
                    <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="h-10 w-full sm:w-auto sm:px-3 shrink-0">
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscogsMessages;
