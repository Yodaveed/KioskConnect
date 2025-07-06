# IC Pasta - Kiosk Ordering System

## Overview

IC Pasta is a responsive web-based kiosk ordering application optimized for tablets and mobile devices. The system facilitates a three-step ordering process for an ice cream shop, allowing customers to select a base flavor, sauce, and multiple toppings before placing their order. The application includes an admin dashboard for menu management and order tracking, with integrated Wi-Fi cloud printing capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: Zustand for order state management
- **Data Fetching**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: connect-pg-simple for PostgreSQL session storage
- **API Architecture**: RESTful API with JSON responses

### Key Components

#### Customer Ordering Flow
1. **Step 1 - Base Selection**: Single selection from available base flavors with optional modifiers (e.g., dairy-free upcharge)
2. **Step 2 - Sauce Selection**: Single selection from available sauces
3. **Step 3 - Toppings Selection**: Multiple selection from available toppings with premium options
4. **Order Summary**: Visual confirmation with pricing breakdown
5. **Order Confirmation**: Success page with order number

#### Admin Management System
- **Menu Management**: CRUD operations for menu items across categories (base, sauce, topping)
- **Order Management**: Real-time order tracking and status updates
- **Analytics Dashboard**: Sales reporting and popular item tracking
- **QR Code Generation**: Dynamic QR code creation for table ordering

#### Database Schema
- **Users**: Admin authentication and authorization
- **Menu Items**: Product catalog with categories, pricing, and availability
- **Orders**: Order records with JSON-stored item details
- **Order Items**: Detailed order line items with modifiers

### Data Flow

1. **Customer Journey**:
   - Customer accesses kiosk interface
   - Progresses through three-step ordering process
   - Order data stored in Zustand state management
   - Final order submitted via API to backend
   - Order confirmation displayed with generated order number

2. **Admin Operations**:
   - Secure login authentication
   - Menu management through admin dashboard
   - Real-time order status updates
   - Analytics data aggregation and display

3. **Data Persistence**:
   - PostgreSQL database for all persistent data
   - Session storage for admin authentication
   - Local storage for order state persistence (Zustand persist middleware)

### External Dependencies

#### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **zustand**: Client state management
- **wouter**: Lightweight routing
- **@radix-ui**: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework

#### Development Dependencies
- **typescript**: Type safety
- **vite**: Build tool and development server
- **eslint**: Code linting
- **@replit/vite-plugin-cartographer**: Replit integration

### Deployment Strategy

The application is designed for deployment on Replit with the following configuration:

#### Build Process
- **Development**: `npm run dev` - Runs TypeScript server with hot reload
- **Production Build**: `npm run build` - Vite build + esbuild server bundling
- **Production Start**: `npm start` - Runs built application

#### Database Management
- **Schema Management**: Drizzle Kit for database migrations
- **Push to Database**: `npm run db:push` for schema updates
- **Connection**: Neon Database with WebSocket support for serverless environments

#### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment specification (development/production)
- **REPL_ID**: Replit-specific environment variable

## Changelog

```
Changelog:
- July 03, 2025. Initial setup and complete implementation
- July 03, 2025. Built full kiosk ordering system with 3-step flow
- July 03, 2025. Implemented admin dashboard with menu management
- July 03, 2025. Added PostgreSQL database integration
- July 03, 2025. Created order tracking and analytics features
- July 03, 2025. Added QR code generation for table ordering
- July 03, 2025. User tested ordering flow successfully
- July 03, 2025. System ready for deployment
- July 03, 2025. Enhanced with flexible ordering flows - 3-step, single-page, and custom flows
- July 03, 2025. Created 5 menu types: Spaghetti, Burger, Soup (3-step), Pints (single-page), Freeze Sticks (custom)
- July 03, 2025. Fixed menu item filtering to use correct menu IDs for each ordering flow
- July 03, 2025. Added group cart functionality for multiple orders on one check
- July 03, 2025. Implemented customer name collection before order submission
- July 03, 2025. Created sold-out item management system for admin dashboard
- July 03, 2025. Simplified cart system with post-order cart creation via "Add to This Order" button
- July 03, 2025. Enhanced order confirmation with intuitive cart creation flow and friendly cart IDs
- July 04, 2025. Added image support for menu items with fallback icons when no image is provided
- July 04, 2025. Made sauce and toppings optional in 3-step ordering flows (Spaghetti, Burger, Soup)
- July 04, 2025. Updated database schema to support imageUrl field for menu items
- July 04, 2025. Implemented dual submission flow: "Submit Order" (immediate) vs "Add to This Order" (cart creation)
- July 04, 2025. Enhanced cart interface with "Submit Cart" and "Add to This Order" options for group ordering
- July 04, 2025. Updated all ordering flows (3-step, Pints, Freeze Sticks) to support new submission options
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```