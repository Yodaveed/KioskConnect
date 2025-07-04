import { Edit, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOrder } from "@/hooks/use-order";
import { useCart } from "@/hooks/use-cart";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function OrderSummary() {
  const { order, totalPrice, setStep, setOrderNumber, selectedMenuId } = useOrder();
  const { isActive, addItem } = useCart();
  const { toast } = useToast();

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const orderData = {
        totalAmount: totalPrice.toFixed(2),
        items: {
          base: order.base,
          sauce: order.sauce,
          toppings: order.toppings,
        },
      };

      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: (data) => {
      setOrderNumber(data.orderNumber);
      
      // Add to cart if cart is active
      if (isActive) {
        // Get customer name from the DOM element set by OrderWrapper
        const customerNameElement = document.querySelector('[data-customer-name]');
        const customerName = customerNameElement?.getAttribute('data-customer-name') || 'Unknown Customer';
        
        console.log('Adding to cart:', {
          customerName,
          menuType: getMenuTypeName(),
          orderData: order,
          totalPrice: totalPrice,
          isActive
        });
        
        // Add item to cart
        addItem({
          customerName,
          menuType: getMenuTypeName(),
          orderData: order,
          totalPrice: totalPrice
        });
      }
      
      // Store order data in localStorage for potential cart addition
      const orderForStorage = {
        menuType: getMenuTypeName(),
        orderNumber: data.orderNumber,
        items: order,
        total: totalPrice
      };
      localStorage.setItem('currentOrder', JSON.stringify(orderForStorage));
      
      setStep(5);
      toast({
        title: "Order placed successfully!",
        description: `Order #${data.orderNumber} is being prepared`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to place order",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const getMenuTypeName = () => {
    // Get menu type name based on selectedMenuId
    const menuNames = {
      6: "Spaghetti",
      7: "Burger", 
      8: "Soup",
      9: "Pints",
      10: "Freeze Sticks"
    };
    return menuNames[selectedMenuId as keyof typeof menuNames] || "Custom Order";
  };

  const handlePlaceOrder = () => {
    placeOrderMutation.mutate();
  };

  const getBasePrice = () => {
    if (!order.base) return 0;
    let price = order.base.price;
    if (order.base.modifiers) {
      price += order.base.modifiers.reduce((sum, mod) => sum + mod.price, 0);
    }
    return price;
  };

  const getBaseDescription = () => {
    if (!order.base) return "";
    const modifiers = order.base.modifiers?.map(mod => mod.name).join(", ");
    return modifiers ? `With ${modifiers}` : "";
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-dark-slate mb-2">Order Summary</h2>
        <p className="text-gray-600 text-lg">Review your delicious creation before placing your order</p>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* Base */}
            {order.base && (
              <div className="flex justify-between items-center pb-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold text-dark-slate">{order.base.name} Base</h3>
                  {getBaseDescription() && (
                    <p className="text-gray-600">{getBaseDescription()}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">${getBasePrice().toFixed(2)}</div>
                </div>
              </div>
            )}

            {/* Sauce */}
            {order.sauce && (
              <div className="flex justify-between items-center pb-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold text-dark-slate">{order.sauce.name}</h3>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">${order.sauce.price.toFixed(2)}</div>
                </div>
              </div>
            )}

            {/* Toppings */}
            {order.toppings.length > 0 && (
              <div className="pb-4 border-b">
                <h3 className="text-lg font-semibold text-dark-slate mb-3">Toppings</h3>
                <div className="space-y-2">
                  {order.toppings.map((topping) => (
                    <div key={topping.id} className="flex justify-between">
                      <span className="text-gray-600">• {topping.name}</span>
                      <span className={topping.price > 0 ? "text-primary font-semibold" : "text-gray-600"}>
                        {topping.price > 0 ? `+$${topping.price.toFixed(2)}` : "Included"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-center text-2xl font-bold">
              <span className="text-dark-slate">Total</span>
              <span className="text-primary">${totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex space-x-4">
            <Button
              onClick={() => setStep(3)}
              variant="outline"
              className="flex-1 py-4 rounded-full font-semibold"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Order
            </Button>
            <Button
              onClick={handlePlaceOrder}
              disabled={placeOrderMutation.isPending}
              className="flex-1 bg-gradient-to-r from-primary to-secondary text-white py-4 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {placeOrderMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Placing Order...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Place Order
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
