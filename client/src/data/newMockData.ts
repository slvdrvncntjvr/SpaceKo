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
          updatedBy: Math.random() > 0.5 ? `user${Math.floor(Math.random() * 100)}` : null,
          verifiedBy: null,
          verifiedAt: null,
          ownedBy: null
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
    updatedBy: Math.random() > 0.5 ? `admin${Math.floor(Math.random() * 10)}` : null,
    verifiedBy: null,
    verifiedAt: null,
    ownedBy: null
  }));
};

// Generate lagoon stall resources
export const generateLagoonStalls = (): Resource[] => {
  const stalls = [
    { name: "Mama's Kitchen", type: "Food Stall", owner: "LAG01-1001" },
    { name: "Coffee Corner", type: "Beverage Stand", owner: "LAG01-1002" },
    { name: "Quick Bites", type: "Snack Bar", owner: "LAG01-1003" },
    { name: "Fresh Fruits", type: "Fruit Stand", owner: "LAG01-1004" },
    { name: "Study Supplies", type: "School Store", owner: "LAG01-1005" },
    { name: "Copy Center", type: "Printing Shop", owner: "LAG01-1006" },
    { name: "Mobile Repair", type: "Tech Service", owner: "LAG01-1007" },
    { name: "Barber Shop", type: "Personal Care", owner: "LAG01-1008" },
    { name: "Mini Grocery", type: "Convenience Store", owner: "LAG01-1009" },
    { name: "Uniform Shop", type: "Clothing Store", owner: "LAG01-1010" },
    { name: "Book Exchange", type: "Bookstore", owner: "LAG01-1011" },
    { name: "Art Supplies", type: "Craft Store", owner: "LAG01-1012" }
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
    updatedBy: stall.owner,
    verifiedBy: null,
    verifiedAt: null,
    ownedBy: stall.owner
  }));
};

// Generate service offices
export const generateServiceOffices = (): Resource[] => {
  const services = [
    { name: "Registrar Office", type: "Academic Service", owner: "OFC01-2001" },
    { name: "Bursar Office", type: "Financial Service", owner: "OFC01-2002" },
    { name: "Medical Clinic", type: "Health Service", owner: "OFC01-2003" },
    { name: "Dental Clinic", type: "Health Service", owner: "OFC01-2004" },
    { name: "Guidance Office", type: "Student Service", owner: "OFC01-2005" },
    { name: "Library Services", type: "Academic Service", owner: "OFC01-2006" },
    { name: "IT Support", type: "Technical Service", owner: "OFC01-2007" },
    { name: "Security Office", type: "Safety Service", owner: "OFC01-2008" },
    { name: "Admission Office", type: "Academic Service", owner: "OFC01-2009" },
    { name: "Student Affairs", type: "Student Service", owner: "OFC01-2010" },
    { name: "Scholarship Office", type: "Financial Service", owner: "OFC01-2011" },
    { name: "Alumni Office", type: "Administrative Service", owner: "OFC01-2012" }
  ];

  return services.map((service, index) => ({
    id: 3000 + index,
    name: service.name,
    type: service.type,
    category: "service" as Category,
    wing: null,
    floor: null,
    room: null,
    status: Math.random() > 0.3 ? "open" : "closed" as Status,
    lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 60) * 60 * 1000),
    updatedBy: service.owner,
    verifiedBy: null,
    verifiedAt: null,
    ownedBy: service.owner
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

// Mock users for testing
export const mockUsers = [
  {
    id: 1,
    userCode: "SUPER-ADMIN",
    username: "SuperAdmin",
    userType: "superadmin" as UserType,
    isActive: true,
    createdAt: new Date(),
    createdBy: null,
    studentId: null,
    grade: null,
    section: null,
    office: null,
    position: null,
    workplace: null,
    employeeId: null
  }
];

// Combine all resources
export const mockResources = [
  ...generateRoomResources(),
  ...generateHallResources(), 
  ...generateLagoonStalls(),
  ...generateServiceOffices()
];