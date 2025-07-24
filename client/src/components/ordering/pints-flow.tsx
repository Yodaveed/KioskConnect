import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobileSafeImage } from "@/components/ui/mobile-safe-image";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, ShoppingCart, Check, ArrowRight } from "lucide-react";
import { useOrder } from "@/hooks/use-order";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { debounce } from "@/lib/debounce";
import type { MenuItem } from "@shared/schema";

interface PintSelection {
  [key: number]: number; // pintId -> quantity
}

export default function PintsFlow() {
  const { setStep, setOrderNumber, resetOrder, selectedMenuId } = useOrder();
  const { isActive, addItem, setCartId } = useCart();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Create debounced version of addItem to prevent rapid API calls
  const debouncedAddItem = debounce(addItem, 300);
  const [selections, setSelections] = useState<PintSelection>({});

  const { data: pints = [], isLoading } = useQuery({
    queryKey: [`/api/menu/flavor?menuId=${selectedMenuId}`],
    enabled: !!selectedMenuId,
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

  const createOrderData = () => {
    return {
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
  };

  const submitOrderMutation = useMutation({
    mutationFn: async () => {
      const customerNameElement = document.querySelector('[data-customer-name]');
      const customerName = customerNameElement?.getAttribute('data-customer-name') || 'Unknown Customer';
      
      const orderData = {
        customerName,
        totalAmount: getTotalPrice().toFixed(2),
        items: createOrderData(),
      };

      const response = await apiRequest("POST", "/api/orders", orderData);
      return response;
    },
    onSuccess: (data) => {
      setOrderNumber(data.orderNumber);
      
      // Store order details for confirmation
      const orderForStorage = {
        menuType: "Pints",
        orderNumber: data.orderNumber,
        orderData: createOrderData(),
        totalPrice: getTotalPrice(),
        total: getTotalPrice()
      };
      localStorage.setItem('currentOrder', JSON.stringify(orderForStorage));
      
      // Clear selections
      setSelections({});
      
      // Go to confirmation
      setStep(4);
      
      toast({
        title: "Order Placed!",
        description: `Your pints order #${data.orderNumber} has been placed successfully.`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitOrder = () => {
    submitOrderMutation.mutate();
  };

  const handleAddToOrder = () => {
    const customOrder = createOrderData();
    
    if (!isActive) {
      // Create a new cart
      const generateFriendlyCartId = () => {
        const adjectives = ['Fresh', 'Sweet', 'Cool', 'Tasty', 'Happy', 'Quick', 'Sunny', 'Smooth'];
        const nouns = ['Ice', 'Cream', 'Treat', 'Order', 'Cart', 'Table', 'Group', 'Party'];
        const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        const randomNum = Math.floor(Math.random() * 999) + 1;
        return `${randomAdj}${randomNoun}${randomNum}`;
      };
      
      const newCartId = generateFriendlyCartId();
      setCartId(newCartId);
      
      const customerNameElement = document.querySelector('[data-customer-name]');
      const customerName = customerNameElement?.getAttribute('data-customer-name') || 'Unknown Customer';
      
      debouncedAddItem({
        customerName,
        menuType: "Pints",
        orderData: customOrder,
        totalPrice: getTotalPrice()
      });
      
      toast({
        title: "Group Cart Created!",
        description: `Your pints order has been added to cart "${newCartId}".`
      });
      
      // Reset selections
      setSelections({});
    } else {
      // Add to existing cart
      const customerNameElement = document.querySelector('[data-customer-name]');
      const customerName = customerNameElement?.getAttribute('data-customer-name') || 'Unknown Customer';
      
      debouncedAddItem({
        customerName,
        menuType: "Pints",
        orderData: customOrder,
        totalPrice: getTotalPrice()
      });
      
      toast({
        title: "Added to Cart!",
        description: "Your pints order has been added to the group cart."
      });
      
      // Reset selections
      setSelections({});
    }
    
    // Navigate back to home page to continue ordering
    resetOrder();
    setLocation('/');
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

  if (pints.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No pints available for this menu</p>
          <Button onClick={() => resetOrder() && setLocation('/')} variant="outline">
            Back to Menu Selection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-slate mb-2">Ice Cream Pints</h1>
        <p className="text-gray-600 text-lg">Take home your favorite flavors</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(pints as MenuItem[]).map((pint) => {
          const quantity = selections[pint.id] || 0;
          
          return (
            <Card key={pint.id} className="relative">
              <MobileSafeImage
                src={pint.imageUrl}
                alt={pint.name}
                className="w-full h-32 object-cover rounded-t-lg"
                fallbackIcon={<div className="text-4xl">🍨</div>}
              />
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

      {/* Order Summary */}
      {getTotalItems() > 0 && (
        <Card className="mt-8 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(selections).map(([pintId, qty]) => {
                const pint = (pints as MenuItem[]).find(p => p.id === Number(pintId));
                if (!pint || qty === 0) return null;
                
                return (
                  <div key={pintId} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{pint.name}</span>
                      <span className="text-gray-600 ml-2">x{qty}</span>
                    </div>
                    <div className="font-bold">
                      ${(parseFloat(pint.price.toString()) * qty).toFixed(2)}
                    </div>
                  </div>
                );
              })}
              
              <Separator />
              
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total ({getTotalItems()} items)</span>
                <span>${getTotalPrice().toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {getTotalItems() > 0 && (
        <div className="mt-8 flex gap-4 justify-end">
          <Button 
            variant="outline" 
            onClick={() => {
              resetOrder();
              setLocation('/');
            }}
          >
            Cancel
          </Button>
          
          <Button 
            onClick={handleAddToOrder}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isActive ? "Add to This Order" : "Start Group Order"}
          </Button>
          
          <Button 
            onClick={handleSubmitOrder}
            className="bg-gradient-to-r from-primary to-secondary text-white flex items-center gap-2"
          >
            {isActive ? "Submit Cart" : "Submit Order"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Empty State Message */}
      {getTotalItems() === 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">Select pint quantities to continue</p>
          <Button 
            variant="outline" 
            onClick={() => {
              resetOrder();
              setLocation('/');
            }}
          >
            Back to Menu Selection
          </Button>
        </div>
      )}
    </div>
  );
}