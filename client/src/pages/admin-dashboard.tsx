import { useState } from "react";
import { Settings, Eye, LogOut, BarChart3, Utensils, Receipt, QrCode, Menu as MenuIcon, FileText } from "lucide-react";
import { authService } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import DashboardTab from "@/components/admin/dashboard-tab";
import MenuTypesTab from "@/components/admin/menu-types-tab";
import MenuTab from "@/components/admin/menu-tab";
import OrdersTab from "@/components/admin/orders-tab";
import QrTab from "@/components/admin/qr-tab";


import ManualTicketEntry from "@/components/ManualTicketEntry";

type TabType = "dashboard" | "menu-types" | "menu" | "orders" | "qr" | "manual-ticket";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [, setLocation] = useLocation();
  
  // -- BEGIN ADMIN AUTH GUARD --
  const token = localStorage.getItem('ic_pasta_admin_token');
  if (!token) {
    setLocation("/admin"); // Or your redirect method
    return null; // Prevent rendering admin UI if not logged in
  }
  // -- END ADMIN AUTH GUARD --

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "menu-types", label: "Menu Types", icon: MenuIcon },
    { id: "menu", label: "Menu Items", icon: Utensils },
    { id: "orders", label: "Orders", icon: Receipt },
    { id: "manual-ticket", label: "Manual Ticket Entry", icon: FileText },
    { id: "qr", label: "QR Codes", icon: QrCode },
  ];

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
      case "manual-ticket":
        return <ManualTicketEntry />;
      case "qr":
        return <QrTab />;
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
            <Settings className="text-2xl" />
            <h1 className="text-2xl font-bold">IC Pasta Admin</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm">Welcome, Admin</span>
            <Button
              onClick={() => setLocation("/admin/qr")}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-dark-slate"
            >
              <QrCode className="h-4 w-4 mr-2" />
              QR Manager
            </Button>
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
