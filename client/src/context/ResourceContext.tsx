import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Resource, UserType, Status } from '@shared/schema';

interface ResourceContextType {
  resources: Resource[];
  loading: boolean;
  error: string | null;
  userType: UserType | null;
  userCode: string | null;
  updateResource: (resourceId: number, updates: Partial<Resource>) => Promise<void>;
  createResource: (resource: Omit<Resource, 'id' | 'lastUpdated'>) => Promise<void>;
  deleteResource: (resourceId: number) => Promise<void>;
  verifyResource: (resourceId: number, verifiedBy: string) => Promise<void>;
  fetchResources: () => Promise<void>;
  setUser: (userType: UserType, userCode: string) => void;
}

const ResourceContext = createContext<ResourceContextType | undefined>(undefined);

interface ResourceProviderProps {
  children: ReactNode;
}

export function ResourceProvider({ children }: ResourceProviderProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [userCode, setUserCode] = useState<string | null>(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/resources`);
      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }
      const data = await response.json();
      setResources(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateResource = async (resourceId: number, updates: Partial<Resource>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/resources/${resourceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update resource');
      }
      
      await fetchResources(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update resource');
    }
  };

  const createResource = async (resource: Omit<Resource, 'id' | 'lastUpdated'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resource),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create resource');
      }
      
      await fetchResources(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create resource');
    }
  };

  const deleteResource = async (resourceId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/resources/${resourceId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete resource');
      }
      
      await fetchResources(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete resource');
    }
  };

  const verifyResource = async (resourceId: number, verifiedBy: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verifiedBy }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to verify resource');
      }
      
      await fetchResources(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify resource');
    }
  };

  const setUser = (newUserType: UserType, newUserCode: string) => {
    setUserType(newUserType);
    setUserCode(newUserCode);
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const value: ResourceContextType = {
    resources,
    loading,
    error,
    userType,
    userCode,
    updateResource,
    createResource,
    deleteResource,
    verifyResource,
    fetchResources,
    setUser,
  };

  return (
    <ResourceContext.Provider value={value}>
      {children}
    </ResourceContext.Provider>
  );
}

export function useResourceContext() {
  const context = useContext(ResourceContext);
  if (context === undefined) {
    throw new Error('useResourceContext must be used within a ResourceProvider');
  }
  return context;
} 