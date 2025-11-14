import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ShoppingBag, Clock, Euro, Calendar, RefreshCw } from "lucide-react";
import { useAdminShopOrders, useOrderStatistics, AdminShopOrder } from "@/hooks/useAdminShopOrders";
import { OrderDetailDialog } from "@/components/admin/OrderDetailDialog";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

const STATUS_COLORS = {
  pending: "default",
  processing: "default",
  shipped: "default",
  completed: "default",
  cancelled: "destructive",
} as const;

const PAYMENT_STATUS_COLORS = {
  pending: "secondary",
  paid: "default",
  failed: "destructive",
  refunded: "secondary",
} as const;

export default function ShopOrders() {
  const { data: orders, isLoading, refetch } = useAdminShopOrders();
  const stats = useOrderStatistics(orders);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<AdminShopOrder | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyer_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || order.payment_status === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const handleRowClick = (order: AdminShopOrder) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shop Orders</h1>
          <p className="text-muted-foreground">Beheer alle winkelbestellingen</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Vernieuwen
        </Button>
      </div>

      {/* Statistics Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">Totaal Orders</div>
            </div>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">Totale Omzet</div>
            </div>
            <div className="text-2xl font-bold">€{stats.totalRevenue.toFixed(2)}</div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">Vandaag</div>
            </div>
            <div className="text-2xl font-bold">{stats.ordersToday}</div>
          </Card>
        </div>
      ) : null}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek op order ID, email of naam..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statussen</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle betalingen</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Orders Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Koper</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Totaal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Betaling</TableHead>
              <TableHead>Datum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredOrders && filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(order)}
                >
                  <TableCell className="font-mono text-xs">
                    {order.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.buyer_name}</div>
                      <div className="text-xs text-muted-foreground">{order.buyer_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.shop_order_items?.length || 0} items
                  </TableCell>
                  <TableCell>
                    €{order.total_amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || "default"}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={PAYMENT_STATUS_COLORS[order.payment_status as keyof typeof PAYMENT_STATUS_COLORS] || "default"}>
                      {order.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: nl })}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Geen orders gevonden
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <OrderDetailDialog
        order={selectedOrder}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
