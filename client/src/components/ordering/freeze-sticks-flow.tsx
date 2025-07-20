import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, ArrowRight } from "lucide-react";
import { useOrder } from "@/hooks/use-order";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { debounce } from "@/lib/debounce";
import type { MenuItem } from "@shared/schema";

interface FreezeStickSelection {
  size: MenuItem | null;
  flavorQuantities: { [flavorId: number]: number };
  sauce: MenuItem | null;
  additionalSticks: number;
  additionalSauces: number;
}

export default function FreezeSticksFlow() {
  const { setStep, setOrderNumber, resetOrder, selectedMenuId } = useOrder();
  const { isActive, addItem, setCartId } = useCart();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Create debounced version of addItem to prevent rapid API calls
  const debouncedAddItem = debounce(addItem, 300);
  const [selection, setSelection] = useState<FreezeStickSelection>({
    size: null,
    flavorQuantities: {},
    sauce: null,
    additionalSticks: 0,
    additionalSauces: 0,
  });

  const { data: sizes = [] } = useQuery({
    queryKey: [`/api/menu/size?menuId=${selectedMenuId}`],
    enabled: !!selectedMenuId,
  });

  const { data: flavors = [] } = useQuery({
    queryKey: [`/api/menu/base?menuId=${selectedMenuId}`],
    enabled: !!selectedMenuId,
  });

  const { data: sauces = [] } = useQuery({
    queryKey: [`/api/menu/sauce?menuId=${selectedMenuId}`],
    enabled: !!selectedMenuId,
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
    const baseMax = selection.size.maxQuantity || 1;
    // Add additional sticks to the max allowed for flavor selection
    return baseMax + selection.additionalSticks;
  };

  const getTotalFlavorSticks = () => {
    return Object.values(selection.flavorQuantities).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalSticks = () => {
    return getTotalFlavorSticks() + selection.additionalSticks;
  };

  const handleFlavorQuantityChange = (flavorId: number, delta: number) => {
    const currentQuantity = selection.flavorQuantities[flavorId] || 0;
    const newQuantity = Math.max(0, currentQuantity + delta);
    const maxSticks = getMaxSticks();
    
    // Calculate what the new total would be
    const currentTotal = getTotalFlavorSticks();
    const newTotal = currentTotal - currentQuantity + newQuantity;
    
    // Don't allow exceeding the base package size
    if (newTotal > maxSticks) {
      return;
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

  const handleSauceSelect = (sauce: MenuItem) => {
    setSelection(prev => ({ ...prev, sauce }));
  };

  const handleAdditionalSticksChange = (delta: number) => {
    const newAmount = Math.max(0, selection.additionalSticks + delta);
    setSelection(prev => ({ 
      ...prev, 
      additionalSticks: newAmount,
      // Reset flavor quantities when additional sticks change to avoid exceeding new max
      flavorQuantities: {}
    }));
  };

  const handleAdditionalSaucesChange = (delta: number) => {
    const newAmount = Math.max(0, selection.additionalSauces + delta);
    setSelection(prev => ({ ...prev, additionalSauces: newAmount }));
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
    const hasSize = !!selection.size;
    const hasMinimumFlavors = getTotalFlavorSticks() > 0;
    const hasFilledFlavors = getTotalFlavorSticks() === getMaxSticks();
    const hasSauce = !!selection.sauce;
    
    return hasSize && hasMinimumFlavors && hasFilledFlavors && hasSauce;
  };

  const submitOrderMutation = useMutation({
    mutationFn: async () => {
      const customerNameElement = document.querySelector('[data-customer-name]');
      const customerName = customerNameElement?.getAttribute('data-customer-name') || 'Unknown Customer';
      
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
            quantity: getTotalFlavorSticks()
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
      
      const orderData = {
        customerName,
        totalAmount: calculateTotal().toFixed(2),
        items: customOrder,
      };

      const response = await apiRequest("POST", "/api/orders", orderData);
      return response;
    },
    onSuccess: (data) => {
      setOrderNumber(data.orderNumber);
      
      // Store order details for confirmation
      const orderForStorage = {
        menuType: "Freeze Sticks",
        orderNumber: data.orderNumber,
        orderData: {
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
              quantity: getTotalFlavorSticks()
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
        },
        totalPrice: calculateTotal(),
        total: calculateTotal()
      };
      localStorage.setItem('currentOrder', JSON.stringify(orderForStorage));
      
      // Clear selections
      setSelection({
        size: null,
        flavorQuantities: {},
        sauce: null,
        additionalSticks: 0,
        additionalSauces: 0,
      });
      
      // Go to confirmation
      setStep(4);
      
      toast({
        title: "Order Placed!",
        description: `Your freeze sticks order #${data.orderNumber} has been placed successfully.`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleComplete = () => {
    submitOrderMutation.mutate();
  };

  const handleAddToOrder = () => {
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
          quantity: getTotalFlavorSticks()
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
    
    if (!isActive) {
      // Create a new cart
      const generateFriendlyCartId = () => {
        const adjectives = ['Fresh', 'Sweet', 'Cool', 'Tasty', 'Happy', 'Quick', 'Sunny', 'Smooth'];
        const nouns = ['Ice', 'Cream', 'Treat', 'Order', 'Cart', 'Table', 'Group', 'Party'];
        const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        const randomNum = Math.floor(Math.random() * 999) + 1;
        return `${randomAdj}${randomNoun}${randomNum}`;
      };
      
      const newCartId = generateFriendlyCartId();
      setCartId(newCartId);
      
      const customerNameElement = document.querySelector('[data-customer-name]');
      const customerName = customerNameElement?.getAttribute('data-customer-name') || 'Unknown Customer';
      
      debouncedAddItem({
        customerName,
        menuType: "Freeze Sticks",
        orderData: customOrder,
        totalPrice: calculateTotal()
      });
      
      // Reset selections
      setSelection({
        size: null,
        flavorQuantities: {},
        sauce: null,
        additionalSticks: 0,
        additionalSauces: 0,
      });
    } else {
      // Add to existing cart
      const customerNameElement = document.querySelector('[data-customer-name]');
      const customerName = customerNameElement?.getAttribute('data-customer-name') || 'Unknown Customer';
      
      debouncedAddItem({
        customerName,
        menuType: "Freeze Sticks",
        orderData: customOrder,
        totalPrice: calculateTotal()
      });
      
      // Reset selections
      setSelection({
        size: null,
        flavorQuantities: {},
        sauce: null,
        additionalSticks: 0,
        additionalSauces: 0,
      });
    }
    
    // Navigate back to home page to continue ordering
    resetOrder();
    setLocation('/');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-slate mb-2">Freeze Sticks</h1>
        <p className="text-lg text-gray-600">Choose your freeze stick package, flavors, and sauce</p>
      </div>

      {/* Step 1: Size Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">1</span>
            Choose Your Package
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(sizes as MenuItem[]).map((size) => (
              <Card 
                key={size.id} 
                className={`cursor-pointer transition-all ${
                  selection.size?.id === size.id 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:shadow-md'
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
                    Choose {size.maxQuantity || 1} flavor{(size.maxQuantity || 1) > 1 ? 's' : ''}
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
              Choose Your Flavors ({getTotalFlavorSticks()}/{getMaxSticks()} selected)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(flavors as MenuItem[]).map((flavor) => {
                const quantity = selection.flavorQuantities[flavor.id] || 0;
                const canIncrease = getTotalFlavorSticks() < getMaxSticks();
                
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
          </CardContent>
        </Card>
      )}

      {/* Step 3: Sauce Selection */}
      {selection.size && getTotalFlavorSticks() > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">3</span>
              Choose Your Sauce
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(sauces as MenuItem[]).map((sauce) => (
                <Card 
                  key={sauce.id} 
                  className={`cursor-pointer transition-all ${
                    selection.sauce?.id === sauce.id 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleSauceSelect(sauce)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-medium">{sauce.name}</h3>
                    <p className="text-sm text-gray-600">{sauce.description}</p>
                    <div className="text-primary font-bold mt-2">
                      ${parseFloat(sauce.price.toString()).toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Additional Options */}
      {selection.size && getTotalFlavorSticks() > 0 && selection.sauce && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">4</span>
              Additional Options (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Additional Sticks */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">Additional Freeze Sticks</h3>
                  <p className="text-sm text-gray-600">Add extra freeze sticks for $2.00 each</p>
                  {selection.additionalSticks > 0 && (
                    <p className="text-sm text-primary font-medium mt-1">
                      ✓ You can now select {getMaxSticks()} flavors total
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAdditionalSticksChange(-1)}
                    disabled={selection.additionalSticks === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{selection.additionalSticks}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAdditionalSticksChange(1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Additional Sauces */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">Additional Sauces</h3>
                  <p className="text-sm text-gray-600">Add extra sauce cups for $0.50 each</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAdditionalSaucesChange(-1)}
                    disabled={selection.additionalSauces === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{selection.additionalSauces}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAdditionalSaucesChange(1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Summary & Action Buttons */}
      {canProceed() && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>{selection.size?.name}</span>
                <span>${parseFloat(selection.size?.price.toString() || '0').toFixed(2)}</span>
              </div>
              <div className="text-sm text-gray-600">
                • {getTotalFlavorSticks()} freeze sticks with {Object.keys(selection.flavorQuantities).length} flavor{Object.keys(selection.flavorQuantities).length > 1 ? 's' : ''}
              </div>
              <div className="text-sm text-gray-600">
                • {selection.sauce?.name} sauce
              </div>
              
              {selection.additionalSticks > 0 && (
                <div className="flex justify-between">
                  <span>Additional Freeze Sticks ({selection.additionalSticks})</span>
                  <span>${(selection.additionalSticks * 2).toFixed(2)}</span>
                </div>
              )}
              
              {selection.additionalSauces > 0 && (
                <div className="flex justify-between">
                  <span>Additional Sauces ({selection.additionalSauces})</span>
                  <span>${(selection.additionalSauces * 0.5).toFixed(2)}</span>
                </div>
              )}
              
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button 
          variant="outline" 
          onClick={() => {
            resetOrder();
            window.location.href = '/';
          }}
        >
          Cancel
        </Button>
        
        {canProceed() && (
          <>
            <Button 
              onClick={handleAddToOrder}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isActive ? "Add to This Order" : "Start Group Order"}
            </Button>
            <Button 
              onClick={handleComplete}
              className="flex items-center gap-2"
            >
              {isActive ? "Submit Cart" : "Submit Order"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}