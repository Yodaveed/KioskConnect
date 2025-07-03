import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, ArrowRight, ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import type { Menu } from '@shared/schema';

interface OrderWrapperProps {
  menu: Menu;
  children: React.ReactNode;
  onAddToCart?: (customerName: string, orderData: any, totalPrice: number) => void;
}

export default function OrderWrapper({ menu, children, onAddToCart }: OrderWrapperProps) {
  const [customerName, setCustomerName] = useState('');
  const [hasEnteredName, setHasEnteredName] = useState(false);
  const { isActive, addItem } = useCart();

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerName.trim()) {
      setHasEnteredName(true);
    }
  };

  if (!hasEnteredName) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-center">
              <User className="h-5 w-5" />
              Enter Your Name for {menu.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div className="text-sm text-gray-600 text-center">
                Please enter your name so we can track your order in the cart.
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customerName">Name</Label>
                <Input
                  id="customerName"
                  type="text"
                  placeholder="Enter your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="text-center"
                  autoFocus
                />
              </div>

              {isActive && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-800">
                    <ShoppingCart className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Adding to group cart
                    </span>
                  </div>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={!customerName.trim()}
              >
                Start {menu.name} Order
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Clone children and pass down the customer name and cart functionality
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-800">
            <User className="h-4 w-4" />
            <span className="font-medium">Ordering for: {customerName}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHasEnteredName(false)}
          >
            Change Name
          </Button>
        </div>
      </div>
      
      {/* Pass the customer name and add-to-cart functionality to children */}
      <div data-customer-name={customerName}>
        {children}
      </div>
    </div>
  );
}