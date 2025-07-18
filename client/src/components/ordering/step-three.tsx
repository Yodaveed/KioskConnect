import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useOrder } from "@/hooks/use-order";
import type { MenuItem, Menu } from "@shared/schema";

export default function StepThree() {
  const { toggleTopping, setStep, order, selectedMenuId } = useOrder();

  const { data: toppingItems = [], isLoading } = useQuery({
    queryKey: [`/api/menu/topping?menuId=${selectedMenuId}`],
    enabled: !!selectedMenuId,
  });

  const { data: currentMenu } = useQuery({
    queryKey: ['/api/menus'],
    select: (menus: Menu[]) => menus.find(menu => menu.id === selectedMenuId),
  });

  const getPricingRules = () => {
    return currentMenu?.pricingRules || {};
  };

  const getSelectedToppingsCount = () => {
    return order.toppings.length;
  };

  const getToppingPrice = (item: MenuItem, selectedCount: number) => {
    const rules = getPricingRules();
    const toppingRules = rules.topping || { freeLimit: 4, additionalPrice: 0.25 };
    
    const basePrice = parseFloat(item.price.toString());
    if (selectedCount > toppingRules.freeLimit) {
      return basePrice + (toppingRules.additionalPrice * (selectedCount - toppingRules.freeLimit));
    }
    return basePrice;
  };

  const handleToggleTopping = (item: MenuItem) => {
    // Don't allow selection of sold-out items
    if (item.isSoldOut) return;
    
    toggleTopping({
      id: item.id,
      name: item.name,
      category: item.category,
      price: parseFloat(item.price.toString()),
    });
  };

  const handleContinue = () => {
    setStep(4);
  };

  const handleSkip = () => {
    // Clear all toppings and continue
    // Note: This would require a method to clear toppings, for now just continue
    setStep(4);
  };

  const isToppingSelected = (itemId: number) => {
    return order.toppings.some(topping => topping.id === itemId);
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
        <p className="text-gray-600 text-lg">Select up to 4 toppings (additional toppings +$0.25 each)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {toppingItems.map((item: MenuItem) => {
          const isSelected = isToppingSelected(item.id);
          const price = parseFloat(item.price);

          return (
            <Card
              key={item.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isSelected
                  ? "border-2 border-primary shadow-lg bg-primary/5"
                  : "border-2 border-transparent hover:border-primary"
              }`}
              onClick={() => handleToggleTopping(item)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => handleToggleTopping(item)}
                    disabled={item.isSoldOut}
                    className="text-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-dark-slate">{item.name}</h4>
                      {item.isPremium && (
                        <Badge variant="outline" className="text-accent border-accent text-xs">
                          Premium
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-primary">
                        {price > 0 ? `+$${price.toFixed(2)}` : "Included"}
                      </p>
                      {getSelectedToppingsCount() >= 4 && (
                        <Badge variant="outline" className="text-xs">
                          +$0.25 after 4th
                        </Badge>
                      )}
                    </div>
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
        
        <div className="flex gap-4">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="px-8 py-3 rounded-full font-medium"
          >
            Skip Toppings
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
    </div>
  );
}