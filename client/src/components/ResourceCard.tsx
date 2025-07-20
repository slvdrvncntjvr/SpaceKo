import { Clock, Shield, User, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Resource, UserType } from "@shared/schema";
import { validateUserAction } from "@/utils/permissions";
import { useResourceContext } from "@/context/ResourceContext";

interface ResourceCardProps {
  resource: Resource;
  onReport: (resource: Resource) => void;
  onVerify?: (resource: Resource) => void;
}

export function ResourceCard({ resource, onReport, onVerify }: ResourceCardProps) {
  const { userType, userCode, updateResource, verifyResource } = useResourceContext();
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes === 1) return "1 min ago";
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    
    const hours = Math.floor(diffInMinutes / 60);
    if (hours === 1) return "1 hour ago";
    return `${hours} hours ago`;
  };

  const isAvailable = resource.status === "available" || resource.status === "open";
  const isPositiveStatus = resource.status === "available" || resource.status === "open";
  const canUpdate = userType && userCode ? validateUserAction(userType, userCode, "update", resource).allowed : false;
  const canVerify = userType && userCode ? validateUserAction(userType, userCode, "verify", resource).allowed : false;
  const isOwned = userCode ? resource.ownedBy === userCode : false;

  return (
    <Card className={`hover:shadow-md transition-shadow duration-200 border ${
      isOwned ? 'border-maroon bg-red-50' : 'border-gray-200'
    }`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">{resource.name}</h3>
              {isOwned && (
                <Badge variant="outline" className="text-xs border-maroon text-maroon">
                  <User className="h-3 w-3 mr-1" />
                  Your Resource
                </Badge>
              )}
              {resource.verifiedBy && (
                <Badge variant="outline" className="text-xs border-green-600 text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">{resource.type}</p>
            {resource.stallNumber && (
              <p className="text-xs text-gray-400">Stall #{resource.stallNumber}</p>
            )}
          </div>
          <Badge 
            className={`${
              isPositiveStatus 
                ? "bg-pup-green hover:bg-pup-green/90 text-white" 
                : "bg-pup-red hover:bg-pup-red/90 text-white"
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-current mr-1"></div>
            {resource.status === "available" ? "Available" : 
             resource.status === "occupied" ? "Occupied" :
             resource.status === "open" ? "Open" : "Closed"}
          </Badge>
        </div>

        {/* Updated by and verification info */}
        <div className="space-y-1 mb-3">
          <p className="text-xs text-gray-500 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Updated {getTimeAgo(resource.lastUpdated)}
            {resource.updatedBy && ` by ${resource.updatedBy}`}
          </p>
          {resource.verifiedBy && resource.verifiedAt && (
            <p className="text-xs text-green-600 flex items-center">
              <Shield className="h-3 w-3 mr-1" />
              Verified by {resource.verifiedBy} {getTimeAgo(resource.verifiedAt)}
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          {canUpdate && (
            <Button
              size="sm"
              className="bg-maroon hover:bg-gold hover:text-maroon text-white transition-colors duration-200 text-xs flex-1"
              onClick={() => onReport(resource)}
            >
              Update Status
            </Button>
          )}
          {canVerify && onVerify && !resource.verifiedBy && (
            <Button
              size="sm"
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white text-xs flex-1"
              onClick={() => onVerify(resource)}
            >
              <Shield className="h-3 w-3 mr-1" />
              Verify
            </Button>
          )}
          {!canUpdate && !canVerify && (
            <Button
              size="sm"
              variant="outline"
              disabled
              className="text-xs flex-1"
            >
              View Only
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
