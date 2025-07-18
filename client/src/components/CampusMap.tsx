import { Star } from "lucide-react";
import { Resource, Wing } from "@shared/schema";

interface CampusMapProps {
  resources: Resource[];
  onRoomClick?: (resource: Resource) => void;
}

export function CampusMap({ resources, onRoomClick }: CampusMapProps) {
  const getWingResources = (wing: Wing) => {
    return resources.filter(r => r.wing === wing);
  };

  const getFloorResources = (wing: Wing, floor: number) => {
    return resources.filter(r => r.wing === wing && r.floor === floor);
  };

  const renderWingSection = (wing: Wing, position: string) => {
    const wingResources = getWingResources(wing);
    const floors = [...new Set(wingResources.map(r => r.floor))].sort((a, b) => a - b);
    
    return (
      <div className={`absolute ${position}`}>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-maroon mb-2">{wing} Wing</h3>
          <div className="grid grid-cols-3 gap-2">
            {floors.slice(0, 6).map(floor => {
              const floorResources = getFloorResources(wing, floor);
              const availableCount = floorResources.filter(r => r.status === "available").length;
              const totalCount = floorResources.length;
              const isAvailable = availableCount > totalCount / 2;
              
              return (
                <div
                  key={floor}
                  className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-200 ${
                    isAvailable ? "bg-pup-green" : "bg-pup-red"
                  }`}
                  onClick={() => {
                    if (onRoomClick && floorResources.length > 0) {
                      onRoomClick(floorResources[0]);
                    }
                  }}
                  title={`${wing} Wing Floor ${floor}: ${availableCount}/${totalCount} available`}
                >
                  <span className="text-xs font-bold text-white">
                    {wing.charAt(0)}{floor}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Campus Map</h2>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-pup-green rounded-full mr-2"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-pup-red rounded-full mr-2"></div>
            <span>Occupied</span>
          </div>
        </div>
      </div>
      
      <div className="relative bg-gray-50 rounded-lg p-8 min-h-96">
        {/* Central PUP Logo */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-20 h-20 bg-gradient-to-br from-maroon to-red-800 rounded-full flex items-center justify-center border-4 border-gold shadow-lg">
            <Star className="text-gold text-3xl h-10 w-10 fill-current" />
          </div>
          <p className="text-xs text-center mt-2 font-bold text-maroon">PUP Main</p>
          <p className="text-xs text-center text-gray-600">Building Complex</p>
        </div>
        
        {/* North Wing */}
        {renderWingSection("North", "top-8 left-1/2 transform -translate-x-1/2")}
        
        {/* South Wing */}
        {renderWingSection("South", "bottom-8 left-1/2 transform -translate-x-1/2")}
        
        {/* East Wing */}
        {renderWingSection("East", "right-8 top-1/2 transform -translate-y-1/2")}
        
        {/* West Wing */}
        {renderWingSection("West", "left-8 top-1/2 transform -translate-y-1/2")}
      </div>
    </div>
  );
}
