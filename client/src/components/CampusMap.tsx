import { Building, MapPin, Users, Coffee, Heart, Shield } from "lucide-react";
import { Resource, Wing } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CampusMapProps {
  resources: Resource[];
  onRoomClick?: (resource: Resource) => void;
}

export function CampusMap({ resources, onRoomClick }: CampusMapProps) {
  const getWingResources = (wing: Wing) => {
    return resources.filter(r => r.wing === wing);
  };

  const getServiceResources = () => {
    return resources.filter(r => r.category === "service");
  };

  const getLagoonResources = () => {
    return resources.filter(r => r.category === "lagoon_stall");
  };

  const getHallResources = () => {
    return resources.filter(r => r.category === "hall");
  };

  const getWingStats = (wing: Wing) => {
    const wingResources = getWingResources(wing);
    const available = wingResources.filter(r => r.status === "available").length;
    const total = wingResources.length;
    return { available, total, percentage: total > 0 ? (available / total) * 100 : 0 };
  };

  const renderWingSection = (wing: Wing, position: string) => {
    const stats = getWingStats(wing);
    const isAvailable = stats.percentage > 50;
    
    return (
      <div className={`absolute ${position}`}>
        <div 
          className={`bg-white rounded-lg shadow-sm p-3 border-2 cursor-pointer hover:shadow-md transition-all duration-200 ${
            isAvailable ? "border-pup-green" : "border-pup-red"
          }`}
          onClick={() => {
            const wingResources = getWingResources(wing);
            if (onRoomClick && wingResources.length > 0) {
              onRoomClick(wingResources[0]);
            }
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Building className="h-4 w-4 text-maroon" />
            <h3 className="text-sm font-semibold text-maroon">{wing} Wing</h3>
          </div>
          <div className="text-xs text-gray-600">
            <div className="flex items-center justify-between">
              <span>Available:</span>
              <span className={`font-bold ${isAvailable ? "text-pup-green" : "text-pup-red"}`}>
                {stats.available}/{stats.total}
              </span>
            </div>
            <div className="mt-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isAvailable ? "bg-pup-green" : "bg-pup-red"
                  }`}
                  style={{ width: `${stats.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const serviceResources = getServiceResources();
  const lagoonResources = getLagoonResources();
  const hallResources = getHallResources();

  return (
    <div className="space-y-6">
      {/* Campus Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-maroon" />
            PUP Main Campus Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative bg-gradient-to-b from-blue-50 to-green-50 rounded-lg p-8 min-h-96">
            {/* Central Campus Circle */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-maroon text-white rounded-full p-6 shadow-lg">
                <Building className="h-8 w-8" />
              </div>
              <div className="text-center mt-2">
                <h3 className="text-sm font-bold text-maroon">PUP Main</h3>
                <p className="text-xs text-gray-600">Academic Buildings</p>
              </div>
            </div>

            {/* Wing Sections */}
            {renderWingSection("North", "top-4 left-1/2 transform -translate-x-1/2")}
            {renderWingSection("South", "bottom-4 left-1/2 transform -translate-x-1/2")}
            {renderWingSection("East", "right-4 top-1/2 transform -translate-y-1/2")}
            {renderWingSection("West", "left-4 top-1/2 transform -translate-y-1/2")}

            {/* Lagoon Area */}
            <div className="absolute bottom-4 right-4">
              <div className="bg-white rounded-lg shadow-sm p-3 border-2 border-orange-400">
                <div className="flex items-center gap-2 mb-2">
                  <Coffee className="h-4 w-4 text-orange-600" />
                  <h3 className="text-sm font-semibold text-orange-600">Lagoon</h3>
                </div>
                <div className="text-xs text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Open Stalls:</span>
                    <span className="font-bold text-orange-600">
                      {lagoonResources.filter(r => r.status === "open").length}/{lagoonResources.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Area */}
            <div className="absolute top-4 right-4">
              <div className="bg-white rounded-lg shadow-sm p-3 border-2 border-purple-400">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-purple-600" />
                  <h3 className="text-sm font-semibold text-purple-600">Services</h3>
                </div>
                <div className="text-xs text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Open Offices:</span>
                    <span className="font-bold text-purple-600">
                      {serviceResources.filter(r => r.status === "open").length}/{serviceResources.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">Academic Halls</h3>
                <p className="text-sm text-blue-600">{hallResources.length} major halls</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {hallResources.filter(r => r.status === "available").length} Available
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-orange-900">Lagoon Stalls</h3>
                <p className="text-sm text-orange-600">{lagoonResources.length} food & services</p>
              </div>
              <Coffee className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {lagoonResources.filter(r => r.status === "open").length} Open
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-purple-900">Student Services</h3>
                <p className="text-sm text-purple-600">{serviceResources.length} offices</p>
              </div>
              <Heart className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {serviceResources.filter(r => r.status === "open").length} Open
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
