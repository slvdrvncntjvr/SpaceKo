import React, { useState, useMemo, useEffect } from "react";
import { Shield, UserPlus } from "lucide-react";
import { Header } from "@/components/Header";
import { AuthModal } from "@/components/AuthModal";
import { SuperAdminModal } from "@/components/SuperAdminModal";
import { CategoryTabs } from "@/components/CategoryTabs";
import { WingSelector } from "@/components/WingSelector";
import { FloorView } from "@/components/FloorView";
import { ResourceCard } from "@/components/ResourceCard";
import { CampusMap } from "@/components/CampusMap";
import { CommunitySpotlight } from "@/components/CommunitySpotlight";
import { ReportModal } from "@/components/ReportModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockResources, mockContributors, mockUsers } from "@/data/newMockData";
import { Resource, Wing, Status, Category, UserType } from "@shared/schema";

type ViewMode = "category" | "wing" | "floor";

export default function Home() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userCode, setUserCode] = useState("");
  const [userType, setUserType] = useState<UserType>("student");
  const [username, setUsername] = useState("");

  // App state
  const [resources, setResources] = useState<Resource[]>(mockResources);
  const [selectedCategory, setSelectedCategory] = useState<Category>("room");
  const [viewMode, setViewMode] = useState<ViewMode>("category");
  const [selectedWing, setSelectedWing] = useState<Wing>("South");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSuperAdminModalOpen, setIsSuperAdminModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | undefined>();

  // Check for saved authentication
  useEffect(() => {
    const savedAuth = localStorage.getItem("spaceko_auth");
    if (savedAuth) {
      const auth = JSON.parse(savedAuth);
      setIsAuthenticated(true);
      setUserCode(auth.userCode);
      setUserType(auth.userType);
      setUsername(auth.username);
    }
  }, []);

  const handleAuthenticate = (code: string, type: UserType, name: string) => {
    setUserCode(code);
    setUserType(type);
    setUsername(name);
    setIsAuthenticated(true);
    
    // Save authentication
    localStorage.setItem("spaceko_auth", JSON.stringify({
      userCode: code,
      userType: type,
      username: name
    }));
  };

  const handleCreateUser = (userData: any) => {
    // In a real app, this would send to backend
    console.log("Created new user:", userData);
    // For demo purposes, show success message or handle as needed
  };

  const filteredResources = useMemo(() => {
    let filtered = resources.filter(resource => resource.category === selectedCategory);
    
    if (selectedCategory === "room" && viewMode === "floor") {
      filtered = filtered.filter(resource => resource.wing === selectedWing);
    }
    
    return filtered;
  }, [resources, selectedCategory, viewMode, selectedWing]);

  const wingStats = useMemo(() => {
    const roomResources = resources.filter(r => r.category === "room");
    const wings: Wing[] = ["North", "South", "East", "West"];
    
    return wings.map(wing => {
      const wingResources = roomResources.filter(r => r.wing === wing);
      const available = wingResources.filter(r => r.status === "available").length;
      return {
        wing,
        total: wingResources.length,
        available
      };
    });
  }, [resources]);

  const handleReport = (resource: Resource) => {
    setSelectedResource(resource);
    setIsReportModalOpen(true);
  };

  const handleReportSubmit = (resourceName: string, status: Status) => {
    setResources(prev => 
      prev.map(resource => 
        resource.name === resourceName 
          ? { ...resource, status, lastUpdated: new Date(), updatedBy: userCode }
          : resource
      )
    );
  };

  const handleVerifyResource = (resource: Resource) => {
    setResources(prev => 
      prev.map(r => 
        r.id === resource.id 
          ? { ...r, verifiedBy: userCode, verifiedAt: new Date() }
          : r
      )
    );
  };

  const handleWingSelect = (wing: Wing) => {
    setSelectedWing(wing);
    setViewMode("floor");
  };

  const handleBackToWings = () => {
    setViewMode("category");
  };

  // Show authentication modal if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-linen">
        <Header />
        <AuthModal
          isOpen={true}
          onAuthenticate={handleAuthenticate}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Category Tabs */}
            <CategoryTabs
              selectedCategory={selectedCategory}
              onCategoryChange={(category) => {
                setSelectedCategory(category);
                setViewMode("category");
              }}
            />

            {/* Content based on category and view mode */}
            {selectedCategory === "room" && viewMode === "category" && (
              <WingSelector
                onWingSelect={handleWingSelect}
                wingStats={wingStats}
              />
            )}

            {selectedCategory === "room" && viewMode === "floor" && (
              <FloorView
                wing={selectedWing}
                resources={filteredResources}
                onBack={handleBackToWings}
                onReport={handleReport}
                userType={userType}
                userCode={userCode}
                onVerify={handleVerifyResource}
              />
            )}

            {(selectedCategory === "hall" || selectedCategory === "lagoon_stall" || selectedCategory === "service") && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredResources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    onReport={handleReport}
                    userType={userType}
                    userCode={userCode}
                    onVerify={handleVerifyResource}
                  />
                ))}
              </div>
            )}

            {/* Campus Map - only show for room category */}
            {selectedCategory === "room" && viewMode === "category" && (
              <div className="mt-8">
                <CampusMap 
                  resources={resources}
                  onRoomClick={handleReport}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* SuperAdmin Panel */}
            {userType === "superadmin" && (
              <Card className="border-maroon border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-maroon flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    SuperAdmin Panel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setIsSuperAdminModalOpen(true)}
                    className="w-full bg-maroon hover:bg-gold hover:text-maroon text-white text-sm"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create User Account
                  </Button>
                  <div className="mt-3 p-3 bg-red-50 rounded-lg">
                    <p className="text-xs text-gray-600">
                      Generate legitimate user codes with detailed information for students, admins, and employees.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* User Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Current User
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Code:</span>
                    <Badge variant="outline" className="text-xs">{userCode}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Name:</span>
                    <span className="text-xs font-medium">{username}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Role:</span>
                    <Badge 
                      className={`text-xs ${
                        userType === "superadmin" ? "bg-maroon text-white" :
                        userType === "admin" ? "bg-red-100 text-red-800" :
                        userType === "student" ? "bg-blue-100 text-blue-800" :
                        userType === "lagoon_employee" ? "bg-green-100 text-green-800" :
                        "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {userType === "superadmin" ? "SuperAdmin" :
                       userType === "admin" ? "Admin" :
                       userType === "student" ? "Student" :
                       userType === "lagoon_employee" ? "Lagoon Staff" :
                       "Office Staff"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <CommunitySpotlight contributors={mockContributors} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              Made with ❤️ for Hackathon 2025
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Polytechnic University of the Philippines - Main Campus
            </p>
          </div>
        </div>
      </footer>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        resources={resources}
        selectedResource={selectedResource}
        onSubmit={handleReportSubmit}
        userType={userType}
        userCode={userCode}
        username={username}
      />

      {/* SuperAdmin Modal */}
      <SuperAdminModal
        isOpen={isSuperAdminModalOpen}
        onClose={() => setIsSuperAdminModalOpen(false)}
        onCreateUser={handleCreateUser}
      />
    </div>
  );
}
