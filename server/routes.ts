import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { checkDatabaseHealth } from "./db";
import { logger } from "./logger";
import { 
  generateTokens, 
  authenticateToken, 
  authorize, 
  validateAuth,
  type AuthRequest 
} from "./auth";
import { strictRateLimit } from "./security";
import { z } from "zod";

// Validation schemas
const resourceUpdateSchema = z.object({
  status: z.enum(['available', 'occupied', 'open', 'closed']),
  updatedBy: z.string().optional(),
});

const userCreationSchema = z.object({
  userCode: z.string().min(1).max(50),
  username: z.string().min(1).max(100),
  userType: z.enum(['student', 'admin', 'lagoon_employee', 'office_employee', 'superadmin']),
  studentId: z.string().optional(),
  grade: z.string().optional(),
  section: z.string().optional(),
  office: z.string().optional(),
  position: z.string().optional(),
  workplace: z.string().optional(),
  employeeId: z.string().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for monitoring
  app.get('/health', async (req, res) => {
    try {
      // Check database connectivity
      const dbHealth = await checkDatabaseHealth();
      
      // Check storage functionality
      const storageCheck = await storage.getResources();
      
      const healthStatus = {
        status: dbHealth.healthy && Array.isArray(storageCheck) ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbHealth,
        storage: Array.isArray(storageCheck) ? 'operational' : 'error',
        environment: process.env.NODE_ENV || 'unknown',
        version: process.env.npm_package_version || '1.0.0'
      };

      const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(healthStatus);
      
    } catch (error) {
      logger.error('Health check failed', { error });
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // API status endpoint
  app.get('/api/status', (req, res) => {
    res.json({
      service: 'SpaceKo API',
      status: 'operational',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // Authentication endpoints
  app.post('/api/auth/login', strictRateLimit, validateAuth, async (req, res) => {
    try {
      const { userCode, userType } = req.body;
      
      // Validate user code against database
      const isValid = await storage.validateUserCode(userCode);
      if (!isValid) {
        logger.warn('Invalid login attempt', { userCode, userType, ip: req.ip });
        return res.status(401).json({
          error: 'Invalid user code',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Get user details
      const user = await storage.getContributorByUsername(userCode);
      if (!user || user.userType !== userType) {
        logger.warn('User type mismatch', { userCode, expectedType: userType, actualType: user?.userType });
        return res.status(401).json({
          error: 'Invalid user type',
          code: 'INVALID_USER_TYPE'
        });
      }

      // Generate tokens
      const tokens = generateTokens({
        userCode: user.userCode,
        username: user.username,
        userType: user.userType,
      });

      // Create session record (simplified for demo)
      logger.info('Session created', { 
        userCode: user.userCode,
        sessionId: tokens.sessionId 
      });

      logger.info('User logged in successfully', { 
        userCode: user.userCode, 
        userType: user.userType,
        sessionId: tokens.sessionId,
        ip: req.ip 
      });

      res.json({
        success: true,
        user: {
          userCode: user.userCode,
          username: user.username,
          userType: user.userType,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 3600, // 1 hour
      });

    } catch (error) {
      logger.error('Login error', { error, userCode: req.body.userCode });
      res.status(500).json({
        error: 'Authentication failed',
        code: 'AUTH_ERROR'
      });
    }
  });

  app.post('/api/auth/logout', authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (req.user?.sessionId) {
        // In production, invalidate session in database/Redis
        logger.info('User logged out', { 
          userCode: req.user.userCode, 
          sessionId: req.user.sessionId 
        });
      }

      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error', { error });
      res.status(500).json({ error: 'Logout failed' });
    }
  });

  // Resource endpoints with authentication
  app.get('/api/resources', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const resources = await storage.getResources();
      
      logger.info('Resources fetched', { 
        userCode: req.user?.userCode, 
        count: resources.length 
      });

      res.json({
        success: true,
        data: resources,
        total: resources.length,
        timestamp: new Date().toISOString(),
        version: resources.length, // Simple versioning
      });
    } catch (error) {
      logger.error('Error fetching resources', { error, user: req.user?.userCode });
      res.status(500).json({
        error: 'Failed to fetch resources',
        code: 'FETCH_ERROR'
      });
    }
  });

  // Bulk update endpoint for efficient state synchronization
  app.post('/api/resources/sync', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { resources: clientResources, clientVersion } = req.body;
      
      if (!Array.isArray(clientResources)) {
        return res.status(400).json({ error: 'Invalid resources data' });
      }

      // Get current server resources
      const serverResources = await storage.getResources();
      const serverVersion = serverResources.length; // Simple versioning
      
      // If client is outdated, send server data
      if (clientVersion < serverVersion) {
        logger.info('Client sync - server data newer', {
          userCode: req.user?.userCode,
          clientVersion,
          serverVersion
        });
        
        return res.json({
          success: true,
          action: 'server_wins',
          data: serverResources,
          version: serverVersion,
          timestamp: new Date().toISOString(),
        });
      }
      
      // If client has newer data, process updates
      if (clientVersion > serverVersion) {
        logger.info('Client sync - processing client updates', {
          userCode: req.user?.userCode,
          clientVersion,
          serverVersion
        });
        
        // For now, return current server state
        // In production, implement proper conflict resolution
        return res.json({
          success: true,
          action: 'conflict_detected',
          data: serverResources,
          version: serverVersion,
          timestamp: new Date().toISOString(),
        });
      }
      
      // Versions match - no sync needed
      res.json({
        success: true,
        action: 'no_changes',
        version: serverVersion,
        timestamp: new Date().toISOString(),
      });
      
    } catch (error) {
      logger.error('Error syncing resources', { error, user: req.user?.userCode });
      res.status(500).json({
        error: 'Failed to sync resources',
        code: 'SYNC_ERROR'
      });
    }
  });

  // Quick status update endpoint for real-time updates
  app.patch('/api/resources/:name/status', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const resourceName = req.params.name;
      const { status } = req.body;
      
      // Validate status
      const validStatuses = ['available', 'occupied', 'open', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: 'Invalid status value',
          validStatuses 
        });
      }

      // Find resource by name
      const resources = await storage.getResources();
      const resource = resources.find(r => r.name === resourceName);
      
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      // Check permissions
      const user = req.user!;
      const canUpdate = checkResourceUpdatePermission(user, resource);
      
      if (!canUpdate.allowed) {
        logger.warn('Unauthorized status update attempt', {
          userCode: user.userCode,
          userType: user.userType,
          resourceName: resourceName,
          reason: canUpdate.reason
        });
        
        return res.status(403).json({
          error: canUpdate.reason,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      // Update resource status
      const updatedResource = await storage.updateResource(resource.id, {
        status,
        updatedBy: user.userCode,
        lastUpdated: new Date(),
      });

      if (!updatedResource) {
        return res.status(500).json({ error: 'Failed to update resource' });
      }

      logger.info('Resource status updated', {
        userCode: user.userCode,
        resourceName: resourceName,
        oldStatus: resource.status,
        newStatus: status,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        data: updatedResource,
        message: `${resourceName} status updated to ${status}`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error updating resource status', { 
        error, 
        resourceName: req.params.name,
        user: req.user?.userCode 
      });
      res.status(500).json({
        error: 'Failed to update resource status',
        code: 'UPDATE_ERROR'
      });
    }
  });

  app.get('/api/resources/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid resource ID' });
      }

      const resource = await storage.getResourceById(id);
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      res.json({ success: true, data: resource });
    } catch (error) {
      logger.error('Error fetching resource', { error, resourceId: req.params.id });
      res.status(500).json({ error: 'Failed to fetch resource' });
    }
  });

  app.put('/api/resources/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid resource ID' });
      }

      // Validate request body
      const validatedData = resourceUpdateSchema.parse(req.body);
      
      // Get existing resource to check permissions
      const existingResource = await storage.getResourceById(id);
      if (!existingResource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      // Check if user has permission to update this resource
      const user = req.user!;
      const canUpdate = checkResourceUpdatePermission(user, existingResource);
      
      if (!canUpdate.allowed) {
        logger.warn('Unauthorized resource update attempt', {
          userCode: user.userCode,
          userType: user.userType,
          resourceId: id,
          reason: canUpdate.reason
        });
        
        return res.status(403).json({
          error: canUpdate.reason,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      // Update resource
      const updatedResource = await storage.updateResource(id, {
        ...validatedData,
        updatedBy: user.userCode,
        lastUpdated: new Date(),
      });

      logger.info('Resource updated', {
        userCode: user.userCode,
        resourceId: id,
        changes: validatedData
      });

      res.json({ success: true, data: updatedResource });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      
      logger.error('Error updating resource', { error, resourceId: req.params.id });
      res.status(500).json({ error: 'Failed to update resource' });
    }
  });

  // Admin endpoints
  app.post('/api/admin/users', 
    authenticateToken, 
    authorize(['superadmin']), 
    async (req: AuthRequest, res) => {
    try {
      const validatedData = userCreationSchema.parse(req.body);
      
      // Check if user code already exists
      const existingUser = await storage.getContributorByUsername(validatedData.userCode);
      if (existingUser) {
        return res.status(409).json({
          error: 'User code already exists',
          code: 'USER_EXISTS'
        });
      }

      // Create new user
      const newUser = await storage.createContributor({
        userCode: validatedData.userCode,
        username: validatedData.username,
        userType: validatedData.userType,
        updateCount: 0,
      });

      logger.info('New user created', {
        createdBy: req.user?.userCode,
        newUser: {
          userCode: newUser.userCode,
          userType: newUser.userType
        }
      });

      res.status(201).json({
        success: true,
        data: newUser,
        message: 'User created successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      
      logger.error('Error creating user', { error, createdBy: req.user?.userCode });
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  // Contributors/statistics endpoint
  app.get('/api/contributors', 
    authenticateToken, 
    authorize(['admin', 'superadmin']), 
    async (req: AuthRequest, res) => {
    try {
      const contributors = await storage.getContributors();
      res.json({ success: true, data: contributors });
    } catch (error) {
      logger.error('Error fetching contributors', { error });
      res.status(500).json({ error: 'Failed to fetch contributors' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to check resource update permissions
function checkResourceUpdatePermission(user: any, resource: any): { allowed: boolean; reason?: string } {
  switch (user.userType) {
    case 'superadmin':
    case 'admin':
      return { allowed: true };
    
    case 'student':
      if (resource.category === 'room') {
        return { allowed: true };
      }
      return { allowed: false, reason: 'Students can only update room availability' };
    
    case 'lagoon_employee':
      if (resource.category === 'lagoon_stall' && resource.ownedBy === user.userCode) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'You can only update your own stall' };
    
    case 'office_employee':
      if (resource.category === 'service' && resource.ownedBy === user.userCode) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'You can only update your own office' };
    
    default:
      return { allowed: false, reason: 'Unknown user type' };
  }
}
