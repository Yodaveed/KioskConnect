import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Search, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import InventoryUpdater from "@/components/admin/inventory-updater";

interface InventoryItem {
  id: number;
  name: string;
  category?: string;
  currentStock?: number;
  minimumStock?: number;
  isLowStock?: boolean;
  createdAt?: string;
  quantity?: number; // Alternative field name
  parLevel?: number; // Alternative field name
}

export default function InventoryTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inventoryResponse, isLoading } = useQuery({
    queryKey: ["/api/inventory"],
  });

  // Handle different response formats from the API
  const inventoryItems = Array.isArray(inventoryResponse) 
    ? inventoryResponse 
    : inventoryResponse?.inventory || [];

  const categories = ["all", ...new Set(inventoryItems.map(item => item.category || "uncategorized").filter(Boolean))];
  
  const filteredItems = inventoryItems.filter(item => {
    if (!item || !item.name) return false;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const itemCategory = item.category || "uncategorized";
    const matchesCategory = selectedCategory === "all" || itemCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = inventoryItems.filter(item => item && (item.isLowStock || (item.quantity && item.parLevel && item.quantity <= item.parLevel)));
  const totalItems = inventoryItems.length;
  const outOfStockItems = inventoryItems.filter(item => item && ((item.currentStock || 0) === 0 || (item.quantity || 0) === 0));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3">Loading inventory...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-dark-slate">Inventory Management</h2>
          <p className="text-gray-600 mt-2">Monitor and manage your inventory levels</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <Package className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold">{totalItems}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{outOfStockItems.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <Package className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Stock</p>
              <p className="text-2xl font-bold text-green-600">{totalItems - outOfStockItems.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Inventory Updater */}
      <InventoryUpdater />

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search inventory items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === "all" ? "All Categories" : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items ({filteredItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Minimum Stock</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {(item.category || "uncategorized").charAt(0).toUpperCase() + (item.category || "uncategorized").slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${
                        (item.currentStock || item.quantity || 0) === 0 ? 'text-red-600' : 
                        (item.isLowStock || (item.quantity && item.parLevel && item.quantity <= item.parLevel)) ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {item.currentStock || item.quantity || 0}
                      </span>
                    </TableCell>
                    <TableCell>{item.minimumStock || item.parLevel || 0}</TableCell>
                    <TableCell>
                      {(item.currentStock || item.quantity || 0) === 0 ? (
                        <Badge variant="destructive">Out of Stock</Badge>
                      ) : (item.isLowStock || (item.quantity && item.parLevel && item.quantity <= item.parLevel)) ? (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Low Stock</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">In Stock</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No inventory items found matching your criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}