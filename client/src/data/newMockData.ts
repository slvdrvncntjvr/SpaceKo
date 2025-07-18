import { Resource, Contributor, Wing, Status, RoomType, Category, UserType } from "@shared/schema";

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

// Generate room resources for all wings and floors (S506 format)
export const generateRoomResources = (): Resource[] => {
  const resources: Resource[] = [];
  let id = 1;

  wings.forEach(wing => {
    // Each wing has 1-6 floors
    const maxFloors = 6;
    
    for (let floor = 1; floor <= maxFloors; floor++) {
      // Each floor has rooms 01-20
      for (let roomNum = 1; roomNum <= 20; roomNum++) {
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
          category: "room",
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

// Generate hall resources (special locations)
export const generateHallResources = (): Resource[] => {
  const halls = [
    { name: "Claro M. Recto Hall", type: "Auditorium" },
    { name: "Ninoy Aquino Hall", type: "Conference Hall" },
    { name: "Jose Rizal Hall", type: "Academic Hall" },
    { name: "Andres Bonifacio Hall", type: "Student Center" },
    { name: "Apolinario Mabini Hall", type: "Library Hall" },
    { name: "Manuel L. Quezon Hall", type: "Administrative Hall" },
    { name: "Emilio Aguinaldo Hall", type: "Ceremonial Hall" },
    { name: "Juan Luna Hall", type: "Arts Hall" }
  ];

  return halls.map((hall, index) => ({
    id: 1000 + index,
    name: hall.name,
    type: hall.type,
    category: "hall" as Category,
    wing: null,
    floor: null,
    room: null,
    status: Math.random() > 0.2 ? "available" : "occupied" as Status,
    lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 60) * 60 * 1000),
    updatedBy: Math.random() > 0.5 ? `admin${Math.floor(Math.random() * 10)}` : null
  }));
};

// Generate lagoon stall resources
export const generateLagoonStalls = (): Resource[] => {
  const stalls = [
    { name: "Mama's Kitchen", type: "Food Stall" },
    { name: "Coffee Corner", type: "Beverage Stand" },
    { name: "Quick Bites", type: "Snack Bar" },
    { name: "Fresh Fruits", type: "Fruit Stand" },
    { name: "Study Supplies", type: "School Store" },
    { name: "Copy Center", type: "Printing Shop" },
    { name: "Mobile Repair", type: "Tech Service" },
    { name: "Barber Shop", type: "Personal Care" },
    { name: "Mini Grocery", type: "Convenience Store" },
    { name: "Uniform Shop", type: "Clothing Store" },
    { name: "Book Exchange", type: "Bookstore" },
    { name: "Art Supplies", type: "Craft Store" }
  ];

  return stalls.map((stall, index) => ({
    id: 2000 + index,
    name: stall.name,
    type: stall.type,
    category: "lagoon_stall" as Category,
    wing: null,
    floor: null,
    room: null,
    status: Math.random() > 0.4 ? "open" : "closed" as Status,
    lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 120) * 60 * 1000),
    updatedBy: Math.random() > 0.3 ? `emp${Math.floor(Math.random() * 20)}` : null
  }));
};

export const mockContributors: Contributor[] = [
  {
    id: 1,
    username: "JuanDLC",
    userCode: "2023-1234",
    userType: "student",
    updateCount: 8,
    lastActive: new Date(Date.now() - 10 * 60 * 1000)
  },
  {
    id: 2,
    username: "Iskolar08", 
    userCode: "2024-5678",
    userType: "student",
    updateCount: 6,
    lastActive: new Date(Date.now() - 15 * 60 * 1000)
  },
  {
    id: 3,
    username: "AdminMary",
    userCode: "PUP01-9999",
    userType: "admin",
    updateCount: 12,
    lastActive: new Date(Date.now() - 5 * 60 * 1000)
  },
  {
    id: 4,
    username: "TechSupport",
    userCode: "EMP01-1111",
    userType: "employee",
    updateCount: 15,
    lastActive: new Date(Date.now() - 20 * 60 * 1000)
  }
];

// Combine all resources
export const mockResources = [
  ...generateRoomResources(),
  ...generateHallResources(), 
  ...generateLagoonStalls()
];