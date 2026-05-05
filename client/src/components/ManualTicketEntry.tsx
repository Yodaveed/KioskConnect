import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Save, RotateCcw, Package, TrendingUp, TrendingDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  parLevel: number;
}

interface TallyEntry {
  inventoryItemId: number;
  inventoryName: string;
  currentQuantity: number;
  tallyCount: number;
  unit: string;
}

export default function ManualTicketEntry() {
  const [tallyEntries, setTallyEntries] = useState<TallyEntry[]>([]);
  const [note, setNote] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch inventory data
  const { data: inventoryData, isLoading } = useQuery<InventoryItem[] | { inventory?: InventoryItem[] }>({
    queryKey: ["/api/inventory"],
  });

  // Initialize tally entries when inventory data loads
  useEffect(() => {
    const inventoryItems = Array.isArray(inventoryData) ? inventoryData : inventoryData?.inventory;
    if (inventoryItems && tallyEntries.length === 0) {
      const entries: TallyEntry[] = inventoryItems.map((item: InventoryItem) => ({
        inventoryItemId: item.id,
        inventoryName: item.name,
        currentQuantity: item.quantity,
        tallyCount: item.quantity, // Start with current quantity for easier tallying
        unit: item.unit
      }));
      setTallyEntries(entries);
    }
  }, [inventoryData, tallyEntries.length]);
  
  // Submit tally adjustments mutation
  const submitTallyMutation = useMutation({
    mutationFn: (adjustments: Array<{
      inventoryItemId: number;
      adjustment: number;
      reason: string;
      note: string;
    }>) => {
      return apiRequest("POST", "/api/inventory-adjustments", { adjustments });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      
      // Reset tally counts but keep entries
      setTallyEntries(prev => prev.map(entry => ({
        ...entry,
        tallyCount: 0
      })));
      setNote("");
      
      toast({
        title: "Success",
        description: "Inventory tally submitted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateTallyCount = (inventoryItemId: number, count: number) => {
    setTallyEntries(prev => prev.map(entry =>
      entry.inventoryItemId === inventoryItemId
        ? { ...entry, tallyCount: Math.max(0, count) }
        : entry
    ));
  };

  const resetTally = () => {
    setTallyEntries(prev => prev.map(entry => ({
      ...entry,
      tallyCount: 0
    })));
    setNote("");
  };

  const submitTally = () => {
    // Calculate adjustments based on tally vs current inventory
    const adjustments = tallyEntries
      .filter(entry => entry.tallyCount !== entry.currentQuantity)
      .map(entry => ({
        inventoryItemId: entry.inventoryItemId,
        adjustment: entry.tallyCount - entry.currentQuantity,
        reason: "Manual inventory tally",
        note: note || `Tally count: ${entry.tallyCount}, Previous: ${entry.currentQuantity}`
      }));

    if (adjustments.length === 0) {
      toast({
        title: "No Changes",
        description: "Tally matches current inventory - no adjustments needed",
      });
      return;
    }

    submitTallyMutation.mutate(adjustments);
  };

  const totalAdjustments = tallyEntries.filter(entry => 
    entry.tallyCount !== entry.currentQuantity
  ).length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Manual Inventory Tally
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Package className="w-8 h-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Manual Inventory Tally
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Count your physical inventory at the end of the day and enter the totals below. 
            The system will automatically calculate and apply adjustments.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant={totalAdjustments > 0 ? "destructive" : "secondary"}>
                {totalAdjustments} items with changes
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetTally}
                disabled={submitTallyMutation.isPending}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={submitTally}
                disabled={submitTallyMutation.isPending || totalAdjustments === 0}
                className="bg-primary hover:bg-primary/90"
              >
                <Save className="w-4 h-4 mr-2" />
                Submit Tally
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-center">Current</TableHead>
                <TableHead className="text-center">Tally Count</TableHead>
                <TableHead className="text-center">Difference</TableHead>
                <TableHead className="text-center">Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tallyEntries.map((entry) => {
                const difference = entry.tallyCount - entry.currentQuantity;
                
                return (
                  <TableRow key={entry.inventoryItemId}>
                    <TableCell className="font-medium">
                      {entry.inventoryName}
                    </TableCell>
                    <TableCell className="text-center">
                      {entry.currentQuantity}
                    </TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        min="0"
                        value={entry.tallyCount}
                        onChange={(e) => updateTallyCount(
                          entry.inventoryItemId, 
                          parseInt(e.target.value) || 0
                        )}
                        className="w-20 text-center mx-auto"
                        disabled={submitTallyMutation.isPending}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {difference !== 0 && (
                        <div className={`flex items-center justify-center gap-1 ${
                          difference > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {difference > 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {Math.abs(difference)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {entry.unit}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {totalAdjustments > 0 && (
            <div className="mt-4">
              <Label htmlFor="tally-note">Notes (Optional)</Label>
              <Textarea
                id="tally-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add any notes about the inventory tally..."
                className="mt-1"
                disabled={submitTallyMutation.isPending}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}