import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Package } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { MenuItem } from '@shared/schema';

export default function SoldOutManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all menu items
  const { data: allMenuItems, isLoading } = useQuery({
    queryKey: ['/api/menu-items'],
    queryFn: () => apiRequest('/api/menu-items')
  });

  // Toggle sold-out status mutation
  const toggleSoldOutMutation = useMutation({
    mutationFn: async ({ itemId, soldOut }: { itemId: number; soldOut: boolean }) => {
      return await apiRequest(`/api/menu-items/${itemId}/sold-out`, 'PUT', { soldOut });
    },
    onSuccess: (updatedItem, { soldOut }) => {
      toast({
        title: soldOut ? "Marked as Sold Out" : "Marked as Available",
        description: `${updatedItem.name} has been updated`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update sold-out status",
        variant: "destructive"
      });
    }
  });

  const handleToggleSoldOut = (item: MenuItem) => {
    toggleSoldOutMutation.mutate({
      itemId: item.id,
      soldOut: !item.isSoldOut
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Sold Out Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading menu items...</div>
        </CardContent>
      </Card>
    );
  }

  const menuItems = allMenuItems as MenuItem[] || [];
  const soldOutItems = menuItems.filter(item => item.isSoldOut);
  const availableItems = menuItems.filter(item => !item.isSoldOut);

  // Group items by category for better organization
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Sold Out Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Available: {availableItems.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span>Sold Out: {soldOutItems.length}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="space-y-2">
                <h3 className="font-semibold text-lg capitalize">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((item) => (
                    <Card key={item.id} className={`${item.isSoldOut ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-600">${item.price}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={item.isSoldOut ? "destructive" : "secondary"}
                              className={item.isSoldOut ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}
                            >
                              {item.isSoldOut ? "Sold Out" : "Available"}
                            </Badge>
                            <Button
                              size="sm"
                              variant={item.isSoldOut ? "default" : "destructive"}
                              onClick={() => handleToggleSoldOut(item)}
                              disabled={toggleSoldOutMutation.isPending}
                            >
                              {item.isSoldOut ? "Mark Available" : "Mark Sold Out"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}