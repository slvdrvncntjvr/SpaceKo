import React, { useState } from "react";
import { ShieldCheck, UserCheck, Users, Briefcase, Crown, Store, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserType } from "@shared/schema";

interface AuthModalProps {
  isOpen: boolean;
  onAuthenticate: (userCode: string, userType: UserType, username: string) => void;
}

export function AuthModal({ isOpen, onAuthenticate }: AuthModalProps) {
  const [userCode, setUserCode] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getUserType = (code: string): UserType | null => {
    if (code === "SUPER-ADMIN") return "superadmin";
    if (/^20\d{2}-\d{4}$/.test(code)) return "student";
    if (/^PUP\d{2}-\d{4}$/.test(code)) return "admin";
    if (/^LAG\d{2}-\d{4}$/.test(code)) return "lagoon_employee";
    if (/^OFC\d{2}-\d{4}$/.test(code)) return "office_employee";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!userCode.trim() || !username.trim()) {
      setError("Please enter both code and username");
      setIsLoading(false);
      return;
    }

    const userType = getUserType(userCode);
    if (!userType) {
      setError("Invalid code format. Please check your code and try again.");
      setIsLoading(false);
      return;
    }

    // Simulate authentication delay
    setTimeout(() => {
      onAuthenticate(userCode, userType, username);
      setIsLoading(false);
    }, 1000);
  };

  const getCodeExample = (type: UserType) => {
    switch (type) {
      case "superadmin": return "SUPER-ADMIN";
      case "student": return "2024-1234";
      case "admin": return "PUP01-5678";
      case "lagoon_employee": return "LAG01-1001";
      case "office_employee": return "OFC01-2001";
    }
  };

  const codeTypes = [
    {
      type: "superadmin" as UserType,
      icon: Crown,
      title: "SuperAdmin",
      description: "Special access code",
      example: getCodeExample("superadmin"),
      color: "text-maroon bg-red-100 border-maroon"
    },
    {
      type: "student" as UserType,
      icon: Users,
      title: "Student",
      description: "Format: 20XX-XXXX",
      example: getCodeExample("student"),
      color: "text-blue-600 bg-blue-50"
    },
    {
      type: "admin" as UserType,
      icon: ShieldCheck,
      title: "Admin",
      description: "Format: PUPXX-XXXX",
      example: getCodeExample("admin"),
      color: "text-red-700 bg-red-50"
    },
    {
      type: "lagoon_employee" as UserType,
      icon: Store,
      title: "Lagoon Staff",
      description: "Format: LAGXX-XXXX",
      example: getCodeExample("lagoon_employee"),
      color: "text-green-600 bg-green-50"
    },
    {
      type: "office_employee" as UserType,
      icon: Building,
      title: "Office Staff",
      description: "Format: OFCXX-XXXX",
      example: getCodeExample("office_employee"),
      color: "text-purple-600 bg-purple-50"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-maroon flex items-center">
            <UserCheck className="mr-2 h-6 w-6" />
            Welcome to SpaceKo
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              Enter your authorized access code to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="userCode" className="text-sm font-medium text-gray-700">
                Access Code
              </Label>
              <Input
                id="userCode"
                value={userCode}
                onChange={(e) => setUserCode(e.target.value.toUpperCase())}
                placeholder="Enter your code (e.g., 2024-1234)"
                className="mt-1"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                Display Name
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                className="mt-1"
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full bg-maroon hover:bg-gold hover:text-maroon text-white transition-colors duration-200"
              disabled={isLoading}
            >
              {isLoading ? "Authenticating..." : "Enter SpaceKo"}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Authentication helps reduce spam and maintain data quality
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}