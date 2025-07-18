// Lambda Handler for Resource Management
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { dynamoStorage } from '../dynamodb-schema';
import { z } from 'zod';

// Validation schemas
const updateResourceSchema = z.object({
  status: z.enum(['available', 'occupied', 'open', 'closed']),
  updatedBy: z.string().optional(),
});

const createResourceSchema = z.object({
  name: z.string(),
  type: z.string(),
  category: z.enum(['room', 'hall', 'lagoon_stall', 'service']),
  wing: z.string().optional(),
  floor: z.number().optional(),
  room: z.string().optional(),
  status: z.enum(['available', 'occupied', 'open', 'closed']),
  ownedBy: z.string().optional(),
  stallNumber: z.number().optional(),
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

// GET /api/resources
export const getResources = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { wing, status } = event.queryStringParameters || {};
    
    let resources;
    
    if (wing) {
      resources = await dynamoStorage.getResourcesByWing(wing);
    } else if (status) {
      resources = await dynamoStorage.getResourcesByStatus(status);
    } else {
      // Get all resources - in production, you'd want pagination
      resources = await dynamoStorage.getResourcesByWing('South');
      const north = await dynamoStorage.getResourcesByWing('North');
      const east = await dynamoStorage.getResourcesByWing('East');
      const west = await dynamoStorage.getResourcesByWing('West');
      resources = [...resources, ...north, ...east, ...west];
    }
    
    return createResponse(200, resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

// GET /api/resources/{id}
export const getResource = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { id } = event.pathParameters || {};
    
    if (!id) {
      return createResponse(400, { error: 'Resource ID is required' });
    }
    
    const resource = await dynamoStorage.getResource(id);
    
    if (!resource) {
      return createResponse(404, { error: 'Resource not found' });
    }
    
    return createResponse(200, resource);
  } catch (error) {
    console.error('Error fetching resource:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

// POST /api/resources
export const createResource = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }
    
    const body = JSON.parse(event.body);
    const validatedData = createResourceSchema.parse(body);
    
    const resource = await dynamoStorage.createResource({
      ...validatedData,
      id: `${validatedData.name}-${Date.now()}`,
      lastUpdated: new Date().toISOString(),
    });
    
    return createResponse(201, resource);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createResponse(400, { error: 'Validation error', details: error.errors });
    }
    
    console.error('Error creating resource:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

// PUT /api/resources/{id}
export const updateResource = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { id } = event.pathParameters || {};
    
    if (!id) {
      return createResponse(400, { error: 'Resource ID is required' });
    }
    
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }
    
    const body = JSON.parse(event.body);
    const validatedData = updateResourceSchema.parse(body);
    
    // Check if resource exists
    const existingResource = await dynamoStorage.getResource(id);
    if (!existingResource) {
      return createResponse(404, { error: 'Resource not found' });
    }
    
    await dynamoStorage.updateResourceStatus(id, validatedData.status, validatedData.updatedBy);
    
    // Get updated resource
    const updatedResource = await dynamoStorage.getResource(id);
    
    return createResponse(200, updatedResource);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createResponse(400, { error: 'Validation error', details: error.errors });
    }
    
    console.error('Error updating resource:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

// OPTIONS handler for CORS
export const optionsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return createResponse(200, {});
};