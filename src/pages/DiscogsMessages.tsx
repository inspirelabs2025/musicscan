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
    <div className="w-full pt-16 pb-24 py-6 overflow-hidden box-border max-w-[100vw]">
      <div className="px-4 mx-auto max-w-screen-xl">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3 sm:mb-4 min-w-0 overflow-hidden">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0 flex-1 overflow-hidden">
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

        {/* Content layout */}
        <div className={isMobile ? "flex flex-col gap-3 min-h-[calc(100dvh-250px)] overflow-hidden" : "flex gap-4 h-[calc(100vh-220px)] overflow-hidden"}>
          {/* Orders list */}
          <div
            className={`flex flex-col min-h-0 overflow-hidden ${
              isMobile
                ? selectedOrder
                  ? "hidden"
                  : "w-full"
                : `${selectedOrder ? "hidden lg:flex" : "flex w-full"} lg:w-80 xl:w-96 lg:shrink-0`
            }`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="font-semibold text-sm">Orders ({orders.length})</h2>
            </div>

            {loadingOrders ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <Card className="overflow-hidden rounded-2xl">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Geen orders gevonden</p>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col flex-1 min-h-0 overflow-hidden w-full">
                <ScrollArea className="flex-1 w-full">
                  <div className="space-y-2 w-full pr-1">
                    {orders.map((order) => (
                      <Card
                        key={order.id}
                        className={`cursor-pointer transition-all hover:shadow-md overflow-hidden rounded-2xl w-full max-w-full ${
                          selectedOrder?.id === order.id ? "ring-2 ring-primary border-primary" : "hover:border-primary/30"
                        }`}
                        onClick={() => handleSelectOrder(order)}
                      >
                        <CardContent className="p-3 overflow-hidden min-w-0">
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <span className="font-mono text-xs font-medium truncate min-w-0 flex-1">#{order.id}</span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] shrink-0 max-w-[50%] truncate ${statusColor(order.status)}`}
                            >
                              {order.status}
                            </Badge>
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
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Button
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => fetchOrders(page - 1)}
                      disabled={page <= 1 || loadingOrders}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {page} / {totalPages}
                    </span>
                    <Button
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => fetchOrders(page + 1)}
                      disabled={page >= totalPages || loadingOrders}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Messages panel */}
          <div
            className={`min-w-0 overflow-hidden flex-col ${
              isMobile
                ? selectedOrder
                  ? "flex flex-1"
                  : "hidden"
                : `${selectedOrder ? "flex" : "hidden lg:flex"} flex-1`
            }`}
          >
            {!selectedOrder ? (
              <Card className="flex-1 flex items-center justify-center overflow-hidden rounded-2xl">
                <div className="text-center text-muted-foreground p-4">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Selecteer een order</p>
                  <p className="text-sm">Klik op een order om de berichten te bekijken</p>
                </div>
              </Card>
            ) : (
              <Card className="flex-1 flex flex-col min-h-0 overflow-hidden rounded-2xl">
                <CardHeader className="pb-3 border-b shrink-0 overflow-hidden">
                  <div className="flex items-center justify-between gap-2 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 lg:hidden"
                        onClick={() => setSelectedOrder(null)}
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <CardTitle className="text-sm truncate min-w-0">Order #{selectedOrder.id}</CardTitle>
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-[10px] max-w-[46%] truncate ${statusColor(selectedOrder.status)}`}
                    >
                      {selectedOrder.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground min-w-0">
                    <span className="truncate max-w-full">
                      Koper: <strong>{selectedOrder.buyer?.username}</strong>
                    </span>
                    <span className="shrink-0">
                      {selectedOrder.total?.currency} {selectedOrder.total?.value?.toFixed(2)}
                    </span>
                  </div>

                  {selectedOrder.items?.[0] && (
                    <p className="text-xs text-muted-foreground truncate max-w-full">
                      📦 {selectedOrder.items[0].release?.description}
                    </p>
                  )}
                </CardHeader>

                <ScrollArea className="flex-1 p-3 sm:p-4">
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
                    <div className="space-y-3 sm:space-y-4">
                      {messages.map((msg, i) => {
                        const isMe =
                          msg.from?.username === connection?.discogs_username ||
                          msg.actor?.username === connection?.discogs_username;
                        const senderName = msg.from?.username || msg.actor?.username || "Systeem";
                        const content = msg.message || msg.original || "";

                        return (
                          <div key={i} className={`flex w-full min-w-0 ${isMe ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`w-fit max-w-[85%] sm:max-w-[80%] rounded-xl px-3 py-2 overflow-hidden ${
                                isMe ? "bg-primary text-primary-foreground" : "bg-muted"
                              }`}
                            >
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1 min-w-0">
                                <span className="text-[11px] font-semibold opacity-80 truncate max-w-full">{senderName}</span>
                                {msg.timestamp && (
                                  <span className="text-[10px] opacity-60 shrink-0">
                                    {new Date(msg.timestamp).toLocaleString("nl-NL", {
                                      day: "numeric",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                )}
                              </div>

                              {content && (
                                <p className="text-sm whitespace-pre-wrap break-all [overflow-wrap:anywhere]">{content}</p>
                              )}

                              {msg.subject && (
                                <p className="text-[11px] opacity-60 mt-1 italic break-all [overflow-wrap:anywhere]">
                                  {msg.subject}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>

                <div className="p-2.5 sm:p-3 border-t shrink-0 space-y-2 overflow-hidden">
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-primary/10 border border-primary/20 text-[10px] text-muted-foreground overflow-hidden">
                    <span className="shrink-0">🎵</span>
                    <span className="truncate italic">
                      Auto: <span className="text-primary/80 font-medium">Sent via MusicScan</span>
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end min-w-0">
                    <Textarea
                      placeholder="Typ je bericht..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="min-h-[56px] resize-none flex-1 min-w-0"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="h-10 w-full sm:w-auto sm:px-3 shrink-0"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscogsMessages;
