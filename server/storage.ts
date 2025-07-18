import { 
  type Resource, 
  type InsertResource, 
  type Contributor, 
  type InsertContributor,
  type Session,
  type InsertSession
} from "@shared/schema";

export interface IStorage {
  // Resources
  getResources(): Promise<Resource[]>;
  getResourceById(id: number): Promise<Resource | undefined>;
  getResourcesByCategory(category: string): Promise<Resource[]>;
  getResourcesByWing(wing: string): Promise<Resource[]>;
  getResourcesByWingAndFloor(wing: string, floor: number): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, updates: Partial<Resource>): Promise<Resource | undefined>;
  
  // Contributors
  getContributors(): Promise<Contributor[]>;
  getContributorByUsername(username: string): Promise<Contributor | undefined>;
  createContributor(contributor: InsertContributor): Promise<Contributor>;
  updateContributor(id: number, updates: Partial<Contributor>): Promise<Contributor | undefined>;
  
  // Sessions
  createSession(session: InsertSession): Promise<Session>;
  getSessionByUserCode(userCode: string): Promise<Session | undefined>;
  validateUserCode(userCode: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private resources: Map<number, Resource>;
  private contributors: Map<number, Contributor>;
  private sessions: Map<number, Session>;
  private resourceId: number;
  private contributorId: number;
  private sessionId: number;

  constructor() {
    this.resources = new Map();
    this.contributors = new Map();
    this.sessions = new Map();
    this.resourceId = 1;
    this.contributorId = 1;
    this.sessionId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample resources will be added here
  }

  // Resource methods
  async getResources(): Promise<Resource[]> {
    return Array.from(this.resources.values());
  }

  async getResourceById(id: number): Promise<Resource | undefined> {
    return this.resources.get(id);
  }

  async getResourcesByCategory(category: string): Promise<Resource[]> {
    return Array.from(this.resources.values()).filter(r => r.category === category);
  }

  async getResourcesByWing(wing: string): Promise<Resource[]> {
    return Array.from(this.resources.values()).filter(r => r.wing === wing);
  }

  async getResourcesByWingAndFloor(wing: string, floor: number): Promise<Resource[]> {
    return Array.from(this.resources.values()).filter(r => r.wing === wing && r.floor === floor);
  }

  async createResource(insertResource: InsertResource): Promise<Resource> {
    const id = this.resourceId++;
    const resource: Resource = { 
      ...insertResource, 
      id,
      lastUpdated: new Date(),
      wing: insertResource.wing || null,
      floor: insertResource.floor || null,
      room: insertResource.room || null,
      updatedBy: insertResource.updatedBy || null,
      verifiedBy: insertResource.verifiedBy || null,
      verifiedAt: null,
      ownedBy: insertResource.ownedBy || null,
      stallNumber: insertResource.stallNumber || null
    };
    this.resources.set(id, resource);
    return resource;
  }

  async updateResource(id: number, updates: Partial<Resource>): Promise<Resource | undefined> {
    const resource = this.resources.get(id);
    if (!resource) return undefined;
    
    const updatedResource = { 
      ...resource, 
      ...updates, 
      lastUpdated: new Date() 
    };
    this.resources.set(id, updatedResource);
    return updatedResource;
  }

  // Contributor methods
  async getContributors(): Promise<Contributor[]> {
    return Array.from(this.contributors.values());
  }

  async getContributorByUsername(username: string): Promise<Contributor | undefined> {
    return Array.from(this.contributors.values()).find(c => c.username === username);
  }

  async createContributor(insertContributor: InsertContributor): Promise<Contributor> {
    const id = this.contributorId++;
    const contributor: Contributor = { 
      ...insertContributor, 
      id,
      lastActive: new Date(),
      updateCount: insertContributor.updateCount || 0
    };
    this.contributors.set(id, contributor);
    return contributor;
  }

  async updateContributor(id: number, updates: Partial<Contributor>): Promise<Contributor | undefined> {
    const contributor = this.contributors.get(id);
    if (!contributor) return undefined;
    
    const updatedContributor = { 
      ...contributor, 
      ...updates, 
      lastActive: new Date() 
    };
    this.contributors.set(id, updatedContributor);
    return updatedContributor;
  }

  // Session methods
  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = this.sessionId++;
    const session: Session = { 
      ...insertSession, 
      id,
      createdAt: new Date()
    };
    this.sessions.set(id, session);
    return session;
  }

  async getSessionByUserCode(userCode: string): Promise<Session | undefined> {
    return Array.from(this.sessions.values()).find(s => s.userCode === userCode);
  }

  async validateUserCode(userCode: string): Promise<boolean> {
    // Simple validation logic
    const studentPattern = /^20\d{2}-\d{4}$/;
    const adminPattern = /^PUP\d{2}-\d{4}$/;
    const employeePattern = /^EMP\d{2}-\d{4}$/;
    
    return studentPattern.test(userCode) || 
           adminPattern.test(userCode) || 
           employeePattern.test(userCode);
  }
}

export const storage = new MemStorage();
