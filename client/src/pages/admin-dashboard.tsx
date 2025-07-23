import { useState, useEffect } from "react";
import { Settings, Eye, LogOut, BarChart3, Utensils, Receipt, QrCode, Menu as MenuIcon, FileText, Package, Image } from "lucide-react";
import { authService } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import DashboardTab from "@/components/admin/dashboard-tab";
import MenuTypesTab from "@/components/admin/menu-types-tab";
import MenuTab from "@/components/admin/menu-tab";
import OrdersTab from "@/components/admin/orders-tab";
import QrTab from "@/components/admin/qr-tab";
import LogoUpload from "@/components/ui/logo-upload";
import ManualTicketEntry from "@/components/ManualTicketEntry";
import InventoryTab from "@/components/InventoryTab";

type TabType = "dashboard" | "menu-types" | "menu" | "orders" | "qr" | "manual-ticket" | "inventory" | "settings";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [, setLocation] = useLocation();
  const [logo, setLogo] = useState<string>("");
  
  // -- BEGIN ADMIN AUTH GUARD --
  const token = localStorage.getItem('ic_pasta_admin_token');
  if (!token) {
    setLocation("/admin"); // Or your redirect method
    return null; // Prevent rendering admin UI if not logged in
  }
  // -- END ADMIN AUTH GUARD --

  // Load logo from localStorage on component mount
  useEffect(() => {
    const savedLogo = localStorage.getItem('ic_pasta_logo');
    if (savedLogo) {
      setLogo(savedLogo);
    }
  }, []);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "menu-types", label: "Menu Types", icon: MenuIcon },
    { id: "menu", label: "Menu Items", icon: Utensils },
    { id: "orders", label: "Orders", icon: Receipt },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "manual-ticket", label: "Manual Ticket Entry", icon: FileText },
    { id: "qr", label: "QR Codes", icon: QrCode },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleLogoChange = (logoUrl: string) => {
    setLogo(logoUrl);
    localStorage.setItem('ic_pasta_logo', logoUrl);
    // Also update the home page logo by dispatching a custom event
    window.dispatchEvent(new CustomEvent('logoUpdated', { detail: { logoUrl } }));
  };

  const handleLogoRemove = () => {
    setLogo("");
    localStorage.removeItem('ic_pasta_logo');
    window.dispatchEvent(new CustomEvent('logoUpdated', { detail: { logoUrl: "" } }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab />;
      case "menu-types":
        return <MenuTypesTab />;
      case "menu":
        return <MenuTab />;
      case "orders":
        return <OrdersTab />;
      case "inventory":
        return <InventoryTab />;
      case "manual-ticket":
        return <ManualTicketEntry />;
      case "qr":
        return <QrTab />;
      case "settings":
        return (
          <div>
            <h2 className="text-2xl font-bold text-dark-slate mb-6">Settings</h2>
            <LogoUpload 
              currentLogo={logo}
              onLogoChange={handleLogoChange}
              onLogoRemove={handleLogoRemove}
            />
          </div>
        );
      default:
        return <DashboardTab />;
    }
  };

  return (
    <div className="min-h-screen bg-soft-white">
      {/* Header */}
      <header className="bg-dark-slate text-white py-4 px-6 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {logo ? (
              <img 
                src={logo} 
                alt="Logo" 
                className="h-8 w-auto max-w-32 object-contain"
                onError={(e) => {
                  // Fallback to default icon if logo fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <Settings className={`text-2xl ${logo ? 'hidden' : ''}`} />
            <h1 className="text-2xl font-bold">IC Pasta Admin</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm">Welcome, Admin</span>

            <Button
              onClick={() => setLocation("/")}
              className="bg-primary hover:bg-primary/90"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Kiosk
            </Button>
            <Button
              onClick={async () => {
                await authService.logout();
                setLocation("/");
              }}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="p-6">
        {renderTabContent()}
      </div>
    </div>
  );
}
