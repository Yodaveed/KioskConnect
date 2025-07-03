import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Edit3, User, DollarSign, Clock, ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import CustomerNameForm from '@/components/ordering/customer-name-form';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function CartViewer() {
  const { 
    cartId, 
    items, 
    isActive, 
    removeItem, 
    updateItem, 
    getCartTotal, 
    getItemsByCustomer,
    clearCart 
  } = useCart();
  
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const { toast } = useToast();

  // Get unique customers in the cart
  const customers = Array.from(new Set(items.map(item => item.customerName)));

  // Submit order mutation
  const submitOrderMutation = useMutation({
    mutationFn: async (customerName: string) => {
      const customerItems = getItemsByCustomer(customerName);
      const totalAmount = customerItems.reduce((sum, item) => sum + item.totalPrice, 0);
      
      return await apiRequest('/api/orders', 'POST', {
        orderNumber: `ORD${Date.now()}`,
        customerName,
        status: 'pending',
        totalAmount,
        items: customerItems
      });
    },
    onSuccess: (order, customerName) => {
      toast({
        title: "Order Submitted!",
        description: `Order for ${customerName} has been submitted successfully.`
      });
      
      // Remove submitted items from cart
      const customerItems = getItemsByCustomer(customerName);
      customerItems.forEach(item => removeItem(item.id));
      
      setShowSubmitDialog(false);
      setSelectedCustomer('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit order. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmitOrder = (customerName: string) => {
    submitOrderMutation.mutate(customerName);
  };

  const handleSubmitAllOrders = () => {
    customers.forEach(customer => {
      submitOrderMutation.mutate(customer);
    });
  };

  if (!isActive || !cartId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            No Active Cart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Create or join a cart to start ordering.</p>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart: {cartId}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Your cart is empty. Add some items to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cart Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart: {cartId}
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              ${getCartTotal().toFixed(2)}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Orders by Customer */}
      {customers.map(customerName => {
        const customerItems = getItemsByCustomer(customerName);
        const customerTotal = customerItems.reduce((sum, item) => sum + item.totalPrice, 0);
        
        return (
          <Card key={customerName} className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {customerName}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">${customerTotal.toFixed(2)}</Badge>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        onClick={() => setSelectedCustomer(customerName)}
                      >
                        Submit Order
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Submit Order for {customerName}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="text-sm text-gray-600">
                          Total: ${customerTotal.toFixed(2)}
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium">Items:</h4>
                          {customerItems.map(item => (
                            <div key={item.id} className="text-sm p-2 bg-gray-50 rounded">
                              {item.menuType} - ${item.totalPrice.toFixed(2)}
                            </div>
                          ))}
                        </div>
                        <Button 
                          onClick={() => handleSubmitOrder(customerName)}
                          disabled={submitOrderMutation.isPending}
                          className="w-full"
                        >
                          {submitOrderMutation.isPending ? "Submitting..." : "Confirm Order"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {customerItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.menuType}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">${item.totalPrice.toFixed(2)}</Badge>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Submit All Orders */}
      {customers.length > 1 && (
        <Card>
          <CardContent className="pt-6">
            <Button 
              onClick={handleSubmitAllOrders}
              disabled={submitOrderMutation.isPending}
              className="w-full"
              size="lg"
            >
              Submit All Orders (${getCartTotal().toFixed(2)})
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Clear Cart */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            onClick={clearCart}
            variant="outline"
            className="w-full"
          >
            Clear Cart
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}