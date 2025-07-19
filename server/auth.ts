import jwt, { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Validation schemas
const loginSchema = z.object({
  userCode: z.string().min(1).max(50),
  userType: z.enum(['student', 'admin', 'lagoon_employee', 'office_employee', 'superadmin'])
});

const JWT_SECRET = process.env.JWT_SECRET;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!JWT_SECRET || !SESSION_SECRET) {
  throw new Error('JWT_SECRET and SESSION_SECRET must be set in environment variables');
}

// Rate limiting for auth endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export interface AuthenticatedUser {
  userCode: string;
  username: string;
  userType: string;
  sessionId: string;
  iat: number;
  exp: number;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

// JWT token generation
export function generateTokens(userData: { userCode: string; username: string; userType: string }) {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const payload = {
    userCode: userData.userCode,
    username: userData.username,
    userType: userData.userType,
    sessionId
  };

  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured for authentication');
  }

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ sessionId }, JWT_SECRET, { expiresIn: '7d' });

  return { accessToken, refreshToken, sessionId };
}

// JWT token verification middleware
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'TOKEN_MISSING'
    });
  }

  if (!JWT_SECRET) {
    return res.status(500).json({ 
      error: 'JWT_SECRET not configured',
      code: 'SERVER_MISCONFIGURED'
    });
  }

  jwt.verify(token, JWT_SECRET, (err: jwt.VerifyErrors | null, decoded: any) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        code: 'TOKEN_INVALID'
      });
    }

    req.user = decoded as AuthenticatedUser;
    next();
  });
}

// Role-based authorization middleware
export function authorize(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!allowedRoles.includes(req.user.userType)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: req.user.userType
      });
    }

    next();
  };
}

// Resource ownership validation
export function requireResourceOwnership(req: AuthRequest, res: Response, next: NextFunction) {
  // This will be implemented in route handlers where resource context is available
  next();
}

// Input validation middleware
export function validateAuth(req: Request, res: Response, next: NextFunction) {
  try {
    loginSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid input data',
        details: error.errors,
        code: 'VALIDATION_ERROR'
      });
    }
    next(error);
  }
}

// Session cleanup (for logout)
export function invalidateSession(sessionId: string) {
  // In production, store invalidated sessions in Redis or database
  // For now, we'll rely on token expiration
  console.log(`Session invalidated: ${sessionId}`);
}

// Token refresh
export function refreshAccessToken(refreshToken: string): { accessToken: string } | null {
  try {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(refreshToken, JWT_SECRET) as unknown as { sessionId: string };
    
    // In production, validate sessionId against database
    // For now, generate new access token
    const newAccessToken = jwt.sign(
      { sessionId: decoded.sessionId },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return { accessToken: newAccessToken };
  } catch (error) {
    return null;
  }
}

export { loginSchema };
