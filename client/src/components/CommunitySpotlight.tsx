import { Users, Edit, Crown, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Contributor } from "@shared/schema";

interface CommunitySpotlightProps {
  contributors: Contributor[];
}

export function CommunitySpotlight({ contributors }: CommunitySpotlightProps) {
  const getInitials = (username: string) => {
    return username.length >= 2 ? username.substring(0, 2).toUpperCase() : username.toUpperCase();
  };

  const topContributors = contributors
    .sort((a, b) => b.updateCount - a.updateCount)
    .slice(0, 3);

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
          <Users className="text-maroon mr-2 h-5 w-5" />
          Community Spotlight
        </CardTitle>
        <p className="text-sm text-gray-600">Top contributors today</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {topContributors.map((contributor, index) => (
          <div
            key={contributor.id}
            className={`flex items-center space-x-3 p-3 rounded-lg ${
              index === 0 ? "bg-gold bg-opacity-10" : "bg-gray-50"
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              index === 0 ? "bg-maroon" : "bg-gray-600"
            }`}>
              <span className="text-white font-semibold text-sm">
                {getInitials(contributor.username)}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{contributor.username}</p>
              <p className="text-xs text-gray-500 flex items-center">
                <Edit className="h-3 w-3 mr-1" />
                {contributor.updateCount} updates
              </p>
            </div>
            {index === 0 && (
              <div className="text-gold">
                <Crown className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        
        <div className="mt-6 p-4 bg-linen rounded-lg">
          <p className="text-sm text-center text-gray-600 flex items-center justify-center">
            <Heart className="text-maroon mr-1 h-4 w-4" />
            Thanks for keeping our community informed!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
