// Web-based printer service that can communicate with physical printers
// This approach works in both development and production environments

interface PrintOrderData {
  orderNumber: string;
  customerName?: string;
  menuType: string;
  items: {
    base?: {
      name: string;
      price: number;
    };
    sauces?: Array<{
      name: string;
      price: number;
    }>;
    toppings?: Array<{
      name: string;
      price: number;
    }>;
  };
  totalAmount: string;
  timestamp: string;
  cartId?: string;
}

export class PrinterService {
  private printerEndpoint: string;
  private isConnected: boolean = false;

  constructor() {
    // In production, this would be the IP address of the tablet connected to the printer
    // For development, we'll use a mock endpoint
    this.printerEndpoint = process.env.PRINTER_ENDPOINT || 'http://localhost:8080/print';
    console.log('Printer service initialized with endpoint:', this.printerEndpoint);
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.printerEndpoint}/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log('Printer connection successful');
        this.isConnected = true;
        return true;
      } else {
        console.error('Printer connection test failed:', response.status);
        this.isConnected = false;
        return false;
      }
    } catch (error) {
      console.error('Printer test connection error:', error);
      this.isConnected = false;
      return false;
    }
  }

  async printReceipt(orderData: PrintOrderData): Promise<boolean> {
    try {
      const receiptData = this.formatReceiptData(orderData);
      
      const response = await fetch(this.printerEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(receiptData),
      });

      if (response.ok) {
        console.log('Receipt printed successfully');
        return true;
      } else {
        console.error('Print failed:', response.status, await response.text());
        return false;
      }
    } catch (error) {
      console.error('Print receipt error:', error);
      return false;
    }
  }

  private formatReceiptData(orderData: PrintOrderData) {
    const lines: string[] = [];
    
    // Header
    lines.push('IC PASTA');
    lines.push('================');
    lines.push('');
    
    // Order Info
    lines.push(`Order #: ${orderData.orderNumber}`);
    lines.push(`Menu: ${orderData.menuType}`);
    lines.push(`Time: ${new Date(orderData.timestamp).toLocaleString()}`);
    
    if (orderData.customerName) {
      lines.push(`Customer: ${orderData.customerName}`);
    }
    
    if (orderData.cartId) {
      lines.push(`Cart ID: ${orderData.cartId}`);
    }
    
    lines.push('================');
    lines.push('');
    
    // Items
    if (orderData.items.base) {
      lines.push('BASE:');
      lines.push(`  ${orderData.items.base.name}`);
      lines.push(`  $${orderData.items.base.price.toFixed(2)}`);
      lines.push('');
    }
    
    if (orderData.items.sauces && orderData.items.sauces.length > 0) {
      lines.push('SAUCES:');
      orderData.items.sauces.forEach(sauce => {
        lines.push(`  ${sauce.name}`);
        lines.push(`  ${sauce.price > 0 ? `$${sauce.price.toFixed(2)}` : 'Included'}`);
      });
      lines.push('');
    }
    
    if (orderData.items.toppings && orderData.items.toppings.length > 0) {
      lines.push('TOPPINGS:');
      orderData.items.toppings.forEach(topping => {
        lines.push(`  ${topping.name}`);
        lines.push(`  ${topping.price > 0 ? `$${topping.price.toFixed(2)}` : 'Included'}`);
      });
      lines.push('');
    }
    
    // Total
    lines.push('================');
    lines.push(`TOTAL: $${orderData.totalAmount}`);
    lines.push('');
    lines.push('');
    
    // Footer
    lines.push('Thank you for your order!');
    lines.push('IC Pasta - Fresh & Delicious');
    lines.push('');
    lines.push('');
    
    return {
      type: 'receipt',
      data: lines,
      cut: true,
      orderData: orderData
    };
  }
}

export const printerService = new PrinterService();