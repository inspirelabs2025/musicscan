import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Send, MessageSquare, Package, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDiscogsConnection } from "@/hooks/useDiscogsConnection";
import { useLanguage } from "@/contexts/LanguageContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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

  // Fetch orders
  const fetchOrders = async (p = 1) => {
    setLoadingOrders(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Niet ingelogd");

      const res = await fetch(
        `https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/discogs-fetch-orders`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ page: p, per_page: 25 }),
        }
      );

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

  // Fetch messages for an order
  const fetchMessages = async (orderId: string) => {
    setLoadingMessages(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Niet ingelogd");

      const res = await fetch(
        `https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/discogs-order-message`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ order_id: orderId, mode: "list" }),
        }
      );

      if (!res.ok) throw new Error("Berichten ophalen mislukt");
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error: any) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    } finally {
      setLoadingMessages(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!selectedOrder || !newMessage.trim()) return;
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Niet ingelogd");

      const res = await fetch(
        `https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/discogs-order-message`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ order_id: selectedOrder.id, message: newMessage }),
        }
      );

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
    <div className="container mx-auto px-4 py-6 max-w-6xl">
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

      <div className="grid grid-cols-1 gap-6">
        {/* Orders list - hidden when an order is selected on mobile */}
        <div className={`space-y-3 ${selectedOrder ? "hidden lg:block" : ""}`}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Orders</h2>
            <span className="text-xs text-muted-foreground">{orders.length} orders</span>
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
            <>
              <ScrollArea className="h-[calc(100vh-280px)]">
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
                            {new Date(order.created).toLocaleDateString("nl-NL")}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button
                    variant="outline"
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
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => fetchOrders(page + 1)}
                    disabled={page >= totalPages || loadingOrders}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Messages panel - shown when order is selected */}
        {selectedOrder && (
          <div>
            <Card className="flex flex-col h-[calc(100vh-280px)]">
               <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedOrder(null)}>
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <CardTitle className="text-base">
                      Order #{selectedOrder.id}
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className={statusColor(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Koper: <strong>{selectedOrder.buyer?.username}</strong></span>
                  <span>{selectedOrder.total?.currency} {selectedOrder.total?.value?.toFixed(2)}</span>
                  <span>{new Date(selectedOrder.created).toLocaleDateString("nl-NL")}</span>
                </div>
                {selectedOrder.items?.[0] && (
                  <p className="text-xs text-muted-foreground mt-1">
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
                    <p>Nog geen berichten</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, i) => {
                      const isMe = msg.from?.username === connection?.discogs_username ||
                                   msg.actor?.username === connection?.discogs_username;
                      return (
                        <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                              isMe
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[11px] font-semibold opacity-80">
                                {msg.from?.username || msg.actor?.username || "Systeem"}
                              </span>
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
                            {msg.message && <p className="text-sm whitespace-pre-wrap">{msg.message}</p>}
                            {msg.original && !msg.message && (
                              <p className="text-sm whitespace-pre-wrap">{msg.original}</p>
                            )}
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
              <div className="p-3 border-t">
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
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscogsMessages;
