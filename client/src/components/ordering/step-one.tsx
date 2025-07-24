import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobileSafeImage } from "@/components/ui/mobile-safe-image";
import { useOrder } from "@/hooks/use-order";
import type { MenuItem, Menu } from "@shared/schema";

export default function StepOne() {
  const { selectBase, setStep, order, selectedMenuId } = useOrder();

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

  const handleSelectBase = (item: MenuItem) => {
    // Don't allow selection of sold-out items
    if (item.isSoldOut) return;
    
    selectBase({
      id: item.id,
      name: item.name,
      category: item.category,
      price: parseFloat(item.price.toString()),
      modifiers: [], // No modifiers for now - keep it simple
    });
  };

  const handleContinue = () => {
    if (order.base) {
      setStep(2);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" aria-hidden="true"></div>
        <span className="sr-only">Loading base options...</span>
      </div>
    );
  }

  if (baseItems.length === 0) {
    return (
      <div className="text-center py-16" role="alert">
        <h2 className="text-2xl font-bold text-gray-600 mb-4">No Base Options Available</h2>
        <p className="text-gray-500">Please check back later or contact staff for assistance.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-dark-slate mb-2">Choose Your Base</h2>
        <p className="text-gray-600 text-lg">Select your ice cream base flavor</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="group" aria-label="Base flavor options">
        {baseItems.map((item: MenuItem) => (
          <Card
            key={item.id}
            tabIndex={item.isSoldOut ? -1 : 0}
            role="button"
            aria-label={`${item.name} base flavor, $${parseFloat(item.price).toFixed(2)}${item.isSoldOut ? ' - sold out' : ''}${order.base?.id === item.id ? ' - selected' : ''}`}
            aria-pressed={order.base?.id === item.id}
            aria-disabled={item.isSoldOut}
            className={`transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              item.isSoldOut
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:shadow-lg"
            } ${
              order.base?.id === item.id
                ? "border-2 border-primary shadow-lg bg-primary/5"
                : "border-2 border-transparent hover:border-primary"
            }`}
            onClick={() => handleSelectBase(item)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectBase(item);
              }
            }}
          >
            <CardContent className="p-6 text-center">
              <MobileSafeImage
                src={item.imageUrl}
                alt={`${item.name} ice cream base`}
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover shadow-md"
                fallbackIcon={<div className="text-4xl" aria-hidden="true">🍨</div>}
              />
              
              <h3 className="text-xl font-semibold text-dark-slate mb-2">{item.name}</h3>
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
                <div className="text-primary font-bold text-lg">${parseFloat(item.price).toFixed(2)}</div>
                {item.isPremium && (
                  <Badge variant="outline" className="text-accent border-accent">
                    Premium
                  </Badge>
                )}
              </div>
              
              {order.base?.id === item.id && (
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

      <div className="mt-8 flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={!order.base}
          aria-label={!order.base ? "Select a base flavor to continue" : "Continue to sauce selection"}
          title={!order.base ? "Select a base flavor to continue" : ""}
          className="bg-gradient-to-r from-primary to-secondary text-white px-12 py-4 rounded-full text-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:transform-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Continue to Sauce
          <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}