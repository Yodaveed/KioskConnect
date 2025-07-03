import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { useOrder } from "@/hooks/use-order";
import { useCart } from "@/hooks/use-cart";
import type { MenuItem } from "@shared/schema";

interface PintSelection {
  [key: number]: number; // pintId -> quantity
}

export default function PintsFlow() {
  const { setStep, setOrderNumber, resetOrder, selectedMenuId } = useOrder();
  const { isActive, addItem } = useCart();
  const [selections, setSelections] = useState<PintSelection>({});

  const { data: pints = [], isLoading } = useQuery({
    queryKey: ["/api/menu/flavor", selectedMenuId],
    queryFn: () => fetch(`/api/menu/flavor?menuId=${selectedMenuId}`).then(res => res.json()),
    enabled: !!selectedMenuId, // Only run query when we have a menu ID
  });

  // Debug logging
  console.log('PintsFlow Debug:', {
    selectedMenuId,
    isLoading,
    pintsLength: pints.length,
    pints
  });

  const handleQuantityChange = (pintId: number, delta: number) => {
    setSelections(prev => {
      const newQuantity = Math.max(0, (prev[pintId] || 0) + delta);
      if (newQuantity === 0) {
        const { [pintId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [pintId]: newQuantity };
    });
  };

  const getTotalItems = () => {
    return Object.values(selections).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    return Object.entries(selections).reduce((sum, [pintId, qty]) => {
      const pint = (pints as MenuItem[]).find(p => p.id === Number(pintId));
      return sum + (pint ? parseFloat(pint.price.toString()) * qty : 0);
    }, 0);
  };

  const handleComplete = () => {
    const orderNumber = `PT${Date.now().toString().slice(-6)}`;
    setOrderNumber(orderNumber);
    
    const customOrder = {
      menuType: "pints",
      items: Object.entries(selections).map(([pintId, qty]) => {
        const pint = (pints as MenuItem[]).find(p => p.id === Number(pintId));
        return {
          item: pint,
          quantity: qty,
          subtotal: pint ? parseFloat(pint.price.toString()) * qty : 0
        };
      }),
      total: getTotalPrice()
    };
    
    // Add to cart if cart is active
    if (isActive) {
      // Get customer name from the DOM element set by OrderWrapper
      const customerNameElement = document.querySelector('[data-customer-name]');
      const customerName = customerNameElement?.getAttribute('data-customer-name') || 'Unknown Customer';
      
      // Add item to cart
      addItem({
        customerName,
        menuType: "Pints",
        orderData: customOrder,
        totalPrice: getTotalPrice()
      });
    }
    
    localStorage.setItem('currentOrder', JSON.stringify(customOrder));
    setStep(4); // Go to confirmation
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!selectedMenuId) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No menu selected</p>
          <Button onClick={() => setStep(0)} variant="outline">
            Go to Menu Selection
          </Button>
        </div>
      </div>
    );
  }

  if (pints.length === 0 && !isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No pints available for this menu</p>
          <Button onClick={() => setStep(0)} variant="outline">
            Go to Menu Selection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-slate mb-2">Ice Cream Pints</h1>
        <p className="text-gray-600">Take home your favorite flavors</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(pints as MenuItem[]).map((pint) => {
          const quantity = selections[pint.id] || 0;
          
          return (
            <Card key={pint.id} className="relative">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{pint.name}</CardTitle>
                {pint.description && (
                  <p className="text-sm text-gray-600">{pint.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl font-bold text-primary">
                    ${parseFloat(pint.price.toString()).toFixed(2)}
                  </div>
                  {pint.isPremium && (
                    <Badge variant="outline" className="text-accent border-accent">
                      Premium
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuantityChange(pint.id, -1)}
                      disabled={quantity === 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuantityChange(pint.id, 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {quantity > 0 && (
                    <div className="text-sm font-medium text-primary">
                      ${(parseFloat(pint.price.toString()) * quantity).toFixed(2)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cart Summary */}
      {getTotalItems() > 0 && (
        <Card className="mt-8 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(selections).map(([pintId, qty]) => {
                const pint = (pints as MenuItem[]).find(p => p.id === Number(pintId));
                if (!pint) return null;
                
                return (
                  <div key={pintId} className="flex justify-between items-center">
                    <span>{pint.name} × {qty}</span>
                    <span>${(parseFloat(pint.price.toString()) * qty).toFixed(2)}</span>
                  </div>
                );
              })}
              <Separator />
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total ({getTotalItems()} items)</span>
                <span>${getTotalPrice().toFixed(2)}</span>
              </div>
            </div>
            
            <Button 
              className="w-full mt-6 bg-primary hover:bg-primary/90"
              onClick={handleComplete}
            >
              Complete Order
              <ShoppingCart className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}