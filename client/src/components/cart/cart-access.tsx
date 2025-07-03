import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, ShoppingCart, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Cart } from '@shared/schema';

interface CartAccessProps {
  onCartLoaded?: (cart: Cart) => void;
}

export default function CartAccess({ onCartLoaded }: CartAccessProps) {
  const [cartId, setCartId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate unique cart ID
  const generateCartId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `cart_${timestamp}_${randomStr}`;
  };

  // Create new cart mutation
  const createCartMutation = useMutation({
    mutationFn: async (data: { cartId: string }) => {
      return await apiRequest('/api/carts', 'POST', {
        cartId: data.cartId,
        items: [],
        totalAmount: 0
      });
    },
    onSuccess: (cart) => {
      toast({
        title: "Cart Created",
        description: `Cart ID: ${cart.cartId}. Share this with your group!`
      });
      setCartId(cart.cartId);
      onCartLoaded?.(cart);
      setIsCreating(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create cart",
        variant: "destructive"
      });
    }
  });

  // Load existing cart query
  const { data: cart, isLoading } = useQuery({
    queryKey: ['/api/carts', cartId],
    enabled: !!cartId && !isCreating,
    queryFn: async () => {
      if (!cartId) return null;
      try {
        const response = await apiRequest(`/api/carts/${cartId}`);
        return response;
      } catch (error) {
        return null;
      }
    }
  });

  const handleCreateCart = () => {
    const newCartId = generateCartId();
    setCartId(newCartId);
    setIsCreating(true);
    createCartMutation.mutate({ cartId: newCartId });
  };

  const handleJoinCart = () => {
    if (!cartId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a cart ID",
        variant: "destructive"
      });
      return;
    }
    // Query will automatically trigger and load the cart
  };

  const handleCartLoaded = (loadedCart: Cart) => {
    if (loadedCart) {
      toast({
        title: "Cart Loaded",
        description: `Joined cart with ${Array.isArray(loadedCart.items) ? loadedCart.items.length : 0} items`
      });
      onCartLoaded?.(loadedCart);
    } else {
      toast({
        title: "Cart Not Found",
        description: "The cart ID you entered doesn't exist",
        variant: "destructive"
      });
    }
  };

  // Effect to handle cart loading
  if (cart && !isLoading) {
    handleCartLoaded(cart);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Group Cart Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            Create a new cart for your group or join an existing one by entering the cart ID.
          </div>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="cartId">Cart ID</Label>
              <Input
                id="cartId"
                type="text"
                placeholder="Enter cart ID to join existing cart"
                value={cartId}
                onChange={(e) => setCartId(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleJoinCart}
                disabled={!cartId.trim() || isLoading}
                className="flex-1"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Join Cart
              </Button>
              
              <Button 
                onClick={handleCreateCart}
                disabled={createCartMutation.isPending}
                variant="outline"
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Cart
              </Button>
            </div>
          </div>
          
          {cart && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-green-800">Cart Active</div>
                  <div className="text-sm text-green-600">
                    ID: {cart.cartId}
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {Array.isArray(cart.items) ? cart.items.length : 0} items
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}