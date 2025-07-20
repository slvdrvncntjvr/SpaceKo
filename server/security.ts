import { Request, Response, NextFunction } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { securityConfig, isProduction, isDevelopment } from './config';
import { logger } from './logger';

// Enhanced security headers middleware
export function securityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: isProduction ? ["'self'"] : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "data:"],
        connectSrc: isProduction 
          ? ["'self'", "https:"] 
          : ["'self'", "ws:", "wss:", "https:"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for development
    hsts: {
      maxAge: securityConfig.headers.hsts,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  });
}

// CORS configuration
export function corsConfig() {
  const allowedOrigins = securityConfig.cors.origins || [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000',
  ];

  return cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1 || !isProduction) {
        callback(null, true);
      } else {
        logger.warn('CORS violation', { origin, allowedOrigins });
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 hours
  });
}

// Rate limiting configurations
export const generalRateLimit = rateLimit({
  windowMs: securityConfig.rateLimit.windowMs,
  max: securityConfig.rateLimit.maxRequests,
  message: {
    error: 'Too many requests from this IP',
    retryAfter: Math.ceil(securityConfig.rateLimit.windowMs / 1000),
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/status';
  },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      error: 'Too many requests from this IP',
      retryAfter: Math.ceil(securityConfig.rateLimit.windowMs / 1000),
      code: 'RATE_LIMIT_EXCEEDED',
    });
  },
});

export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: securityConfig.rateLimit.authMaxRequests,
  message: {
    error: 'Too many sensitive requests from this IP',
    retryAfter: 15 * 60,
    code: 'STRICT_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.error('Strict rate limit exceeded - potential abuse', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      error: 'Too many sensitive requests from this IP',
      retryAfter: 15 * 60,
      code: 'STRICT_RATE_LIMIT_EXCEEDED',
    });
  },
});

// Request size limiter
export function requestSizeLimit() {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('content-length') || '0', 10);
    const maxSize = 1024 * 1024; // 1MB
    
    if (contentLength > maxSize) {
      logger.warn('Request size exceeded', {
        contentLength,
        maxSize,
        ip: req.ip,
        path: req.path,
      });
      
      return res.status(413).json({
        error: 'Request entity too large',
        maxSize: `${maxSize / 1024 / 1024}MB`,
        code: 'PAYLOAD_TOO_LARGE',
      });
    }
    
    next();
  };
}

// IP whitelist/blacklist middleware
const blockedIPs = new Set<string>();
const trustedProxies = new Set([
  '127.0.0.1',
  '::1',
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
]);

export function ipFilter() {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (blockedIPs.has(clientIP)) {
      logger.error('Blocked IP attempted access', { ip: clientIP });
      return res.status(403).json({
        error: 'Access denied',
        code: 'IP_BLOCKED',
      });
    }
    
    next();
  };
}

// Security logging middleware
export function securityLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        contentLength: req.get('content-length'),
        referer: req.get('referer'),
      };
      
      // Log suspicious activity
      if (res.statusCode >= 400) {
        if (res.statusCode === 401 || res.statusCode === 403) {
          logger.warn('Authentication/Authorization failure', logData);
        } else if (res.statusCode >= 500) {
          logger.error('Server error', logData);
        } else {
          logger.info('Client error', logData);
        }
      } else if (req.path.startsWith('/api')) {
        logger.info('API request', logData);
      }
    });
    
    next();
  };
}

// HTTPS enforcement middleware
export function enforceHttps() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!securityConfig.headers.forceHttps || isDevelopment) {
      return next();
    }
    
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    
    if (protocol !== 'https') {
      logger.warn('HTTP request redirected to HTTPS', {
        url: req.originalUrl,
        ip: req.ip,
      });
      
      return res.redirect(301, `https://${req.get('host')}${req.originalUrl}`);
    }
    
    next();
  };
}

// Input sanitization middleware
export function sanitizeInput() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Basic XSS protection
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      } else if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            obj[key] = sanitize(obj[key]);
          }
        }
      }
      return obj;
    };
    
    if (req.body) {
      req.body = sanitize(req.body);
    }
    
    if (req.query) {
      req.query = sanitize(req.query);
    }
    
    if (req.params) {
      req.params = sanitize(req.params);
    }
    
    next();
  };
}

// Block suspicious user agents
const suspiciousUserAgents = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
];

export function blockSuspiciousUserAgents() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!isProduction) return next();
    
    const userAgent = req.get('User-Agent') || '';
    
    const isSuspicious = suspiciousUserAgents.some(pattern => 
      pattern.test(userAgent)
    );
    
    if (isSuspicious && !req.path.startsWith('/api/status') && req.path !== '/health') {
      logger.warn('Suspicious user agent blocked', {
        userAgent,
        ip: req.ip,
        path: req.path,
      });
      
      return res.status(403).json({
        error: 'Access denied',
        code: 'SUSPICIOUS_USER_AGENT',
      });
    }
    
    next();
  };
}

// Export security middleware stack
export function securityMiddleware() {
  return [
    enforceHttps(),
    securityHeaders(),
    corsConfig(),
    ipFilter(),
    blockSuspiciousUserAgents(),
    requestSizeLimit(),
    sanitizeInput(),
    securityLogger(),
  ];
}
