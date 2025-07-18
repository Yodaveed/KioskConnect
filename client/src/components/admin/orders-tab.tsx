import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, DollarSign, User, Package, Search, Filter, RefreshCw, Printer } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@shared/schema";

export default function OrdersTab() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/orders"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest("PUT", `/api/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Success!",
        description: "Order status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  // SECURE ADMIN-ONLY REPRINT FUNCTIONALITY
  const reprintReceiptMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const token = localStorage.getItem('ic_pasta_admin_token');
      return await apiRequest("POST", `/api/print/reprint/${orderId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Receipt Reprinted",
        description: data.message || "Receipt has been sent to the thermal printer",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Reprint Failed", 
        description: error.message || "Failed to reprint receipt",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (orderId: number, newStatus: string) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const handleReprintReceipt = (orderId: number) => {
    reprintReceiptMutation.mutate(orderId);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary", text: "Pending", className: "bg-yellow-100 text-yellow-800" },
      preparing: { variant: "default", text: "Preparing", className: "bg-blue-100 text-blue-800" },
      completed: { variant: "default", text: "Completed", className: "bg-green-100 text-green-800" },
      cancelled: { variant: "destructive", text: "Cancelled", className: "bg-red-100 text-red-800" },
    };
    
    const config = variants[status as keyof typeof variants] || { variant: "outline", text: status, className: "" };
    
    return (
      <Badge className={config.className}>
        {config.text}
      </Badge>
    );
  };

  const formatOrderItems = (items: any) => {
    if (!items) return "No items";
    
    // Handle different order types
    if (items.menuType) {
      // New format with menuType
      return `${items.menuType} Order`;
    }
    
    if (items.cartId) {
      // Group cart order
      const customers = items.customers?.join(", ") || "Multiple customers";
      return `Group Cart (${items.itemCount} items) - ${customers}`;
    }
    
    // Legacy 3-step format
    const parts = [];
    if (items.base) parts.push(items.base.name);
    if (items.sauce) parts.push(items.sauce.name);
    if (items.toppings && items.toppings.length > 0) {
      parts.push(`${items.toppings.length} toppings`);
    }
    
    return parts.length > 0 ? parts.join(" + ") : "Custom order";
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    
    return date.toLocaleDateString();
  };

  const getOrderTotal = (order: Order) => {
    return parseFloat(order.totalAmount?.toString() || "0");
  };

  // Filter orders based on search and status
  const filteredOrders = orders.filter((order: Order) => {
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatOrderItems(order.items).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Order statistics
  const stats = {
    total: orders.length,
    pending: orders.filter((o: Order) => o.status === "pending").length,
    preparing: orders.filter((o: Order) => o.status === "preparing").length,
    completed: orders.filter((o: Order) => o.status === "completed").length,
    totalRevenue: orders.reduce((sum: number, o: Order) => sum + getOrderTotal(o), 0),
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-dark-slate">Orders</h2>
          <p className="text-gray-600">Manage and track all orders</p>
        </div>
        <Button 
          onClick={() => refetch()}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Preparing</p>
                <p className="text-2xl font-bold">{stats.preparing}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by order number, customer name, or items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || statusFilter !== "all" ? "No orders match your search" : "No orders found"}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order: Order) => (
                <Card key={order.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="font-semibold text-lg">#{order.orderNumber}</div>
                          {getStatusBadge(order.status)}
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(order.createdAt)}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          {order.customerName && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {order.customerName}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${getOrderTotal(order).toFixed(2)}
                          </div>
                        </div>
                        
                        <div className="text-sm">
                          <strong>Items:</strong> {formatOrderItems(order.items)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* SECURE REPRINT BUTTON - ADMIN ONLY */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReprintReceipt(order.id)}
                          disabled={reprintReceiptMutation.isPending}
                          title="Reprint receipt to thermal printer"
                          className="h-8 px-3"
                        >
                          <Printer className="h-3 w-3 mr-1" />
                          {reprintReceiptMutation.isPending ? "Printing..." : "Reprint"}
                        </Button>
                        
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
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}