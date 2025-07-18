import React, { useState } from "react";
import { UserPlus, Shield, Users, Briefcase, Store, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserType } from "@shared/schema";

interface SuperAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateUser: (userData: any) => void;
}

export function SuperAdminModal({ isOpen, onClose, onCreateUser }: SuperAdminModalProps) {
  const [selectedUserType, setSelectedUserType] = useState<UserType>("student");
  const [formData, setFormData] = useState({
    username: "",
    studentId: "",
    grade: "",
    section: "",
    office: "",
    position: "",
    workplace: "",
    employeeId: ""
  });
  const [generatedCode, setGeneratedCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generateUserCode = (type: UserType) => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    
    switch (type) {
      case "student":
        return `${year}-${random}`;
      case "admin":
        return `PUP${random.slice(0, 2)}-${random.slice(2)}`;
      case "lagoon_employee":
        return `LAG${random.slice(0, 2)}-${random.slice(2)}`;
      case "office_employee":
        return `OFC${random.slice(0, 2)}-${random.slice(2)}`;
      default:
        return "";
    }
  };

  const handleUserTypeChange = (type: UserType) => {
    setSelectedUserType(type);
    setGeneratedCode(generateUserCode(type));
    setFormData({
      username: "",
      studentId: "",
      grade: "",
      section: "",
      office: "",
      position: "",
      workplace: "",
      employeeId: ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const userData = {
      userCode: generatedCode,
      username: formData.username,
      userType: selectedUserType,
      ...(selectedUserType === "student" && {
        studentId: formData.studentId,
        grade: formData.grade,
        section: formData.section
      }),
      ...(selectedUserType === "admin" && {
        office: formData.office,
        position: formData.position
      }),
      ...(selectedUserType === "lagoon_employee" && {
        workplace: formData.workplace,
        employeeId: formData.employeeId
      }),
      ...(selectedUserType === "office_employee" && {
        workplace: formData.workplace,
        employeeId: formData.employeeId
      })
    };

    // Simulate API call
    setTimeout(() => {
      onCreateUser(userData);
      setIsLoading(false);
      onClose();
      // Reset form
      setFormData({
        username: "",
        studentId: "",
        grade: "",
        section: "",
        office: "",
        position: "",
        workplace: "",
        employeeId: ""
      });
      setGeneratedCode("");
    }, 1000);
  };

  const userTypes = [
    {
      type: "student" as UserType,
      label: "Student",
      icon: Users,
      description: "Can report room availability",
      color: "text-blue-600 bg-blue-50"
    },
    {
      type: "admin" as UserType,
      label: "Admin",
      icon: Shield,
      description: "Can verify all reports",
      color: "text-maroon bg-red-50"
    },
    {
      type: "lagoon_employee" as UserType,
      label: "Lagoon Staff",
      icon: Store,
      description: "Can manage their stall status",
      color: "text-green-600 bg-green-50"
    },
    {
      type: "office_employee" as UserType,
      label: "Office Staff",
      icon: Building,
      description: "Can manage office services",
      color: "text-purple-600 bg-purple-50"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-maroon flex items-center">
            <UserPlus className="mr-2 h-6 w-6" />
            Create New User Account
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Type Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Select User Type
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {userTypes.map((userType) => {
                const Icon = userType.icon;
                const isSelected = selectedUserType === userType.type;
                
                return (
                  <Card
                    key={userType.type}
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected ? "ring-2 ring-maroon bg-red-50" : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleUserTypeChange(userType.type)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5" />
                        <div>
                          <h3 className="font-medium text-sm">{userType.label}</h3>
                          <p className="text-xs text-gray-500 mt-1">{userType.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Generated Code Display */}
          {generatedCode && (
            <Alert>
              <AlertDescription>
                Generated Code: <strong className="text-maroon">{generatedCode}</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Form based on user type */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                Full Name *
              </Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter full name"
                required
              />
            </div>

            {/* Student Fields */}
            {selectedUserType === "student" && (
              <>
                <div>
                  <Label htmlFor="studentId" className="text-sm font-medium text-gray-700">
                    Student ID *
                  </Label>
                  <Input
                    id="studentId"
                    value={formData.studentId}
                    onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                    placeholder="e.g., 2021-12345"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="grade" className="text-sm font-medium text-gray-700">
                      Year Level *
                    </Label>
                    <Select onValueChange={(value) => setFormData(prev => ({ ...prev, grade: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st Year">1st Year</SelectItem>
                        <SelectItem value="2nd Year">2nd Year</SelectItem>
                        <SelectItem value="3rd Year">3rd Year</SelectItem>
                        <SelectItem value="4th Year">4th Year</SelectItem>
                        <SelectItem value="Graduate">Graduate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="section" className="text-sm font-medium text-gray-700">
                      Section
                    </Label>
                    <Input
                      id="section"
                      value={formData.section}
                      onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                      placeholder="e.g., IT-3A"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Admin Fields */}
            {selectedUserType === "admin" && (
              <>
                <div>
                  <Label htmlFor="office" className="text-sm font-medium text-gray-700">
                    Office/Department *
                  </Label>
                  <Input
                    id="office"
                    value={formData.office}
                    onChange={(e) => setFormData(prev => ({ ...prev, office: e.target.value }))}
                    placeholder="e.g., IT Department"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="position" className="text-sm font-medium text-gray-700">
                    Position *
                  </Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="e.g., IT Coordinator"
                    required
                  />
                </div>
              </>
            )}

            {/* Employee Fields */}
            {(selectedUserType === "lagoon_employee" || selectedUserType === "office_employee") && (
              <>
                <div>
                  <Label htmlFor="workplace" className="text-sm font-medium text-gray-700">
                    {selectedUserType === "lagoon_employee" ? "Stall/Business Name" : "Office Name"} *
                  </Label>
                  <Input
                    id="workplace"
                    value={formData.workplace}
                    onChange={(e) => setFormData(prev => ({ ...prev, workplace: e.target.value }))}
                    placeholder={selectedUserType === "lagoon_employee" ? "e.g., Mama's Kitchen" : "e.g., Registrar Office"}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="employeeId" className="text-sm font-medium text-gray-700">
                    Employee ID
                  </Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                    placeholder="Employee identification number"
                  />
                </div>
              </>
            )}

            <div className="flex space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-maroon hover:bg-gold hover:text-maroon text-white transition-colors duration-200"
                disabled={isLoading || !formData.username || !generatedCode}
              >
                {isLoading ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}