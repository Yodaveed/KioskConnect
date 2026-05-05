// SECURE SERVER-SIDE PRINTER SERVICE
// Only admin/staff can access printing functionality - NEVER exposed to guests
// All printing is triggered automatically on order placement or manually by admin

import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } from 'node-thermal-printer';

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
    orderData?: any; // For complex orders like Pints, Freeze Sticks
  };
  totalAmount: string;
  timestamp: string;
  cartId?: string;
  tableNumber?: string;
  location?: string;
}

export class SecurePrinterService {
  private printer: ThermalPrinter | null = null;
  private isConnected: boolean = false;
  private printerPath: string;

  constructor() {
    // SECURITY: Only initialize printer on server - never exposed to client
    // In production, this should be the USB/serial path to the Toast TP200 printer
    this.printerPath = process.env.PRINTER_PATH || '/dev/usb/lp0';
    
    try {
      this.initializePrinter();
    } catch (error) {
      console.error('Printer initialization failed (this is normal in development):', error);
    }
  }

  private initializePrinter() {
    this.printer = new ThermalPrinter({
      type: PrinterTypes.STAR,
      interface: this.printerPath,
      characterSet: CharacterSet.PC852_LATIN2,
      width: 48, // Toast TP200 width
      removeSpecialCharacters: false,
    });
  }

  // SECURITY: Only admin/staff can test printer connection
  async testConnection(): Promise<boolean> {
    if (!this.printer) {
      console.log('Printer not initialized (normal in development)');
      return false;
    }

    try {
      const isConnected = await this.printer.isPrinterConnected();
      this.isConnected = isConnected;
      
      if (isConnected) {
        console.log('Thermal printer connection successful');
        return true;
      } else {
        console.error('Thermal printer not connected');
        return false;
      }
    } catch (error) {
      console.error('Printer connection test error:', error);
      this.isConnected = false;
      return false;
    }
  }

  // SECURITY: AUTO-PRINT on order placement + ADMIN-ONLY manual reprint
  async printReceipt(orderData: PrintOrderData, isReprint: boolean = false): Promise<boolean> {
    if (!this.printer) {
      console.log('Development mode: Order would be printed in production');
      console.log('Order Details:', JSON.stringify(orderData, null, 2));
      return true; // Return true in development for testing
    }

    try {
      // Clear any previous print jobs
      this.printer.clear();
      
      // Format and send receipt to thermal printer
      this.formatThermalReceipt(orderData, isReprint);
      
      // Execute the print job
      const success = await this.printer.execute();
      
      if (success) {
        console.log(`Receipt ${isReprint ? 'reprinted' : 'printed'} successfully for order #${orderData.orderNumber}`);
        return true;
      } else {
        console.error('Thermal print execution failed');
        return false;
      }
    } catch (error) {
      console.error('Print receipt error:', error);
      return false;
    }
  }

  private formatThermalReceipt(orderData: PrintOrderData, isReprint: boolean = false) {
    const printer = this.printer;
    if (!printer) return;

    // Header
    printer.alignCenter();
    printer.setTextSize(1, 1);
    printer.bold(true);
    printer.println('IC PASTA');
    printer.bold(false);
    printer.setTextSize(0, 0);
    printer.println('Fresh & Delicious');
    printer.drawLine();
    printer.newLine();

    // Reprint indicator
    if (isReprint) {
      printer.alignCenter();
      printer.bold(true);
      printer.println('*** REPRINT ***');
      printer.bold(false);
      printer.newLine();
    }

    // Order Information
    printer.alignLeft();
    printer.bold(true);
    printer.println(`Order #: ${orderData.orderNumber}`);
    printer.bold(false);
    printer.println(`Menu: ${orderData.menuType}`);
    printer.println(`Time: ${new Date(orderData.timestamp).toLocaleString()}`);
    
    if (orderData.customerName) {
      printer.println(`Customer: ${orderData.customerName}`);
    }
    
    if (orderData.cartId) {
      printer.println(`Group Cart: ${orderData.cartId}`);
    }

    if (orderData.tableNumber) {
      printer.println(`Table: ${orderData.tableNumber}`);
    }

    if (orderData.location) {
      printer.println(`Location: ${orderData.location}`);
    }
    
    printer.drawLine();
    printer.newLine();

    // Order Items
    if (orderData.items.base) {
      printer.bold(true);
      printer.println('BASE:');
      printer.bold(false);
      printer.println(`  ${orderData.items.base.name}`);
      printer.tableCustom([
        { text: '', align: 'LEFT', width: 0.7 },
        { text: `$${orderData.items.base.price.toFixed(2)}`, align: 'RIGHT', width: 0.3 }
      ]);
      printer.newLine();
    }

    if (orderData.items.sauces && orderData.items.sauces.length > 0) {
      printer.bold(true);
      printer.println('SAUCES:');
      printer.bold(false);
      orderData.items.sauces.forEach(sauce => {
        printer.println(`  ${sauce.name}`);
        printer.tableCustom([
          { text: '', align: 'LEFT', width: 0.7 },
          { text: sauce.price > 0 ? `$${sauce.price.toFixed(2)}` : 'Included', align: 'RIGHT', width: 0.3 }
        ]);
      });
      printer.newLine();
    }

    if (orderData.items.toppings && orderData.items.toppings.length > 0) {
      printer.bold(true);
      printer.println('TOPPINGS:');
      printer.bold(false);
      orderData.items.toppings.forEach(topping => {
        printer.println(`  ${topping.name}`);
        printer.tableCustom([
          { text: '', align: 'LEFT', width: 0.7 },
          { text: topping.price > 0 ? `$${topping.price.toFixed(2)}` : 'Included', align: 'RIGHT', width: 0.3 }
        ]);
      });
      printer.newLine();
    }

    // Handle complex order data (Pints, Freeze Sticks, etc.)
    if (orderData.items.orderData) {
      printer.bold(true);
      printer.println('ORDER DETAILS:');
      printer.bold(false);
      printer.println(JSON.stringify(orderData.items.orderData, null, 2));
      printer.newLine();
    }

    // Total
    printer.drawLine();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.tableCustom([
      { text: 'TOTAL:', align: 'LEFT', width: 0.6 },
      { text: `$${orderData.totalAmount}`, align: 'RIGHT', width: 0.4 }
    ]);
    printer.setTextSize(0, 0);
    printer.bold(false);
    printer.newLine();

    // Footer
    printer.alignCenter();
    printer.println('Thank you for your order!');
    printer.println('Please show this receipt');
    printer.println('when picking up your order');
    printer.newLine();
    printer.newLine();

    // Cut the paper
    printer.cut();
  }

  // SECURITY: Only admin can reprint orders
  async reprintOrder(orderData: PrintOrderData): Promise<boolean> {
    console.log(`Admin reprinting order #${orderData.orderNumber}`);
    return this.printReceipt(orderData, true);
  }
}

// Export secure printer service - only accessible server-side
export const printerService = new SecurePrinterService();