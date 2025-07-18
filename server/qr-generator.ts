import QRCode from 'qrcode';

export interface QRCodeOptions {
  tableNumber?: string;
  location?: string;
  customParams?: Record<string, string>;
}

export class QRCodeService {
  private baseUrl: string;

  constructor() {
    // Use environment variable or default to current domain
    this.baseUrl = process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'https://localhost:5000';
  }

  generateOrderURL(options: QRCodeOptions = {}): string {
    const params = new URLSearchParams();
    
    if (options.tableNumber) {
      params.append('table', options.tableNumber);
    }
    
    if (options.location) {
      params.append('location', options.location);
    }

    if (options.customParams) {
      Object.entries(options.customParams).forEach(([key, value]) => {
        params.append(key, value);
      });
    }

    const queryString = params.toString();
    return `${this.baseUrl}${queryString ? `?${queryString}` : ''}`;
  }

  async generateQRCode(options: QRCodeOptions = {}): Promise<string> {
    const url = this.generateOrderURL(options);
    
    try {
      const qrCodeDataURL = await QRCode.toDataURL(url, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('QR Code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  async generateQRCodeSVG(options: QRCodeOptions = {}): Promise<string> {
    const url = this.generateOrderURL(options);
    
    try {
      const qrCodeSVG = await QRCode.toString(url, {
        type: 'svg',
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });
      
      return qrCodeSVG;
    } catch (error) {
      console.error('QR Code SVG generation error:', error);
      throw new Error('Failed to generate QR code SVG');
    }
  }
}

export const qrCodeService = new QRCodeService();