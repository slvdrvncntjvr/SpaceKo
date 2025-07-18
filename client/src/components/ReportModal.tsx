import React, { useState } from "react";
import { X, Circle, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Resource, Status, UserType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { validateUserAction, checkRateLimit, logUserAction, getUserPermissions } from "@/utils/permissions";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  resources: Resource[];
  selectedResource?: Resource;
  onSubmit: (resourceId: string, status: Status) => void;
  userType: UserType;
  userCode: string;
  username: string;
}

export function ReportModal({ 
  isOpen, 
  onClose, 
  resources, 
  selectedResource,
  onSubmit,
  userType,
  userCode,
  username
}: ReportModalProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [status, setStatus] = useState<Status>("available");
  const [permissionError, setPermissionError] = useState<string>("");
  const { toast } = useToast();

  const permissions = getUserPermissions(userType, userCode);
  const allowedResources = permissions.getOwnedResources(resources);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPermissionError("");
    
    if (!selectedRoomId) {
      toast({
        title: "Error",
        description: "Please select a resource",
        variant: "destructive"
      });
      return;
    }

    // Find the selected resource
    const resource = resources.find(r => r.name === selectedRoomId);
    if (!resource) {
      toast({
        title: "Error",
        description: "Resource not found",
        variant: "destructive"
      });
      return;
    }

    // Check permissions
    const validation = validateUserAction(userType, userCode, "update", resource);
    if (!validation.allowed) {
      setPermissionError(validation.reason || "Action not permitted");
      toast({
        title: "Access Denied",
        description: validation.reason,
        variant: "destructive"
      });
      return;
    }

    // Check rate limiting
    if (!checkRateLimit(userCode, "update_resource")) {
      toast({
        title: "Rate Limited",
        description: "Too many updates. Please wait a moment.",
        variant: "destructive"
      });
      return;
    }

    // Log the action
    logUserAction(userCode, userType, "update_resource", resource.id, {
      oldStatus: resource.status,
      newStatus: status,
      resourceName: resource.name
    });

    onSubmit(selectedRoomId, status);
    toast({
      title: "Success",
      description: "Status updated successfully!",
      className: "bg-pup-green text-white"
    });
    
    onClose();
    setSelectedRoomId("");
    setStatus("available");
    setPermissionError("");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setSelectedRoomId("");
      setStatus("available");
    }
  };

  // Pre-select resource if provided
  React.useEffect(() => {
    if (selectedResource && isOpen) {
      setSelectedRoomId(selectedResource.name);
    }
  }, [selectedResource, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Update Status
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Permission Warning */}
          {permissionError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {permissionError}
              </AlertDescription>
            </Alert>
          )}

          {/* User Permission Info */}
          <Alert className="border-blue-200 bg-blue-50">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              {userType === "student" && "You can only update room availability."}
              {userType === "lagoon_employee" && "You can only update your own stall status."}
              {userType === "office_employee" && "You can only update your own office status."}
              {userType === "admin" && "You can update and verify all resources."}
              {userType === "superadmin" && "You have full access to all resources."}
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Select Resource ({allowedResources.length} available)
              </Label>
              <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a resource..." />
                </SelectTrigger>
                <SelectContent>
                  {allowedResources.map((resource) => (
                    <SelectItem key={resource.id} value={resource.name}>
                      {resource.name} - {resource.type}
                      {resource.ownedBy === userCode && " (Your Resource)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {allowedResources.length === 0 && (
                <p className="text-sm text-red-600 mt-1">
                  No resources available for your account type.
                </p>
              )}
            </div>
          
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </Label>
              <RadioGroup value={status} onValueChange={(value) => setStatus(value as Status)}>
                <div className="space-y-2">
                  <Label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="available" className="mr-3" />
                    <Circle className="text-pup-green mr-2 h-4 w-4 fill-current" />
                    Available
                  </Label>
                  <Label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="occupied" className="mr-3" />
                    <Circle className="text-pup-red mr-2 h-4 w-4 fill-current" />
                    Occupied
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-maroon hover:bg-gold hover:text-maroon text-white transition-colors duration-200"
                disabled={allowedResources.length === 0}
              >
                Update Status
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
