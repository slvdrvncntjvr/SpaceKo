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
        
        // Assign ownership for some office rooms to demonstrate access control
        const isOffice = type === "Faculty Office";
        const ownedBy = isOffice && Math.random() > 0.7 ? `OFF${Math.floor(Math.random() * 50) + 1}` : null;
        const hasVerification = Math.random() > 0.8;
        
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
          updatedBy: Math.random() > 0.5 ? `STU${Math.floor(Math.random() * 1000) + 1}` : null,
          verifiedBy: hasVerification ? `ADM001` : null,
          verifiedAt: hasVerification ? new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)) : null,
          ownedBy,
          stallNumber: null
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
    ownedBy: null,
    stallNumber: null
  }));
};

// Generate lagoon stall resources (50 stalls)
export const generateLagoonStalls = (): Resource[] => {
  const stallTypes = ["Food Stall", "Beverage Stand", "Snack Bar", "Convenience Store", "School Store", "Printing Shop", "Tech Service", "Personal Care", "Clothing Store", "Bookstore"];
  const stallNames = [
    "Mama's Kitchen", "Coffee Corner", "Quick Bites", "Fresh Fruits", "Study Supplies",
    "Copy Center", "Mobile Repair", "Barber Shop", "Mini Grocery", "Uniform Shop",
    "Book Exchange", "Art Supplies", "Tea House", "Burger Hub", "Noodle Station",
    "Juice Bar", "Sandwich Shop", "Rice Meals", "Pastry Corner", "Ice Cream Stand",
    "Gadget Repair", "Phone Accessories", "Stationery Plus", "Print Express", "Laundry Service",
    "Shoe Repair", "Watch Service", "Eyeglass Shop", "Pharmacy", "Medical Supplies",
    "Fitness Gear", "Sports Equipment", "Music Store", "Guitar Shop", "Art Gallery",
    "Photo Studio", "Travel Agency", "Courier Service", "Money Exchange", "Loading Station",
    "Internet Cafe", "Gaming Lounge", "Tutoring Center", "Language School", "Dance Studio",
    "Yoga Corner", "Massage Therapy", "Beauty Salon", "Nail Spa", "Wellness Center"
  ];

  return Array.from({ length: 50 }, (_, index) => {
    const stallNumber = index + 1;
    const ownerCode = `LAG${String(Math.floor(stallNumber / 10) + 1).padStart(2, '0')}-${String(stallNumber).padStart(4, '0')}`;
    
    return {
      id: 2000 + index,
      name: `Stall ${stallNumber} - ${stallNames[index]}`,
      type: stallTypes[index % stallTypes.length],
      category: "lagoon_stall" as Category,
      wing: null,
      floor: null,
      room: null,
      status: Math.random() > 0.4 ? "open" : "closed" as Status,
      lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 120) * 60 * 1000),
      updatedBy: ownerCode,
      verifiedBy: null,
      verifiedAt: null,
      ownedBy: ownerCode,
      stallNumber: stallNumber
    };
  });
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

  return services.map((service, index) => {
    const hasVerification = Math.random() > 0.6;
    const minutesAgo = Math.floor(Math.random() * 240) + 1;
    
    return {
      id: 3000 + index,
      name: service.name,
      type: service.type,
      category: "service" as Category,
      wing: null,
      floor: null,
      room: null,
      status: Math.random() > 0.3 ? "open" : "closed" as Status,
      lastUpdated: new Date(Date.now() - minutesAgo * 60 * 1000),
      updatedBy: service.owner,
      verifiedBy: hasVerification ? "ADM001" : null,
      verifiedAt: hasVerification ? new Date(Date.now() - Math.floor(Math.random() * 12 * 60 * 60 * 1000)) : null,
      ownedBy: service.owner,
      stallNumber: null
    };
  });
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