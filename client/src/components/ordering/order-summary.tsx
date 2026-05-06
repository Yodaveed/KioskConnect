import { Edit, Check, Send, ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ORDER_STEPS, useOrder } from "@/hooks/use-order";
import { useCart } from "@/hooks/use-cart";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { debounce } from "@/lib/debounce";
import { buildOrderPayload, requireCustomerName } from "@/lib/order-payload";

export default function OrderSummary() {
  const { order, totalPrice, setStep, setOrderNumber, selectedMenuId, resetOrder } = useOrder();
  const { isActive, addItem, setCartId, items, clearCart, getCartTotal } = useCart();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Create debounced version of addItem to prevent rapid API calls
  const debouncedAddItem = debounce(addItem, 300);

  const getMenuTypeName = () => {
    switch(selectedMenuId) {
      case 6: return "Spaghetti";
      case 7: return "Burger";
      case 8: return "Soup";
      default: return "Ice Cream";
    }
  };

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      if (!order.base) {
        throw new Error("Please select a base before placing the order.");
      }

      const orderData = buildOrderPayload({
        customerName: order.customerName,
        totalAmount: totalPrice,
        items: {
          base: order.base,
          sauces: order.sauces,
          toppings: order.toppings,
        },
        menuType: getMenuTypeName(),
        source: "kiosk",
      });

      const response = await apiRequest("POST", "/api/orders", orderData);
      return response;
    },
    onSuccess: (data) => {
      setOrderNumber(data.orderNumber);
      
      // Add to cart if cart is active
      if (isActive) {
        // Use the customer name persisted by OrderWrapper in the order draft
        const customerName = requireCustomerName(order.customerName);
        
        // Add item to cart (debounced to prevent rapid calls)
        debouncedAddItem({
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
        orderData: {
          base: order.base,
          sauces: order.sauces,
          toppings: order.toppings,
          totalAmount: totalPrice.toFixed(2)
        },
        totalPrice: totalPrice,
        total: totalPrice
      };
      
      localStorage.setItem('currentOrder', JSON.stringify(orderForStorage));
      
      setStep(ORDER_STEPS.CONFIRMATION);
      toast({
        title: "Order Placed!",
        description: `Your order #${data.orderNumber} has been confirmed.`
      });
    },
    onError: (error) => {
      toast({
        title: "Order Failed",
        description: error instanceof Error ? error.message : "There was an error placing your order. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmitCart = async () => {
    if (!isActive || items.length === 0) {
      toast({
        title: "Cart is Empty",
        description: "Please add items to your cart before submitting.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Submit all cart items as individual orders
      for (const item of items) {
        const orderData = {
          ...buildOrderPayload({
            customerName: item.customerName,
            totalAmount: item.totalPrice,
            items: item.orderData,
            menuType: item.menuType,
            source: "group-cart",
          })
        };
        
        await apiRequest("POST", "/api/orders", orderData);
      }
      
      toast({
        title: "Cart Submitted!",
        description: `Successfully submitted ${items.length} orders totaling $${getCartTotal().toFixed(2)}`
      });
      
      clearCart();
      resetOrder();
      setLocation('/');
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your cart. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddToOrder = () => {
    let customerName: string;
    try {
      customerName = requireCustomerName(order.customerName);
    } catch (error) {
      toast({
        title: "Customer Name Required",
        description: error instanceof Error ? error.message : "Please enter a customer name before adding to a group order.",
        variant: "destructive",
      });
      return;
    }

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
      
      // Add the current order to the cart with the order draft customer name
      const orderDataForCart = {
        base: order.base,
        sauces: order.sauces,
        toppings: order.toppings,
        totalAmount: totalPrice.toFixed(2)
      };
      
      debouncedAddItem({
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-dark-slate mb-2">Order Summary</h2>
        <p className="text-gray-600 text-lg">Review your order before placing it</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Your {getMenuTypeName()} Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Base Selection */}
          {order.base && (
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold">{order.base.name}</h4>
                <p className="text-sm text-gray-600">Base</p>
              </div>
              <div className="text-right">
                <div className="font-bold">${order.base.price.toFixed(2)}</div>
                {order.base.modifiers && order.base.modifiers.length > 0 && (
                  <div className="text-sm text-gray-600">
                    {order.base.modifiers.map(mod => `+${mod.name}`).join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sauce Selection */}
          {order.sauces.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Sauces</h4>
                {order.sauces.map((sauce, index) => (
                  <div key={index} className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span>{sauce.name}</span>
                      {sauce.price > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Premium
                        </Badge>
                      )}
                    </div>
                    <div className="font-medium">
                      {sauce.price > 0 ? `+$${sauce.price.toFixed(2)}` : "Included"}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Toppings */}
          {order.toppings.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Toppings</h4>
                {order.toppings.map((topping, index) => (
                  <div key={index} className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span>{topping.name}</span>
                      {topping.price > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Premium
                        </Badge>
                      )}
                    </div>
                    <div className="font-medium">
                      {topping.price > 0 ? `+$${topping.price.toFixed(2)}` : "Included"}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <Separator />
          
          {/* Subtotal */}
          <div className="flex justify-between items-center">
            <span>Subtotal</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          
          {/* Tax & Fees (showing $0 for transparency) */}
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Tax & Fees</span>
            <span>$0.00</span>
          </div>
          
          {/* Total */}
          <div className="flex justify-between items-center text-xl font-bold border-t pt-2 mt-2">
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          
          {/* Error state */}
          {placeOrderMutation.isError && (
            <div className="text-red-600 mt-2 p-2 bg-red-50 rounded" role="alert" aria-live="polite">
              Order submission failed. Please try again or see staff for assistance.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-4 justify-between">
          <Button
            onClick={() => setStep(ORDER_STEPS.TOPPINGS)}
            variant="outline"
            className="flex-1"
            aria-label="Edit order and return to previous step"
          >
            <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
            Edit Order
          </Button>
          
          {isActive && (
            <Button
              onClick={handleSubmitCart}
              className="flex-1 bg-green-600 hover:bg-green-700"
              aria-label={`Submit group cart with total of $${getCartTotal().toFixed(2)}`}
            >
              <Send className="mr-2 h-4 w-4" aria-hidden="true" />
              Submit Cart (${getCartTotal().toFixed(2)})
            </Button>
          )}
        </div>

        <div className="flex gap-4">
          {!isActive && (
            <Button
              onClick={handleAddToOrder}
              variant="outline"
              className="flex-1"
              aria-label="Start a new group order with this item"
            >
              <Users className="mr-2 h-4 w-4" aria-hidden="true" />
              Start Group Order
            </Button>
          )}
          
          <Button
            onClick={() => placeOrderMutation.mutate()}
            disabled={placeOrderMutation.isPending || !order.base}
            className="flex-1 bg-gradient-to-r from-primary to-secondary text-white disabled:from-gray-400 disabled:to-gray-500"
            aria-label={
              placeOrderMutation.isPending 
                ? "Placing order, please wait" 
                : !order.base 
                  ? "Order incomplete - please select required items"
                  : isActive 
                    ? "Add this order to the current group cart" 
                    : "Place individual order"
            }
          >
            {placeOrderMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true"></div>
                Placing Order...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                {isActive ? "Add to This Order" : "Place Order"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}