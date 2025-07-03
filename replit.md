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
- July 03, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```