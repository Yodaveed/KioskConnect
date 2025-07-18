import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Download, QrCode as QrCodeIcon, Printer, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface QRCodeData {
  qrCode: string;
  url: string;
}

export default function QrTab() {
  const [tableNumber, setTableNumber] = useState("");
  const [location, setLocation] = useState("Main Floor");
  const [qrCodeData, setQrCodeData] = useState<QRCodeData | null>(null);
  const { toast } = useToast();

  const generateQRMutation = useMutation({
    mutationFn: async (table: string) => {
      const response = await apiRequest("GET", `/api/qr/${table}?location=${encodeURIComponent(location)}`);
      return response;
    },
    onSuccess: (data) => {
      setQrCodeData(data);
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

  const handleGenerate = () => {
    if (!tableNumber.trim()) {
      toast({
        title: "Table number required",
        description: "Please enter a table number",
        variant: "destructive",
      });
      return;
    }

    generateQRMutation.mutate(tableNumber.trim());
  };

  const handleDownload = () => {
    if (!qrCodeData) return;

    const link = document.createElement("a");
    link.download = `ic-pasta-table-${tableNumber}-qr.png`;
    link.href = qrCodeData.qrCode;
    link.click();
  };

  const handlePrint = async () => {
    if (!qrCodeData) return;

    try {
      await apiRequest("POST", "/api/print", {
        orderNumber: `QR-${tableNumber}`,
        customerName: "QR Code Print",
        menuType: "QR Code",
        items: { qrCode: true },
        totalAmount: "0.00",
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Print sent",
        description: `QR code for table ${tableNumber} sent to printer`
      });
    } catch (error) {
      toast({
        title: "Print failed",
        description: "Could not print QR code",
        variant: "destructive"
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-dark-slate">QR Code Generator</h2>
        <Button
          onClick={() => window.open('/admin/qr', '_blank')}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Open Advanced QR Manager
        </Button>
      </div>
      
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
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                type="text"
                placeholder="e.g., Main Floor, Patio"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
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
                    src={qrCodeData.qrCode}
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
              {qrCodeData && (
                <p className="text-xs text-gray-500 mb-4 break-all">
                  URL: {qrCodeData.url}
                </p>
              )}
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={handleDownload}
                  disabled={!qrCodeData}
                  className="bg-secondary hover:bg-secondary/90 disabled:opacity-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={handlePrint}
                  disabled={!qrCodeData}
                  variant="outline"
                  className="disabled:opacity-50"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
