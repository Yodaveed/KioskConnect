import { Check, Home, Users, Plus, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrder } from "@/hooks/use-order";
import { useCart } from "@/hooks/use-cart";
import { useLocation } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function OrderConfirmation() {
  const { orderNumber, resetOrder } = useOrder();
  const { cartId, isActive, setCartId } = useCart();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateFriendlyCartId = () => {
    const adjectives = ['Fresh', 'Sweet', 'Cool', 'Tasty', 'Happy', 'Quick', 'Sunny', 'Smooth'];
    const nouns = ['Ice', 'Cream', 'Treat', 'Order', 'Cart', 'Table', 'Group', 'Party'];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 999) + 1;
    return `${randomAdj}${randomNoun}${number}`;
  };

  const handleStartNewOrder = () => {
    resetOrder();
    setLocation('/');
  };

  const handleAddToThisOrder = () => {
    if (!isActive) {
      // Create a new cart
      const newCartId = generateFriendlyCartId();
      setCartId(newCartId);
      toast({
        title: "Group Cart Created!",
        description: `Share "${newCartId}" with others to add their orders.`
      });
    }
    // Go back to home to add another order
    resetOrder();
    setLocation('/');
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

  return (
    <div className="text-center space-y-6">
      <Card className="shadow-lg max-w-md mx-auto">
        <CardContent className="p-12">
          <div className="w-20 h-20 bg-secondary rounded-full mx-auto mb-6 flex items-center justify-center">
            <Check className="text-3xl text-white" />
          </div>
          <h2 className="text-3xl font-bold text-dark-slate mb-4">Thank You!</h2>
          <p className="text-gray-600 text-lg mb-6">Your order is being prepared</p>
          
          {orderNumber && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">Order Number</p>
              <p className="text-2xl font-bold text-primary">#{orderNumber}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cart Status (if active) */}
      {isActive && (
        <Card className="max-w-md mx-auto bg-green-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-green-800 flex items-center justify-center gap-2">
              <Users className="h-5 w-5" />
              Group Cart: {cartId}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-green-700 text-sm mb-3">
              Your order has been added to the group cart
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={copyCartId}
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
              {copied ? 'Copied!' : 'Share Cart ID'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="max-w-md mx-auto space-y-3">
        <Button
          onClick={handleAddToThisOrder}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
        >
          <Plus className="h-4 w-4 mr-2" />
          {isActive ? 'Add Another Order' : 'Add to This Order'}
        </Button>
        
        <Button
          onClick={handleStartNewOrder}
          variant="outline"
          className="w-full px-8 py-3 rounded-full font-semibold"
        >
          <Home className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </div>

      {/* Help Text */}
      <Card className="max-w-md mx-auto bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-blue-800 text-sm">
            <strong>"{isActive ? 'Add Another Order' : 'Add to This Order'}"</strong> lets you {isActive ? 'continue adding orders to your group cart' : 'create a group cart and add more orders for friends and family'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
