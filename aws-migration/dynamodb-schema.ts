// DynamoDB Schema for SpaceKo Application
// Single-table design with composite keys for optimal performance

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const dynamoClient = DynamoDBDocumentClient.from(client);

// Table name
export const TABLE_NAME = process.env.DYNAMODB_TABLE || 'spaceko-main';

// DynamoDB Item Types
export interface BaseItem {
  PK: string;  // Partition Key
  SK: string;  // Sort Key
  GSI1PK?: string;  // Global Secondary Index 1 Partition Key
  GSI1SK?: string;  // Global Secondary Index 1 Sort Key
  EntityType: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceItem extends BaseItem {
  EntityType: 'RESOURCE';
  PK: string;  // RESOURCE#<wing>#<floor>#<room> or RESOURCE#<category>#<id>
  SK: string;  // RESOURCE#<id>
  GSI1PK: string;  // WING#<wing> or CATEGORY#<category>
  GSI1SK: string;  // STATUS#<status>#<name>
  
  id: string;
  name: string;
  type: string;
  category: 'room' | 'hall' | 'lagoon_stall' | 'service';
  wing?: string;
  floor?: number;
  room?: string;
  status: 'available' | 'occupied' | 'open' | 'closed';
  lastUpdated: string;
  updatedBy?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  ownedBy?: string;
  stallNumber?: number;
}

export interface UserItem extends BaseItem {
  EntityType: 'USER';
  PK: string;  // USER#<userCode>
  SK: string;  // USER#<userCode>
  GSI1PK: string;  // USERTYPE#<userType>
  GSI1SK: string;  // USERNAME#<username>
  
  userCode: string;
  username: string;
  userType: 'student' | 'admin' | 'lagoon_employee' | 'office_employee' | 'superadmin';
  isActive: boolean;
  createdBy?: string;
  
  // Student specific
  studentId?: string;
  grade?: string;
  section?: string;
  
  // Admin specific
  office?: string;
  position?: string;
  
  // Employee specific
  workplace?: string;
  employeeId?: string;
}

export interface ContributorItem extends BaseItem {
  EntityType: 'CONTRIBUTOR';
  PK: string;  // CONTRIBUTOR#<userCode>
  SK: string;  // CONTRIBUTOR#<userCode>
  GSI1PK: string;  // USERTYPE#<userType>
  GSI1SK: string;  // UPDATECOUNT#<updateCount>
  
  userCode: string;
  username: string;
  userType: string;
  updateCount: number;
  lastActive: string;
}

export interface SessionItem extends BaseItem {
  EntityType: 'SESSION';
  PK: string;  // SESSION#<userCode>
  SK: string;  // SESSION#<sessionId>
  GSI1PK: string;  // USERTYPE#<userType>
  GSI1SK: string;  // CREATEDAT#<createdAt>
  
  userCode: string;
  userType: string;
  username: string;
  sessionId: string;
  ttl: number;  // TTL for automatic cleanup
}

// DynamoDB Operations
export class DynamoDBStorage {
  
  // Resources
  async createResource(resource: Omit<ResourceItem, 'PK' | 'SK' | 'GSI1PK' | 'GSI1SK' | 'EntityType' | 'createdAt' | 'updatedAt'>): Promise<ResourceItem> {
    const now = new Date().toISOString();
    const item: ResourceItem = {
      ...resource,
      PK: this.getResourcePK(resource),
      SK: `RESOURCE#${resource.id}`,
      GSI1PK: resource.wing ? `WING#${resource.wing}` : `CATEGORY#${resource.category}`,
      GSI1SK: `STATUS#${resource.status}#${resource.name}`,
      EntityType: 'RESOURCE',
      createdAt: now,
      updatedAt: now,
    };
    
    await dynamoClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }));
    
    return item;
  }

  async getResource(id: string): Promise<ResourceItem | null> {
    const result = await dynamoClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `RESOURCE#${id}`,
        SK: `RESOURCE#${id}`,
      },
    }));
    
    return result.Item as ResourceItem || null;
  }

  async getResourcesByWing(wing: string): Promise<ResourceItem[]> {
    const result = await dynamoClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :wing',
      ExpressionAttributeValues: {
        ':wing': `WING#${wing}`,
      },
    }));
    
    return result.Items as ResourceItem[] || [];
  }

  async getResourcesByStatus(status: string): Promise<ResourceItem[]> {
    const result = await dynamoClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1SK BEGINS_WITH :status',
      ExpressionAttributeValues: {
        ':status': `STATUS#${status}`,
      },
    }));
    
    return result.Items as ResourceItem[] || [];
  }

  async updateResourceStatus(id: string, status: string, updatedBy?: string): Promise<void> {
    const now = new Date().toISOString();
    
    await dynamoClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `RESOURCE#${id}`,
        SK: `RESOURCE#${id}`,
      },
      UpdateExpression: 'SET #status = :status, lastUpdated = :now, updatedBy = :updatedBy, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':now': now,
        ':updatedBy': updatedBy,
        ':updatedAt': now,
      },
    }));
  }

  // Users
  async createUser(user: Omit<UserItem, 'PK' | 'SK' | 'GSI1PK' | 'GSI1SK' | 'EntityType' | 'createdAt' | 'updatedAt'>): Promise<UserItem> {
    const now = new Date().toISOString();
    const item: UserItem = {
      ...user,
      PK: `USER#${user.userCode}`,
      SK: `USER#${user.userCode}`,
      GSI1PK: `USERTYPE#${user.userType}`,
      GSI1SK: `USERNAME#${user.username}`,
      EntityType: 'USER',
      createdAt: now,
      updatedAt: now,
    };
    
    await dynamoClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }));
    
    return item;
  }

  async getUser(userCode: string): Promise<UserItem | null> {
    const result = await dynamoClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userCode}`,
        SK: `USER#${userCode}`,
      },
    }));
    
    return result.Item as UserItem || null;
  }

  async getUsersByType(userType: string): Promise<UserItem[]> {
    const result = await dynamoClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :userType',
      ExpressionAttributeValues: {
        ':userType': `USERTYPE#${userType}`,
      },
    }));
    
    return result.Items as UserItem[] || [];
  }

  // Contributors
  async updateContributor(userCode: string, username: string, userType: string): Promise<void> {
    const now = new Date().toISOString();
    
    await dynamoClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `CONTRIBUTOR#${userCode}`,
        SK: `CONTRIBUTOR#${userCode}`,
      },
      UpdateExpression: 'SET updateCount = if_not_exists(updateCount, :zero) + :inc, lastActive = :now, updatedAt = :updatedAt ADD updateCount :inc',
      ExpressionAttributeValues: {
        ':zero': 0,
        ':inc': 1,
        ':now': now,
        ':updatedAt': now,
      },
    }));
  }

  async getTopContributors(limit: number = 10): Promise<ContributorItem[]> {
    const result = await dynamoClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :contributors',
      ExpressionAttributeValues: {
        ':contributors': 'CONTRIBUTOR',
      },
      ScanIndexForward: false,
      Limit: limit,
    }));
    
    return result.Items as ContributorItem[] || [];
  }

  // Sessions
  async createSession(userCode: string, userType: string, username: string): Promise<SessionItem> {
    const now = new Date().toISOString();
    const sessionId = `${userCode}_${Date.now()}`;
    const ttl = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours
    
    const item: SessionItem = {
      PK: `SESSION#${userCode}`,
      SK: `SESSION#${sessionId}`,
      GSI1PK: `USERTYPE#${userType}`,
      GSI1SK: `CREATEDAT#${now}`,
      EntityType: 'SESSION',
      userCode,
      userType,
      username,
      sessionId,
      ttl,
      createdAt: now,
      updatedAt: now,
    };
    
    await dynamoClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }));
    
    return item;
  }

  async getSession(userCode: string, sessionId: string): Promise<SessionItem | null> {
    const result = await dynamoClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `SESSION#${userCode}`,
        SK: `SESSION#${sessionId}`,
      },
    }));
    
    return result.Item as SessionItem || null;
  }

  async deleteSession(userCode: string, sessionId: string): Promise<void> {
    await dynamoClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `SESSION#${userCode}`,
        SK: `SESSION#${sessionId}`,
      },
    }));
  }

  // Helper methods
  private getResourcePK(resource: any): string {
    if (resource.wing && resource.floor && resource.room) {
      return `RESOURCE#${resource.wing}#${resource.floor}#${resource.room}`;
    }
    return `RESOURCE#${resource.category}#${resource.id}`;
  }
}

// Export singleton instance
export const dynamoStorage = new DynamoDBStorage();