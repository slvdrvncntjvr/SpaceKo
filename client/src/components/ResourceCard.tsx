import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Resource } from "@shared/schema";

interface ResourceCardProps {
  resource: Resource;
  onReport: (resource: Resource) => void;
}

export function ResourceCard({ resource, onReport }: ResourceCardProps) {
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

  const isAvailable = resource.status === "available";

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 border border-gray-200">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{resource.name}</h3>
            <p className="text-sm text-gray-500">{resource.type}</p>
          </div>
          <Badge 
            className={`${
              isAvailable 
                ? "bg-pup-green hover:bg-pup-green/90 text-white" 
                : "bg-pup-red hover:bg-pup-red/90 text-white"
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-current mr-1"></div>
            {isAvailable ? "Available" : "Occupied"}
          </Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Updated {getTimeAgo(resource.lastUpdated)}
          </p>
          <Button
            size="sm"
            className="bg-maroon hover:bg-gold hover:text-maroon text-white transition-colors duration-200 text-xs"
            onClick={() => onReport(resource)}
          >
            Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
