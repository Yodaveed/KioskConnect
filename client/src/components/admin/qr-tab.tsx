import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Download, QrCode as QrCodeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { generateQRCode } from "@/lib/qr-generator";

export default function QrTab() {
  const [tableNumber, setTableNumber] = useState("");
  const [qrSize, setQrSize] = useState("medium");
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const { toast } = useToast();

  const generateQRMutation = useMutation({
    mutationFn: async ({ tableNumber, size }: { tableNumber: string; size: string }) => {
      const response = await apiRequest("POST", "/api/qr/generate", { tableNumber, size });
      return response.json();
    },
    onSuccess: async (data) => {
      const qrCode = await generateQRCode(data.qrCodeData, getSizePixels(qrSize));
      setQrCodeData(qrCode);
      toast({
        title: "QR Code generated",
        description: `QR code for table ${tableNumber} has been generated`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to generate QR code",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const getSizePixels = (size: string) => {
    switch (size) {
      case "small":
        return 200;
      case "medium":
        return 300;
      case "large":
        return 400;
      default:
        return 300;
    }
  };

  const handleGenerate = () => {
    if (!tableNumber.trim()) {
      toast({
        title: "Table number required",
        description: "Please enter a table number",
        variant: "destructive",
      });
      return;
    }

    generateQRMutation.mutate({ tableNumber: tableNumber.trim(), size: qrSize });
  };

  const handleDownload = () => {
    if (!qrCodeData) return;

    const link = document.createElement("a");
    link.download = `ic-pasta-table-${tableNumber}-qr.png`;
    link.href = qrCodeData;
    link.click();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-dark-slate mb-6">QR Code Generator</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-dark-slate">Generate QR Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="table-number">Table Number</Label>
              <Input
                id="table-number"
                type="text"
                placeholder="Enter table number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="qr-size">QR Code Size</Label>
              <Select value={qrSize} onValueChange={setQrSize}>
                <SelectTrigger id="qr-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (200x200)</SelectItem>
                  <SelectItem value="medium">Medium (300x300)</SelectItem>
                  <SelectItem value="large">Large (400x400)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleGenerate}
              className="w-full bg-primary hover:bg-primary/90"
              disabled={generateQRMutation.isPending}
            >
              {generateQRMutation.isPending ? "Generating..." : "Generate QR Code"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-dark-slate">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="w-48 h-48 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center overflow-hidden">
                {qrCodeData ? (
                  <img
                    src={qrCodeData}
                    alt="Generated QR Code"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <QrCodeIcon className="text-6xl text-gray-400" />
                )}
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {qrCodeData ? `QR Code for Table ${tableNumber}` : "QR Code will appear here"}
              </p>
              <Button
                onClick={handleDownload}
                disabled={!qrCodeData}
                className="bg-secondary hover:bg-secondary/90 disabled:opacity-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
