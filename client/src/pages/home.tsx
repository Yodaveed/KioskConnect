import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { IceCream, Settings, ArrowRight, ShoppingCart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useOrder } from "@/hooks/use-order";
import StepOne from "@/components/ordering/step-one";
import StepTwo from "@/components/ordering/step-two";
import StepThree from "@/components/ordering/step-three";
import OrderSummary from "@/components/ordering/order-summary";
import OrderConfirmation from "@/components/ordering/order-confirmation";
import FreezeSticksFlow from "@/components/ordering/freeze-sticks-flow";
import PintsFlow from "@/components/ordering/pints-flow";
import EasyCart from "@/components/cart/easy-cart";
import OrderWrapper from "@/components/ordering/order-wrapper";
import { useCart } from "@/hooks/use-cart";
import { useLocation } from "wouter";
import type { Menu, Cart } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [showCartDialog, setShowCartDialog] = useState(false);
  const [showCartViewer, setShowCartViewer] = useState(false);
  const [customerName, setCustomerName] = useState<string>('');
  const { currentStep, order, totalPrice, resetOrder, setSelectedMenuId, setStep } = useOrder();
  const { cartId, items, isActive, setCartId, addItem } = useCart();

  // Reset order state when component mounts to start fresh
  useEffect(() => {
    // Clear any persistent order state to start fresh
    resetOrder();
  }, []);

  const { data: menus = [] } = useQuery<Menu[]>({
    queryKey: ["/api/menus"],
  });

  const handleMenuSelect = (menu: Menu) => {
    setSelectedMenu(menu);
    setSelectedMenuId(menu.id);
    
    // Route to appropriate flow based on menu type
    switch (menu.orderingFlow) {
      case "single-page":
        setStep(5); // Single page flow
        break;
      case "custom":
        setStep(6); // Custom flow (freeze sticks, etc.)
        break;
      default:
        setStep(1); // Traditional 3-step flow
    }
  };

  const renderMenuSelection = () => {
    return (
      <div className="space-y-8">
        {/* Group Ordering CTA */}
        {!isActive && (
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-2xl font-bold text-blue-900">Ordering with Friends?</h3>
              </div>
              <p className="text-blue-700 mb-4 text-lg">
                Create a group cart so everyone can add their orders together!
              </p>
              <Dialog open={showCartDialog} onOpenChange={setShowCartDialog}>
                <DialogTrigger asChild>
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    <Users className="h-5 w-5 mr-2" />
                    Start Group Cart
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Group Cart</DialogTitle>
                  </DialogHeader>
                  <EasyCart />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}

        {isActive && (
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <ShoppingCart className="h-6 w-6 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-green-900">Group Cart: {cartId}</h3>
              </div>
              <p className="text-green-700 text-sm mb-3">
                {items.length} items • Share "{cartId}" with your group
              </p>
              <Dialog open={showCartDialog} onOpenChange={setShowCartDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                    View Cart
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Group Cart</DialogTitle>
                  </DialogHeader>
                  <EasyCart />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <h2 className="text-4xl font-bold text-dark-slate mb-4">Choose Your Experience</h2>
          <p className="text-gray-600 text-xl">Select from our delicious menu options</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(menus as Menu[]).map((menu: Menu) => (
            <Card
              key={menu.id}
              className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary"
              onClick={() => handleMenuSelect(menu)}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
                  <IceCream className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-semibold text-dark-slate mb-2">{menu.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{menu.description}</p>
                <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                  Start Order
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

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
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(0)}
                  className="text-xs"
                >
                  ← Change Menu
                </Button>
                {selectedMenu && (
                  <span className="text-sm text-gray-600 font-medium">
                    {selectedMenu.name} Menu
                  </span>
                )}
              </div>
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
    if (currentStep === 0) {
      return renderMenuSelection();
    }

    if (!selectedMenu) {
      return renderMenuSelection();
    }

    // Wrap all ordering flows with name collection
    const orderingFlow = () => {
      switch (currentStep) {
        case 1:
          return <StepOne />;
        case 2:
          return <StepTwo />;
        case 3:
          return <StepThree />;
        case 4:
          return <OrderConfirmation />;
        case 5:
          return <PintsFlow />; // Single page flow
        case 6:
          return <FreezeSticksFlow />; // Custom flow
        default:
          return <StepOne />;
      }
    };

    return (
      <OrderWrapper menu={selectedMenu}>
        {orderingFlow()}
      </OrderWrapper>
    );
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
            <div className="flex items-center gap-3">
              {/* Cart Access */}
              <Dialog open={showCartDialog} onOpenChange={setShowCartDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {isActive ? `Cart (${items.length})` : 'Group Cart'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Group Cart</DialogTitle>
                  </DialogHeader>
                  <EasyCart />
                </DialogContent>
              </Dialog>

              <div className="text-right">
                <p className="text-sm opacity-90">Welcome!</p>
                <p className="text-lg font-semibold">Start Your Order</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {currentStep > 0 && currentStep < 5 && renderProgressBar()}
      
      {/* Home Button for non-traditional flows */}
      {currentStep >= 5 && (
        <div className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <Button
              variant="outline"
              onClick={() => {
                resetOrder();
                setSelectedMenu(null);
              }}
              className="text-sm"
            >
              ← Back to Menu Selection
            </Button>
          </div>
        </div>
      )}

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
