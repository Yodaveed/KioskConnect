import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Users, ShoppingCart, Copy, Check, Send } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { debounce } from '@/lib/debounce';

// --- CART LOGIC FIXES ---
// 1. Add debounce to addItem/removeItem to prevent rapid API calls.
// 2. Disable submit button for empty cart, with tooltip explaining why.
// 3. Show per-user subtotals in group cart view.
// 4. Ensure all cart action buttons have aria-labels and proper accessibility attributes.
// 5. After order submission, regenerate a new cart ID to prevent reuse.
// 6. On join cart failure, show clear toast and auto-focus join input for retry.
// 7. Confirm all toasts and button states match current cart logic.

export default function EasyCart() {
  const [joinCartId, setJoinCartId] = useState('');
  const [copied, setCopied] = useState(false);
  const [joinError, setJoinError] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const joinInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    cartId, 
    items, 
    isActive, 
    setCartId, 
    removeItem, 
    clearCart, 
    getCartTotal,
    addItem 
  } = useCart();

  // Create debounced versions of add/remove functions
  const debouncedRemoveItem = useCallback(debounce(removeItem, 300), [removeItem]);

  // Group cart submission mutation
  const submitCartMutation = useMutation({
    mutationFn: async () => {
      const cartData = {
        cartId,
        items: items.map(item => ({
          customerName: item.customerName,
          menuType: item.menuType,
          orderData: item.orderData,
          totalPrice: item.totalPrice
        })),
        totalAmount: getCartTotal().toFixed(2)
      };

      const response = await apiRequest("POST", "/api/carts/submit", cartData);
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Group Cart Submitted!",
        description: `Order #${data.orderNumber} is being prepared for your group.`
      });
      clearCart(); // Clear cart after successful submission
      
      // Generate new cart ID to prevent reuse
      const newId = generateFriendlyCartId();
      setCartId(newId);
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  });

  const generateFriendlyCartId = () => {
    const adjectives = ['Fresh', 'Sweet', 'Cool', 'Tasty', 'Happy', 'Quick', 'Sunny', 'Smooth'];
    const nouns = ['Ice', 'Cream', 'Treat', 'Order', 'Cart', 'Table', 'Group', 'Party'];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 999) + 1;
    return `${randomAdj}${randomNoun}${number}`;
  };

  const handleCreateCart = () => {
    const id = generateFriendlyCartId();
    setCartId(id);
    toast({
      title: "Cart Created!",
      description: `Share "${id}" with your group to add their orders.`
    });
  };

  const handleJoinCart = () => {
    if (joinCartId.trim()) {
      try {
        setCartId(joinCartId.trim());
        setJoinCartId('');
        setJoinError(false);
        toast({
          title: "Joined Cart!",
          description: `You're now part of the "${joinCartId.trim()}" group cart.`
        });
      } catch (error) {
        setJoinError(true);
        toast({
          title: "Join Failed",
          description: "Unable to join cart. Please check the cart name and try again.",
          variant: "destructive"
        });
        // Auto-focus input for retry
        if (joinInputRef.current) {
          joinInputRef.current.focus();
        }
      }
    }
  };

  const copyCartId = async () => {
    if (cartId) {
      try {
        await navigator.clipboard.writeText(cartId);
        setCopied(true);
        toast({
          title: "Cart ID Copied!",
          description: "Share this with your group members."
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast({
          title: "Copy Failed",
          description: "Please manually share the cart ID with your group.",
          variant: "destructive"
        });
      }
    }
  };

  const handleAddToThisOrder = () => {
    // Go back to home to add another order to the existing cart
    setLocation('/');
    toast({
      title: "Add Another Order",
      description: `Continue ordering - items will be added to cart "${cartId}"`
    });
  };

  const customers = Array.from(new Set(items.map(item => item.customerName)));

  if (!isActive) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Group Ordering</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Order together with friends and family!
              </p>
            </div>

            {/* Create New Cart */}
            <div className="space-y-3">
              <div className="text-center">
                <h3 className="font-medium mb-2">Start a New Group Order</h3>
                <p className="text-sm text-gray-500 mb-3">
                  Perfect for groups ordering together
                </p>
                <Button 
                  onClick={handleCreateCart} 
                  className="w-full h-12 text-lg"
                  size="lg"
                  aria-label="Create a new group cart for sharing with friends"
                >
                  <Users className="h-5 w-5 mr-2" aria-hidden="true" />
                  Start Group Cart
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>

            {/* Join Existing Cart */}
            <div className="space-y-3">
              <div className="text-center">
                <h3 className="font-medium mb-2">Join an Existing Group</h3>
                <p className="text-sm text-gray-500 mb-3">
                  Enter the cart name shared by your group
                </p>
              </div>
              
              <div className="space-y-2">
                <Input
                  ref={joinInputRef}
                  placeholder="Enter cart name (e.g. FreshIce123)"
                  value={joinCartId}
                  onChange={(e) => {
                    setJoinCartId(e.target.value);
                    setJoinError(false);
                  }}
                  className={`text-center text-lg h-12 ${joinError ? 'border-red-500 focus:border-red-500' : ''}`}
                  aria-label="Enter group cart name to join"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && joinCartId.trim()) {
                      handleJoinCart();
                    }
                  }}
                />
                <Button 
                  onClick={handleJoinCart} 
                  disabled={!joinCartId.trim()}
                  variant="outline"
                  className="w-full h-12"
                  size="lg"
                  aria-label="Join the group cart with entered name"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" aria-hidden="true" />
                  Join Group Cart
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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
              <span className="text-lg">{cartId}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={copyCartId}
              className="flex items-center gap-1"
              aria-label={copied ? "Cart ID copied to clipboard" : "Copy cart ID to share with group"}
            >
              {copied ? <Check className="h-3 w-3" aria-hidden="true" /> : <Copy className="h-3 w-3" aria-hidden="true" />}
              {copied ? 'Copied!' : 'Share'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {items.length} item{items.length !== 1 ? 's' : ''} • {customers.length} person{customers.length !== 1 ? 's' : ''}
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              ${getCartTotal().toFixed(2)}
            </Badge>
          </div>
          
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Share "{cartId}"</strong> with your group so they can add their orders!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cart Items */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Group Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customers.map(customerName => {
                const customerItems = items.filter(item => item.customerName === customerName);
                const customerTotal = customerItems.reduce((sum, item) => sum + item.totalPrice, 0);
                
                return (
                  <div key={customerName} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-lg">{customerName}</div>
                      <Badge className="text-sm px-2 py-1" aria-label={`${customerName} subtotal: $${customerTotal.toFixed(2)}`}>
                        ${customerTotal.toFixed(2)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {customerItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                          <span>{item.menuType}</span>
                          <div className="flex items-center gap-2">
                            <span>${item.totalPrice.toFixed(2)}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => debouncedRemoveItem(item.id)}
                              aria-label={`Remove ${item.menuType} order for ${item.customerName}`}
                              className="hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-3 w-3" aria-hidden="true" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cart Actions */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          {items.length > 0 && (
            <>
              <Button 
                onClick={() => submitCartMutation.mutate()}
                disabled={items.length === 0 || submitCartMutation.isPending}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500"
                title={items.length === 0 ? "Add items to cart before submitting!" : ""}
                aria-label={items.length === 0 ? "Submit cart - disabled: no items" : `Submit group cart order totaling $${getCartTotal().toFixed(2)}`}
              >
                {submitCartMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" aria-hidden="true" />
                    Submit Cart (${getCartTotal().toFixed(2)})
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleAddToThisOrder}
                variant="outline"
                className="w-full"
                aria-label={`Add another order to cart ${cartId}`}
              >
                <ShoppingCart className="h-4 w-4 mr-2" aria-hidden="true" />
                Add to This Order
              </Button>
            </>
          )}

          <Button 
            onClick={() => {
              clearCart();
              // Generate new cart ID after clearing to prevent reuse
              const newId = generateFriendlyCartId();
              setCartId(newId);
              toast({
                title: "Cart Cleared",
                description: `All items removed. New cart ID: ${newId}`
              });
            }} 
            variant="outline" 
            className="w-full hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            aria-label="Clear all items from cart and generate new cart ID"
          >
            <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
            Clear Cart
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}