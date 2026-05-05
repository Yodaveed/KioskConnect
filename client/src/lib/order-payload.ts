export interface OrderPayloadInput {
  customerName: string;
  totalAmount: number;
  items: unknown;
  menuType?: string;
  source?: string;
}

export interface OrderPayload {
  customerName: string;
  totalAmount: string;
  items: unknown;
  menuType?: string;
  source?: string;
}

export function requireCustomerName(customerName: string): string {
  const trimmedName = customerName.trim();

  if (!trimmedName) {
    throw new Error("Please enter a customer name before placing the order.");
  }

  return trimmedName;
}

export function buildOrderPayload({
  customerName,
  totalAmount,
  items,
  menuType,
  source,
}: OrderPayloadInput): OrderPayload {
  const trimmedName = requireCustomerName(customerName);

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw new Error("Order total must be greater than $0.00 before checkout.");
  }

  if (!items) {
    throw new Error("Order must include at least one item before checkout.");
  }

  return {
    customerName: trimmedName,
    totalAmount: totalAmount.toFixed(2),
    items,
    ...(menuType ? { menuType } : {}),
    ...(source ? { source } : {}),
  };
}
