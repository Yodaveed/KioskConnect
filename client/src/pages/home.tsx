import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { IceCream, Settings, ArrowRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MobileSafeImage } from "@/components/ui/mobile-safe-image";
import { ORDER_STEPS, useOrder, type OrderStep } from "@/hooks/use-order";
import StepOne from "@/components/ordering/step-one";
import StepTwo from "@/components/ordering/step-two";
import StepThree from "@/components/ordering/step-three";
import OrderSummary from "@/components/ordering/order-summary";
import OrderConfirmation from "@/components/ordering/order-confirmation";
import FreezeSticksFlow from "@/components/ordering/freeze-sticks-flow";
import PintsFlow from "@/components/ordering/pints-flow";
import CartViewer from "@/components/cart/cart-viewer";
import OrderWrapper from "@/components/ordering/order-wrapper";
import { useCart } from "@/hooks/use-cart";
import { useLocation } from "wouter";
import type { Menu } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [showCartDialog, setShowCartDialog] = useState(false);
  const { currentStep, totalPrice, resetOrder, setSelectedMenuId, setStep } = useOrder();
  const { cartId, items, isActive } = useCart();

  // Logo state
  const [logo, setLogo] = useState<string>("");

  // QR code and guest info state
  const [qrInfo, setQrInfo] = useState<{ table?: string; location?: string }>({});
  const [showGuestBanner, setShowGuestBanner] = useState(false);

  // Reset order state when component mounts to start fresh
  useEffect(() => {
    // Clear any persistent order state to start fresh
    resetOrder();
    
    // Load logo from localStorage
    const savedLogo = localStorage.getItem('ic_pasta_logo');
    if (savedLogo) {
      setLogo(savedLogo);
    }
    
    // Listen for logo updates from admin
    const handleLogoUpdate = (event: CustomEvent) => {
      setLogo(event.detail.logoUrl);
    };
    window.addEventListener('logoUpdated', handleLogoUpdate as EventListener);
    
    // Check for QR code parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const tableNumber = urlParams.get('table');
    const location = urlParams.get('location');
    
    if (tableNumber) {
      // Store QR code info for later use in orders
      localStorage.setItem('qr_table', tableNumber);
      if (location) {
        localStorage.setItem('qr_location', location);
      }
      setQrInfo({ table: tableNumber, location: location || undefined });
      setShowGuestBanner(true);
    }

    return () => {
      window.removeEventListener('logoUpdated', handleLogoUpdate as EventListener);
    };
  }, []);

  const { data: menus = [], isLoading: menusLoading, error: menusError } = useQuery<Menu[]>({
    queryKey: ["/api/menus"],
  });

  // Sort menus by sort order or creation
  const sortedMenus = [...menus].sort((a, b) => {
    // Sort by sortOrder if available, then by id
    return (a.sortOrder || a.id) - (b.sortOrder || b.id);
  });

  const handleMenuSelect = (menu: Menu) => {
    setSelectedMenu(menu);
    setSelectedMenuId(menu.id);
    
    // Route to appropriate flow based on menu type
    switch (menu.orderingFlow) {
      case "single-page":
        setStep(ORDER_STEPS.PINTS); // Single page flow
        break;
      case "custom":
        setStep(ORDER_STEPS.FREEZE_STICKS); // Custom flow (freeze sticks, etc.)
        break;
      default:
        setStep(ORDER_STEPS.BASE); // Traditional 3-step flow
    }
  };

  const renderMenuSelection = () => {
    if (menusLoading) {
      return (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-dark-slate mb-4">Choose Your Experience</h2>
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Loading menu options...</span>
            </div>
          </div>
        </div>
      );
    }

    if (menusError) {
      return (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-dark-slate mb-4">Choose Your Experience</h2>
            <p className="text-red-600">Unable to load menu options. Please try refreshing the page.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-dark-slate mb-4">Choose Your Experience</h1>
          <p className="text-gray-600 text-xl">Select from our delicious menu options</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" role="group" aria-label="Menu selection">
          {sortedMenus.map((menu: Menu) => (
            <Card
              key={menu.id}
              tabIndex={0} // Make the card keyboard focusable
              aria-label={`Select ${menu.name} menu - ${menu.description || ''}`}
              className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary focus:shadow-lg btn-focus"
              // Handle keyboard selection as well as click
              onClick={() => handleMenuSelect(menu)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleMenuSelect(menu);
                }
              }}
            >
              <CardContent className="p-8 text-center">
                {/* Show menu image if available, otherwise fallback to icon */}
                <MobileSafeImage
                  src={menu.imageUrl}
                  alt={`${menu.name} preview`}
                  className="w-20 h-20 mx-auto mb-4 rounded-lg object-cover"
                  fallbackIcon={<IceCream className="w-10 h-10 text-white" aria-hidden="true" />}
                />

                <div className="text-2xl font-bold mb-2 text-dark-slate">{menu.name}</div>
                <div className="text-muted-foreground mb-4 text-sm">{menu.description}</div>

                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-white focus:ring-2 focus:ring-primary focus:ring-offset-2 btn-focus"
                  aria-label={`Start ${menu.name} order`}
                  tabIndex={-1} // Card handles focus, not individual button
                >
                  Start Order
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const traditionalSteps: { step: OrderStep; number: number; label: string }[] = [
    { step: ORDER_STEPS.BASE, number: 1, label: "Base" },
    { step: ORDER_STEPS.SAUCE, number: 2, label: "Sauce" },
    { step: ORDER_STEPS.TOPPINGS, number: 3, label: "Toppings" },
  ];

  const getTraditionalStepIndex = (step: OrderStep) => {
    const index = traditionalSteps.findIndex((item) => item.step === step);
    return index === -1 ? traditionalSteps.length : index;
  };

  const traditionalFlowSteps: OrderStep[] = [
    ORDER_STEPS.BASE,
    ORDER_STEPS.SAUCE,
    ORDER_STEPS.TOPPINGS,
    ORDER_STEPS.REVIEW,
  ];
  const isTraditionalFlowStep = traditionalFlowSteps.includes(currentStep);

  const renderProgressBar = () => {
    const currentIndex = getTraditionalStepIndex(currentStep);
    const ariaValue = Math.min(currentIndex + 1, traditionalSteps.length);

    return (
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8" role="progressbar" aria-valuenow={ariaValue} aria-valuemin={1} aria-valuemax={traditionalSteps.length} aria-label="Order progress">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(ORDER_STEPS.MENU)}
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
                {traditionalSteps.map((step, index) => {
                  const isActiveOrComplete = currentIndex >= index;
                  const isComplete = currentIndex > index;

                  return (
                    <div key={step.step} className="flex items-center">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            isActiveOrComplete
                              ? "bg-primary text-white"
                              : "bg-gray-300 text-gray-600"
                          }`}
                        >
                          {step.number}
                        </div>
                        <span
                          className={`font-medium ${
                            isActiveOrComplete
                              ? "text-primary"
                              : "text-gray-600"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                      {index < traditionalSteps.length - 1 && (
                        <div className="w-16 h-1 bg-gray-200 rounded ml-8">
                          <div
                            className={`h-1 rounded transition-all duration-300 ${
                              isComplete ? "w-full bg-primary" : "w-0"
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
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
    if (currentStep === ORDER_STEPS.MENU) {
      return renderMenuSelection();
    }

    if (!selectedMenu) {
      return renderMenuSelection();
    }

    // Wrap all ordering flows with name collection
    const orderingFlow = () => {
      switch (currentStep) {
        case ORDER_STEPS.BASE:
          return <StepOne />;
        case ORDER_STEPS.SAUCE:
          return <StepTwo />;
        case ORDER_STEPS.TOPPINGS:
          return <StepThree />;
        case ORDER_STEPS.REVIEW:
          return <OrderSummary />;
        case ORDER_STEPS.PINTS:
          return <PintsFlow />; // Single page flow
        case ORDER_STEPS.FREEZE_STICKS:
          return <FreezeSticksFlow />; // Custom flow
        case ORDER_STEPS.CONFIRMATION:
          return <OrderConfirmation />;
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
              {logo ? (
                <img 
                  src={logo} 
                  alt="Logo" 
                  className="h-10 w-auto max-w-40 object-contain"
                  onError={(e) => {
                    // Fallback to default icon if logo fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <IceCream className={`text-3xl ${logo ? 'hidden' : ''}`} />
              <h1 className="text-3xl md:text-4xl font-bold">IC Pasta</h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Cart Access - Only show when cart is active */}
              {isActive && (
                <Dialog open={showCartDialog} onOpenChange={setShowCartDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {cartId} ({items.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Group Cart</DialogTitle>
                      <DialogDescription>
                        Manage your group orders and share your cart with others
                      </DialogDescription>
                    </DialogHeader>
                    <CartViewer />
                  </DialogContent>
                </Dialog>
              )}

              <div className="text-right">
                <p className="text-sm opacity-90">Welcome!</p>
                <p className="text-lg font-semibold">Start Your Order</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {isTraditionalFlowStep && renderProgressBar()}
      
      {/* Home Button for non-traditional flows */}
      {([ORDER_STEPS.PINTS, ORDER_STEPS.FREEZE_STICKS] as OrderStep[]).includes(currentStep) && (
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
        className="fixed bottom-4 right-4 bg-dark-slate text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors z-40 btn-focus"
        size="icon"
        aria-label="Access admin dashboard"
      >
        <Settings className="h-5 w-5" />
      </Button>
    </div>
  );
}
