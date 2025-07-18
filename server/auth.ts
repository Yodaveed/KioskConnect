import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import type { Express, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { storage } from './storage';

// JWT secret - in production, this should be from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'ic-pasta-secret-key-2025';
const JWT_EXPIRES_IN = '24h';

// Rate limiting for login attempts
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many login attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    isAdmin: boolean;
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: { id: number; username: string; isAdmin: boolean }): string {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      isAdmin: user.isAdmin 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function authenticateAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Try cookie first (preferred for web apps), then fallback to Authorization header
  let token = req.cookies?.auth_token;
  
  if (!token) {
    const authHeader = req.headers.authorization;
    token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  if (!decoded.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  req.user = decoded;
  next();
}

export async function setupSecureAuth(app: Express) {
  // Default admin credentials for testing
  const defaultAdmin = {
    id: 1,
    username: "admin",
    password: "admin123",
    isAdmin: true
  };
  
  // POST /api/auth/login - Admin login
  app.post("/api/auth/login", 
    loginRateLimit,
    async (req, res) => {
      try {
        console.log("Login request received:", req.body);
        const { username, password } = req.body;
        
        if (!username || !password) {
          return res.status(400).json({ error: "Username and password are required" });
        }

        console.log("Comparing credentials:", { provided: { username, password }, expected: { username: defaultAdmin.username, password: defaultAdmin.password } });

        if (username === defaultAdmin.username && password === defaultAdmin.password) {
          const token = generateToken({
            id: defaultAdmin.id,
            username: defaultAdmin.username,
            isAdmin: defaultAdmin.isAdmin
          });

          // Store token in HTTP-only, secure cookie for enhanced security
          res.cookie('auth_token', token, {
            httpOnly: true, // Prevents XSS attacks via JavaScript access
            secure: process.env.NODE_ENV === 'production', // HTTPS only in production
            sameSite: 'strict', // CSRF protection
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            path: '/'
          });

          console.log("Login successful, token generated and stored in secure cookie");
          res.json({
            success: true,
            data: {
              user: {
                id: defaultAdmin.id,
                username: defaultAdmin.username,
                isAdmin: defaultAdmin.isAdmin
              },
              // Remove token from response body for security
              token: "stored_in_cookie"
            },
            message: "Login successful"
          });
        } else {
          console.log("Invalid credentials provided");
          res.status(401).json({ error: "Invalid credentials" });
        }
      } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );

  // POST /api/auth/logout - Admin logout
  app.post("/api/auth/logout", async (req, res) => {
    // Clear the authentication cookie for secure logout
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });
    res.json({ success: true, message: "Logout successful" });
  });

  // GET /api/auth/verify - Verify admin token
  app.get("/api/auth/verify", authenticateAdmin, async (req, res) => {
    const user = (req as any).user;
    res.json({ success: true, data: { user }, message: "Token is valid" });
  });
  
  // Helmet-like security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
}