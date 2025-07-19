import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Receipt, Plus, Minus, Trash2, DollarSign } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  parLevel: number;
}

interface TicketItem {
  inventoryItemId: number;
  quantity: number;
  name?: string;
  unit?: string;
  availableQuantity?: number;
}

export default function ManualTicketEntry() {
  const [ticketItems, setTicketItems] = useState<TicketItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [note, setNote] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch inventory data
  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ["/api/inventory"],
  });
  
  // Submit manual ticket mutation
  const submitTicketMutation = useMutation({
    mutationFn: (data: {
      items: TicketItem[];
      totalAmount: number;
      customerName?: string;
      note?: string;
    }) => apiRequest("/api/manual-ticket", {
      method: "POST",
      body: data
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      
      // Reset form
      setTicketItems([]);
      setCustomerName("");
      setTotalAmount(0);
      setNote("");
      
      toast({
        title: "Success",
        description: `Manual ticket ${data.data.orderNumber} created successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const inventory: InventoryItem[] = inventoryData?.data?.inventory || [];
  
  // Filter inventory based on search term
  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    item.quantity > 0 // Only show items with stock
  );
  
  const addItemToTicket = (item: InventoryItem) => {
    const existingIndex = ticketItems.findIndex(ti => ti.inventoryItemId === item.id);
    
    if (existingIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...ticketItems];
      const currentQty = updatedItems[existingIndex].quantity;
      
      if (currentQty >= item.quantity) {
        toast({
          title: "Warning",
          description: `Cannot add more ${item.name}. Only ${item.quantity} ${item.unit} available.`,
          variant: "destructive",
        });
        return;
      }
      
      updatedItems[existingIndex].quantity += 1;
      setTicketItems(updatedItems);
    } else {
      // Add new item to ticket
      const newTicketItem: TicketItem = {
        inventoryItemId: item.id,
        quantity: 1,
        name: item.name,
        unit: item.unit,
        availableQuantity: item.quantity
      };
      setTicketItems([...ticketItems, newTicketItem]);
    }
  };
  
  const updateItemQuantity = (inventoryItemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItemFromTicket(inventoryItemId);
      return;
    }
    
    const item = inventory.find(i => i.id === inventoryItemId);
    if (item && newQuantity > item.quantity) {
      toast({
        title: "Warning",
        description: `Cannot exceed available quantity of ${item.quantity} ${item.unit}`,
        variant: "destructive",
      });
      return;
    }
    
    setTicketItems(items =>
      items.map(item =>
        item.inventoryItemId === inventoryItemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };
  
  const removeItemFromTicket = (inventoryItemId: number) => {
    setTicketItems(items => items.filter(item => item.inventoryItemId !== inventoryItemId));
  };
  
  const handleSubmitTicket = () => {
    if (ticketItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the ticket",
        variant: "destructive",
      });
      return;
    }
    
    if (totalAmount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid total amount",
        variant: "destructive",
      });
      return;
    }
    
    const ticketData = {
      items: ticketItems.map(item => ({
        inventoryItemId: item.inventoryItemId,
        quantity: item.quantity
      })),
      totalAmount,
      customerName: customerName || undefined,
      note: note || undefined,
    };
    
    submitTicketMutation.mutate(ticketData);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading inventory...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center">
          <Receipt className="w-8 h-8 mr-3" />
          Manual Ticket Entry
        </h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Inventory */}
        <Card>
          <CardHeader>
            <CardTitle>Available Inventory</CardTitle>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {filteredInventory.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 border rounded hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">
                        {item.quantity} {item.unit} available
                        {item.quantity <= item.parLevel && (
                          <Badge variant="destructive" className="ml-2">Low Stock</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addItemToTicket(item)}
                      disabled={item.quantity === 0}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                {filteredInventory.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    {searchTerm ? "No items match your search" : "No inventory items available"}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Current Ticket */}
        <Card>
          <CardHeader>
            <CardTitle>Current Ticket</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name (Optional)</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="totalAmount">Total Amount ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="totalAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="note">Note (Optional)</Label>
                  <Textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>
              </div>
              
              {/* Ticket Items */}
              <div>
                <h3 className="font-medium mb-2">Items</h3>
                {ticketItems.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ticketItems.map((item) => (
                        <TableRow key={item.inventoryItemId}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-xs text-gray-500">
                                {item.availableQuantity} {item.unit} available
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateItemQuantity(item.inventoryItemId, item.quantity - 1)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                max={item.availableQuantity}
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(item.inventoryItemId, parseInt(e.target.value) || 1)}
                                className="w-16 text-center"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateItemQuantity(item.inventoryItemId, item.quantity + 1)}
                                disabled={item.quantity >= (item.availableQuantity || 0)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeItemFromTicket(item.inventoryItemId)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No items added yet. Select items from the inventory list.
                  </div>
                )}
              </div>
              
              {/* Submit Button */}
              <div className="pt-4 border-t">
                <Button
                  onClick={handleSubmitTicket}
                  disabled={submitTicketMutation.isPending || ticketItems.length === 0 || totalAmount <= 0}
                  className="w-full"
                  size="lg"
                >
                  {submitTicketMutation.isPending ? (
                    "Submitting Ticket..."
                  ) : (
                    `Submit Ticket - $${totalAmount.toFixed(2)}`
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}