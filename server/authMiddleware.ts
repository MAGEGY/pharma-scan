import type { Request, Response, NextFunction } from "express";
import { authService } from "./authService";
import { JwtPayload } from "../shared/schema";

// Extend Request interface to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        sessionId: string;
      };
      userId?: string;
    }
  }
}

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Access token is required",
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const payload = authService.verifyToken(token, 'access');
    
    if (!payload) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired token",
      });
    }

    // Add user info to request
    req.user = {
      id: payload.userId,
      email: payload.email,
      sessionId: payload.sessionId,
    };
    req.userId = payload.userId;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication failed",
    });
  }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = authService.verifyToken(token, 'access');
      
      if (payload) {
        req.user = {
          id: payload.userId,
          email: payload.email,
          sessionId: payload.sessionId,
        };
        req.userId = payload.userId;
      }
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    // Continue without authentication
    next();
  }
};

// Role-based middleware (for future use)
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    // In a real implementation, you would check user roles from database
    // For now, we'll assume all authenticated users have basic access
    
    next();
  };
};

// Premium user middleware
export const requirePremium = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required",
    });
  }

  try {
    // Check if user is premium (would be implemented with database query)
    // For now, we'll skip this check
    
    next();
  } catch (error) {
    return res.status(403).json({
      error: "Forbidden",
      message: "Premium subscription required",
    });
  }
};

// Email verification middleware
export const requireEmailVerification = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required",
    });
  }

  try {
    // Check if user's email is verified (would be implemented with database query)
    // For now, we'll skip this check
    
    next();
  } catch (error) {
    return res.status(403).json({
      error: "Forbidden",
      message: "Email verification required",
    });
  }
};

// Rate limiting middleware (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    let record = rateLimitMap.get(key);
    
    if (!record || record.resetTime < now) {
      record = { count: 0, resetTime: now + windowMs };
      rateLimitMap.set(key, record);
    }

    record.count++;

    if (record.count > maxRequests) {
      return res.status(429).json({
        error: "Too Many Requests",
        message: `Rate limit exceeded. Try again in ${Math.ceil((record.resetTime - now) / 1000)} seconds`,
      });
    }

    next();
  };
};

// Clean up expired rate limit records
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  rateLimitMap.forEach((record, key) => {
    if (record.resetTime < now) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => rateLimitMap.delete(key));
}, 60000); // Clean up every minute

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // CORS headers (would be more specific in production)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || '';
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    console.log(`${method} ${url} - ${statusCode} - ${duration}ms - ${ip} - ${userAgent.substring(0, 50)}`);
  });
  
  next();
};

// Error handling middleware
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  
  // Don't expose error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    error: "Internal Server Error",
    message: isDevelopment ? err.message : "Something went wrong",
    ...(isDevelopment && { stack: err.stack }),
  });
};
