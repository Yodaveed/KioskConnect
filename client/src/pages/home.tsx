import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IceCream, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrder } from "@/hooks/use-order";
import StepOne from "@/components/ordering/step-one";
import StepTwo from "@/components/ordering/step-two";
import StepThree from "@/components/ordering/step-three";
import OrderSummary from "@/components/ordering/order-summary";
import OrderConfirmation from "@/components/ordering/order-confirmation";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const { currentStep, order, totalPrice, resetOrder } = useOrder();

  const { data: menuItems = [] } = useQuery({
    queryKey: ["/api/menu"],
  });

  const renderProgressBar = () => {
    const steps = [
      { number: 1, label: "Base" },
      { number: 2, label: "Sauce" },
      { number: 3, label: "Toppings" },
    ];

    return (
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        currentStep >= step.number
                          ? "bg-primary text-white"
                          : "bg-gray-300 text-gray-600"
                      }`}
                    >
                      {step.number}
                    </div>
                    <span
                      className={`font-medium ${
                        currentStep >= step.number
                          ? "text-primary"
                          : "text-gray-600"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-16 h-1 bg-gray-200 rounded ml-8">
                      <div
                        className={`h-1 rounded transition-all duration-300 ${
                          currentStep > step.number ? "w-full bg-primary" : "w-0"
                        }`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Order Total</p>
              <p className="text-2xl font-bold text-primary">${totalPrice.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepOne />;
      case 2:
        return <StepTwo />;
      case 3:
        return <StepThree />;
      case 4:
        return <OrderSummary />;
      case 5:
        return <OrderConfirmation />;
      default:
        return <StepOne />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-secondary text-white py-6 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <IceCream className="text-3xl" />
              <h1 className="text-3xl md:text-4xl font-bold">IC Pasta</h1>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Welcome!</p>
              <p className="text-lg font-semibold">Start Your Order</p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {currentStep < 5 && renderProgressBar()}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {renderStep()}
      </main>

      {/* Admin Button */}
      <Button
        onClick={() => setLocation("/admin")}
        className="fixed bottom-4 right-4 bg-dark-slate text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors z-40"
        size="icon"
      >
        <Settings className="h-5 w-5" />
      </Button>
    </div>
  );
}
