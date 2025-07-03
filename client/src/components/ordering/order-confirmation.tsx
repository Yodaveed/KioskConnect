import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOrder } from "@/hooks/use-order";

export default function OrderConfirmation() {
  const { orderNumber, resetOrder } = useOrder();

  const handleStartNewOrder = () => {
    resetOrder();
  };

  return (
    <div className="text-center">
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
          
          <Button
            onClick={handleStartNewOrder}
            className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
          >
            Start New Order
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
