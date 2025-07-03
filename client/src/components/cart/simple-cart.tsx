import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Users, ShoppingCart, Plus } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';

export default function SimpleCart() {
  const [newCartId, setNewCartId] = useState('');
  const { 
    cartId, 
    items, 
    isActive, 
    setCartId, 
    removeItem, 
    clearCart, 
    getCartTotal 
  } = useCart();

  const generateCartId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 6);
    return `cart_${timestamp}_${randomStr}`;
  };

  const handleCreateCart = () => {
    const id = generateCartId();
    setCartId(id);
    setNewCartId('');
  };

  const handleJoinCart = () => {
    if (newCartId.trim()) {
      setCartId(newCartId.trim());
      setNewCartId('');
    }
  };

  const customers = Array.from(new Set(items.map(item => item.customerName)));

  return (
    <div className="space-y-4">
      {!isActive ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Group Cart
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Create a new cart for your group or join an existing one.
            </p>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="cartId">Cart ID</Label>
                <Input
                  id="cartId"
                  placeholder="Enter cart ID to join"
                  value={newCartId}
                  onChange={(e) => setNewCartId(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleJoinCart} disabled={!newCartId.trim()} className="flex-1">
                  Join Cart
                </Button>
                <Button onClick={handleCreateCart} variant="outline" className="flex-1">
                  <Plus className="h-4 w-4 mr-1" />
                  New Cart
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Cart: {cartId}
                </div>
                <Badge>${getCartTotal().toFixed(2)}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {items.length} item{items.length !== 1 ? 's' : ''} • {customers.length} customer{customers.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          {items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Cart Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{item.customerName}</div>
                        <div className="text-sm text-gray-600">{item.menuType}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>${item.totalPrice.toFixed(2)}</Badge>
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
          )}

          <Card>
            <CardContent className="pt-6">
              <Button onClick={clearCart} variant="outline" className="w-full">
                Clear Cart
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}