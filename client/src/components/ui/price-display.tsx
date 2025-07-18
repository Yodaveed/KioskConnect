import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  price: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  showCurrency?: boolean;
  variant?: "default" | "accent" | "muted";
}

export function PriceDisplay({ 
  price, 
  className, 
  size = "md", 
  showCurrency = true,
  variant = "default" 
}: PriceDisplayProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg font-semibold"
  };

  const variantClasses = {
    default: "text-gray-900",
    accent: "text-primary font-semibold",
    muted: "text-gray-600"
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <span 
      className={cn(
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      aria-label={`Price: ${formatPrice(price)}`}
    >
      {showCurrency ? formatPrice(price) : `$${price.toFixed(2)}`}
    </span>
  );
}