import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, QrCode, Printer, TestTube2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface QRCodeData {
  tableNumber: string;
  qrCode: string;
  url: string;
}

export default function QRManager() {
  const [tableNumber, setTableNumber] = useState("1");
  const [bulkCount, setBulkCount] = useState("10");
  const [location, setLocation] = useState("Main Floor");
  const [startNumber, setStartNumber] = useState("1");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Test printer connection
  const testPrinterMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/print/test");
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: data.connected ? "Printer Connected" : "Printer Not Connected",
        description: data.connected ? "Receipt printer is ready" : "Check printer connection",
        variant: data.connected ? "default" : "destructive"
      });
    },
    onError: () => {
      toast({
        title: "Connection Test Failed",
        description: "Could not test printer connection",
        variant: "destructive"
      });
    }
  });

  // Generate single QR code
  const generateQRMutation = useMutation({
    mutationFn: async (table: string) => {
      const response = await apiRequest("GET", `/api/qr/${table}?location=${encodeURIComponent(location)}`);
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "QR Code Generated",
        description: `QR code for table ${tableNumber} created successfully`
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Could not generate QR code",
        variant: "destructive"
      });
    }
  });

  // Generate bulk QR codes
  const generateBulkMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", `/api/qr/bulk/${bulkCount}?location=${encodeURIComponent(location)}&startNumber=${startNumber}`);
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Bulk QR Codes Generated",
        description: `${data.length} QR codes created successfully`
      });
    },
    onError: () => {
      toast({
        title: "Bulk Generation Failed",
        description: "Could not generate bulk QR codes",
        variant: "destructive"
      });
    }
  });

  const handleDownloadQR = (qrCode: string, tableNumber: string) => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `table-${tableNumber}-qr.png`;
    link.click();
  };

  const handlePrintQR = async (tableNumber: string) => {
    try {
      // This would send print command to the printer
      await apiRequest("POST", "/api/print", {
        orderNumber: `QR-${tableNumber}`,
        customerName: "QR Code Print",
        menuType: "QR Code",
        items: { qrCode: true },
        totalAmount: "0.00",
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Print Sent",
        description: `QR code for table ${tableNumber} sent to printer`
      });
    } catch (error) {
      toast({
        title: "Print Failed",
        description: "Could not print QR code",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-dark-slate mb-2">QR Code Manager</h1>
        <p className="text-gray-600 text-lg">Generate and manage QR codes for table ordering</p>
      </div>

      {/* Printer Test Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube2 className="h-5 w-5" />
            Printer Connection Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <Button
              onClick={() => testPrinterMutation.mutate()}
              disabled={testPrinterMutation.isPending}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              {testPrinterMutation.isPending ? "Testing..." : "Test Printer"}
            </Button>
            <Badge variant="outline" className="text-sm">
              Toast TP200 Serial: 21127a00256
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Single QR Code Generation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Single QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tableNumber">Table Number</Label>
              <Input
                id="tableNumber"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Enter table number"
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Main Floor, Patio"
              />
            </div>
            <Button
              onClick={() => generateQRMutation.mutate(tableNumber)}
              disabled={generateQRMutation.isPending || !tableNumber}
              className="w-full"
            >
              {generateQRMutation.isPending ? "Generating..." : "Generate QR Code"}
            </Button>
            
            {generateQRMutation.data && (
              <div className="mt-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Table {tableNumber}</h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadQR(generateQRMutation.data.qrCode, tableNumber)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePrintQR(tableNumber)}
                    >
                      <Printer className="h-4 w-4 mr-1" />
                      Print
                    </Button>
                  </div>
                </div>
                <img
                  src={generateQRMutation.data.qrCode}
                  alt={`QR Code for Table ${tableNumber}`}
                  className="w-32 h-32 mx-auto"
                />
                <p className="text-sm text-gray-600 mt-2 break-all">
                  URL: {generateQRMutation.data.url}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bulk QR Code Generation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Bulk QR Codes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bulkCount">Number of QR Codes</Label>
              <Input
                id="bulkCount"
                type="number"
                value={bulkCount}
                onChange={(e) => setBulkCount(e.target.value)}
                placeholder="Enter count (max 50)"
                min="1"
                max="50"
              />
            </div>
            <div>
              <Label htmlFor="startNumber">Starting Table Number</Label>
              <Input
                id="startNumber"
                type="number"
                value={startNumber}
                onChange={(e) => setStartNumber(e.target.value)}
                placeholder="Starting number"
                min="1"
              />
            </div>
            <Button
              onClick={() => generateBulkMutation.mutate()}
              disabled={generateBulkMutation.isPending || !bulkCount}
              className="w-full"
            >
              {generateBulkMutation.isPending ? "Generating..." : "Generate Bulk QR Codes"}
            </Button>
            
            {generateBulkMutation.data && (
              <div className="mt-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  {generateBulkMutation.data.map((qr: QRCodeData) => (
                    <div key={qr.tableNumber} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-sm">Table {qr.tableNumber}</h5>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadQR(qr.qrCode, qr.tableNumber)}
                            className="h-6 px-2 text-xs"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrintQR(qr.tableNumber)}
                            className="h-6 px-2 text-xs"
                          >
                            <Printer className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <img
                        src={qr.qrCode}
                        alt={`QR Code for Table ${qr.tableNumber}`}
                        className="w-20 h-20 mx-auto"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}