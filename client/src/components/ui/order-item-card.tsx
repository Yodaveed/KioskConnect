import { Card, CardContent } from "./card";
import { Button } from "./button";
import { PriceDisplay } from "./price-display";
import { IconWithFallback } from "./icon-with-fallback";
import { Plus, Minus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderItemCardProps {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string | null;
  isSelected?: boolean;
  quantity?: number;
  maxQuantity?: number | null;
  isPremium?: boolean;
  isRequired?: boolean;
  onSelect?: () => void;
  onQuantityChange?: (quantity: number) => void;
  variant?: "default" | "compact";
}

export function OrderItemCard({
  id,
  name,
  description,
  price,
  imageUrl,
  isSelected = false,
  quantity = 0,
  maxQuantity = null,
  isPremium = false,
  isRequired = false,
  onSelect,
  onQuantityChange,
  variant = "default"
}: OrderItemCardProps) {
  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!maxQuantity || quantity < maxQuantity) {
      onQuantityChange?.(quantity + 1);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity > 0) {
      onQuantityChange?.(quantity - 1);
    }
  };

  const canIncrement = !maxQuantity || quantity < maxQuantity;
  const canDecrement = quantity > 0;

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all duration-200",
          isSelected ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
        )}
        onClick={onSelect}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect?.();
          }
        }}
        aria-label={`${name}${isPremium ? ' (Premium)' : ''}${isRequired ? ' (Required)' : ''} - ${price}`}
      >
        <div className="flex items-center space-x-3">
          <IconWithFallback 
            src={imageUrl} 
            alt={name}
            className="w-8 h-8 rounded-full"
            size={24}
          />
          <div>
            <h4 className="font-medium text-sm">{name}</h4>
            {isPremium && (
              <span className="text-xs text-amber-600 font-medium">Premium</span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <PriceDisplay price={price} size="sm" />
          {isSelected && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
        </div>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        isSelected ? "border-primary ring-2 ring-primary ring-opacity-20" : "border-gray-200"
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.();
        }
      }}
      aria-label={`${name}${isPremium ? ' (Premium)' : ''}${isRequired ? ' (Required)' : ''} - ${price}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <IconWithFallback 
            src={imageUrl} 
            alt={name}
            className="w-16 h-16 rounded-lg flex-shrink-0"
            size={32}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
              {isPremium && (
                <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full font-medium">
                  Premium
                </span>
              )}
              {isRequired && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                  Required
                </span>
              )}
            </div>
            {description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>
            )}
            <div className="mt-2 flex items-center justify-between">
              <PriceDisplay price={price} variant="accent" />
              {maxQuantity && maxQuantity > 1 && (
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDecrement}
                    disabled={!canDecrement}
                    aria-label={`Decrease quantity of ${name}`}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm font-medium w-8 text-center" aria-live="polite">
                    {quantity}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleIncrement}
                    disabled={!canIncrement}
                    aria-label={`Increase quantity of ${name}`}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          {isSelected && !maxQuantity && (
            <Check className="h-5 w-5 text-primary flex-shrink-0" aria-hidden="true" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}