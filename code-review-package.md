# IC Pasta Kiosk Ordering System - Code Review Package

## Project Overview
This is a comprehensive web-based kiosk ordering system for IC Pasta ice cream shop with receipt printing and QR code mobile ordering capabilities.

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + PostgreSQL
- **Database**: Drizzle ORM with Neon serverless PostgreSQL
- **Print System**: Web-based print server for Toast TP200 receipt printer
- **QR System**: Mobile ordering via QR codes with table context

## Key Implementation Files

### 1. Database Schema (`shared/schema.ts`)
```typescript
// [The complete schema file would go here]
```

### 2. Print Server (`server/printer.ts`)
```typescript
// [The complete printer service implementation]
```

### 3. QR Code Service (`server/qr-generator.ts`)
```typescript
// [The complete QR code generation service]
```

### 4. Main API Routes (`server/routes.ts`)
```typescript
// [Key API endpoints for orders, printing, QR codes]
```

### 5. Customer Ordering Interface (`client/src/pages/home.tsx`)
```typescript
// [Main kiosk interface implementation]
```

### 6. Admin Management (`client/src/pages/admin-dashboard.tsx`)
```typescript
// [Admin interface for menu and order management]
```

### 7. QR Code Manager (`client/src/pages/qr-manager.tsx`)
```typescript
// [QR code generation and management interface]
```

## Business Requirements Addressed
1. **Multi-device kiosk ordering** - Tablet-optimized interface
2. **Receipt printing** - Centralized print server architecture
3. **Mobile ordering** - QR code integration for table-based ordering
4. **Menu management** - Admin interface for dynamic menu updates
5. **Order tracking** - Real-time order status and analytics
6. **Group ordering** - Cart system for multiple items per table
7. **Inventory management** - Sold-out item tracking

## Technical Decisions
- **Print Server Architecture**: One USB-connected tablet serves all kiosks
- **Web-based Printing**: HTTP API for cross-device print job management
- **QR Code Integration**: Mobile-friendly ordering with table context
- **Responsive Design**: Works on tablets, phones, and desktop
- **Database Persistence**: All orders and menu data stored in PostgreSQL

## Review Focus Areas
1. **Architecture scalability** - Can this handle multiple locations?
2. **Error handling** - Robust failure scenarios for printing/network issues
3. **Security** - Admin authentication and data protection
4. **Performance** - Database queries and UI responsiveness
5. **Maintainability** - Code organization and documentation
6. **Hardware integration** - Print server reliability and QR code workflow

## Testing Strategy
- Unit tests for business logic
- Integration tests for print server
- End-to-end testing of ordering flows
- Hardware compatibility testing with Toast TP200
- Mobile QR code ordering validation

## Production Deployment
- Replit hosting for web application
- Neon PostgreSQL for database
- Local print server setup on designated tablet
- QR code generation and physical placement