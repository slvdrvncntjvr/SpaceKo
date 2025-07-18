import { useState } from "react";
import { MapPin, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Home", href: "#", active: true },
    { name: "About", href: "#", active: false },
    { name: "Report", href: "#", active: false },
    { name: "Map", href: "#", active: false }
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <MapPin className="text-maroon text-2xl mr-3 h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold text-maroon">SpaceKo</h1>
                <p className="text-xs text-gray-600 hidden sm:block">
                  Empowering PUPians with Real-Time Space Visibility
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  item.active
                    ? "text-maroon"
                    : "text-gray-600 hover:text-maroon"
                }`}
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-maroon hover:text-gold">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-maroon">Menu</h2>
                </div>
                <nav className="space-y-2">
                  {navItems.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                        item.active
                          ? "text-maroon bg-gold bg-opacity-10"
                          : "text-gray-600 hover:text-maroon hover:bg-gray-50"
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.name}
                    </a>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
