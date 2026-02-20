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

  const sendMessage = async () => {
    if (!selectedOrder || !newMessage.trim()) return;
    setSending(true);
    try {
      const session = await getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/discogs-order-message`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order_id: selectedOrder.id, message: newMessage }),
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
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl text-center space-y-4">
        <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">Discogs Messages</h1>
        <p className="text-muted-foreground">
          Koppel eerst je Discogs account om je order berichten te bekijken.
        </p>
        <Button onClick={() => navigate("/mijn-discogs")}>
          Ga naar Mijn Discogs
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            Discogs Messages
          </h1>
          <p className="text-sm text-muted-foreground">
            Order berichten voor {connection?.discogs_username}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchOrders(page)} disabled={loadingOrders}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loadingOrders ? "animate-spin" : ""}`} />
          Ververs
        </Button>
      </div>

      {/* Split layout: always 2 columns on desktop, stacked on mobile */}
      <div className="flex gap-4 h-[calc(100vh-220px)]">

        {/* LEFT: Orders list — hidden on mobile when order selected */}
        <div className={`flex flex-col w-full lg:w-80 xl:w-96 shrink-0 ${selectedOrder ? "hidden lg:flex" : "flex"}`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Orders <span className="text-xs text-muted-foreground">({orders.length})</span></h2>
          </div>

          {loadingOrders ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Geen orders gevonden</p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col flex-1 min-h-0">
              <ScrollArea className="flex-1">
                <div className="space-y-2 pr-2">
                  {orders.map((order) => (
                    <Card
                      key={order.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedOrder?.id === order.id
                          ? "ring-2 ring-primary border-primary"
                          : "hover:border-primary/30"
                      }`}
                      onClick={() => handleSelectOrder(order)}
                    >
                      <CardContent className="p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-medium">#{order.id}</span>
                          <Badge variant="outline" className={`text-[10px] ${statusColor(order.status)}`}>
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          Koper: {order.buyer?.username || "—"}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {order.created ? new Date(order.created).toLocaleDateString("nl-NL") : "—"}
                          </span>
                          <span className="font-semibold">
                            {order.total?.currency} {order.total?.value?.toFixed(2)}
                          </span>
                        </div>
                        {order.items?.[0] && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            {order.items[0].release?.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button
                    variant="outline" size="icon" className="h-8 w-8"
                    onClick={() => fetchOrders(page - 1)}
                    disabled={page <= 1 || loadingOrders}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
                  <Button
                    variant="outline" size="icon" className="h-8 w-8"
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

        {/* RIGHT: Messages panel */}
        <div className={`flex-1 min-w-0 ${selectedOrder ? "flex" : "hidden lg:flex"} flex-col`}>
          {!selectedOrder ? (
            <Card className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Selecteer een order</p>
                <p className="text-sm">Klik op een order om de berichten te bekijken</p>
              </div>
            </Card>
          ) : (
            <Card className="flex-1 flex flex-col min-h-0">
              {/* Header */}
              <CardHeader className="pb-3 border-b shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 lg:hidden"
                      onClick={() => setSelectedOrder(null)}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <CardTitle className="text-base">Order #{selectedOrder.id}</CardTitle>
                  </div>
                  <Badge variant="outline" className={statusColor(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span>Koper: <strong>{selectedOrder.buyer?.username}</strong></span>
                  <span>{selectedOrder.total?.currency} {selectedOrder.total?.value?.toFixed(2)}</span>
                  {selectedOrder.created && (
                    <span>{new Date(selectedOrder.created).toLocaleDateString("nl-NL")}</span>
                  )}
                </div>
                {selectedOrder.items?.[0] && (
                  <p className="text-xs text-muted-foreground">
                    📦 {selectedOrder.items[0].release?.description}
                  </p>
                )}
              </CardHeader>

              {/* Messages thread */}
              <ScrollArea className="flex-1 p-4">
                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>Nog geen berichten in deze order</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, i) => {
                      const isMe =
                        msg.from?.username === connection?.discogs_username ||
                        msg.actor?.username === connection?.discogs_username;
                      const senderName = msg.from?.username || msg.actor?.username || "Systeem";
                      const content = msg.message || msg.original || "";
                      return (
                        <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                              isMe ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[11px] font-semibold opacity-80">{senderName}</span>
                              {msg.timestamp && (
                                <span className="text-[10px] opacity-60">
                                  {new Date(msg.timestamp).toLocaleString("nl-NL", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              )}
                            </div>
                            {content && <p className="text-sm whitespace-pre-wrap">{content}</p>}
                            {msg.subject && (
                              <p className="text-[11px] opacity-60 mt-1 italic">{msg.subject}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Compose */}
              <div className="p-3 border-t shrink-0">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Typ je bericht..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="min-h-[60px] resize-none"
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
                    className="self-end"
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
  );
};

export default DiscogsMessages;
