import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { ResourceCard } from "@/components/ResourceCard";
import { CampusMap } from "@/components/CampusMap";
import { CommunitySpotlight } from "@/components/CommunitySpotlight";
import { ReportModal } from "@/components/ReportModal";
import { Button } from "@/components/ui/button";
import { mockResources, mockContributors } from "@/data/mockData";
import { Resource, Wing, Status } from "@shared/schema";

type Filter = "all" | Wing;
type StatusFilter = "all" | Status;

export default function Home() {
  const [resources, setResources] = useState<Resource[]>(mockResources);
  const [selectedWing, setSelectedWing] = useState<Filter>("all");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | undefined>();

  const filteredResources = useMemo(() => {
    return resources.filter(resource => {
      const wingMatch = selectedWing === "all" || resource.wing === selectedWing;
      const statusMatch = selectedStatus === "all" || resource.status === selectedStatus;
      return wingMatch && statusMatch;
    });
  }, [resources, selectedWing, selectedStatus]);

  const handleReport = (resource: Resource) => {
    setSelectedResource(resource);
    setIsReportModalOpen(true);
  };

  const handleReportSubmit = (resourceName: string, status: Status) => {
    setResources(prev => 
      prev.map(resource => 
        resource.name === resourceName 
          ? { ...resource, status, lastUpdated: new Date() }
          : resource
      )
    );
  };

  const wingFilters: { label: string; value: Filter }[] = [
    { label: "All Wings", value: "all" },
    { label: "South Wing", value: "South" },
    { label: "East Wing", value: "East" },
    { label: "West Wing", value: "West" },
    { label: "North Wing", value: "North" }
  ];

  const statusFilters: { label: string; value: StatusFilter }[] = [
    { label: "Available", value: "available" },
    { label: "Occupied", value: "occupied" }
  ];

  return (
    <div className="min-h-screen bg-linen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Filter Section */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {wingFilters.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={selectedWing === filter.value ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setSelectedWing(filter.value)}
                    className={
                      selectedWing === filter.value
                        ? "bg-maroon text-white hover:bg-maroon/90"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {statusFilters.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={selectedStatus === filter.value ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setSelectedStatus(filter.value)}
                    className={
                      selectedStatus === filter.value
                        ? filter.value === "available"
                          ? "bg-pup-green text-white hover:bg-pup-green/90"
                          : "bg-pup-red text-white hover:bg-pup-red/90"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }
                  >
                    <div className={`w-2 h-2 rounded-full mr-1 ${
                      filter.value === "available" ? "bg-pup-green" : "bg-pup-red"
                    }`}></div>
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Resource Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {filteredResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onReport={handleReport}
                />
              ))}
            </div>

            {/* Campus Map */}
            <CampusMap 
              resources={resources}
              onRoomClick={handleReport}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
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
      />
    </div>
  );
}
