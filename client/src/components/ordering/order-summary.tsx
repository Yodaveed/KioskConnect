import { Edit, Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOrder } from "@/hooks/use-order";
import { useCart } from "@/hooks/use-cart";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function OrderSummary() {
  const { order, totalPrice, setStep, setOrderNumber, selectedMenuId, resetOrder } = useOrder();
  const { isActive, addItem, setCartId, items, clearCart, getCartTotal } = useCart();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

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
        total: totalPrice,
        // Store in the same format as other flows
        customerName: '', // Will be populated by order confirmation
        orderData: {
          base: order.base,
          sauce: order.sauce,
          toppings: order.toppings,
          totalAmount: totalPrice.toFixed(2)
        }
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

  const handleAddToOrder = () => {
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
      
      // Add the current order to the cart - get customer name from OrderWrapper
      const customerNameElement = document.querySelector('[data-customer-name]');
      const customerName = customerNameElement?.getAttribute('data-customer-name') || 'Unknown Customer';
      
      const orderDataForCart = {
        base: order.base,
        sauce: order.sauce,
        toppings: order.toppings,
        totalAmount: totalPrice.toFixed(2)
      };
      
      addItem({
        customerName,
        menuType: getMenuTypeName(),
        orderData: orderDataForCart,
        totalPrice: totalPrice
      });
      
      toast({
        title: "Group Cart Created!",
        description: `Your order has been added to cart "${newCartId}". Share this ID with your group.`
      });
    }
    
    // Reset order and go back to home
    resetOrder();
    setLocation('/');
  };

  const handleSubmitCart = async () => {
    try {
      const cartData = {
        items: items.map(item => ({
          customerName: item.customerName,
          menuType: item.menuType,
          orderData: item.orderData,
          totalPrice: item.totalPrice
        })),
        totalAmount: getCartTotal().toFixed(2)
      };

      const response = await apiRequest("POST", "/api/carts/submit", cartData);
      const data = await response.json();
      
      toast({
        title: "Group Cart Submitted!",
        description: `Order #${data.orderNumber} is being prepared for your group.`
      });
      
      clearCart();
      resetOrder();
      setLocation('/order-confirmation');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit cart. Please try again.",
        variant: "destructive"
      });
    }
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
          <div className="mt-8 flex flex-col space-y-4">
            <div className="flex space-x-4">
              {/* Show different buttons based on cart state */}
              {!isActive ? (
                <>
                  <Button
                    onClick={handlePlaceOrder}
                    disabled={placeOrderMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-primary to-secondary text-white py-4 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {placeOrderMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Submit Order
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleAddToOrder}
                    disabled={placeOrderMutation.isPending}
                    variant="outline"
                    className="flex-1 py-4 rounded-full font-semibold"
                  >
                    Add to This Order
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleSubmitCart}
                    disabled={placeOrderMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {placeOrderMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Cart
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleAddToOrder}
                    disabled={placeOrderMutation.isPending}
                    variant="outline"
                    className="flex-1 py-4 rounded-full font-semibold"
                  >
                    Add to This Order
                  </Button>
                </>
              )}
            </div>
            <Button
              onClick={() => setStep(3)}
              variant="outline"
              className="w-full py-3 rounded-full font-medium"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Order
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
