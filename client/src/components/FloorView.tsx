import React from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResourceCard } from "./ResourceCard";
import { Resource, Wing } from "@shared/schema";

interface FloorViewProps {
  wing: Wing;
  resources: Resource[];
  onBack: () => void;
  onReport: (resource: Resource) => void;
}

export function FloorView({ wing, resources, onBack, onReport }: FloorViewProps) {
  // Group resources by floor
  const resourcesByFloor = resources.reduce((acc, resource) => {
    const floor = resource.floor || 0;
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(resource);
    return acc;
  }, {} as Record<number, Resource[]>);

  const floors = Object.keys(resourcesByFloor)
    .map(Number)
    .filter(floor => floor > 0)
    .sort((a, b) => a - b);

  const wingEmojis = {
    North: "🧭",
    South: "🌅", 
    East: "🌄",
    West: "🌆"
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Wings</span>
        </Button>
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{wingEmojis[wing]}</span>
          <h2 className="text-2xl font-bold text-gray-900">{wing} Wing</h2>
        </div>
      </div>

      {/* Floors */}
      {floors.map(floor => {
        const floorResources = resourcesByFloor[floor];
        const availableCount = floorResources.filter(r => r.status === "available").length;
        const totalCount = floorResources.length;
        
        return (
          <Card key={floor} className="border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-maroon" />
                  <span>Floor {floor}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {availableCount}/{totalCount} available
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {floorResources.map(resource => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    onReport={onReport}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {floors.length === 0 && (
        <Card className="border border-gray-200">
          <CardContent className="text-center py-12">
            <p className="text-gray-500">No rooms found in {wing} Wing</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}