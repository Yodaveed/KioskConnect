import { Button, ButtonProps } from "./button";
import { LoadingSpinner } from "./loading-spinner";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface EnhancedButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  ariaLabel?: string;
}

export const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ 
    children, 
    loading = false, 
    loadingText, 
    icon, 
    iconPosition = "left",
    fullWidth = false,
    ariaLabel,
    className,
    disabled,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <Button
        ref={ref}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-busy={loading}
        className={cn(
          "transition-all duration-200 focus:ring-2 focus:ring-offset-2",
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <div className="flex items-center space-x-2">
            <LoadingSpinner size="sm" />
            <span>{loadingText || "Loading..."}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            {icon && iconPosition === "left" && (
              <span aria-hidden="true">{icon}</span>
            )}
            <span>{children}</span>
            {icon && iconPosition === "right" && (
              <span aria-hidden="true">{icon}</span>
            )}
          </div>
        )}
      </Button>
    );
  }
);

EnhancedButton.displayName = "EnhancedButton";