import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { logger } from "./logger";
import { config, isProduction } from "./config";
import { 
  securityMiddleware, 
  generalRateLimit, 
  strictRateLimit 
} from "./security";
import { 
  authenticateToken, 
  authRateLimit,
  type AuthRequest 
} from "./auth";

const app = express();

// Trust proxy if behind reverse proxy (for correct IP addresses)
if (isProduction) {
  app.set('trust proxy', 1);
}

// Apply security middleware stack
app.use(...securityMiddleware());

// Request size limits and parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Apply rate limiting
app.use('/api', generalRateLimit);
app.use('/api/auth', authRateLimit);

// Request logging and monitoring
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logData = {
        method: req.method,
        path,
        status: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        contentLength: req.get('content-length'),
      };

      if (res.statusCode >= 400) {
        logger.warn('API error response', { ...logData, response: capturedJsonResponse });
      } else {
        logger.info('API request', logData);
      }
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Global error handler with enhanced security logging
  app.use((err: any, req: AuthRequest, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Enhanced error logging
    const errorData = {
      status,
      message: err.message,
      stack: !isProduction ? err.stack : undefined,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      user: req.user ? {
        userCode: req.user.userCode,
        userType: req.user.userType,
      } : undefined,
      timestamp: new Date().toISOString(),
    };

    if (status >= 500) {
      logger.error('Server error occurred', errorData);
    } else if (status >= 400) {
      logger.warn('Client error occurred', errorData);
    }

    // Secure error response (don't leak sensitive information)
    const errorResponse: any = {
      error: isProduction ? 'Internal Server Error' : message,
      code: err.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    };

    // Add stack trace only in development
    if (!isProduction && err.stack) {
      errorResponse.stack = err.stack;
    }

    res.status(status).json(errorResponse);
    
    // Don't re-throw to prevent app crash
    return;
  });

  // Setup Vite for development or static serving for production
  if (app.get("env").trim() === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start server with enhanced configuration
  const port = config.PORT;
  const host = isProduction ? "0.0.0.0" : "localhost";
  
  server.listen({
    port,
    host,
    ...(isProduction && { reusePort: true }),
  }, () => {
    logger.info('Server started', {
      port,
      host,
      environment: config.NODE_ENV,
      secure: config.NODE_ENV === 'production',
      timestamp: new Date().toISOString(),
    });
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    server.close((err) => {
      if (err) {
        logger.error('Error during server shutdown', { error: err });
        process.exit(1);
      }
      
      logger.info('Server closed successfully');
      process.exit(0);
    });

    // Force close after 30 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions and unhandled rejections
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
    gracefulShutdown('unhandledRejection');
  });
})();
