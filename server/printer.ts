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
    if (!this.printer) return;

    // Header
    this.printer.alignCenter();
    this.printer.setTextSize(1, 1);
    this.printer.bold(true);
    this.printer.println('IC PASTA');
    this.printer.bold(false);
    this.printer.setTextSize(0, 0);
    this.printer.println('Fresh & Delicious');
    this.printer.drawLine();
    this.printer.newLine();

    // Reprint indicator
    if (isReprint) {
      this.printer.alignCenter();
      this.printer.bold(true);
      this.printer.println('*** REPRINT ***');
      this.printer.bold(false);
      this.printer.newLine();
    }

    // Order Information
    this.printer.alignLeft();
    this.printer.bold(true);
    this.printer.println(`Order #: ${orderData.orderNumber}`);
    this.printer.bold(false);
    this.printer.println(`Menu: ${orderData.menuType}`);
    this.printer.println(`Time: ${new Date(orderData.timestamp).toLocaleString()}`);
    
    if (orderData.customerName) {
      this.printer.println(`Customer: ${orderData.customerName}`);
    }
    
    if (orderData.cartId) {
      this.printer.println(`Group Cart: ${orderData.cartId}`);
    }

    if (orderData.tableNumber) {
      this.printer.println(`Table: ${orderData.tableNumber}`);
    }

    if (orderData.location) {
      this.printer.println(`Location: ${orderData.location}`);
    }
    
    this.printer.drawLine();
    this.printer.newLine();

    // Order Items
    if (orderData.items.base) {
      this.printer.bold(true);
      this.printer.println('BASE:');
      this.printer.bold(false);
      this.printer.println(`  ${orderData.items.base.name}`);
      this.printer.tableCustom([
        { text: '', align: 'LEFT', width: 0.7 },
        { text: `$${orderData.items.base.price.toFixed(2)}`, align: 'RIGHT', width: 0.3 }
      ]);
      this.printer.newLine();
    }

    if (orderData.items.sauces && orderData.items.sauces.length > 0) {
      this.printer.bold(true);
      this.printer.println('SAUCES:');
      this.printer.bold(false);
      orderData.items.sauces.forEach(sauce => {
        this.printer.println(`  ${sauce.name}`);
        this.printer.tableCustom([
          { text: '', align: 'LEFT', width: 0.7 },
          { text: sauce.price > 0 ? `$${sauce.price.toFixed(2)}` : 'Included', align: 'RIGHT', width: 0.3 }
        ]);
      });
      this.printer.newLine();
    }

    if (orderData.items.toppings && orderData.items.toppings.length > 0) {
      this.printer.bold(true);
      this.printer.println('TOPPINGS:');
      this.printer.bold(false);
      orderData.items.toppings.forEach(topping => {
        this.printer.println(`  ${topping.name}`);
        this.printer.tableCustom([
          { text: '', align: 'LEFT', width: 0.7 },
          { text: topping.price > 0 ? `$${topping.price.toFixed(2)}` : 'Included', align: 'RIGHT', width: 0.3 }
        ]);
      });
      this.printer.newLine();
    }

    // Handle complex order data (Pints, Freeze Sticks, etc.)
    if (orderData.items.orderData) {
      this.printer.bold(true);
      this.printer.println('ORDER DETAILS:');
      this.printer.bold(false);
      this.printer.println(JSON.stringify(orderData.items.orderData, null, 2));
      this.printer.newLine();
    }

    // Total
    this.printer.drawLine();
    this.printer.bold(true);
    this.printer.setTextSize(1, 1);
    this.printer.tableCustom([
      { text: 'TOTAL:', align: 'LEFT', width: 0.6 },
      { text: `$${orderData.totalAmount}`, align: 'RIGHT', width: 0.4 }
    ]);
    this.printer.setTextSize(0, 0);
    this.printer.bold(false);
    this.printer.newLine();

    // Footer
    this.printer.alignCenter();
    this.printer.println('Thank you for your order!');
    this.printer.println('Please show this receipt');
    this.printer.println('when picking up your order');
    this.printer.newLine();
    this.printer.newLine();

    // Cut the paper
    this.printer.cut();
  }

  // SECURITY: Only admin can reprint orders
  async reprintOrder(orderData: PrintOrderData): Promise<boolean> {
    console.log(`Admin reprinting order #${orderData.orderNumber}`);
    return this.printReceipt(orderData, true);
  }
}

// Export secure printer service - only accessible server-side
export const printerService = new SecurePrinterService();