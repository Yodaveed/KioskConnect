import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Package, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function InventoryUpdater() {
  const { toast } = useToast();
  const [lastUpdate, setLastUpdate] = useState<any>(null);

  const updateInventoryMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/inventory/update-from-menu");
    },
    onSuccess: (data) => {
      setLastUpdate(data);
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Inventory Updated!",
        description: `Successfully mapped ${data.ingredientCount} unique ingredients from menu items`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Could not update inventory from menu items",
        variant: "destructive",
      });
    },
  });

  const handleUpdateInventory = () => {
    updateInventoryMutation.mutate();
  };

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Package className="h-5 w-5" />
          Smart Inventory Mapping
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-1">Automatically extract ingredient names from menu items</p>
            <p>This will map themed menu names like "Chef's Special (Cookies n' Cream)" to actual inventory items like "Cookies n' Cream"</p>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <Button
            onClick={handleUpdateInventory}
            disabled={updateInventoryMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {updateInventoryMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Update Inventory from Menu
              </>
            )}
          </Button>
          
          {lastUpdate && (
            <Badge variant="secondary">
              Last updated: {lastUpdate.ingredientCount} ingredients mapped
            </Badge>
          )}
        </div>

        {lastUpdate?.mapping && (
          <div className="mt-4 p-3 bg-white rounded border max-h-64 overflow-y-auto">
            <p className="text-sm font-medium mb-2">Recent Mapping Preview:</p>
            <div className="space-y-1">
              {lastUpdate.mapping.slice(0, 10).map((ingredient: any, index: number) => (
                <div key={index} className="text-xs">
                  <span className="font-medium">{ingredient.actualName}</span>
                  <span className="text-gray-500"> ({ingredient.category})</span>
                  <div className="text-gray-400 ml-2">
                    Used in: {ingredient.themedNames.slice(0, 2).join(', ')}
                    {ingredient.themedNames.length > 2 && ` +${ingredient.themedNames.length - 2} more`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}