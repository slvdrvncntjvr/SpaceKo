import React, { useState } from "react";
import { ShieldCheck, UserCheck, Users, Briefcase, Crown, Store, Building, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserType } from "@shared/schema";
import { validateCode, getCodesByUserType } from "@/data/validCodes";

interface AuthModalProps {
  isOpen: boolean;
  onAuthenticate: (userCode: string, userType: UserType, username: string) => void;
}

export function AuthModal({ isOpen, onAuthenticate }: AuthModalProps) {
  const [userCode, setUserCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showValidCodes, setShowValidCodes] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!userCode.trim()) {
      setError("Please enter your access code");
      setIsLoading(false);
      return;
    }

    const validCodeData = validateCode(userCode);
    if (!validCodeData) {
      setError("Invalid access code. Please check your code and try again.");
      setIsLoading(false);
      return;
    }

    // Simulate authentication delay
    setTimeout(() => {
      onAuthenticate(userCode, validCodeData.userType, validCodeData.username);
      setIsLoading(false);
    }, 1000);
  };

  const getCodeExample = (type: UserType) => {
    const codes = getCodesByUserType(type);
    return codes.length > 0 ? codes[0].code : "No codes available";
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
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-maroon" />
            SpaceKo Authentication
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userCode">Access Code</Label>
            <Input
              id="userCode"
              type="text"
              placeholder="Enter your access code"
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              className="font-mono"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full bg-maroon hover:bg-gold hover:text-maroon"
            disabled={isLoading}
          >
            {isLoading ? "Authenticating..." : "Access SpaceKo"}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">Valid Access Codes:</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowValidCodes(!showValidCodes)}
              className="text-xs"
            >
              {showValidCodes ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
              {showValidCodes ? "Hide" : "Show"} Codes
            </Button>
          </div>

          {showValidCodes && (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {codeTypes.map(({ type, icon: Icon, title, color }) => {
                const codes = getCodesByUserType(type);
                return (
                  <Card key={type} className={`${color} border`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Icon className="h-4 w-4" />
                        {title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 gap-1 text-xs">
                        {codes.slice(0, 3).map((code) => (
                          <div key={code.code} className="flex items-center justify-between">
                            <code className="font-mono bg-white px-2 py-1 rounded">{code.code}</code>
                            <span className="text-gray-600 ml-2">{code.username}</span>
                          </div>
                        ))}
                        {codes.length > 3 && (
                          <div className="text-gray-500 text-center">
                            +{codes.length - 3} more codes available
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}