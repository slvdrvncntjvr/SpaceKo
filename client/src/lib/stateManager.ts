// State Management with Persistence and Synchronization
import { Resource, Status, UserType } from "@shared/schema";

interface AppState {
  resources: Resource[];
  lastUpdated: string;
  version: number;
}

interface UserSession {
  userCode: string;
  userType: UserType;
  username: string;
  sessionId: string;
  loginTime: string;
  lastActivity: string;
}

export class StateManager {
  private storageKey = "spaceko_app_state";
  private sessionKey = "spaceko_session";
  private syncKey = "spaceko_sync";
  private listeners: Set<() => void> = new Set();
  private syncInterval: NodeJS.Timeout | null = null;
  private activityTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeSync();
    this.setupActivityTracking();
    this.setupStorageListener();
  }

  // Initialize cross-tab synchronization
  private initializeSync() {
    // Listen for storage changes from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === this.storageKey || e.key === this.syncKey) {
        this.notifyListeners();
      }
    });

    // Periodic sync with backend (if available)
    this.syncInterval = setInterval(() => {
      this.syncWithBackend();
    }, 30000); // Every 30 seconds
  }

  // Setup activity tracking for session management
  private setupActivityTracking() {
    const updateActivity = () => {
      const session = this.getSession();
      if (session) {
        this.updateSession({
          ...session,
          lastActivity: new Date().toISOString()
        });
      }
      
      // Reset activity timeout
      if (this.activityTimeout) {
        clearTimeout(this.activityTimeout);
      }
      
      // Auto-logout after 30 minutes of inactivity
      this.activityTimeout = setTimeout(() => {
        this.logout();
      }, 30 * 60 * 1000);
    };

    // Track user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Initial activity update
    updateActivity();
  }

  // Setup storage event listener for cross-tab sync
  private setupStorageListener() {
    // Detect when app is opened in another tab
    window.addEventListener('focus', () => {
      this.syncWithOtherTabs();
    });
  }

  // Get current app state
  getState(): AppState | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;
      
      const state = JSON.parse(stored) as AppState;
      
      // Validate state structure
      if (!state.resources || !Array.isArray(state.resources)) {
        return null;
      }
      
      return state;
    } catch (error) {
      console.error('Error loading state:', error);
      return null;
    }
  }

  // Save app state with versioning
  saveState(resources: Resource[]): void {
    try {
      const currentState = this.getState();
      const newVersion = currentState ? currentState.version + 1 : 1;
      
      const state: AppState = {
        resources,
        lastUpdated: new Date().toISOString(),
        version: newVersion
      };

      localStorage.setItem(this.storageKey, JSON.stringify(state));
      
      // Trigger sync notification for other tabs
      localStorage.setItem(this.syncKey, Date.now().toString());
      
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }

  // Update resource status with proper validation and logging
  updateResourceStatus(resourceName: string, status: Status, userCode: string): Resource[] | null {
    const currentState = this.getState();
    if (!currentState) return null;

    const updatedResources = currentState.resources.map(resource => {
      if (resource.name === resourceName) {
        const updatedResource = {
          ...resource,
          status,
          lastUpdated: new Date(),
          updatedBy: userCode
        };

        // Log the update for audit trail
        this.logResourceUpdate(resource, updatedResource, userCode);
        
        // Try to sync with backend
        this.syncResourceStatusWithBackend(resourceName, status);
        
        return updatedResource;
      }
      return resource;
    });

    this.saveState(updatedResources);
    return updatedResources;
  }

  // Verify resource with admin privileges
  verifyResource(resourceId: number, userCode: string): Resource[] | null {
    const currentState = this.getState();
    if (!currentState) return null;

    const updatedResources = currentState.resources.map(resource => {
      if (resource.id === resourceId) {
        const updatedResource = {
          ...resource,
          verifiedBy: userCode,
          verifiedAt: new Date()
        };

        // Log the verification
        this.logResourceVerification(resource, userCode);
        
        return updatedResource;
      }
      return resource;
    });

    this.saveState(updatedResources);
    return updatedResources;
  }

  // Session management
  createSession(userCode: string, userType: UserType, username: string): UserSession {
    const session: UserSession = {
      userCode,
      userType,
      username,
      sessionId: `${userCode}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    localStorage.setItem(this.sessionKey, JSON.stringify(session));
    return session;
  }

  getSession(): UserSession | null {
    try {
      const stored = localStorage.getItem(this.sessionKey);
      if (!stored) return null;
      
      const session = JSON.parse(stored) as UserSession;
      
      // Check if session is expired (24 hours)
      const loginTime = new Date(session.loginTime);
      const now = new Date();
      const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        this.logout();
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('Error loading session:', error);
      return null;
    }
  }

  updateSession(session: UserSession): void {
    localStorage.setItem(this.sessionKey, JSON.stringify(session));
  }

  logout(): void {
    localStorage.removeItem(this.sessionKey);
    localStorage.removeItem(this.storageKey);
    
    // Clear all timeouts
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }
    
    // Reload page to reset state
    window.location.reload();
  }

  // Subscribe to state changes
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Sync with backend (when available)
  private async syncWithBackend(): Promise<void> {
    const session = this.getSession();
    if (!session) return;

    try {
      // Try to sync with backend API
      const response = await fetch('/api/resources', {
        headers: {
          'Authorization': `Bearer ${session.sessionId}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const serverResources = result.data;
        const currentState = this.getState();
        
        if (currentState && serverResources && serverResources.length > 0) {
          // Simple conflict resolution: server wins for now
          // In production, implement proper conflict resolution
          this.saveState(serverResources);
        }
      }
    } catch (error) {
      // Backend not available, continue with local state
      console.debug('Backend sync not available, using local state');
    }
  }

  // Sync individual resource status with backend
  private async syncResourceStatusWithBackend(resourceName: string, status: Status): Promise<void> {
    const session = this.getSession();
    if (!session) return;

    try {
      const response = await fetch(`/api/resources/${encodeURIComponent(resourceName)}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.sessionId}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        const result = await response.json();
        console.debug('Resource status synced with backend:', result.message);
      } else {
        const error = await response.json();
        console.warn('Failed to sync with backend:', error.error);
      }
    } catch (error) {
      console.debug('Backend sync not available for status update');
    }
  }

  // Sync with other tabs
  private syncWithOtherTabs(): void {
    const event = new CustomEvent('spaceko-sync', {
      detail: { timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }

  // Audit logging
  private logResourceUpdate(oldResource: Resource, newResource: Resource, userCode: string): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: 'resource_update',
      userCode,
      resourceId: oldResource.id,
      resourceName: oldResource.name,
      oldStatus: oldResource.status,
      newStatus: newResource.status,
      sessionId: this.getSession()?.sessionId || 'unknown'
    };

    this.appendToAuditLog(logEntry);
  }

  private logResourceVerification(resource: Resource, userCode: string): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: 'resource_verification',
      userCode,
      resourceId: resource.id,
      resourceName: resource.name,
      sessionId: this.getSession()?.sessionId || 'unknown'
    };

    this.appendToAuditLog(logEntry);
  }

  private appendToAuditLog(entry: any): void {
    try {
      const logs = JSON.parse(localStorage.getItem('spaceko_audit_logs') || '[]');
      logs.push(entry);
      
      // Keep only last 500 entries
      if (logs.length > 500) {
        logs.splice(0, logs.length - 500);
      }
      
      localStorage.setItem('spaceko_audit_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Error logging audit entry:', error);
    }
  }

  // Clean up resources
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }
    this.listeners.clear();
  }

  // Get audit logs for admin users
  getAuditLogs(): any[] {
    try {
      return JSON.parse(localStorage.getItem('spaceko_audit_logs') || '[]');
    } catch (error) {
      console.error('Error loading audit logs:', error);
      return [];
    }
  }

  // Health check
  getHealthStatus(): {
    sessionValid: boolean;
    stateLoaded: boolean;
    lastSync: string | null;
    version: number;
  } {
    const session = this.getSession();
    const state = this.getState();
    
    return {
      sessionValid: !!session,
      stateLoaded: !!state,
      lastSync: state?.lastUpdated || null,
      version: state?.version || 0
    };
  }
}

// Create singleton instance
export const stateManager = new StateManager();

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  stateManager.destroy();
});
