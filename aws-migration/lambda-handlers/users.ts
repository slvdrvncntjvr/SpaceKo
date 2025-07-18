// Lambda Handler for User Management
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { dynamoStorage } from '../dynamodb-schema';
import { z } from 'zod';

// Validation schemas
const createUserSchema = z.object({
  userCode: z.string(),
  username: z.string(),
  userType: z.enum(['student', 'admin', 'lagoon_employee', 'office_employee', 'superadmin']),
  isActive: z.boolean().default(true),
  createdBy: z.string().optional(),
  
  // Student fields
  studentId: z.string().optional(),
  grade: z.string().optional(),
  section: z.string().optional(),
  
  // Admin fields
  office: z.string().optional(),
  position: z.string().optional(),
  
  // Employee fields
  workplace: z.string().optional(),
  employeeId: z.string().optional(),
});

const loginSchema = z.object({
  userCode: z.string(),
});

// Helper function for API responses
const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  },
  body: JSON.stringify(body),
});

// POST /api/auth/login
export const login = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }
    
    const body = JSON.parse(event.body);
    const { userCode } = loginSchema.parse(body);
    
    // Get user from database
    const user = await dynamoStorage.getUser(userCode);
    
    if (!user || !user.isActive) {
      return createResponse(401, { error: 'Invalid user code or inactive user' });
    }
    
    // Create session
    const session = await dynamoStorage.createSession(user.userCode, user.userType, user.username);
    
    return createResponse(200, {
      user: {
        userCode: user.userCode,
        username: user.username,
        userType: user.userType,
        studentId: user.studentId,
        grade: user.grade,
        section: user.section,
        office: user.office,
        position: user.position,
        workplace: user.workplace,
        employeeId: user.employeeId,
      },
      sessionId: session.sessionId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createResponse(400, { error: 'Validation error', details: error.errors });
    }
    
    console.error('Error during login:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

// POST /api/auth/logout
export const logout = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { userCode, sessionId } = event.queryStringParameters || {};
    
    if (!userCode || !sessionId) {
      return createResponse(400, { error: 'User code and session ID are required' });
    }
    
    await dynamoStorage.deleteSession(userCode, sessionId);
    
    return createResponse(200, { message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error during logout:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

// GET /api/users/{userCode}
export const getUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { userCode } = event.pathParameters || {};
    
    if (!userCode) {
      return createResponse(400, { error: 'User code is required' });
    }
    
    const user = await dynamoStorage.getUser(userCode);
    
    if (!user) {
      return createResponse(404, { error: 'User not found' });
    }
    
    // Remove sensitive fields
    const { createdAt, updatedAt, ...safeUser } = user;
    
    return createResponse(200, safeUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

// POST /api/users
export const createUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }
    
    const body = JSON.parse(event.body);
    const validatedData = createUserSchema.parse(body);
    
    // Check if user already exists
    const existingUser = await dynamoStorage.getUser(validatedData.userCode);
    if (existingUser) {
      return createResponse(409, { error: 'User already exists' });
    }
    
    const user = await dynamoStorage.createUser(validatedData);
    
    // Remove sensitive fields
    const { createdAt, updatedAt, ...safeUser } = user;
    
    return createResponse(201, safeUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createResponse(400, { error: 'Validation error', details: error.errors });
    }
    
    console.error('Error creating user:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

// GET /api/users
export const getUsers = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { userType } = event.queryStringParameters || {};
    
    let users;
    
    if (userType) {
      users = await dynamoStorage.getUsersByType(userType);
    } else {
      // Get all user types - in production, you'd want pagination
      const students = await dynamoStorage.getUsersByType('student');
      const admins = await dynamoStorage.getUsersByType('admin');
      const lagoonEmployees = await dynamoStorage.getUsersByType('lagoon_employee');
      const officeEmployees = await dynamoStorage.getUsersByType('office_employee');
      const superAdmins = await dynamoStorage.getUsersByType('superadmin');
      
      users = [...students, ...admins, ...lagoonEmployees, ...officeEmployees, ...superAdmins];
    }
    
    // Remove sensitive fields
    const safeUsers = users.map(({ createdAt, updatedAt, ...user }) => user);
    
    return createResponse(200, safeUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

// GET /api/contributors
export const getContributors = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { limit } = event.queryStringParameters || {};
    const contributorLimit = limit ? parseInt(limit) : 10;
    
    const contributors = await dynamoStorage.getTopContributors(contributorLimit);
    
    return createResponse(200, contributors);
  } catch (error) {
    console.error('Error fetching contributors:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

// POST /api/contributors/update
export const updateContributor = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }
    
    const { userCode, username, userType } = JSON.parse(event.body);
    
    if (!userCode || !username || !userType) {
      return createResponse(400, { error: 'User code, username, and user type are required' });
    }
    
    await dynamoStorage.updateContributor(userCode, username, userType);
    
    return createResponse(200, { message: 'Contributor updated successfully' });
  } catch (error) {
    console.error('Error updating contributor:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

// OPTIONS handler for CORS
export const optionsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return createResponse(200, {});
};