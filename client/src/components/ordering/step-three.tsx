import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useOrder } from "@/hooks/use-order";
import type { MenuItem } from "@shared/schema";

export default function StepThree() {
  const { toggleTopping, setStep, order } = useOrder();

  const { data: toppingItems = [], isLoading } = useQuery({
    queryKey: ["/api/menu/topping"],
  });

  const handleToggleTopping = (item: MenuItem) => {
    toggleTopping({
      id: item.id,
      name: item.name,
      category: item.category,
      price: parseFloat(item.price),
    });
  };

  const handleContinue = () => {
    setStep(4);
  };

  const isToppingSelected = (itemId: number) => {
    return order.toppings.some((topping) => topping.id === itemId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-dark-slate mb-2">Choose Your Toppings</h2>
        <p className="text-gray-600 text-lg">Select multiple toppings to customize your creation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {toppingItems.map((item: MenuItem) => {
          const isSelected = isToppingSelected(item.id);
          const isPremium = item.isPremium;
          const price = parseFloat(item.price);

          return (
            <Card
              key={item.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isSelected
                  ? `border-2 ${isPremium ? "border-accent" : "border-secondary"} shadow-lg`
                  : `border-2 border-transparent ${isPremium ? "hover:border-accent" : "hover:border-secondary"}`
              }`}
              onClick={() => handleToggleTopping(item)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => handleToggleTopping(item)}
                    className={isPremium ? "text-accent" : "text-secondary"}
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-dark-slate">{item.name}</h4>
                    <p className={`text-sm ${isPremium ? "text-accent font-semibold" : "text-gray-600"}`}>
                      {price > 0 ? `+$${price.toFixed(2)}` : "Included"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 flex justify-between">
        <Button
          onClick={() => setStep(2)}
          variant="outline"
          className="px-8 py-3 rounded-full font-medium"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sauce
        </Button>
        <Button
          onClick={handleContinue}
          className="bg-gradient-to-r from-primary to-secondary text-white px-12 py-4 rounded-full text-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
        >
          Review Order
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
