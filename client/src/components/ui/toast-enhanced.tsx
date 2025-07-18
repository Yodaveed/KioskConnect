import { useEffect } from "react";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

export function ToasterEnhanced() {
  const { toasts } = useToast();

  const getToastIcon = (variant?: string) => {
    switch (variant) {
      case "destructive":
        return <AlertCircle className="h-4 w-4" aria-hidden="true" />;
      case "success":
        return <CheckCircle className="h-4 w-4" aria-hidden="true" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" aria-hidden="true" />;
      default:
        return <Info className="h-4 w-4" aria-hidden="true" />;
    }
  };

  const getAriaLabel = (variant?: string, title?: string) => {
    const type = variant === "destructive" ? "Error" : variant === "success" ? "Success" : variant === "warning" ? "Warning" : "Info";
    return `${type} notification: ${title || ""}`;
  };

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props} 
            variant={variant}
            role="alert"
            aria-live={variant === "destructive" ? "assertive" : "polite"}
            aria-label={getAriaLabel(variant, title)}
          >
            <div className="flex items-start space-x-2">
              {getToastIcon(variant)}
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

// Enhanced toast hook with better UX
export function useToastEnhanced() {
  const { toast: originalToast } = useToast();

  const toast = {
    success: (title: string, description?: string) => {
      originalToast({
        title,
        description,
        variant: "default",
        duration: 3000,
      });
    },
    error: (title: string, description?: string) => {
      originalToast({
        title,
        description,
        variant: "destructive",
        duration: 5000,
      });
    },
    warning: (title: string, description?: string) => {
      originalToast({
        title,
        description,
        variant: "warning",
        duration: 4000,
      });
    },
    info: (title: string, description?: string) => {
      originalToast({
        title,
        description,
        duration: 3000,
      });
    },
  };

  return { toast };
}