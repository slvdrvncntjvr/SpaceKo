import { z } from 'zod';

// Environment variable validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('5000'),
  DATABASE_URL: z.string().url(),
  
  // Security secrets
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).transform(Number).default('100'),
  AUTH_RATE_LIMIT_MAX: z.string().regex(/^\d+$/).transform(Number).default('5'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE_PATH: z.string().default('./logs/app.log'),
  
  // CORS
  ALLOWED_ORIGINS: z.string().optional(),
  
  // SSL
  SSL_CERT_PATH: z.string().optional(),
  SSL_KEY_PATH: z.string().optional(),
  FORCE_HTTPS: z.string().transform(v => v === 'true').default('false'),
  
  // Database security
  DB_SSL_MODE: z.enum(['disable', 'allow', 'prefer', 'require']).default('prefer'),
  DB_CONNECTION_TIMEOUT: z.string().regex(/^\d+$/).transform(Number).default('10000'),
  DB_IDLE_TIMEOUT: z.string().regex(/^\d+$/).transform(Number).default('30000'),
  DB_MAX_CONNECTIONS: z.string().regex(/^\d+$/).transform(Number).default('20'),
  
  // Security headers
  CSP_POLICY: z.string().optional(),
  HSTS_MAX_AGE: z.string().regex(/^\d+$/).transform(Number).default('31536000'),
  
  // Session management
  SESSION_TIMEOUT: z.string().regex(/^\d+$/).transform(Number).default('3600'),
  REFRESH_TOKEN_EXPIRY: z.string().regex(/^\d+$/).transform(Number).default('604800'),
  
  // Monitoring
  SENTRY_DSN: z.string().optional(),
  HEALTH_CHECK_ENABLED: z.string().transform(v => v === 'true').default('true'),
});

// Validate and parse environment variables
function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    
    // Additional security validations for production
    if (env.NODE_ENV === 'production') {
      if (env.JWT_SECRET.includes('your-') || env.JWT_SECRET.includes('change')) {
        throw new Error('Production JWT_SECRET must be changed from default value');
      }
      
      if (env.SESSION_SECRET.includes('your-') || env.SESSION_SECRET.includes('change')) {
        throw new Error('Production SESSION_SECRET must be changed from default value');
      }
      
      if (!env.DATABASE_URL.startsWith('postgresql://') && !env.DATABASE_URL.startsWith('postgres://')) {
        throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
      }
      
      if (env.FORCE_HTTPS === false) {
        console.warn('⚠️  WARNING: FORCE_HTTPS is disabled in production environment');
      }
    }
    
    return env;
  } catch (error) {
    console.error('❌ Environment validation failed:');
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error(`  - ${(error as Error).message}`);
    }
    process.exit(1);
  }
}

// Export validated environment configuration
export const config = validateEnv();

// Type-safe environment access
export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';

// Security configuration object
export const securityConfig = {
  jwt: {
    secret: config.JWT_SECRET,
    accessTokenExpiry: config.SESSION_TIMEOUT,
    refreshTokenExpiry: config.REFRESH_TOKEN_EXPIRY,
  },
  session: {
    secret: config.SESSION_SECRET,
    timeout: config.SESSION_TIMEOUT,
  },
  rateLimit: {
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    maxRequests: config.RATE_LIMIT_MAX_REQUESTS,
    authMaxRequests: config.AUTH_RATE_LIMIT_MAX,
  },
  database: {
    url: config.DATABASE_URL,
    ssl: config.DB_SSL_MODE !== 'disable',
    connectionTimeout: config.DB_CONNECTION_TIMEOUT,
    idleTimeout: config.DB_IDLE_TIMEOUT,
    maxConnections: config.DB_MAX_CONNECTIONS,
  },
  headers: {
    csp: config.CSP_POLICY || (isProduction 
      ? "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
      : "default-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' ws: wss:;"
    ),
    hsts: config.HSTS_MAX_AGE,
    forceHttps: config.FORCE_HTTPS,
  },
  cors: {
    origins: config.ALLOWED_ORIGINS ? config.ALLOWED_ORIGINS.split(',') : undefined,
  },
  ssl: {
    certPath: config.SSL_CERT_PATH,
    keyPath: config.SSL_KEY_PATH,
  },
  monitoring: {
    sentryDsn: config.SENTRY_DSN,
    healthCheckEnabled: config.HEALTH_CHECK_ENABLED,
  },
  logging: {
    level: config.LOG_LEVEL,
    filePath: config.LOG_FILE_PATH,
  },
};

// Ensure required directories exist
import { mkdirSync } from 'fs';
import { dirname } from 'path';

try {
  mkdirSync(dirname(config.LOG_FILE_PATH), { recursive: true });
} catch (error) {
  // Directory might already exist, ignore error
}
