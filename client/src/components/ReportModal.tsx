import React, { useState } from "react";
import { X, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Resource, Status } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  resources: Resource[];
  selectedResource?: Resource;
  onSubmit: (resourceId: string, status: Status) => void;
}

export function ReportModal({ 
  isOpen, 
  onClose, 
  resources, 
  selectedResource,
  onSubmit 
}: ReportModalProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [status, setStatus] = useState<Status>("available");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRoomId) {
      toast({
        title: "Error",
        description: "Please select a room",
        variant: "destructive"
      });
      return;
    }

    onSubmit(selectedRoomId, status);
    toast({
      title: "Success",
      description: "Thanks for reporting!",
      className: "bg-pup-green text-white"
    });
    
    onClose();
    setSelectedRoomId("");
    setStatus("available");
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
            Report Room Status
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Select Room
            </Label>
            <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a room..." />
              </SelectTrigger>
              <SelectContent>
                {resources.map((resource) => (
                  <SelectItem key={resource.id} value={resource.name}>
                    {resource.name} - {resource.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            >
              Submit Report
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
