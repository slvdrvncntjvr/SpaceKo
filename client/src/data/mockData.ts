import { Resource, Contributor, Wing, Status, RoomType } from "@shared/schema";

const roomTypes: RoomType[] = [
  "Computer Lab",
  "Lecture Hall", 
  "Study Area",
  "Library",
  "Conference Room",
  "Research Lab",
  "Classroom",
  "Faculty Office"
];

const wings: Wing[] = ["South", "North", "East", "West"];

// Generate mock resources for all wings and floors
export const generateMockResources = (): Resource[] => {
  const resources: Resource[] = [];
  let id = 1;

  wings.forEach(wing => {
    // Each wing has 1-6 floors
    const maxFloors = wing === "West" ? 3 : 6; // West wing has fewer floors
    
    for (let floor = 1; floor <= maxFloors; floor++) {
      // Each floor has rooms 01-20, but not all are always present
      const roomCount = Math.floor(Math.random() * 8) + 8; // 8-15 rooms per floor
      
      for (let roomNum = 1; roomNum <= roomCount; roomNum++) {
        const roomCode = roomNum.toString().padStart(2, '0');
        const name = `${wing.charAt(0)}${floor}${roomCode}`;
        const type = roomTypes[Math.floor(Math.random() * roomTypes.length)];
        const status: Status = Math.random() > 0.3 ? "available" : "occupied";
        const minutesAgo = Math.floor(Math.random() * 30) + 1;
        const lastUpdated = new Date(Date.now() - minutesAgo * 60 * 1000);
        
        resources.push({
          id,
          name,
          type,
          wing,
          floor,
          room: roomCode,
          status,
          lastUpdated,
          updatedBy: Math.random() > 0.5 ? `user${Math.floor(Math.random() * 100)}` : null
        });
        
        id++;
      }
    }
  });

  return resources;
};

export const mockContributors: Contributor[] = [
  {
    id: 1,
    username: "JuanDLC",
    updateCount: 5,
    lastActive: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
  },
  {
    id: 2,
    username: "Iskolar08", 
    updateCount: 4,
    lastActive: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
  },
  {
    id: 3,
    username: "MaryRose",
    updateCount: 3,
    lastActive: new Date(Date.now() - 20 * 60 * 1000) // 20 minutes ago
  },
  {
    id: 4,
    username: "TechNinja",
    updateCount: 2,
    lastActive: new Date(Date.now() - 25 * 60 * 1000) // 25 minutes ago
  }
];

export const mockResources = generateMockResources();
