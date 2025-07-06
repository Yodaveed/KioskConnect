import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Droplet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOrder } from "@/hooks/use-order";
import type { MenuItem } from "@shared/schema";

export default function StepTwo() {
  const { selectSauce, setStep, order, selectedMenuId } = useOrder();

  const { data: sauceItems = [], isLoading } = useQuery({
    queryKey: ["/api/menu/sauce", selectedMenuId],
    queryFn: () => fetch(`/api/menu/sauce?menuId=${selectedMenuId}`).then(res => res.json()),
  });

  const handleSelectSauce = (item: MenuItem) => {
    selectSauce({
      id: item.id,
      name: item.name,
      category: item.category,
      price: parseFloat(item.price),
    });
  };

  const handleContinue = () => {
    // Allow continuing even without sauce selection
    setStep(3);
  };

  const getSauceIconColor = (sauceName: string) => {
    switch (sauceName.toLowerCase()) {
      case "white chocolate":
        return "text-yellow-600";
      case "strawberry puree":
        return "text-pink-600";
      case "salted caramel":
        return "text-amber-600";
      case "hot fudge":
        return "text-amber-100";
      default:
        return "text-gray-600";
    }
  };

  const getSauceBackgroundColor = (sauceName: string) => {
    switch (sauceName.toLowerCase()) {
      case "white chocolate":
        return "bg-gradient-to-br from-yellow-100 to-yellow-200";
      case "strawberry puree":
        return "bg-gradient-to-br from-pink-100 to-pink-200";
      case "salted caramel":
        return "bg-gradient-to-br from-amber-100 to-amber-200";
      case "hot fudge":
        return "bg-gradient-to-br from-amber-700 to-amber-800";
      default:
        return "bg-gradient-to-br from-gray-100 to-gray-200";
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
        <h2 className="text-3xl font-bold text-dark-slate mb-2">Choose Your Sauce</h2>
        <p className="text-gray-600 text-lg">Select a delicious sauce to complement your base, or skip to continue</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sauceItems.map((item: MenuItem) => (
          <Card
            key={item.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              order.sauce?.id === item.id
                ? "border-2 border-primary shadow-lg"
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
                <div className={`w-16 h-16 ${getSauceBackgroundColor(item.name)} rounded-full mx-auto mb-4 flex items-center justify-center`}>
                  <Droplet className={`text-2xl ${getSauceIconColor(item.name)}`} />
                </div>
              )}
              <h3 className="text-lg font-semibold text-dark-slate mb-2">{item.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{item.description}</p>
              <div className="text-primary font-bold text-lg mb-4">+${item.price}</div>
              <Button
                className={`w-full px-4 py-2 rounded-full font-medium transition-colors ${
                  order.sauce?.id === item.id
                    ? "bg-secondary text-white hover:bg-secondary/90"
                    : "bg-primary text-white hover:bg-primary/90"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectSauce(item);
                }}
              >
                {order.sauce?.id === item.id ? "✓ Selected" : "Select"}
              </Button>
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
        <Button
          onClick={handleContinue}
          className="bg-gradient-to-r from-primary to-secondary text-white px-12 py-4 rounded-full text-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
        >
          Continue to Toppings
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
