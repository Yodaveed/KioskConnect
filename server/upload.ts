import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');

async function ensureUploadsDir() {
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
}

// Initialize uploads directory
ensureUploadsDir();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `menu-item-${uniqueSuffix}${ext}`);
  }
});

// File filter to only allow images
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG images are allowed.'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Helper function to delete uploaded file
export async function deleteUploadedFile(filename: string) {
  try {
    const filepath = path.join(uploadsDir, filename);
    await fs.unlink(filepath);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

// Helper function to get file URL
export function getFileUrl(filename: string) {
  return `/uploads/${filename}`;
}