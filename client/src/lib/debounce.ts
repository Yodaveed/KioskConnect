// --- SHARED DEBOUNCE UTILITY ---
// Centralized debounce function for cart operations to prevent rapid API calls
// Used across all ordering components to ensure consistent behavior

export const debounce = (fn: Function, delay = 300) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

// Create commonly used debounced cart operations
export const createDebouncedCartOperations = (addItem: Function, removeItem: Function) => ({
  debouncedAddItem: debounce(addItem, 300),
  debouncedRemoveItem: debounce(removeItem, 300)
});