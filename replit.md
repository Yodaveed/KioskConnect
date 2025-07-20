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
- **Menu Items to Menus**: Junction table for many-to-many relationship between menu items and menus
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
- July 06, 2025. Redesigned freeze sticks flow with integrated additional options in flavor and sauce selection
- July 06, 2025. Fixed 3-step ordering flow issues and ensured proper cart submission functionality
- July 06, 2025. Comprehensive code review: removed debug console logs, fixed logic bugs, standardized data structures
- July 06, 2025. Enhanced freeze sticks validation logic for proper additional items tracking
- July 07, 2025. Completely rewrote freeze sticks flow with simplified, user-friendly logic
- July 07, 2025. Simplified and cleaned up 3-step ordering flow (Spaghetti, Burger, Soup)
- July 07, 2025. Removed complex modifier logic and hardcoded styling from ordering components
- July 07, 2025. Enhanced order summary with clearer layout and improved cart integration
- July 07, 2025. Fixed maxQuantity values in database for proper freeze sticks flavor selection
- July 07, 2025. Standardized all ordering components with consistent styling and behavior
- July 07, 2025. Completely rewrote Pints flow with simplified logic and better cart integration
- July 07, 2025. Fixed undefined variable references and complex cart logic in Pints component
- July 07, 2025. Standardized localStorage data structure across all ordering flows
- July 07, 2025. Major backend cleanup: created middleware for consistent API responses and error handling
- July 07, 2025. Rewrote all API routes with proper validation, async error handling, and standardized response format
- July 07, 2025. Completely redesigned admin components with cleaner UX, search/filter functionality, and better state management
- July 07, 2025. Enhanced admin dashboard with real-time stats, improved orders management, and streamlined menu item creation
- July 07, 2025. Fixed all frontend customer ordering API compatibility issues with new backend
- July 07, 2025. Updated all ordering flows to navigate back to home page after "Add to This Order" action
- July 07, 2025. Added automatic 5-second redirect to home page after order completion with cancellation option
- July 17, 2025. Implemented comprehensive image upload functionality for menu items
- July 17, 2025. Added multer-based file upload system with validation and error handling
- July 17, 2025. Created ImageUpload component for admin interface with drag-and-drop support
- July 17, 2025. Added automatic image cleanup when menu items are deleted or updated
- July 17, 2025. Supports JPEG, PNG, GIF, WebP, and SVG images with 5MB file size limit
- July 17, 2025. Images stored in /uploads directory and served via Express static middleware
- July 17, 2025. Implemented many-to-many relationship for menu items and menus
- July 17, 2025. Created junction table (menu_items_to_menus) for multi-menu assignments
- July 17, 2025. Updated database schema to remove single menuId from menu_items table
- July 17, 2025. Added comprehensive API endpoints for menu item assignments
- July 17, 2025. Menu items can now be assigned to multiple menus simultaneously
- July 17, 2025. Backward compatibility maintained with existing menu filtering logic
- July 18, 2025. Fixed kiosk menu filtering to properly display only items assigned to specific menus
- July 18, 2025. Corrected query key format in ordering components to properly pass menuId parameter
- July 18, 2025. Kiosk now perfectly syncs with admin menu item assignments
- July 18, 2025. Implemented comprehensive cart logic enhancements with professional-grade UX improvements
- July 18, 2025. Added debounced add/remove operations (300ms) to prevent rapid API calls and race conditions
- July 18, 2025. Enhanced accessibility with ARIA labels, keyboard navigation, and proper error handling
- July 18, 2025. Improved cart submission with empty cart validation, tooltips, and automatic cart ID regeneration
- July 18, 2025. Added per-user subtotals display, join cart error handling with auto-focus retry functionality
- July 18, 2025. Created shared debounce utility for consistent cart operations across all ordering components
- July 18, 2025. Enhanced order summary with professional breakdown display (subtotal, tax/fees, total) and comprehensive error handling
- July 18, 2025. Improved order confirmation with missing order number error handling, enhanced accessibility, and countdown controls
- July 18, 2025. Added ARIA labels, screen reader support, and keyboard navigation throughout order summary and confirmation flows
- July 18, 2025. Implemented professional loading states, order validation, and user-friendly error messages for robust ordering experience
- July 18, 2025. Added comprehensive image upload support for menu types to display pictures on homepage
- July 18, 2025. Enhanced backend API routes to handle image uploads for menu creation and updates with automatic cleanup
- July 18, 2025. Updated admin interface with image upload component and enhanced menu table to display actual images
- July 18, 2025. Conducted comprehensive system test before redeployment: cleaned orphaned data, fixed image paths, validated all flows
- July 18, 2025. System testing confirmed: authentication, menu management, ordering flows, cart functionality, image uploads all working properly
- July 18, 2025. Implemented comprehensive security upgrades based on ChatGPT code review recommendations
- July 18, 2025. Enhanced authentication system with HTTP-only cookies, bcrypt password hashing, and secure session management
- July 18, 2025. Added comprehensive input validation schemas with Zod for all API endpoints and data operations
- July 18, 2025. Implemented express-rate-limit middleware with tailored limits for different endpoint types (API, uploads, orders)
- July 18, 2025. Secured file upload system by removing SVG support, adding file type validation, and implementing size limits
- July 18, 2025. Added comprehensive audit logging for all administrative actions, order operations, and security events
- July 18, 2025. Enhanced error handling with production-safe messages and comprehensive server-side logging
- July 18, 2025. Added security headers (X-Content-Type-Options, X-Frame-Options, Cache-Control) for static file serving
- July 18, 2025. System now meets industry-standard security requirements and is production-ready for real-world deployment
- July 19, 2025. Major architectural transformation: Removed file upload system and implemented external image URL functionality
- July 19, 2025. Updated database schema to use imageUrl fields for menus, menu items, and inventory items instead of file uploads
- July 19, 2025. Removed multer-based upload logic from backend API routes and replaced with URL validation
- July 19, 2025. Updated admin interface components to use simple URL input fields instead of file upload components
- July 19, 2025. Enhanced validation schemas now include proper URL format validation for external image URLs
- July 19, 2025. System now supports external image hosting for better scalability and reduced server storage requirements
- July 19, 2025. Fixed authentication system to use secure HTTP-only cookies instead of Bearer token authentication
- July 19, 2025. Successfully completed inventory system implementation with end-of-day tally functionality for staff
- July 19, 2025. Populated inventory with all 50 current menu items including special mappings (e.g., "turkey burger" → "vanilla")
- July 19, 2025. Added unique constraints to inventory table and implemented batch adjustment API with audit logging
- July 19, 2025. Manual Ticket Entry now serves as professional inventory tally system for physical stock counting
- July 20, 2025. Fixed menu item update functionality by correcting schema validation references in server routes
- July 20, 2025. Resolved Manual Ticket Entry component data structure access to properly display all inventory items
- July 20, 2025. Both admin menu management and inventory tally systems now fully operational for staff use
- July 20, 2025. Fixed critical admin dashboard issues: menu item updates failing with validation errors and inventory tab crashes
- July 20, 2025. Root cause identified: missing sortOrder field in enhanced validation schema causing 400 errors for menu updates
- July 20, 2025. Added comprehensive null safety to inventory component preventing crashes from undefined categories
- July 20, 2025. Enhanced API error logging for better debugging and troubleshooting capabilities
- July 20, 2025. All admin dashboard functionality now fully operational with proper validation and error handling
- July 20, 2025. Resolved final validation error: "Invalid image URL format" for menu item updates  
- July 20, 2025. Updated validation schema to accept both relative paths (/uploads/...) and full HTTP/HTTPS URLs
- July 20, 2025. Menu item updates now working perfectly - all 400 validation errors resolved
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```