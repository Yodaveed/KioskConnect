import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
}

export function LoadingSpinner({ size = "md", className, children }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  return (
    <div className={cn("flex items-center justify-center space-x-2", className)} role="status" aria-live="polite">
      <Loader2 className={cn("animate-spin", sizeClasses[size])} aria-hidden="true" />
      {children && <span className="text-sm">{children}</span>}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function LoadingCard({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center p-8 border border-gray-200 rounded-lg bg-white">
      <LoadingSpinner size="lg">{children}</LoadingSpinner>
    </div>
  );
}