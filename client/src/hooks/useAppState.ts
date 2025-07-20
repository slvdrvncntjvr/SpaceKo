import { useState, useEffect, useCallback } from "react";
import { Resource, Status, UserType } from "@shared/schema";
import { stateManager } from "@/lib/stateManager";
import { mockResources } from "@/data/newMockData";

interface UseAppStateReturn {
  // State
  resources: Resource[];
  isAuthenticated: boolean;
  userCode: string;
  userType: UserType;
  username: string;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (code: string, type: UserType, name: string) => void;
  logout: () => void;
  updateResourceStatus: (resourceName: string, status: Status) => boolean;
  verifyResource: (resourceId: number) => boolean;
  refreshState: () => void;
  
  // Health
  healthStatus: {
    sessionValid: boolean;
    stateLoaded: boolean;
    lastSync: string | null;
    version: number;
  };
}

export function useAppState(): UseAppStateReturn {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userCode, setUserCode] = useState("");
  const [userType, setUserType] = useState<UserType>("student");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState(stateManager.getHealthStatus());

  // Load initial state
  useEffect(() => {
    const loadInitialState = () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check for existing session
        const session = stateManager.getSession();
        if (session) {
          setIsAuthenticated(true);
          setUserCode(session.userCode);
          setUserType(session.userType);
          setUsername(session.username);
        }

        // Load app state
        const state = stateManager.getState();
        if (state && state.resources.length > 0) {
          setResources(state.resources);
        } else {
          // Initialize with mock data if no state exists
          setResources(mockResources);
          stateManager.saveState(mockResources);
        }

        setHealthStatus(stateManager.getHealthStatus());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load application state');
        console.error('Error loading initial state:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialState();
  }, []);

  // Subscribe to state changes (cross-tab sync)
  useEffect(() => {
    const unsubscribe = stateManager.subscribe(() => {
      const state = stateManager.getState();
      if (state) {
        setResources(state.resources);
      }
      setHealthStatus(stateManager.getHealthStatus());
    });

    return unsubscribe;
  }, []);

  // Login function
  const login = useCallback((code: string, type: UserType, name: string) => {
    try {
      const session = stateManager.createSession(code, type, name);
      setIsAuthenticated(true);
      setUserCode(session.userCode);
      setUserType(session.userType);
      setUsername(session.username);
      setError(null);
      
      // Update health status
      setHealthStatus(stateManager.getHealthStatus());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      console.error('Login error:', err);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    try {
      stateManager.logout();
      // State will be reset by page reload in stateManager.logout()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
      console.error('Logout error:', err);
    }
  }, []);

  // Update resource status
  const updateResourceStatus = useCallback((resourceName: string, status: Status): boolean => {
    try {
      if (!isAuthenticated) {
        setError('You must be authenticated to update resources');
        return false;
      }

      const updatedResources = stateManager.updateResourceStatus(resourceName, status, userCode);
      if (updatedResources) {
        setResources(updatedResources);
        setError(null);
        setHealthStatus(stateManager.getHealthStatus());
        return true;
      } else {
        setError('Failed to update resource status');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update resource');
      console.error('Update resource error:', err);
      return false;
    }
  }, [isAuthenticated, userCode]);

  // Verify resource (admin only)
  const verifyResource = useCallback((resourceId: number): boolean => {
    try {
      if (!isAuthenticated || (userType !== 'admin' && userType !== 'superadmin')) {
        setError('Only administrators can verify resources');
        return false;
      }

      const updatedResources = stateManager.verifyResource(resourceId, userCode);
      if (updatedResources) {
        setResources(updatedResources);
        setError(null);
        setHealthStatus(stateManager.getHealthStatus());
        return true;
      } else {
        setError('Failed to verify resource');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify resource');
      console.error('Verify resource error:', err);
      return false;
    }
  }, [isAuthenticated, userType, userCode]);

  // Refresh state manually
  const refreshState = useCallback(() => {
    try {
      const state = stateManager.getState();
      if (state) {
        setResources(state.resources);
      }
      setHealthStatus(stateManager.getHealthStatus());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh state');
      console.error('Refresh state error:', err);
    }
  }, []);

  // Auto-refresh health status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setHealthStatus(stateManager.getHealthStatus());
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    // State
    resources,
    isAuthenticated,
    userCode,
    userType,
    username,
    isLoading,
    error,
    
    // Actions
    login,
    logout,
    updateResourceStatus,
    verifyResource,
    refreshState,
    
    // Health
    healthStatus
  };
}
