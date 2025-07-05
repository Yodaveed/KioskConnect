import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useOrder } from "@/hooks/use-order";
import type { MenuItem } from "@shared/schema";

export default function StepOne() {
  const { selectBase, setStep, order, selectedMenuId } = useOrder();
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, boolean>>({});

  const { data: baseItems = [], isLoading } = useQuery({
    queryKey: ["/api/menu/base", selectedMenuId],
    queryFn: () => fetch(`/api/menu/base?menuId=${selectedMenuId}`).then(res => res.json()),
  });

  const handleSelectBase = (item: MenuItem) => {
    const modifiers = selectedModifiers[item.id.toString()]
      ? [{ name: "Dairy-Free", price: 1.00 }]
      : [];

    selectBase({
      id: item.id,
      name: item.name,
      category: item.category,
      price: parseFloat(item.price),
      modifiers,
    });
  };

  const handleModifierChange = (itemId: string, checked: boolean) => {
    setSelectedModifiers(prev => ({
      ...prev,
      [itemId]: checked,
    }));
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
        <p className="text-gray-600 text-lg">Select one delicious base flavor to start your creation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {baseItems.map((item: MenuItem) => (
          <Card
            key={item.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              order.base?.id === item.id
                ? "border-2 border-primary shadow-lg"
                : "border-2 border-transparent hover:border-primary"
            }`}
            onClick={() => handleSelectBase(item)}
          >
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-48 object-cover rounded-t-lg"
              />
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-primary/20 rounded-t-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-2">🍝</div>
                  <div className="text-sm text-gray-600">No image</div>
                </div>
              </div>
            )}
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold text-dark-slate">{item.name}</h3>
                <span className="text-lg font-bold text-primary">${item.price}</span>
              </div>
              <p className="text-gray-600 mb-4">{item.description}</p>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`dairy-free-${item.id}`}
                    checked={selectedModifiers[item.id.toString()] || false}
                    onCheckedChange={(checked) => 
                      handleModifierChange(item.id.toString(), checked as boolean)
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                  <label
                    htmlFor={`dairy-free-${item.id}`}
                    className="text-sm text-gray-600 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Dairy-Free +$1.00
                  </label>
                </div>
                <Button
                  className={`px-6 py-2 rounded-full font-medium transition-colors ${
                    order.base?.id === item.id
                      ? "bg-secondary text-white hover:bg-secondary/90"
                      : "bg-primary text-white hover:bg-primary/90"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectBase(item);
                  }}
                >
                  {order.base?.id === item.id ? "✓ Selected" : "Select"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Button
          onClick={handleContinue}
          disabled={!order.base}
          className="bg-gradient-to-r from-primary to-secondary text-white px-12 py-4 rounded-full text-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          Continue to Sauce Selection
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
