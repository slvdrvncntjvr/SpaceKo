import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RefreshCw, Wifi, WifiOff, CheckCircle, AlertTriangle, Clock } from "lucide-react";

interface StatusBarProps {
  healthStatus: {
    sessionValid: boolean;
    stateLoaded: boolean;
    lastSync: string | null;
    version: number;
  };
  error: string | null;
  isLoading: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  username: string;
}

export function StatusBar({ 
  healthStatus, 
  error, 
  isLoading, 
  onRefresh, 
  onLogout,
  username 
}: StatusBarProps) {
  const getStatusIcon = () => {
    if (error) return <AlertTriangle className="h-3 w-3" />;
    if (!healthStatus.sessionValid) return <WifiOff className="h-3 w-3" />;
    if (!healthStatus.stateLoaded) return <Clock className="h-3 w-3" />;
    return <CheckCircle className="h-3 w-3" />;
  };

  const getStatusColor = () => {
    if (error) return "text-red-600 border-red-600";
    if (!healthStatus.sessionValid) return "text-orange-600 border-orange-600";
    if (!healthStatus.stateLoaded) return "text-yellow-600 border-yellow-600";
    return "text-green-600 border-green-600";
  };

  const getStatusText = () => {
    if (error) return "Error";
    if (!healthStatus.sessionValid) return "Session Invalid";
    if (!healthStatus.stateLoaded) return "Loading";
    return "Online";
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return "Never";
    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-lg border shadow-sm">
      <div className="flex items-center space-x-4">
        {/* Connection Status */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className={getStatusColor()}>
                <div className="flex items-center space-x-2">
                  {getStatusIcon()}
                  <span>{getStatusText()}</span>
                </div>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm space-y-1">
                <p><strong>Status:</strong> {getStatusText()}</p>
                <p><strong>Session:</strong> {healthStatus.sessionValid ? "Valid" : "Invalid"}</p>
                <p><strong>Data:</strong> {healthStatus.stateLoaded ? "Loaded" : "Not loaded"}</p>
                <p><strong>Version:</strong> {healthStatus.version}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Version Info */}
        <Badge variant="secondary" className="text-xs">
          v{healthStatus.version}
        </Badge>

        {/* Last Sync */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm text-gray-500 flex items-center space-x-1">
                <Wifi className="h-3 w-3" />
                <span>Last sync: {formatLastSync(healthStatus.lastSync)}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {healthStatus.lastSync ? (
                <p>Last synchronized: {new Date(healthStatus.lastSync).toLocaleString()}</p>
              ) : (
                <p>No synchronization yet</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* User Info */}
        <span className="text-sm text-gray-700">
          Welcome, <strong>{username}</strong>
        </span>
      </div>

      <div className="flex items-center space-x-2">
        {/* Error Display */}
        {error && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Error
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{error}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Refresh Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          disabled={isLoading}
          className="text-xs"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>

        {/* Logout Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onLogout}
          className="text-xs"
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
