import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Package, Plus, Edit, Archive, TrendingUp, TrendingDown, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  parLevel: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface InventoryAdjustment {
  id: number;
  inventoryItemId: number;
  adjustment: number;
  reason: string;
  note: string;
  userId: number;
  createdAt: string;
}

export default function AdminInventory() {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: 0,
    unit: "",
    parLevel: 0
  });
  
  const [adjustment, setAdjustment] = useState({
    adjustment: 0,
    reason: "",
    note: ""
  });
  
  const [editItem, setEditItem] = useState({
    name: "",
    quantity: 0,
    unit: "",
    parLevel: 0
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch inventory data
  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ["/api/inventory"],
  });
  
  // Fetch adjustment log
  const { data: logData } = useQuery({
    queryKey: ["/api/inventory-log"],
    enabled: isLogOpen,
  });
  
  // Create inventory item mutation
  const createItemMutation = useMutation({
    mutationFn: (data: typeof newItem) => apiRequest("/api/inventory", {
      method: "POST",
      body: data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setIsCreateOpen(false);
      setNewItem({ name: "", quantity: 0, unit: "", parLevel: 0 });
      toast({
        title: "Success",
        description: "Inventory item created successfully",
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
  
  // Update inventory item mutation
  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof editItem }) => apiRequest(`/api/inventory/${id}`, {
      method: "PUT",
      body: data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setIsEditOpen(false);
      setSelectedItem(null);
      toast({
        title: "Success",
        description: "Inventory item updated successfully",
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
  
  // Archive inventory item mutation
  const archiveItemMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/inventory/${id}`, {
      method: "DELETE"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Success",
        description: "Inventory item archived successfully",
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
  
  // Adjust inventory mutation
  const adjustInventoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof adjustment }) => apiRequest(`/api/inventory/${id}/adjust`, {
      method: "POST",
      body: data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setIsAdjustOpen(false);
      setSelectedItem(null);
      setAdjustment({ adjustment: 0, reason: "", note: "" });
      toast({
        title: "Success",
        description: "Inventory adjusted successfully",
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
  
  const handleCreateItem = () => {
    if (!newItem.name || !newItem.unit) {
      toast({
        title: "Error",
        description: "Name and unit are required",
        variant: "destructive",
      });
      return;
    }
    createItemMutation.mutate(newItem);
  };
  
  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setEditItem({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      parLevel: item.parLevel
    });
    setIsEditOpen(true);
  };
  
  const handleUpdateItem = () => {
    if (!selectedItem || !editItem.name || !editItem.unit) {
      toast({
        title: "Error",
        description: "Name and unit are required",
        variant: "destructive",
      });
      return;
    }
    updateItemMutation.mutate({ id: selectedItem.id, data: editItem });
  };
  
  const handleAdjustItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsAdjustOpen(true);
  };
  
  const handleSubmitAdjustment = () => {
    if (!selectedItem || adjustment.adjustment === 0 || !adjustment.reason) {
      toast({
        title: "Error",
        description: "Adjustment amount and reason are required",
        variant: "destructive",
      });
      return;
    }
    adjustInventoryMutation.mutate({ id: selectedItem.id, data: adjustment });
  };
  
  const handleArchiveItem = (id: number) => {
    if (window.confirm("Are you sure you want to archive this item?")) {
      archiveItemMutation.mutate(id);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading inventory...</div>
      </div>
    );
  }
  
  const inventory = inventoryData?.inventory || [];
  const lowStock = inventoryData?.lowStock || [];
  const adjustmentLog = logData?.data || [];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <div className="flex gap-2">
          <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                View Log
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Inventory Adjustment Log</DialogTitle>
                <DialogDescription>
                  History of all inventory adjustments
                </DialogDescription>
              </DialogHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item ID</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>User ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustmentLog.map((entry: InventoryAdjustment) => (
                    <TableRow key={entry.id}>
                      <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{entry.inventoryItemId}</TableCell>
                      <TableCell>
                        <span className={entry.adjustment > 0 ? "text-green-600" : "text-red-600"}>
                          {entry.adjustment > 0 ? "+" : ""}{entry.adjustment}
                        </span>
                      </TableCell>
                      <TableCell>{entry.reason}</TableCell>
                      <TableCell>{entry.note}</TableCell>
                      <TableCell>{entry.userId}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Inventory Item</DialogTitle>
                <DialogDescription>
                  Add a new item to track in inventory
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    placeholder="Enter item name"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      value={newItem.unit}
                      onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                      placeholder="oz, each, box"
                    />
                  </div>
                  <div>
                    <Label htmlFor="parLevel">Par Level</Label>
                    <Input
                      id="parLevel"
                      type="number"
                      value={newItem.parLevel}
                      onChange={(e) => setNewItem({...newItem, parLevel: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateItem}
                  disabled={createItemMutation.isPending}
                >
                  {createItemMutation.isPending ? "Creating..." : "Create Item"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Low Stock Alerts */}
      {lowStock.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-700">
              <AlertCircle className="w-5 h-5 mr-2" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStock.map((item: InventoryItem) => (
                <div key={item.id} className="flex justify-between items-center">
                  <span>{item.name}</span>
                  <Badge variant="destructive">
                    {item.quantity} {item.unit} (Par: {item.parLevel})
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Current Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Par Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item: InventoryItem) => (
                <TableRow key={item.id} className={item.quantity <= item.parLevel ? "bg-red-50" : ""}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{item.parLevel}</TableCell>
                  <TableCell>
                    {item.quantity <= item.parLevel ? (
                      <Badge variant="destructive">Low Stock</Badge>
                    ) : (
                      <Badge variant="default">OK</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAdjustItem(item)}
                      >
                        {item.quantity <= item.parLevel ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleArchiveItem(item.id)}
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Edit Item Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>
              Update item details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="editName">Name</Label>
              <Input
                id="editName"
                value={editItem.name}
                onChange={(e) => setEditItem({...editItem, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="editQuantity">Quantity</Label>
                <Input
                  id="editQuantity"
                  type="number"
                  value={editItem.quantity}
                  onChange={(e) => setEditItem({...editItem, quantity: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label htmlFor="editUnit">Unit</Label>
                <Input
                  id="editUnit"
                  value={editItem.unit}
                  onChange={(e) => setEditItem({...editItem, unit: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="editParLevel">Par Level</Label>
                <Input
                  id="editParLevel"
                  type="number"
                  value={editItem.parLevel}
                  onChange={(e) => setEditItem({...editItem, parLevel: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateItem}
              disabled={updateItemMutation.isPending}
            >
              {updateItemMutation.isPending ? "Updating..." : "Update Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Adjust Inventory Dialog */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Inventory</DialogTitle>
            <DialogDescription>
              {selectedItem && `Adjust quantity for ${selectedItem.name} (Current: ${selectedItem.quantity} ${selectedItem.unit})`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="adjustAmount">Amount (+ to add, - to remove)</Label>
              <Input
                id="adjustAmount"
                type="number"
                value={adjustment.adjustment}
                onChange={(e) => setAdjustment({...adjustment, adjustment: parseInt(e.target.value) || 0})}
                placeholder="Enter positive or negative number"
              />
            </div>
            <div>
              <Label htmlFor="adjustReason">Reason</Label>
              <Select 
                value={adjustment.reason}
                onValueChange={(value) => setAdjustment({...adjustment, reason: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason for adjustment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="waste">Waste/Spoilage</SelectItem>
                  <SelectItem value="manual sale">Manual Sale</SelectItem>
                  <SelectItem value="comp">Comp/Free Item</SelectItem>
                  <SelectItem value="inventory count">Inventory Count</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="adjustNote">Note (optional)</Label>
              <Textarea
                id="adjustNote"
                value={adjustment.note}
                onChange={(e) => setAdjustment({...adjustment, note: e.target.value})}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitAdjustment}
              disabled={adjustInventoryMutation.isPending}
            >
              {adjustInventoryMutation.isPending ? "Adjusting..." : "Submit Adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}