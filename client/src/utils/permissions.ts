import { UserType, Resource, Category } from "@shared/schema";

export interface UserPermissions {
  canViewCategory: (category: Category) => boolean;
  canUpdateResource: (resource: Resource) => boolean;
  canVerifyResource: (resource: Resource) => boolean;
  canCreateUsers: () => boolean;
  getAllowedCategories: () => Category[];
  getOwnedResources: (resources: Resource[]) => Resource[];
}

export function getUserPermissions(userType: UserType, userCode: string): UserPermissions {
  return {
    canViewCategory: (category: Category) => {
      // All users can view all categories for now, but updating is restricted
      return true;
    },

    canUpdateResource: (resource: Resource) => {
      switch (userType) {
        case "superadmin":
          return true; // SuperAdmin can update anything
          
        case "admin":
          return true; // Admins can update anything for verification purposes
          
        case "student":
          // Students can only update room availability, not lagoon stalls or services
          return resource.category === "room";
          
        case "lagoon_employee":
          // Lagoon employees can only update their own stall
          return resource.category === "lagoon_stall" && resource.ownedBy === userCode;
          
        case "office_employee":
          // Office employees can only update their own service/office
          return resource.category === "service" && resource.ownedBy === userCode;
          
        default:
          return false;
      }
    },

    canVerifyResource: (resource: Resource) => {
      // Only admins and superadmins can verify resources
      return userType === "admin" || userType === "superadmin";
    },

    canCreateUsers: () => {
      // Only superadmins can create new users
      return userType === "superadmin";
    },

    getAllowedCategories: () => {
      switch (userType) {
        case "superadmin":
        case "admin":
          return ["room", "hall", "lagoon_stall", "service"];
          
        case "student":
          return ["room", "hall", "lagoon_stall", "service"]; // Can view all, but can only update rooms
          
        case "lagoon_employee":
          return ["lagoon_stall"]; // Focus on their stall, but can view others for context
          
        case "office_employee":
          return ["service"]; // Focus on their service, but can view others for context
          
        default:
          return [];
      }
    },

    getOwnedResources: (resources: Resource[]) => {
      switch (userType) {
        case "superadmin":
        case "admin":
          return resources; // Can manage all resources
          
        case "student":
          return resources.filter(r => r.category === "room"); // Only rooms for reporting
          
        case "lagoon_employee":
          return resources.filter(r => r.category === "lagoon_stall" && r.ownedBy === userCode);
          
        case "office_employee":
          return resources.filter(r => r.category === "service" && r.ownedBy === userCode);
          
        default:
          return [];
      }
    }
  };
}

// Security validation functions
export function validateUserAction(
  userType: UserType,
  userCode: string,
  action: "view" | "update" | "verify" | "create_user",
  resource?: Resource,
  category?: Category
): { allowed: boolean; reason?: string } {
  const permissions = getUserPermissions(userType, userCode);

  switch (action) {
    case "view":
      if (category && !permissions.canViewCategory(category)) {
        return { allowed: false, reason: "Not authorized to view this category" };
      }
      return { allowed: true };

    case "update":
      if (!resource) {
        return { allowed: false, reason: "No resource specified" };
      }
      if (!permissions.canUpdateResource(resource)) {
        return { 
          allowed: false, 
          reason: userType === "student" ? "Students can only update room availability" :
                  userType === "lagoon_employee" ? "You can only update your own stall" :
                  userType === "office_employee" ? "You can only update your own office" :
                  "Not authorized to update this resource"
        };
      }
      return { allowed: true };

    case "verify":
      if (!resource) {
        return { allowed: false, reason: "No resource specified" };
      }
      if (!permissions.canVerifyResource(resource)) {
        return { allowed: false, reason: "Only admins can verify resource status" };
      }
      return { allowed: true };

    case "create_user":
      if (!permissions.canCreateUsers()) {
        return { allowed: false, reason: "Only SuperAdmins can create user accounts" };
      }
      return { allowed: true };

    default:
      return { allowed: false, reason: "Unknown action" };
  }
}

// Rate limiting and security measures
export function checkRateLimit(userCode: string, action: string): boolean {
  const key = `${userCode}-${action}`;
  const now = Date.now();
  const stored = localStorage.getItem(`rate_limit_${key}`);
  
  if (stored) {
    const { timestamp, count } = JSON.parse(stored);
    const timeDiff = now - timestamp;
    
    // Allow 10 actions per minute
    if (timeDiff < 60000 && count >= 10) {
      return false;
    }
    
    // Reset counter if more than a minute has passed
    if (timeDiff >= 60000) {
      localStorage.setItem(`rate_limit_${key}`, JSON.stringify({ timestamp: now, count: 1 }));
    } else {
      localStorage.setItem(`rate_limit_${key}`, JSON.stringify({ timestamp, count: count + 1 }));
    }
  } else {
    localStorage.setItem(`rate_limit_${key}`, JSON.stringify({ timestamp: now, count: 1 }));
  }
  
  return true;
}

// Audit logging for security
export function logUserAction(userCode: string, userType: UserType, action: string, resourceId?: number, details?: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userCode,
    userType,
    action,
    resourceId,
    details,
    userAgent: navigator.userAgent,
    sessionId: localStorage.getItem("spaceko_session_id") || "unknown"
  };

  // In a real application, this would be sent to a secure backend endpoint
  // For development, we'll use a proper logging mechanism
  
  // Store locally for development/demo purposes
  const existingLogs = JSON.parse(localStorage.getItem("spaceko_audit_logs") || "[]");
  existingLogs.push(logEntry);
  
  // Keep only last 100 entries to prevent storage bloat
  if (existingLogs.length > 100) {
    existingLogs.splice(0, existingLogs.length - 100);
  }
  
  localStorage.setItem("spaceko_audit_logs", JSON.stringify(existingLogs));
}