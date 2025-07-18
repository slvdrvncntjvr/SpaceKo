import { UserType } from "@shared/schema";

export interface ValidCode {
  code: string;
  userType: UserType;
  username: string;
  description: string;
  assignedResources?: string[];
}

export const validCodes: ValidCode[] = [
  // SuperAdmin
  {
    code: "SUPER-ADMIN",
    userType: "superadmin",
    username: "Admin Master",
    description: "Full system access"
  },

  // Students (2024-XXXX format)
  {
    code: "2024-1001",
    userType: "student",
    username: "Juan Dela Cruz",
    description: "BSIT Student"
  },
  {
    code: "2024-1002",
    userType: "student",
    username: "Maria Santos",
    description: "BSCS Student"
  },
  {
    code: "2024-1003",
    userType: "student",
    username: "Jose Rizal",
    description: "BSBA Student"
  },
  {
    code: "2023-2001",
    userType: "student",
    username: "Andres Bonifacio",
    description: "BSEE Student"
  },
  {
    code: "2023-2002",
    userType: "student",
    username: "Emilio Aguinaldo",
    description: "BSCE Student"
  },

  // Admins (PUP01-XXXX format)
  {
    code: "PUP01-9001",
    userType: "admin",
    username: "Director Lopez",
    description: "Academic Affairs Director"
  },
  {
    code: "PUP01-9002",
    userType: "admin",
    username: "Dean Martinez",
    description: "Engineering Dean"
  },
  {
    code: "PUP01-9003",
    userType: "admin",
    username: "Dr. Reyes",
    description: "IT Department Head"
  },

  // Lagoon Employees (LAG01-XXXX format with stall assignments)
  {
    code: "LAG01-1001",
    userType: "lagoon_employee",
    username: "Aling Rosa",
    description: "Stall 1 Owner",
    assignedResources: ["Stall 1 - Mama's Kitchen"]
  },
  {
    code: "LAG01-1002",
    userType: "lagoon_employee",
    username: "Kuya Ben",
    description: "Stall 2 Owner",
    assignedResources: ["Stall 2 - Coffee Corner"]
  },
  {
    code: "LAG01-1003",
    userType: "lagoon_employee",
    username: "Ate Luz",
    description: "Stall 3 Owner",
    assignedResources: ["Stall 3 - Quick Bites"]
  },
  {
    code: "LAG01-1004",
    userType: "lagoon_employee",
    username: "Mang Eddie",
    description: "Stall 4 Owner",
    assignedResources: ["Stall 4 - Fresh Fruits"]
  },
  {
    code: "LAG01-1005",
    userType: "lagoon_employee",
    username: "Tita Amy",
    description: "Stall 5 Owner",
    assignedResources: ["Stall 5 - Study Supplies"]
  },
  {
    code: "LAG01-1010",
    userType: "lagoon_employee",
    username: "Sir Jun",
    description: "Stall 10 Owner",
    assignedResources: ["Stall 10 - Uniform Shop"]
  },
  {
    code: "LAG01-1015",
    userType: "lagoon_employee",
    username: "Ate Grace",
    description: "Stall 15 Owner",
    assignedResources: ["Stall 15 - Noodle Station"]
  },
  {
    code: "LAG01-1020",
    userType: "lagoon_employee",
    username: "Kuya Mark",
    description: "Stall 20 Owner",
    assignedResources: ["Stall 20 - Ice Cream Stand"]
  },
  {
    code: "LAG01-1025",
    userType: "lagoon_employee",
    username: "Manang Cora",
    description: "Stall 25 Owner",
    assignedResources: ["Stall 25 - Laundry Service"]
  },
  {
    code: "LAG01-1030",
    userType: "lagoon_employee",
    username: "Tatay Romy",
    description: "Stall 30 Owner",
    assignedResources: ["Stall 30 - Medical Supplies"]
  },

  // Office Employees (OFC01-XXXX format with office assignments)
  {
    code: "OFC01-2001",
    userType: "office_employee",
    username: "Ms. Patricia Cruz",
    description: "Registrar Staff",
    assignedResources: ["Registrar Office"]
  },
  {
    code: "OFC01-2002",
    userType: "office_employee",
    username: "Mr. Carlos Mendoza",
    description: "Bursar Staff",
    assignedResources: ["Bursar Office"]
  },
  {
    code: "OFC01-2003",
    userType: "office_employee",
    username: "Nurse Anna Silva",
    description: "Medical Staff",
    assignedResources: ["Medical Clinic"]
  },
  {
    code: "OFC01-2004",
    userType: "office_employee",
    username: "Dr. Michael Torres",
    description: "Dental Staff",
    assignedResources: ["Dental Clinic"]
  },
  {
    code: "OFC01-2005",
    userType: "office_employee",
    username: "Ms. Lisa Garcia",
    description: "Guidance Counselor",
    assignedResources: ["Guidance Office"]
  },
  {
    code: "OFC01-2006",
    userType: "office_employee",
    username: "Librarian Pablo",
    description: "Library Staff",
    assignedResources: ["Library Services"]
  },
  {
    code: "OFC01-2007",
    userType: "office_employee",
    username: "IT Support Dave",
    description: "IT Technician",
    assignedResources: ["IT Support"]
  },
  {
    code: "OFC01-2008",
    userType: "office_employee",
    username: "Guard Captain Jose",
    description: "Security Chief",
    assignedResources: ["Security Office"]
  },
  {
    code: "OFC01-2009",
    userType: "office_employee",
    username: "Ms. Sarah Lim",
    description: "Admission Officer",
    assignedResources: ["Admission Office"]
  },
  {
    code: "OFC01-2010",
    userType: "office_employee",
    username: "Mr. Ryan Dela Rosa",
    description: "Student Affairs Officer",
    assignedResources: ["Student Affairs"]
  }
];

export function validateCode(code: string): ValidCode | null {
  return validCodes.find(valid => valid.code === code) || null;
}

export function getCodesByUserType(userType: UserType): ValidCode[] {
  return validCodes.filter(valid => valid.userType === userType);
}