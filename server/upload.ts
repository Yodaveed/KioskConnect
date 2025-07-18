import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';

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
    // Generate UUID-based filename for security - never trust original filenames
    const uuid = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `menu-item-${uuid}${ext}`);
  }
});

// File filter - security hardened to only allow safe image types (no SVG for XSS prevention)
const fileFilter = (req: any, file: any, cb: any) => {
  // Only allow safe image types - SVG removed due to XSS vulnerability potential
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed for security.'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // Reduced to 2MB limit for better performance and security
    fileCount: 1, // Only allow single file uploads
    fieldSize: 1024 * 1024, // 1MB field size limit
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