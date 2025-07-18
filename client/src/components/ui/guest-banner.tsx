import { useState } from "react";
import { X, Info, Star, Clock, Wifi } from "lucide-react";
import { Button } from "./button";
import { Card } from "./card";

interface GuestBannerProps {
  tableNumber?: string;
  location?: string;
  estimatedWait?: string;
  onDismiss?: () => void;
}

export function GuestBanner({ tableNumber, location, estimatedWait, onDismiss }: GuestBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <Card className="mx-4 mt-4 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Info className="h-4 w-4 text-blue-600" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">
                Welcome to IC Pasta! 
                {tableNumber && ` Table ${tableNumber}`}
                {location && ` - ${location}`}
              </h3>
              <div className="flex items-center space-x-4 mt-1 text-sm text-blue-700">
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3" aria-hidden="true" />
                  <span>Freshly made to order</span>
                </div>
                {estimatedWait && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <span>Est. {estimatedWait} wait time</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Wifi className="h-3 w-3" aria-hidden="true" />
                  <span>Free WiFi available</span>
                </div>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
            aria-label="Dismiss welcome message"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function OrderingTips() {
  return (
    <Card className="mx-4 mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
      <div className="p-4">
        <h3 className="font-semibold text-green-900 mb-2">Quick Ordering Tips</h3>
        <div className="space-y-1 text-sm text-green-700">
          <p>• Use keyboard arrows to navigate between options</p>
          <p>• Premium toppings are clearly marked with special pricing</p>
          <p>• Your order will be prepared fresh - estimated 8-12 minutes</p>
          <p>• Need help? Wave to any staff member</p>
        </div>
      </div>
    </Card>
  );
}