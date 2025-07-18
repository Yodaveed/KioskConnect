import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useOrder } from "@/hooks/use-order";
import type { MenuItem, Menu } from "@shared/schema";

export default function StepOne() {
  const { toggleBase, setStep, order, selectedMenuId } = useOrder();

  const { data: baseItems = [], isLoading } = useQuery({
    queryKey: [`/api/menu/base?menuId=${selectedMenuId}`],
    enabled: !!selectedMenuId,
  });

  const { data: currentMenu } = useQuery({
    queryKey: ['/api/menus'],
    select: (menus: Menu[]) => menus.find(menu => menu.id === selectedMenuId),
  });

  const getPricingRules = () => {
    return currentMenu?.pricingRules || {};
  };

  const getBasePrice = (item: MenuItem, selectedCount: number) => {
    const rules = getPricingRules();
    const baseRules = rules.base || { freeLimit: 1, additionalPrice: 1.00 };
    
    const basePrice = parseFloat(item.price.toString());
    if (selectedCount > baseRules.freeLimit) {
      return basePrice + (baseRules.additionalPrice * (selectedCount - baseRules.freeLimit));
    }
    return basePrice;
  };

  const getSelectedBaseCount = () => {
    return order.bases.length;
  };

  const handleToggleBase = (item: MenuItem) => {
    // Don't allow selection of sold-out items
    if (item.isSoldOut) return;
    
    toggleBase({
      id: item.id,
      name: item.name,
      category: item.category,
      price: parseFloat(item.price.toString()),
      modifiers: [], // No modifiers for now - keep it simple
    });
  };

  const handleContinue = () => {
    setStep(2);
  };

  const handleSkip = () => {
    // Clear all bases and continue
    setStep(2);
  };

  const isBaseSelected = (itemId: number) => {
    return order.bases.some(base => base.id === itemId);
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
        <h2 className="text-3xl font-bold text-dark-slate mb-2">Choose Your Base</h2>
        <p className="text-gray-600 text-lg">Select your ice cream base flavor</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {baseItems.map((item: MenuItem) => {
          const isSelected = isBaseSelected(item.id);
          const price = parseFloat(item.price);

          return (
            <Card
              key={item.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isSelected
                  ? "border-2 border-primary shadow-lg bg-primary/5"
                  : "border-2 border-transparent hover:border-primary"
              }`}
              onClick={() => handleToggleBase(item)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => handleToggleBase(item)}
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
                        ${price.toFixed(2)}
                      </p>
                      {getSelectedBaseCount() >= 1 && (
                        <Badge variant="outline" className="text-xs">
                          +$1.00 after 1st
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

      <div className="mt-8 flex justify-end">
        <div className="flex gap-4">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="px-8 py-3 rounded-full font-medium"
          >
            Skip Bases
          </Button>
          <Button
            onClick={handleContinue}
            className="bg-gradient-to-r from-primary to-secondary text-white px-12 py-4 rounded-full text-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
          >
            Continue to Sauce
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}