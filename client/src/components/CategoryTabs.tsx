import React from "react";
import { Building2, School, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Category } from "@shared/schema";

interface CategoryTabsProps {
  selectedCategory: Category;
  onCategoryChange: (category: Category) => void;
}

export function CategoryTabs({ selectedCategory, onCategoryChange }: CategoryTabsProps) {
  const categories = [
    {
      id: "room" as Category,
      label: "Rooms",
      icon: Building2,
      description: "Classrooms, Labs & Offices"
    },
    {
      id: "hall" as Category,
      label: "Halls",
      icon: School,
      description: "Auditoriums & Special Venues"
    },
    {
      id: "lagoon_stall" as Category,
      label: "Lagoon",
      icon: Store,
      description: "Food Stalls & Services"
    }
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-6">
      {categories.map((category) => {
        const Icon = category.icon;
        const isActive = selectedCategory === category.id;
        
        return (
          <Button
            key={category.id}
            variant={isActive ? "default" : "outline"}
            onClick={() => onCategoryChange(category.id)}
            className={`flex-1 flex items-center space-x-2 h-auto p-4 ${
              isActive 
                ? "bg-maroon text-white hover:bg-maroon/90" 
                : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
            }`}
          >
            <Icon className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">{category.label}</div>
              <div className="text-xs opacity-75">{category.description}</div>
            </div>
          </Button>
        );
      })}
    </div>
  );
}