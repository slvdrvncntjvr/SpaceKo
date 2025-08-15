import { 
  type Resource, 
  type InsertResource, 
  type Contributor, 
  type InsertContributor,
  type Session,
  type InsertSession
} from "@shared/schema";

// Memory storage specific interfaces
interface MemoryInsertResource {
  name: string;
  type: string;
  category: string;
  wing?: string | null;
  floor?: number | null;
  room?: string | null;
  status: string;
  updatedBy?: string | null;
  verifiedBy?: string | null;
  ownedBy?: string | null;
  stallNumber?: number | null;
}

interface MemoryInsertContributor {
  userCode: string;
  username: string;
  userType: string;
  updateCount?: number;
}

interface MemoryInsertSession {
  userCode: string;
  userType: string;
  username: string;
}

export interface IStorage {
  // Resources
  getResources(): Promise<Resource[]>;
  getResourceById(id: number): Promise<Resource | undefined>;
  getResourcesByCategory(category: string): Promise<Resource[]>;
  getResourcesByWing(wing: string): Promise<Resource[]>;
  getResourcesByWingAndFloor(wing: string, floor: number): Promise<Resource[]>;
  createResource(resource: MemoryInsertResource): Promise<Resource>;
  updateResource(id: number, updates: Partial<Resource>): Promise<Resource | undefined>;
  
  // Contributors
  getContributors(): Promise<Contributor[]>;
  getContributorByUsername(username: string): Promise<Contributor | undefined>;
  createContributor(contributor: MemoryInsertContributor): Promise<Contributor>;
  updateContributor(id: number, updates: Partial<Contributor>): Promise<Contributor | undefined>;
  
  // Sessions
  createSession(session: MemoryInsertSession): Promise<Session>;
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

    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample resources
    this.createResource({
      name: "S506",
      type: "Computer Lab",
      category: "room",
      wing: "South",
      floor: 5,
      room: "06",
      status: "available",
      updatedBy: "admin"
    });

    this.createResource({
      name: "N312",
      type: "Lecture Hall",
      category: "room",
      wing: "North",
      floor: 3,
      room: "12",
      status: "occupied",
      updatedBy: "student"
    });

    this.createResource({
      name: "E201",
      type: "Study Area",
      category: "room",
      wing: "East",
      floor: 2,
      room: "01",
      status: "open",
      updatedBy: "admin"
    });

    this.createResource({
      name: "Main Hall",
      type: "Conference Hall",
      category: "hall",
      status: "available",
      updatedBy: "admin"
    });

    this.createResource({
      name: "Lagoon Stall 1",
      type: "Food Stall",
      category: "lagoon_stall",
      status: "open",
      ownedBy: "employee1",
      stallNumber: 1
    });

    // Sample contributors
    this.createContributor({
      userCode: "2023-1234",
      username: "john_doe",
      userType: "student",
      updateCount: 5
    });

    this.createContributor({
      userCode: "PUP01-5678",
      username: "admin_user",
      userType: "admin",
      updateCount: 12
    });

    this.createContributor({
      userCode: "EMP01-9999",
      username: "employee_user",
      userType: "lagoon_employee",
      updateCount: 8
    });
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

  async createResource(insertResource: MemoryInsertResource): Promise<Resource> {
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

  async createContributor(insertContributor: MemoryInsertContributor): Promise<Contributor> {
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
  async createSession(insertSession: MemoryInsertSession): Promise<Session> {
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
    const studentPattern = /^20\d{2}-\d{4}$/;
    const adminPattern = /^PUP\d{2}-\d{4}$/;
    const employeePattern = /^EMP\d{2}-\d{4}$/;
    
    return studentPattern.test(userCode) || 
           adminPattern.test(userCode) || 
           employeePattern.test(userCode);
  }
}

export const storage = new MemStorage();
