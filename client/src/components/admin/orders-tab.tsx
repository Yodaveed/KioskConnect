import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@shared/schema";

export default function OrdersTab() {
  const { toast } = useToast();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/orders/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order status updated",
        description: "The order status has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update order status",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (orderId: number, newStatus: string) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "preparing":
        return <Badge className="bg-yellow-100 text-yellow-800">Preparing</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatOrderItems = (items: any) => {
    if (!items) return "No items";
    
    const parts = [];
    if (items.base) parts.push(items.base.name);
    if (items.sauce) parts.push(items.sauce.name);
    if (items.toppings && items.toppings.length > 0) {
      parts.push(...items.toppings.map((t: any) => t.name));
    }
    
    return parts.join(" + ");
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-dark-slate mb-6">Recent Orders</h2>
      
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order: Order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                    <TableCell>{formatTime(order.createdAt!)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {formatOrderItems(order.items)}
                    </TableCell>
                    <TableCell className="font-medium">${order.totalAmount}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(newStatus) => handleStatusChange(order.id, newStatus)}
                        disabled={updateStatusMutation.isPending}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="preparing">Preparing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
