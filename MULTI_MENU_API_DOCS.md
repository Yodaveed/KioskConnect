# Multi-Menu Assignment API Documentation

## Overview
The IC Pasta kiosk ordering system now supports assigning menu items to multiple menus simultaneously through a many-to-many relationship. This allows for flexible menu management where items can appear across different ordering flows.

## Database Schema Changes

### New Junction Table
- **menu_items_to_menus**: Junction table managing the many-to-many relationship
  - `id`: Primary key
  - `menu_item_id`: Foreign key to menu_items table
  - `menu_id`: Foreign key to menus table
  - `created_at`: Timestamp of assignment

### Schema Migration
- Removed `menu_id` column from `menu_items` table
- Migrated existing data to the new junction table
- All existing menu assignments preserved during migration

## API Endpoints

### Menu Item Assignment Management

#### GET /api/menu-items/:id/menus
Get all menus that a specific menu item is assigned to.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 6,
      "name": "Spaghetti",
      "description": "Traditional ice cream spaghetti with toppings",
      "isActive": true,
      "sortOrder": 1,
      "orderingFlow": "three-step",
      "flowConfig": null,
      "pricingRules": {...},
      "createdAt": "2025-07-03T18:30:27.351Z"
    }
  ]
}
```

#### POST /api/menu-items/:id/menus
Assign a menu item to multiple menus.

**Request Body:**
```json
{
  "menuIds": [6, 7, 8]
}
```

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Menu item assigned to menus successfully"
}
```

#### DELETE /api/menu-items/:id/menus
Remove a menu item from multiple menus.

**Request Body:**
```json
{
  "menuIds": [6, 7]
}
```

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Menu item removed from menus successfully"
}
```

#### GET /api/menu-items-with-menus
Get all menu items along with their assigned menus.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 105,
      "name": "Multi-Menu Test Item",
      "description": "Test item for multiple menus",
      "category": "base",
      "price": "4.99",
      "imageUrl": null,
      "isActive": true,
      "isPremium": false,
      "isSoldOut": false,
      "maxQuantity": null,
      "isRequired": false,
      "sortOrder": 0,
      "createdAt": "2025-07-17T20:49:51.441Z",
      "menus": [
        {
          "id": 6,
          "name": "Spaghetti",
          "description": "Traditional ice cream spaghetti with toppings",
          "isActive": true,
          "sortOrder": 1,
          "orderingFlow": "three-step",
          "flowConfig": null,
          "pricingRules": {...},
          "createdAt": "2025-07-03T18:30:27.351Z"
        }
      ]
    }
  ]
}
```

### Enhanced Menu Item Creation

#### POST /api/menu
Create a new menu item and assign it to multiple menus.

**Form Data Parameters:**
- `name`: Menu item name
- `description`: Menu item description
- `category`: Item category (base, sauce, topping, etc.)
- `price`: Price as string
- `menuIds`: JSON array of menu IDs or single menuId for backward compatibility
- `isActive`: Boolean (true/false)
- `isPremium`: Boolean (true/false)
- `image`: Image file (optional)
- Other standard menu item fields

**Example Request:**
```bash
curl -X POST "http://localhost:5000/api/menu" \
  -F "name=Multi-Menu Test Item" \
  -F "description=Test item for multiple menus" \
  -F "category=base" \
  -F "price=4.99" \
  -F "menuIds=[7,8,9]" \
  -F "isActive=true"
```

## Backward Compatibility

### Existing API Endpoints
All existing menu filtering endpoints maintain backward compatibility:

- `GET /api/menu?menuId=6` - Still filters items by menu ID
- `GET /api/menu/:category?menuId=6` - Still filters by category and menu ID
- Menu item creation with single `menuId` parameter still works

### Data Migration
- Existing menu item assignments were automatically migrated to the new junction table
- No data loss occurred during the schema update
- All existing menu filtering logic continues to work

## Storage Layer Methods

### New Methods Added
- `assignMenuItemToMenus(menuItemId, menuIds)` - Assign item to multiple menus
- `removeMenuItemFromMenus(menuItemId, menuIds)` - Remove item from multiple menus
- `getMenuItemMenus(menuItemId)` - Get all menus for a menu item
- `getMenuItemsWithMenus()` - Get all items with their assigned menus

### Updated Methods
- `createMenuItem(item, menuIds)` - Now accepts array of menu IDs
- `getMenuItems(menuId)` - Uses junction table for filtering
- `getMenuItemsByCategory(category, menuId)` - Uses junction table for filtering

## Use Cases

### Cross-Menu Items
Items can now appear in multiple ordering flows:
- Base flavors appearing in both Spaghetti and Burger menus
- Sauces shared across multiple menu types
- Toppings available in different ordering contexts

### Menu Management
- Create items once and assign to multiple menus
- Easily manage availability across different ordering flows
- Flexible menu organization without duplication

### Reporting and Analytics
- Track item performance across different menu contexts
- Analyze which items work best in different ordering flows
- Optimize menu assignments based on customer preferences

## Testing Examples

### Creating Multi-Menu Item
```bash
# Create item assigned to multiple menus
curl -X POST "http://localhost:5000/api/menu" \
  -F "name=Universal Vanilla" \
  -F "description=Classic vanilla for all menus" \
  -F "category=base" \
  -F "price=8.99" \
  -F "menuIds=[6,7,8,9]" \
  -F "isActive=true"
```

### Managing Assignments
```bash
# Get current assignments
curl "http://localhost:5000/api/menu-items/105/menus"

# Add to more menus
curl -X POST "http://localhost:5000/api/menu-items/105/menus" \
  -H "Content-Type: application/json" \
  -d '{"menuIds": [10]}'

# Remove from specific menus
curl -X DELETE "http://localhost:5000/api/menu-items/105/menus" \
  -H "Content-Type: application/json" \
  -d '{"menuIds": [6]}'
```

### Verification
```bash
# Check item appears in specific menu
curl "http://localhost:5000/api/menu?menuId=6" | grep "Universal Vanilla"

# Get all items with their menu assignments
curl "http://localhost:5000/api/menu-items-with-menus"
```

## Future Enhancements

### Potential Features
- Menu-specific pricing for the same item
- Menu-specific availability settings
- Bulk assignment operations
- Menu template system for easy setup

### Performance Optimizations
- Caching for frequently accessed menu-item relationships
- Batch operations for large menu assignments
- Optimized queries for complex menu filtering

## Migration Notes

### For Existing Data
- All existing menu item assignments were preserved
- No manual data migration required
- System automatically handles the new schema

### For Frontend Integration
- API responses maintain the same structure
- Menu filtering continues to work as before
- New endpoints available for enhanced functionality

This multi-menu system provides the flexibility needed for complex menu management while maintaining backward compatibility with existing code and data.