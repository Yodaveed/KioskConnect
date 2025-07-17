import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Droplet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOrder } from "@/hooks/use-order";
import type { MenuItem, Menu } from "@shared/schema";

export default function StepTwo() {
  const { selectSauce, setStep, order, selectedMenuId } = useOrder();

  const { data: sauceItems = [], isLoading } = useQuery({
    queryKey: ['/api/menu/sauce', selectedMenuId],
    enabled: !!selectedMenuId,
  });

  const { data: currentMenu } = useQuery({
    queryKey: ['/api/menus'],
    select: (menus: Menu[]) => menus.find(menu => menu.id === selectedMenuId),
  });

  const getPricingRules = () => {
    return currentMenu?.pricingRules || {};
  };

  const getSelectedSauceCount = () => {
    return order.sauce ? 1 : 0;
  };

  const getSaucePrice = (item: MenuItem, selectedCount: number) => {
    const rules = getPricingRules();
    const sauceRules = rules.sauce || { freeLimit: 2, additionalPrice: 0.25 };
    
    const basePrice = parseFloat(item.price.toString());
    if (selectedCount > sauceRules.freeLimit) {
      return basePrice + (sauceRules.additionalPrice * (selectedCount - sauceRules.freeLimit));
    }
    return basePrice;
  };

  const handleSelectSauce = (item: MenuItem) => {
    // Don't allow selection of sold-out items
    if (item.isSoldOut) return;
    
    selectSauce({
      id: item.id,
      name: item.name,
      category: item.category,
      price: parseFloat(item.price.toString()),
    });
  };

  const handleContinue = () => {
    // Allow continuing even without sauce selection (optional)
    setStep(3);
  };

  const handleSkip = () => {
    // Clear sauce selection and continue
    selectSauce(null);
    setStep(3);
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
        <h2 className="text-3xl font-bold text-dark-slate mb-2">Choose Your Sauce</h2>
        <p className="text-gray-600 text-lg">Select up to 2 sauces (additional sauces +$0.25 each)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sauceItems.map((item: MenuItem) => (
          <Card
            key={item.id}
            className={`transition-all duration-200 ${
              item.isSoldOut
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:shadow-lg"
            } ${
              order.sauce?.id === item.id
                ? "border-2 border-primary shadow-lg bg-primary/5"
                : "border-2 border-transparent hover:border-primary"
            }`}
            onClick={() => handleSelectSauce(item)}
          >
            <CardContent className="p-6 text-center">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-16 h-16 rounded-full mx-auto mb-4 object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-secondary/10 to-secondary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Droplet className="text-2xl text-secondary" />
                </div>
              )}
              
              <h3 className="text-lg font-semibold text-dark-slate mb-2">{item.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{item.description}</p>
              
              <div className="flex items-center justify-center gap-2 mb-2">
                {item.isSoldOut && (
                  <Badge variant="destructive" className="text-xs">
                    SOLD OUT
                  </Badge>
                )}
                {item.isPremium && (
                  <Badge variant="secondary" className="text-xs">
                    Premium
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="text-primary font-bold text-lg">+${parseFloat(item.price.toString()).toFixed(2)}</div>
                {getSelectedSauceCount() >= 2 && (
                  <Badge variant="outline" className="text-xs">
                    +$0.25 after 2nd
                  </Badge>
                )}
              </div>
              
              {item.isPremium && (
                <Badge variant="outline" className="text-accent border-accent">
                  Premium
                </Badge>
              )}
              
              {order.sauce?.id === item.id && (
                <div className="mt-2">
                  <Badge variant="default" className="bg-primary text-white">
                    Selected
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex justify-between">
        <Button
          onClick={() => setStep(1)}
          variant="outline"
          className="px-8 py-3 rounded-full font-medium"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Base
        </Button>
        
        <div className="flex gap-4">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="px-8 py-3 rounded-full font-medium"
          >
            Skip Sauce
          </Button>
          <Button
            onClick={handleContinue}
            className="bg-gradient-to-r from-primary to-secondary text-white px-12 py-4 rounded-full text-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
          >
            Continue to Toppings
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}