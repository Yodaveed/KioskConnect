# Testing Print and QR Code Functionality

## Architecture Overview
The system implements a print server architecture where:
- One tablet (connected to Toast TP200 printer) acts as the print server
- Multiple kiosks/devices can send print jobs to this server
- QR codes enable mobile ordering that also utilizes the print server

## Implementation Details

### Print Service Architecture
1. **Web-based Print Service**: HTTP API endpoints for print operations
2. **Print Server Endpoint**: `/api/print` accepts print jobs from any device
3. **Receipt Formatting**: Clean, readable receipt format with order details
4. **Error Handling**: Graceful failure handling - orders complete even if printing fails

### QR Code System
1. **QR Code Generation**: `/api/qr/:tableNumber` generates QR codes for tables
2. **Bulk Generation**: `/api/qr/bulk/:count` for multiple table QR codes
3. **Mobile Integration**: QR codes link to kiosk ordering with table context
4. **Print Integration**: QR codes can be printed for table placement

### Order Flow with Print Integration
1. Customer places order (kiosk or mobile)
2. Order is saved to database
3. Print job is automatically sent to print server
4. Receipt is printed (if printer is available)
5. Order confirmation is shown to customer

## Test Cases

### Print Server Tests
1. **Printer Connection Test**: `GET /api/print/test`
2. **Receipt Print Test**: `POST /api/print` with order data
3. **Multiple Device Test**: Print from different kiosks to same printer

### QR Code Tests
1. **Single QR Generation**: Generate QR code for table 1
2. **Bulk QR Generation**: Generate QR codes for tables 1-10
3. **Mobile Order Flow**: Scan QR code, place order, print receipt
4. **QR Code Printing**: Print QR codes for table placement

### Integration Tests
1. **Kiosk to Print**: Complete order flow with receipt printing
2. **Mobile to Print**: QR code order with receipt printing
3. **Print Failure Handling**: Order completes even if print fails

## Configuration

### Environment Variables
- `PRINTER_ENDPOINT`: URL of the print server (default: localhost:8080/print)
- `REPLIT_DOMAINS`: Used for QR code URL generation

### Hardware Requirements
- Toast TP200 receipt printer (Serial: 21127a00256)
- USB connection to designated print server tablet
- Network connection for all kiosks to reach print server

## Production Deployment

### Print Server Setup
1. Connect Toast TP200 to designated tablet via USB
2. Set `PRINTER_ENDPOINT` environment variable on all kiosks
3. Configure network access between kiosks and print server
4. Test print functionality from all kiosks

### QR Code Deployment
1. Generate QR codes for all tables
2. Print and laminate QR codes for table placement
3. Test mobile ordering flow from QR codes
4. Verify receipt printing from mobile orders

## Benefits

1. **Centralized Printing**: One printer serves all kiosks
2. **Cost Effective**: No need for printer per kiosk
3. **Mobile Ordering**: QR codes enable table-based mobile ordering
4. **Reliable Operation**: Orders complete even if printing fails
5. **Easy Management**: Admin interface for QR code generation and printing