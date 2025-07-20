import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MenuItem, Menu } from "@shared/schema";
// Removed ImageUpload - now using simple URL input

const menuItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.enum(["base", "sauce", "topping", "flavor", "size"], {
    required_error: "Category is required",
  }),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Price must be a valid positive number",
  }),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  isPremium: z.boolean().default(false),
  menuIds: z.array(z.number()).min(1, "At least one menu must be selected"),
});

type MenuItemForm = z.infer<typeof menuItemSchema>;

export default function MenuTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);
  const [selectedMenus, setSelectedMenus] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: menus = [], isLoading: menusLoading } = useQuery({
    queryKey: ["/api/menus"],
  });

  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ["/api/menu", selectedMenuId],
    queryFn: () => selectedMenuId ? 
      apiRequest("GET", `/api/menu?menuId=${selectedMenuId}`) : 
      Promise.resolve([]),
    enabled: !!selectedMenuId,
  });

  const form = useForm<MenuItemForm>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "base",
      price: "0.00",
      imageUrl: "",
      isActive: true,
      isPremium: false,
      menuIds: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: MenuItemForm) => {

      return apiRequest("POST", "/api/menu", {
        ...data,
        price: Number(data.price)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      setIsDialogOpen(false);
      form.reset();
      setEditingItem(null);
      toast({
        title: "Success!",
        description: "Menu item created successfully",
      });
    },
    onError: (error: any) => {

      toast({
        title: "Error",
        description: error.message || "Failed to create menu item",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: MenuItemForm }) => {

      return apiRequest("PUT", `/api/menu/${id}`, {
        ...data,
        price: Number(data.price)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      setIsDialogOpen(false);
      form.reset();
      setEditingItem(null);
      toast({
        title: "Success!",
        description: "Menu item updated successfully",
      });
    },
    onError: (error: any) => {

      toast({
        title: "Error", 
        description: error.message || "Failed to update menu item",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/menu/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      toast({
        title: "Success!",
        description: "Menu item deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete menu item",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MenuItemForm) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = async (item: MenuItem) => {
    setEditingItem(item);
    
    // Get current menu assignments for this item
    try {
      const assignedMenus = await apiRequest("GET", `/api/menu-items/${item.id}/menus`);
      const menuIds = assignedMenus.map((menu: Menu) => menu.id);
      
      form.reset({
        name: item.name,
        description: item.description || "",
        category: item.category as any,
        price: item.price.toString(),
        imageUrl: item.imageUrl || "",
        isActive: item.isActive,
        isPremium: item.isPremium,
        menuIds: menuIds,
      });
      setSelectedMenus(menuIds);
    } catch (error) {
      console.error("Error loading menu assignments:", error);
      form.reset({
        name: item.name,
        description: item.description || "",
        category: item.category as any,
        price: item.price.toString(),
        imageUrl: item.imageUrl || "",
        isActive: item.isActive,
        isPremium: item.isPremium,
        menuIds: [],
      });
      setSelectedMenus([]);
    }
    
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this menu item?")) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    form.reset({
      name: "",
      description: "",
      category: "base",
      price: "0.00",
      imageUrl: "",
      isActive: true,
      isPremium: false,
      menuIds: [],
    });
    setEditingItem(null);
    setSelectedMenus([]);
  };

  // Filter menu items based on search term and category
  const filteredItems = menuItems.filter((item: MenuItem) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", "base", "sauce", "topping", "flavor", "size"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-dark-slate">Menu Items</h2>
          <p className="text-gray-600">Manage your menu items</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Menu Item" : "Create New Menu Item"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter item name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="base">Base</SelectItem>
                            <SelectItem value="sauce">Sauce</SelectItem>
                            <SelectItem value="topping">Topping</SelectItem>
                            <SelectItem value="flavor">Flavor</SelectItem>
                            <SelectItem value="size">Size</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter item description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="menuIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Menus</FormLabel>
                        <div className="space-y-2">
                          <div className="text-sm text-gray-600">
                            Select which menus this item should appear in:
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {(menus as Menu[]).map((menu) => (
                              <div key={menu.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`menu-${menu.id}`}
                                  checked={field.value.includes(menu.id)}
                                  onChange={(e) => {
                                    const currentValue = field.value || [];
                                    if (e.target.checked) {
                                      field.onChange([...currentValue, menu.id]);
                                      setSelectedMenus([...currentValue, menu.id]);
                                    } else {
                                      const newValue = currentValue.filter(id => id !== menu.id);
                                      field.onChange(newValue);
                                      setSelectedMenus(newValue);
                                    }
                                  }}
                                  className="h-4 w-4"
                                />
                                <label 
                                  htmlFor={`menu-${menu.id}`} 
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {menu.name}
                                </label>
                                <span className="text-xs text-gray-500">
                                  ({menu.orderingFlow})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/image.jpg"
                          {...field}
                          disabled={createMutation.isPending || updateMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-6">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Active</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isPremium"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Premium</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {editingItem ? "Update" : "Create"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Menu Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Menu Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={(value) => setSelectedMenuId(parseInt(value))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a menu to manage items" />
            </SelectTrigger>
            <SelectContent>
              {(menus as Menu[]).map((menu) => (
                <SelectItem key={menu.id} value={menu.id.toString()}>
                  {menu.name} - {menu.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      {selectedMenuId && (
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Menu Items List */}
      {selectedMenuId && (
        <Card>
          <CardHeader>
            <CardTitle>Menu Items ({filteredItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || categoryFilter !== "all" ? "No items match your search" : "No menu items found"}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item: MenuItem) => (
                  <Card key={item.id} className={`relative ${!item.isActive ? "opacity-50" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                            {item.isPremium && (
                              <Badge variant="secondary" className="text-xs">
                                Premium
                              </Badge>
                            )}
                            {!item.isActive && (
                              <Badge variant="destructive" className="text-xs">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <div className="font-bold text-lg text-primary">
                            ${parseFloat(item.price.toString()).toFixed(2)}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}