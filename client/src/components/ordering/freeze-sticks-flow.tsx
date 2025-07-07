import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, ArrowRight } from "lucide-react";
import { useOrder } from "@/hooks/use-order";
import { useCart } from "@/hooks/use-cart";
import type { MenuItem } from "@shared/schema";

interface FreezeStickSelection {
  size: MenuItem | null;
  flavorQuantities: { [flavorId: number]: number }; // flavorId -> quantity
  sauce: MenuItem | null;
  additionalSticks: number;
  additionalFlavorQuantities: { [flavorId: number]: number }; // Additional stick flavors
  additionalSauces: number;
  additionalSauceSelections: MenuItem[]; // Additional sauce selections
}

export default function FreezeSticksFlow() {
  const { setStep, setOrderNumber, resetOrder, selectedMenuId } = useOrder();
  const { isActive, addItem } = useCart();
  const [selection, setSelection] = useState<FreezeStickSelection>({
    size: null,
    flavorQuantities: {},
    sauce: null,
    additionalSticks: 0,
    additionalFlavorQuantities: {},
    additionalSauces: 0,
    additionalSauceSelections: [],
  });

  const { data: sizes = [] } = useQuery({
    queryKey: ["/api/menu/size", selectedMenuId],
    queryFn: () => fetch(`/api/menu/size?menuId=${selectedMenuId}`).then(res => res.json()),
  });

  const { data: flavors = [] } = useQuery({
    queryKey: ["/api/menu/flavor", selectedMenuId],
    queryFn: () => fetch(`/api/menu/flavor?menuId=${selectedMenuId}`).then(res => res.json()),
  });

  const { data: sauces = [] } = useQuery({
    queryKey: ["/api/menu/sauce", selectedMenuId],
    queryFn: () => fetch(`/api/menu/sauce?menuId=${selectedMenuId}`).then(res => res.json()),
  });

  const { data: addons = [] } = useQuery({
    queryKey: ["/api/menu/addon", selectedMenuId],
    queryFn: () => fetch(`/api/menu/addon?menuId=${selectedMenuId}`).then(res => res.json()),
  });

  const handleSizeSelect = (size: MenuItem) => {
    setSelection(prev => ({ 
      ...prev, 
      size,
      flavorQuantities: {} // Reset flavors when size changes
    }));
  };

  const getMaxSticks = () => {
    if (!selection.size) return 0;
    // Extract number from size name (e.g., "3 Sticks" -> 3)
    const match = selection.size.name.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const getTotalSticks = () => {
    const baseSticks = Object.values(selection.flavorQuantities).reduce((sum, qty) => sum + qty, 0);
    const additionalSticks = selection.additionalSticks;
    return baseSticks + additionalSticks;
  };

  const handleFlavorQuantityChange = (flavorId: number, delta: number) => {
    const baseMaxSticks = selection.size?.maxQuantity || 1;
    const currentTotal = Object.values(selection.flavorQuantities).reduce((sum, qty) => sum + qty, 0);
    const currentQuantity = selection.flavorQuantities[flavorId] || 0;
    const newQuantity = Math.max(0, currentQuantity + delta);
    
    // Check if adding this quantity would exceed the base package max sticks
    const newTotal = currentTotal - currentQuantity + newQuantity;
    if (newTotal > baseMaxSticks) {
      return; // Don't allow exceeding base package max sticks
    }
    
    setSelection(prev => {
      const newFlavorQuantities = { ...prev.flavorQuantities };
      if (newQuantity === 0) {
        delete newFlavorQuantities[flavorId];
      } else {
        newFlavorQuantities[flavorId] = newQuantity;
      }
      
      return {
        ...prev,
        flavorQuantities: newFlavorQuantities
      };
    });
  };

  const handleAdditionalFlavorQuantityChange = (flavorId: number, delta: number) => {
    const currentQuantity = selection.additionalFlavorQuantities[flavorId] || 0;
    const newQuantity = Math.max(0, currentQuantity + delta);
    
    // Check if adding this quantity would exceed the additional sticks limit
    const currentTotal = Object.values(selection.additionalFlavorQuantities).reduce((sum, qty) => sum + qty, 0);
    const newTotal = currentTotal - currentQuantity + newQuantity;
    if (newTotal > selection.additionalSticks) {
      return; // Don't allow exceeding additional sticks limit
    }
    
    setSelection(prev => {
      const newAdditionalFlavorQuantities = { ...prev.additionalFlavorQuantities };
      if (newQuantity === 0) {
        delete newAdditionalFlavorQuantities[flavorId];
      } else {
        newAdditionalFlavorQuantities[flavorId] = newQuantity;
      }
      
      return {
        ...prev,
        additionalFlavorQuantities: newAdditionalFlavorQuantities
      };
    });
  };

  const handleSauceSelect = (sauce: MenuItem) => {
    setSelection(prev => ({ ...prev, sauce }));
  };

  const handleAdditionalSauceSelect = (index: number, sauce: MenuItem) => {
    setSelection(prev => {
      const newAdditionalSauceSelections = [...prev.additionalSauceSelections];
      newAdditionalSauceSelections[index] = sauce;
      return {
        ...prev,
        additionalSauceSelections: newAdditionalSauceSelections
      };
    });
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
    const baseSticks = Object.values(selection.flavorQuantities).reduce((sum, qty) => sum + qty, 0);
    const baseMaxSticks = selection.size?.maxQuantity || 0;
    const hasBaseSelection = baseSticks > 0 && baseSticks <= baseMaxSticks;
    
    // Check additional sticks have flavors selected if any additional sticks exist
    const additionalSticks = selection.additionalSticks;
    const additionalFlavorTotal = Object.values(selection.additionalFlavorQuantities).reduce((sum, qty) => sum + qty, 0);
    const hasValidAdditionalSticks = additionalSticks === 0 || additionalSticks === additionalFlavorTotal;
    
    // Check additional sauces are selected if any additional sauces exist
    const additionalSauces = selection.additionalSauces;
    const additionalSauceCount = selection.additionalSauceSelections.filter(s => s).length;
    const hasValidAdditionalSauces = additionalSauces === 0 || additionalSauces === additionalSauceCount;
    
    return selection.size && 
           hasBaseSelection && 
           selection.sauce &&
           hasValidAdditionalSticks &&
           hasValidAdditionalSauces;
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
          items: Object.entries(selection.flavorQuantities).map(([flavorId, qty]) => {
            const flavor = (flavors as MenuItem[]).find(f => f.id === Number(flavorId));
            return { flavor, quantity: qty };
          }),
          quantity: getTotalSticks()
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
    
    // Add to cart if cart is active
    if (isActive) {
      // Get customer name from the DOM element set by OrderWrapper
      const customerNameElement = document.querySelector('[data-customer-name]');
      const customerName = customerNameElement?.getAttribute('data-customer-name') || 'Unknown Customer';
      
      // Add item to cart
      addItem({
        customerName,
        menuType: "Freeze Sticks",
        orderData: customOrder,
        totalPrice: calculateTotal()
      });
    }
    
    // Store in localStorage with consistent structure for order confirmation
    const orderForStorage = {
      menuType: "Freeze Sticks",
      orderNumber: orderNumber,
      orderData: customOrder,
      totalPrice: calculateTotal(),
      total: calculateTotal()
    };
    localStorage.setItem('currentOrder', JSON.stringify(orderForStorage));
    
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

      {/* Step 2: Flavor Selection with Additional Options */}
      {selection.size && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">2</span>
              Choose Your Flavors ({getTotalSticks()}/{getMaxSticks()} sticks)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Base Package Flavors */}
            <div className="mb-6">
              <h4 className="font-medium mb-3 text-primary">Base Package ({selection.size?.name})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(flavors as MenuItem[]).map((flavor) => {
                  const quantity = selection.flavorQuantities[flavor.id] || 0;
                  const baseMaxSticks = selection.size?.maxQuantity || 1;
                  const baseTotalSticks = Object.values(selection.flavorQuantities).reduce((sum, q) => sum + q, 0);
                  const canIncrease = baseTotalSticks < baseMaxSticks;
                  
                  return (
                    <Card key={flavor.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{flavor.name}</h3>
                            <p className="text-sm text-gray-600">{flavor.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFlavorQuantityChange(flavor.id, -1)}
                              disabled={quantity === 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">{quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFlavorQuantityChange(flavor.id, 1)}
                              disabled={!canIncrease}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  Base package: {Object.values(selection.flavorQuantities).reduce((sum, q) => sum + q, 0)}/{selection.size?.maxQuantity || 1} sticks selected
                </p>
              </div>
            </div>

            {/* Additional Sticks Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-secondary">Additional Freeze Sticks ($2.00 each)</h4>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelection(prev => ({ 
                      ...prev, 
                      additionalSticks: Math.max(0, prev.additionalSticks - 1),
                      additionalFlavorQuantities: prev.additionalSticks <= 1 ? {} : prev.additionalFlavorQuantities
                    }))}
                    disabled={selection.additionalSticks === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{selection.additionalSticks}</span>
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

              {/* Additional Stick Flavors */}
              {selection.additionalSticks > 0 && (
                <div className="border rounded-lg p-4 bg-orange-50">
                  <p className="text-sm text-orange-800 mb-3">
                    Choose flavors for your {selection.additionalSticks} additional stick{selection.additionalSticks !== 1 ? 's' : ''}:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(flavors as MenuItem[]).map((flavor) => {
                      const additionalQuantity = selection.additionalFlavorQuantities[flavor.id] || 0;
                      const additionalTotal = Object.values(selection.additionalFlavorQuantities).reduce((sum, q) => sum + q, 0);
                      const canIncrease = additionalTotal < selection.additionalSticks;
                      
                      return (
                        <div key={`additional-${flavor.id}`} className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="text-sm font-medium">{flavor.name}</span>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAdditionalFlavorQuantityChange(flavor.id, -1)}
                              disabled={additionalQuantity === 0}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-sm">{additionalQuantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAdditionalFlavorQuantityChange(flavor.id, 1)}
                              disabled={!canIncrease}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 text-xs text-orange-600">
                    Additional flavors selected: {Object.values(selection.additionalFlavorQuantities).reduce((sum, q) => sum + q, 0)}/{selection.additionalSticks}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Total sticks: {getTotalSticks()} 
                (Base: {Object.values(selection.flavorQuantities).reduce((sum, q) => sum + q, 0)} + Additional: {selection.additionalSticks})
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Sauce Selection with Additional Options */}
      {selection.size && getTotalSticks() > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">3</span>
              Choose Your Sauce
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Base Sauce Selection */}
            <div className="mb-6">
              <h4 className="font-medium mb-3 text-primary">Base Sauce (Included)</h4>
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
            </div>

            {/* Additional Sauces Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-secondary">Additional Sauces ($0.50 each)</h4>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelection(prev => ({ 
                      ...prev, 
                      additionalSauces: Math.max(0, prev.additionalSauces - 1),
                      additionalSauceSelections: prev.additionalSauces <= 1 ? [] : prev.additionalSauceSelections.slice(0, prev.additionalSauces - 1)
                    }))}
                    disabled={selection.additionalSauces === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{selection.additionalSauces}</span>
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

              {/* Additional Sauce Selection */}
              {selection.additionalSauces > 0 && (
                <div className="border rounded-lg p-4 bg-purple-50">
                  <p className="text-sm text-purple-800 mb-3">
                    Choose {selection.additionalSauces} additional sauce{selection.additionalSauces !== 1 ? 's' : ''}:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Array.from({ length: selection.additionalSauces }, (_, index) => (
                      <div key={`additional-sauce-${index}`} className="space-y-2">
                        <p className="text-xs font-medium text-purple-700">Sauce #{index + 1}</p>
                        <div className="grid grid-cols-1 gap-2">
                          {(sauces as MenuItem[]).map((sauce) => (
                            <Button
                              key={`${index}-${sauce.id}`}
                              size="sm"
                              variant={selection.additionalSauceSelections[index]?.id === sauce.id ? "default" : "outline"}
                              onClick={() => handleAdditionalSauceSelect(index, sauce)}
                              className="text-xs h-8"
                            >
                              {sauce.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-purple-600">
                    Additional sauces selected: {selection.additionalSauceSelections.filter(s => s).length}/{selection.additionalSauces}
                  </div>
                </div>
              )}
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
                <span>{selection.size?.name}</span>
                <span>${parseFloat(selection.size?.price.toString() || "0").toFixed(2)}</span>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                Base Flavors: {Object.entries(selection.flavorQuantities).map(([flavorId, qty]) => {
                  const flavor = (flavors as MenuItem[]).find(f => f.id === Number(flavorId));
                  return `${flavor?.name} (${qty})`;
                }).join(', ')}
              </div>
              {selection.additionalSticks > 0 && Object.keys(selection.additionalFlavorQuantities).length > 0 && (
                <div className="text-sm text-gray-600 mb-2">
                  Additional Flavors: {Object.entries(selection.additionalFlavorQuantities).map(([flavorId, qty]) => {
                    const flavor = (flavors as MenuItem[]).find(f => f.id === Number(flavorId));
                    return `${flavor?.name} (${qty})`;
                  }).join(', ')}
                </div>
              )}
              <div className="flex justify-between">
                <span>Base Sauce: {selection.sauce?.name}</span>
                <span>Included</span>
              </div>
              {selection.additionalSauceSelections.length > 0 && (
                <div className="text-sm text-gray-600 mb-2">
                  Additional Sauces: {selection.additionalSauceSelections.filter(s => s).map(sauce => sauce.name).join(', ')}
                </div>
              )}
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