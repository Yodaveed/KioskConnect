import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, ArrowRight } from "lucide-react";
import { useOrder } from "@/hooks/use-order";
import type { MenuItem } from "@shared/schema";

interface FreezeStickSelection {
  size: MenuItem | null;
  flavors: MenuItem[];
  sauce: MenuItem | null;
  additionalSticks: number;
  additionalSauces: number;
}

export default function FreezeSticksFlow() {
  const { setStep, setOrderNumber, resetOrder } = useOrder();
  const [selection, setSelection] = useState<FreezeStickSelection>({
    size: null,
    flavors: [],
    sauce: null,
    additionalSticks: 0,
    additionalSauces: 0,
  });

  const { data: sizes = [] } = useQuery({
    queryKey: ["/api/menu/size", 2], // Assuming freeze sticks menu ID is 2
    queryFn: () => fetch("/api/menu/size?menuId=2").then(res => res.json()),
  });

  const { data: flavors = [] } = useQuery({
    queryKey: ["/api/menu/flavor", 2],
    queryFn: () => fetch("/api/menu/flavor?menuId=2").then(res => res.json()),
  });

  const { data: sauces = [] } = useQuery({
    queryKey: ["/api/menu/sauce", 2],
    queryFn: () => fetch("/api/menu/sauce?menuId=2").then(res => res.json()),
  });

  const handleSizeSelect = (size: MenuItem) => {
    setSelection(prev => ({ ...prev, size }));
  };

  const handleFlavorToggle = (flavor: MenuItem) => {
    setSelection(prev => {
      const maxFlavors = prev.size?.maxQuantity || 1;
      const currentFlavors = prev.flavors;
      
      if (currentFlavors.some(f => f.id === flavor.id)) {
        // Remove flavor
        return {
          ...prev,
          flavors: currentFlavors.filter(f => f.id !== flavor.id)
        };
      } else if (currentFlavors.length < maxFlavors) {
        // Add flavor
        return {
          ...prev,
          flavors: [...currentFlavors, flavor]
        };
      }
      return prev;
    });
  };

  const handleSauceSelect = (sauce: MenuItem) => {
    setSelection(prev => ({ ...prev, sauce }));
  };

  const calculateTotal = () => {
    let total = 0;
    
    // Base price from size
    if (selection.size) {
      total += parseFloat(selection.size.price.toString());
    }
    
    // Additional sticks ($2 each)
    total += selection.additionalSticks * 2;
    
    // Additional sauces ($0.50 each)
    total += selection.additionalSauces * 0.5;
    
    return total;
  };

  const canProceed = () => {
    const requiredFlavors = selection.size?.maxQuantity || 1;
    return selection.size && 
           selection.flavors.length === requiredFlavors && 
           selection.sauce;
  };

  const handleComplete = () => {
    // Create order in the expected format
    const orderNumber = `FS${Date.now().toString().slice(-6)}`;
    setOrderNumber(orderNumber);
    
    // Store the custom order data
    const customOrder = {
      menuType: "freeze-sticks",
      items: [
        {
          type: "size",
          item: selection.size,
          quantity: 1
        },
        {
          type: "flavors",
          items: selection.flavors,
          quantity: selection.flavors.length
        },
        {
          type: "sauce",
          item: selection.sauce,
          quantity: 1
        }
      ],
      addons: [
        ...(selection.additionalSticks > 0 ? [{
          name: "Additional Freeze Sticks",
          quantity: selection.additionalSticks,
          price: 2
        }] : []),
        ...(selection.additionalSauces > 0 ? [{
          name: "Additional Sauces",
          quantity: selection.additionalSauces,
          price: 0.5
        }] : [])
      ],
      total: calculateTotal()
    };
    
    // Store in localStorage for now (you can save to backend later)
    localStorage.setItem('currentOrder', JSON.stringify(customOrder));
    
    setStep(4); // Go to confirmation
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-slate mb-2">Freeze Sticks</h1>
        <p className="text-gray-600">Ice cream shaped like cheese sticks, coated with crushed waffle cone</p>
      </div>

      {/* Step 1: Size Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">1</span>
            Choose Your Size
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(sizes as MenuItem[]).map((size) => (
              <Card
                key={size.id}
                className={`cursor-pointer transition-all duration-200 ${
                  selection.size?.id === size.id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => handleSizeSelect(size)}
              >
                <CardContent className="p-4 text-center">
                  <h3 className="font-bold text-lg mb-2">{size.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{size.description}</p>
                  <div className="text-primary font-bold text-xl">
                    ${parseFloat(size.price.toString()).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Pick {size.maxQuantity || 1} flavor{(size.maxQuantity || 1) > 1 ? 's' : ''}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Flavor Selection */}
      {selection.size && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">2</span>
              Choose Your Flavors ({selection.flavors.length}/{selection.size.maxQuantity || 1})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(flavors as MenuItem[]).map((flavor) => {
                const isSelected = selection.flavors.some(f => f.id === flavor.id);
                const canSelect = selection.flavors.length < (selection.size?.maxQuantity || 1);
                
                return (
                  <Card
                    key={flavor.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : canSelect 
                        ? 'hover:border-primary/50' 
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                    onClick={() => (isSelected || canSelect) && handleFlavorToggle(flavor)}
                  >
                    <CardContent className="p-4 text-center">
                      <h3 className="font-medium mb-1">{flavor.name}</h3>
                      {isSelected && (
                        <Badge className="bg-primary text-white">Selected</Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Sauce Selection */}
      {selection.size && selection.flavors.length === (selection.size.maxQuantity || 1) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">3</span>
              Choose Your Sauce
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(sauces as MenuItem[]).map((sauce) => (
                <Card
                  key={sauce.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    selection.sauce?.id === sauce.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleSauceSelect(sauce)}
                >
                  <CardContent className="p-4 text-center">
                    <h3 className="font-medium mb-1">{sauce.name}</h3>
                    {selection.sauce?.id === sauce.id && (
                      <Badge className="bg-primary text-white">Selected</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Add-ons */}
      {canProceed() && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">4</span>
              Add-ons (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Additional Freeze Sticks */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Additional Freeze Sticks</h3>
                  <p className="text-sm text-gray-600">$2.00 each</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelection(prev => ({ 
                      ...prev, 
                      additionalSticks: Math.max(0, prev.additionalSticks - 1) 
                    }))}
                    disabled={selection.additionalSticks === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center">{selection.additionalSticks}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelection(prev => ({ 
                      ...prev, 
                      additionalSticks: prev.additionalSticks + 1 
                    }))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Additional Sauces */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Additional Sauces</h3>
                  <p className="text-sm text-gray-600">$0.50 each</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelection(prev => ({ 
                      ...prev, 
                      additionalSauces: Math.max(0, prev.additionalSauces - 1) 
                    }))}
                    disabled={selection.additionalSauces === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center">{selection.additionalSauces}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelection(prev => ({ 
                      ...prev, 
                      additionalSauces: prev.additionalSauces + 1 
                    }))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Summary and Proceed */}
      {canProceed() && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>{selection.size?.name} ({selection.flavors.map(f => f.name).join(', ')})</span>
                <span>${parseFloat(selection.size?.price.toString() || "0").toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Sauce: {selection.sauce?.name}</span>
                <span>Included</span>
              </div>
              {selection.additionalSticks > 0 && (
                <div className="flex justify-between">
                  <span>Additional Sticks × {selection.additionalSticks}</span>
                  <span>${(selection.additionalSticks * 2).toFixed(2)}</span>
                </div>
              )}
              {selection.additionalSauces > 0 && (
                <div className="flex justify-between">
                  <span>Additional Sauces × {selection.additionalSauces}</span>
                  <span>${(selection.additionalSauces * 0.5).toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
            
            <Button 
              className="w-full mt-6 bg-primary hover:bg-primary/90"
              onClick={handleComplete}
            >
              Complete Order
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}