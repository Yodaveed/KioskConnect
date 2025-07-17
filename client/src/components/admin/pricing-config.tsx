import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Settings, Save, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Menu } from "@shared/schema";

interface PricingRule {
  freeLimit: number;
  additionalPrice: number;
}

interface PricingRules {
  base?: PricingRule;
  sauce?: PricingRule;
  topping?: PricingRule;
}

export default function PricingConfig() {
  const { toast } = useToast();
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);
  const [editingRules, setEditingRules] = useState<PricingRules>({});

  const { data: menus = [] } = useQuery({
    queryKey: ["/api/menus"],
  });

  const { data: currentMenu } = useQuery({
    queryKey: ["/api/menus", selectedMenuId],
    select: (menus: Menu[]) => menus.find(menu => menu.id === selectedMenuId),
    enabled: !!selectedMenuId,
  });

  const updatePricingMutation = useMutation({
    mutationFn: async (rules: PricingRules) => {
      return await apiRequest("PUT", `/api/menus/${selectedMenuId}`, {
        pricingRules: rules,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menus"] });
      toast({
        title: "Success!",
        description: "Pricing rules updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update pricing rules",
        variant: "destructive",
      });
    },
  });

  const handleMenuSelect = (menuId: number) => {
    setSelectedMenuId(menuId);
    const menu = menus.find(m => m.id === menuId);
    if (menu) {
      setEditingRules(menu.pricingRules || {});
    }
  };

  const handleRuleChange = (category: string, field: string, value: string) => {
    setEditingRules(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: field === 'freeLimit' ? parseInt(value) || 0 : parseFloat(value) || 0,
      },
    }));
  };

  const handleSave = () => {
    updatePricingMutation.mutate(editingRules);
  };

  const threeStepMenus = menus.filter(menu => menu.orderingFlow === "three-step");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-slate">Pricing Configuration</h2>
          <p className="text-gray-600">Configure pricing rules for 3-step ordering menus</p>
        </div>
      </div>

      {/* Menu Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Select Menu to Configure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {threeStepMenus.map((menu) => (
              <Card
                key={menu.id}
                className={`cursor-pointer transition-all ${
                  selectedMenuId === menu.id 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleMenuSelect(menu.id)}
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold">{menu.name}</h3>
                  <p className="text-sm text-gray-600">{menu.description}</p>
                  <Badge variant="outline" className="mt-2">
                    {menu.orderingFlow}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Rules Configuration */}
      {selectedMenuId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Pricing Rules for {currentMenu?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Base Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-dark-slate">Base Flavor Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="base-free-limit">Free Flavors</Label>
                  <Input
                    id="base-free-limit"
                    type="number"
                    value={editingRules.base?.freeLimit || 1}
                    onChange={(e) => handleRuleChange('base', 'freeLimit', e.target.value)}
                    min="1"
                    max="5"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Number of flavors included in base price
                  </p>
                </div>
                <div>
                  <Label htmlFor="base-additional-price">Additional Flavor Price</Label>
                  <Input
                    id="base-additional-price"
                    type="number"
                    step="0.01"
                    value={editingRules.base?.additionalPrice || 1.00}
                    onChange={(e) => handleRuleChange('base', 'additionalPrice', e.target.value)}
                    min="0"
                    max="10"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Price for each additional flavor
                  </p>
                </div>
              </div>
            </div>

            {/* Sauce Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-dark-slate">Sauce Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sauce-free-limit">Free Sauces</Label>
                  <Input
                    id="sauce-free-limit"
                    type="number"
                    value={editingRules.sauce?.freeLimit || 2}
                    onChange={(e) => handleRuleChange('sauce', 'freeLimit', e.target.value)}
                    min="1"
                    max="5"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Number of sauces included in base price
                  </p>
                </div>
                <div>
                  <Label htmlFor="sauce-additional-price">Additional Sauce Price</Label>
                  <Input
                    id="sauce-additional-price"
                    type="number"
                    step="0.01"
                    value={editingRules.sauce?.additionalPrice || 0.25}
                    onChange={(e) => handleRuleChange('sauce', 'additionalPrice', e.target.value)}
                    min="0"
                    max="5"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Price for each additional sauce
                  </p>
                </div>
              </div>
            </div>

            {/* Topping Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-dark-slate">Topping Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="topping-free-limit">Free Toppings</Label>
                  <Input
                    id="topping-free-limit"
                    type="number"
                    value={editingRules.topping?.freeLimit || 4}
                    onChange={(e) => handleRuleChange('topping', 'freeLimit', e.target.value)}
                    min="1"
                    max="10"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Number of toppings included in base price
                  </p>
                </div>
                <div>
                  <Label htmlFor="topping-additional-price">Additional Topping Price</Label>
                  <Input
                    id="topping-additional-price"
                    type="number"
                    step="0.01"
                    value={editingRules.topping?.additionalPrice || 0.25}
                    onChange={(e) => handleRuleChange('topping', 'additionalPrice', e.target.value)}
                    min="0"
                    max="5"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Price for each additional topping
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={updatePricingMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {updatePricingMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}