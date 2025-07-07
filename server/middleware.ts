import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

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

// Error response wrapper  
export function errorResponse(error: string, details?: any): ApiError {
  return {
    error,
    ...(details && { details })
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
export function validatePartialBody(schema: z.ZodSchema) {
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

// Global error handler
export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('API Error:', err);
  
  if (res.headersSent) {
    return next(err);
  }
  
  if (err instanceof z.ZodError) {
    return res.status(400).json(errorResponse("Validation failed", err.errors));
  }
  
  res.status(500).json(errorResponse("Internal server error"));
}