import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOrder } from "@/hooks/use-order";
import type { MenuItem } from "@shared/schema";

export default function StepOne() {
  const { selectBase, setStep, order, selectedMenuId } = useOrder();

  const { data: baseItems = [], isLoading } = useQuery({
    queryKey: [`/api/menu/base?menuId=${selectedMenuId}`],
    enabled: !!selectedMenuId,
  });

  const handleSelectBase = (item: MenuItem) => {
    selectBase({
      id: item.id,
      name: item.name,
      category: item.category,
      price: parseFloat(item.price),
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {baseItems.map((item: MenuItem) => (
          <Card
            key={item.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              order.base?.id === item.id
                ? "border-2 border-primary shadow-lg bg-primary/5"
                : "border-2 border-transparent hover:border-primary"
            }`}
            onClick={() => handleSelectBase(item)}
          >
            <CardContent className="p-6 text-center">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <div className="text-4xl">🍨</div>
                </div>
              )}
              
              <h3 className="text-xl font-semibold text-dark-slate mb-2">{item.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{item.description}</p>
              
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
          className="bg-gradient-to-r from-primary to-secondary text-white px-12 py-4 rounded-full text-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:transform-none"
        >
          Continue to Sauce
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}