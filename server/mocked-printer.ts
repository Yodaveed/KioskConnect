/**
 * PHASE 3A: Mocked Printer Service for Testing
 * Records every print call and validates ticket formatting
 */

interface MockPrintCall {
  timestamp: string;
  orderId: string;
  ticketData: any;
  formattedTicket: string;
  success: boolean;
  error?: string;
}

interface PrintData {
  orderNumber: string;
  customerName: string;
  menuType?: string;
  items: any;
  totalAmount: string | number;
  timestamp: string;
  cartId?: string;
  tableNumber?: string;
  location?: string;
}

class MockedPrinterService {
  private printCalls: MockPrintCall[] = [];
  private shouldSimulateError: boolean = false;
  private errorMessage: string = "Simulated printer error";
  private printCount: number = 0;

  // Configure mock behavior
  simulateError(shouldError: boolean, errorMessage?: string) {
    this.shouldSimulateError = shouldError;
    if (errorMessage) {
      this.errorMessage = errorMessage;
    }
  }

  // Reset mock state
  reset() {
    this.printCalls = [];
    this.shouldSimulateError = false;
    this.printCount = 0;
  }

  // Get all print calls for validation
  getPrintCalls(): MockPrintCall[] {
    return [...this.printCalls];
  }

  // Get print call count
  getPrintCount(): number {
    return this.printCount;
  }

  // Main print method that replaces real printer
  async printReceipt(printData: PrintData): Promise<boolean> {
    this.printCount++;
    
    const callId = `${printData.orderNumber}-${Date.now()}`;
    
    try {
      // Format ticket string exactly like real printer would
      const formattedTicket = this.formatTicketString(printData);
      
      // Simulate printer error if configured
      if (this.shouldSimulateError) {
        const errorCall: MockPrintCall = {
          timestamp: new Date().toISOString(),
          orderId: callId,
          ticketData: printData,
          formattedTicket: formattedTicket,
          success: false,
          error: this.errorMessage
        };
        
        this.printCalls.push(errorCall);
        console.log(`MOCK PRINTER ERROR: ${this.errorMessage} for order ${printData.orderNumber}`);
        return false;
      }

      // Record successful print call
      const successCall: MockPrintCall = {
        timestamp: new Date().toISOString(),
        orderId: callId,
        ticketData: printData,
        formattedTicket: formattedTicket,
        success: true
      };
      
      this.printCalls.push(successCall);
      console.log(`MOCK PRINTER SUCCESS: Order ${printData.orderNumber} printed successfully`);
      console.log(`TICKET CONTENT:\n${formattedTicket}\n---END TICKET---`);
      
      return true;
      
    } catch (error) {
      const errorCall: MockPrintCall = {
        timestamp: new Date().toISOString(),
        orderId: callId,
        ticketData: printData,
        formattedTicket: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
      
      this.printCalls.push(errorCall);
      console.error(`MOCK PRINTER EXCEPTION: ${error} for order ${printData.orderNumber}`);
      return false;
    }
  }

  // Format ticket string with proper structure
  private formatTicketString(printData: PrintData): string {
    const lines: string[] = [];
    
    // Header
    lines.push("================================");
    lines.push("       IC PASTA KIOSK");
    lines.push("      Order Receipt");
    lines.push("================================");
    lines.push("");
    
    // Order info
    lines.push(`Order #: ${printData.orderNumber}`);
    lines.push(`Customer: ${printData.customerName}`);
    lines.push(`Menu Type: ${printData.menuType || "Ice Cream"}`);
    lines.push(`Date: ${new Date(printData.timestamp).toLocaleString()}`);
    
    if (printData.tableNumber) {
      lines.push(`Table: ${printData.tableNumber}`);
    }
    
    if (printData.cartId) {
      lines.push(`Cart ID: ${printData.cartId}`);
    }
    
    lines.push("");
    lines.push("--------------------------------");
    lines.push("ITEMS:");
    lines.push("--------------------------------");
    
    // Parse items - handle both array and object formats
    const items = this.parseItemsForPrint(printData.items);
    let subtotal = 0;
    
    items.forEach(item => {
      const itemTotal = parseFloat(item.price.toString()) * item.quantity;
      subtotal += itemTotal;
      
      lines.push(`${item.name}`);
      lines.push(`  Qty: ${item.quantity} x $${item.price} = $${itemTotal.toFixed(2)}`);
      
      // Add premium badge if applicable
      if (item.isPremium || item.category === 'premium') {
        lines.push("  [PREMIUM ITEM]");
      }
      
      // Add modifiers if present
      if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach((mod: any) => {
          lines.push(`    + ${mod.name || mod}`);
        });
      }
      
      lines.push("");
    });
    
    lines.push("--------------------------------");
    lines.push(`Subtotal: $${subtotal.toFixed(2)}`);
    
    // Calculate tax/fees (simplified)
    const tax = subtotal * 0.08; // 8% tax
    lines.push(`Tax (8%): $${tax.toFixed(2)}`);
    
    const total = subtotal + tax;
    lines.push(`TOTAL: $${total.toFixed(2)}`);
    lines.push("--------------------------------");
    lines.push("");
    lines.push("Thank you for your order!");
    lines.push("IC Pasta - Fresh & Delicious");
    lines.push("================================");
    
    return lines.join("\n");
  }

  // Parse items from various formats
  private parseItemsForPrint(items: any): any[] {
    if (Array.isArray(items)) {
      return items;
    }
    
    if (typeof items === 'object' && items !== null) {
      // Handle object format from order data
      return Object.values(items).filter(Boolean);
    }
    
    // Fallback - return empty array
    return [];
  }

  // Validation helpers for tests
  validateTicketFormat(ticketString: string): boolean {
    const requiredElements = [
      "IC PASTA KIOSK",
      "Order #:",
      "Customer:",
      "ITEMS:",
      "TOTAL:",
      "Thank you"
    ];
    
    return requiredElements.every(element => ticketString.includes(element));
  }

  findPrintCallByOrderNumber(orderNumber: string): MockPrintCall | undefined {
    return this.printCalls.find(call => 
      call.ticketData?.orderNumber === orderNumber
    );
  }

  validatePremiumBadges(orderNumber: string): boolean {
    const call = this.findPrintCallByOrderNumber(orderNumber);
    if (!call) return false;
    
    // Check if premium items have badges in ticket
    const items = this.parseItemsForPrint(call.ticketData.items);
    const premiumItems = items.filter(item => item.isPremium || item.category === 'premium');
    
    return premiumItems.every(item => 
      call.formattedTicket.includes("[PREMIUM ITEM]")
    );
  }
}

// Export singleton instance
export const mockedPrinterService = new MockedPrinterService();

// Export class for testing
export { MockedPrinterService, type MockPrintCall, type PrintData };