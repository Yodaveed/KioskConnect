import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, DollarSign, TrendingUp, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/analytics/stats"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const revenueData = [
    { day: "Mon", value: 60 },
    { day: "Tue", value: 80 },
    { day: "Wed", value: 45 },
    { day: "Thu", value: 70 },
    { day: "Fri", value: 90 },
    { day: "Sat", value: 100 },
    { day: "Sun", value: 85 },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-dark-slate mb-6">Analytics Dashboard</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Today's Orders</p>
                <p className="text-3xl font-bold text-primary">{stats?.totalOrders || 0}</p>
              </div>
              <div className="w-12 h-12 bg-primary bg-opacity-20 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Today's Revenue</p>
                <p className="text-3xl font-bold text-secondary">${stats?.totalRevenue?.toFixed(2) || "0.00"}</p>
              </div>
              <div className="w-12 h-12 bg-secondary bg-opacity-20 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Average Order</p>
                <p className="text-3xl font-bold text-accent">${stats?.averageOrderValue?.toFixed(2) || "0.00"}</p>
              </div>
              <div className="w-12 h-12 bg-accent bg-opacity-20 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Popular Item</p>
                <p className="text-lg font-bold text-coral">{stats?.popularItems?.[0]?.name || "N/A"}</p>
              </div>
              <div className="w-12 h-12 bg-coral bg-opacity-20 rounded-full flex items-center justify-center">
                <Star className="h-6 w-6 text-coral" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-dark-slate">Popular Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.popularItems?.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-600">{item.name}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(10, (item.count / 50) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-dark-slate">Weekly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end justify-between space-x-2">
              {revenueData.map((item, index) => (
                <div key={item.day} className="flex-1 flex flex-col items-center">
                  <div 
                    className={`w-full rounded-t transition-all duration-300 ${
                      index % 4 === 0 ? 'bg-primary' : 
                      index % 4 === 1 ? 'bg-secondary' : 
                      index % 4 === 2 ? 'bg-accent' : 'bg-coral'
                    }`}
                    style={{ height: `${item.value}%` }}
                  />
                  <span className="text-xs text-gray-600 mt-2">{item.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
