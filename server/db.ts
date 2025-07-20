import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { securityConfig, isProduction } from './config';
import { logger } from './logger';

neonConfig.webSocketConstructor = ws;

// Database connection validation
if (!securityConfig.database.url) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Validate DATABASE_URL format
const dbUrl = securityConfig.database.url;
if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
  throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
}

// Enhanced security configuration for database connections
const poolConfig = {
  connectionString: dbUrl,
  max: securityConfig.database.maxConnections,
  idleTimeoutMillis: securityConfig.database.idleTimeout,
  connectionTimeoutMillis: securityConfig.database.connectionTimeout,
  
  // SSL configuration based on environment
  ssl: isProduction ? {
    rejectUnauthorized: true,
    ca: process.env.DB_CA_CERT, // Certificate Authority certificate
    cert: process.env.DB_CLIENT_CERT, // Client certificate
    key: process.env.DB_CLIENT_KEY, // Client private key
  } : securityConfig.database.ssl ? { rejectUnauthorized: false } : false,
  
  // Connection validation
  allowExitOnIdle: true,
  
  // Query timeout
  query_timeout: 30000, // 30 seconds
  
  // Statement timeout 
  statement_timeout: 30000, // 30 seconds
};

// Log database configuration (without sensitive data)
logger.info('Database configuration', {
  maxConnections: poolConfig.max,
  sslEnabled: !!poolConfig.ssl,
  environment: process.env.NODE_ENV,
  connectionTimeout: poolConfig.connectionTimeoutMillis,
  idleTimeout: poolConfig.idleTimeoutMillis,
});

export const pool = new Pool(poolConfig);

// Connection error handling
pool.on('error', (err) => {
  logger.error('Database pool error', {
    error: err.message,
    stack: err.stack,
    code: (err as any).code,
  });
});

pool.on('connect', (client) => {
  logger.debug('Database client connected', {
    processID: (client as any).processID,
    backendKeyData: (client as any).backendKeyData,
  });
});

pool.on('acquire', () => {
  logger.debug('Database client acquired from pool');
});

pool.on('remove', () => {
  logger.debug('Database client removed from pool');
});

// Database connection health check
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; details?: any }> {
  try {
    const start = Date.now();
    const result = await pool.query('SELECT 1 as health_check, NOW() as timestamp');
    const duration = Date.now() - start;
    
    return {
      healthy: true,
      details: {
        responseTime: duration,
        timestamp: result.rows[0]?.timestamp,
        activeConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingConnections: pool.waitingCount,
      }
    };
  } catch (error) {
    logger.error('Database health check failed', { error });
    return {
      healthy: false,
      details: {
        error: (error as Error).message,
        activeConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingConnections: pool.waitingCount,
      }
    };
  }
}

// Enhanced database instance with monitoring
export const db = drizzle({ client: pool, schema });

// Graceful shutdown handling
const gracefulShutdown = async () => {
  logger.info('Closing database pool...');
  try {
    await pool.end();
    logger.info('Database pool closed successfully');
  } catch (error) {
    logger.error('Error closing database pool', { error });
  }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  gracefulShutdown().then(() => process.exit(1));
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
});

// Connection pool monitoring
setInterval(async () => {
  if (isProduction) {
    logger.info('Database pool status', {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    });
  }
}, 60000); // Log every minute in production

export default db;