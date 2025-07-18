import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "success";
  onConfirm: () => void;
  onCancel?: () => void;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const getIcon = () => {
    switch (variant) {
      case "destructive":
        return <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />;
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />;
      default:
        return <Info className="h-6 w-6 text-blue-600" aria-hidden="true" />;
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center space-x-3">
            {getIcon()}
            <AlertDialogTitle className="text-lg font-semibold">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-gray-600 mt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex space-x-2 sm:space-x-0">
          <AlertDialogCancel 
            onClick={handleCancel}
            className="focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={`focus:ring-2 focus:ring-offset-2 ${
              variant === "destructive"
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-300"
                : variant === "success"
                ? "bg-green-600 hover:bg-green-700 focus:ring-green-300"
                : "bg-primary hover:bg-primary/90 focus:ring-primary/30"
            }`}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}