import React from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wing } from "@shared/schema";

interface WingSelectorProps {
  onWingSelect: (wing: Wing) => void;
  wingStats: { wing: Wing; total: number; available: number }[];
}

export function WingSelector({ onWingSelect, wingStats }: WingSelectorProps) {
  const wingColors = {
    North: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    South: "bg-green-50 border-green-200 hover:bg-green-100", 
    East: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100",
    West: "bg-purple-50 border-purple-200 hover:bg-purple-100"
  };

  const wingIcons = {
    North: "🧭",
    South: "🌅", 
    East: "🌄",
    West: "🌆"
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {wingStats.map((stat) => {
        const availabilityRate = stat.total > 0 ? Math.round((stat.available / stat.total) * 100) : 0;
        
        return (
          <Card 
            key={stat.wing}
            className={`cursor-pointer transition-all duration-200 ${wingColors[stat.wing]}`}
            onClick={() => onWingSelect(stat.wing)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{wingIcons[stat.wing]}</span>
                  <h3 className="font-semibold text-gray-900">{stat.wing} Wing</h3>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Available</span>
                  <span className="font-medium text-pup-green">{stat.available}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Rooms</span>
                  <span className="font-medium">{stat.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-pup-green h-2 rounded-full transition-all duration-300"
                    style={{ width: `${availabilityRate}%` }}
                  ></div>
                </div>
                <p className="text-xs text-center text-gray-500">
                  {availabilityRate}% available
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}