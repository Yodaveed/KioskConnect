import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Users, ShoppingCart, Copy, Check } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';

export default function EasyCart() {
  const [joinCartId, setJoinCartId] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const { 
    cartId, 
    items, 
    isActive, 
    setCartId, 
    removeItem, 
    clearCart, 
    getCartTotal 
  } = useCart();

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
      setCartId(joinCartId.trim());
      setJoinCartId('');
      toast({
        title: "Joined Cart!",
        description: `You're now part of the "${joinCartId.trim()}" group cart.`
      });
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
                >
                  <Users className="h-5 w-5 mr-2" />
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
                  placeholder="Enter cart name (e.g. FreshIce123)"
                  value={joinCartId}
                  onChange={(e) => setJoinCartId(e.target.value)}
                  className="text-center text-lg h-12"
                />
                <Button 
                  onClick={handleJoinCart} 
                  disabled={!joinCartId.trim()}
                  variant="outline"
                  className="w-full h-12"
                  size="lg"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
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
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
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
                      <Badge>${customerTotal.toFixed(2)}</Badge>
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
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
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
        <CardContent className="pt-6 space-y-2">
          <Button 
            onClick={() => {
              clearCart();
              toast({
                title: "Cart Cleared",
                description: "All items have been removed from the cart."
              });
            }} 
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