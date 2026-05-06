import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import rateLimit from 'express-rate-limit';

// Error response interface
interface ApiError {
  error: string;
  details?: any;
}

// Success response wrapper
export function successResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    message
  };
}

// Error response wrapper with enhanced security (no data leakage)
export function errorResponse(error: string, details?: any): ApiError {
  // Log full error details server-side for debugging
  if (details) {
    console.error('API Error:', {
      error,
      details: typeof details === 'object' ? JSON.stringify(details) : details,
      timestamp: new Date().toISOString()
    });
  }
  
  return {
    error,
    // Never expose error details in production to prevent information leakage
    ...(process.env.NODE_ENV === 'development' && details && { details })
  };
}

// Async error handler middleware
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Validation middleware factory
export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json(errorResponse("Validation failed", error.errors));
      } else {
        res.status(400).json(errorResponse("Invalid request data"));
      }
    }
  };
}

// Validation middleware for partial updates
export function validatePartialBody(schema: z.ZodObject<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.partial().parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json(errorResponse("Validation failed", error.errors));
      } else {
        res.status(400).json(errorResponse("Invalid request data"));
      }
    }
  };
}

// ID parameter validation
export function validateIdParam(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const parsedId = parseInt(id);
  
  if (isNaN(parsedId) || parsedId <= 0) {
    return res.status(400).json(errorResponse("Invalid ID parameter"));
  }
  
  req.params.id = parsedId.toString();
  next();
}

// Basic authentication middleware (simplified for demo)
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // In a real app, you'd check session/JWT here
  // For now, we'll skip auth validation since it's a demo
  next();
}

// Enhanced rate limiting for different endpoint types
export const createRateLimit = (windowMs: number, max: number, message: string) => 
  rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for admin endpoints with valid tokens in development
    skip: (req) => Boolean(process.env.NODE_ENV === 'development' && req.headers.authorization?.startsWith('Bearer')),
  });

// Specific rate limits for different endpoints
export const generalApiLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  'Too many requests, please try again later'
);

export const uploadRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes  
  10, // 10 uploads per window
  'Too many file uploads, please try again later'
);

export const orderRateLimit = createRateLimit(
  5 * 60 * 1000, // 5 minutes
  20, // 20 orders per window
  'Too many orders, please slow down'
);

// Enhanced global error handler with security considerations
export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Log comprehensive error details server-side
  console.error("Global Error Handler:", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });
  
  if (res.headersSent) {
    return next(err);
  }
  
  if (err instanceof z.ZodError) {
    return res.status(400).json(errorResponse("Validation failed", 
      process.env.NODE_ENV === 'development' ? err.errors : undefined));
  }
  
  if (err.status) {
    return res.status(err.status).json(errorResponse(
      err.message || "Request failed",
      process.env.NODE_ENV === 'development' ? err.details : undefined
    ));
  }
  
  // Generic error message for production security
  res.status(500).json(errorResponse(
    process.env.NODE_ENV === 'development' ? err.message : "Internal server error"
  ));
}