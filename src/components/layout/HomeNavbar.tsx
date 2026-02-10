import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { 
  Menu, 
  X, 
  ArrowRight,
  Satellite
} from "lucide-react";

export function HomeNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity cursor-pointer">
            <img 
              src="/logo.png" 
              alt="STARHAWK - Agricultural Insurance Platform" 
              className="h-12 w-auto"
            />
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            <NavigationMenu>
              <NavigationMenuList className="gap-2">
                <NavigationMenuItem>
                  <Link 
                    to="/" 
                    className={`px-4 py-2.5 text-base ${
                      location.pathname === '/' 
                        ? 'text-[rgba(20,40,75,1)] underline underline-offset-4' 
                        : 'text-gray-800 rounded-lg'
                    }`}
                  >
                    Home
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link 
                    to="/services" 
                    className={`px-4 py-2.5 text-base font-medium ${
                      location.pathname === '/services' 
                        ? 'text-[rgba(20,40,75,1)] underline underline-offset-4' 
                        : 'text-gray-700 rounded-lg'
                    }`}
                  >
                    Services
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link 
                    to="/team" 
                    className={`px-4 py-2.5 text-base font-medium ${
                      location.pathname === '/team' 
                        ? 'text-[rgba(20,40,75,1)] underline underline-offset-4' 
                        : 'text-gray-700 rounded-lg'
                    }`}
                  >
                    Team
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Button 
              className="bg-[rgba(20,40,75,1)] hover:bg-[rgba(15,30,56,1)] text-white rounded-full px-6 py-2 shadow-sm hover:shadow-md transition-all duration-300 text-sm font-medium"
              onClick={() => navigate("/role-selection")}
            >
              Get Started
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-gray-800 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              <Link
                to="/"
                className={`block px-4 py-2.5 text-base ${
                  location.pathname === '/' 
                    ? 'text-[rgba(20,40,75,1)] underline underline-offset-4' 
                    : 'text-gray-800 rounded-lg'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/services"
                className={`block px-4 py-2.5 text-base font-medium ${
                  location.pathname === '/services' 
                    ? 'text-[rgba(20,40,75,1)] underline underline-offset-4' 
                    : 'text-gray-700 rounded-lg'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Services
              </Link>
              <Link
                to="/team"
                className={`block px-4 py-2.5 text-base font-medium ${
                  location.pathname === '/team' 
                    ? 'text-[rgba(20,40,75,1)] underline underline-offset-4' 
                    : 'text-gray-700 rounded-lg'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Team
              </Link>
              <div className="px-3 pt-3 border-t border-gray-200">
                <Button 
                  className="w-full bg-[rgba(20,40,75,1)] hover:bg-[rgba(15,30,56,1)] text-white rounded-full text-sm font-medium"
                  onClick={() => {
                    navigate("/role-selection");
                    setIsMenuOpen(false);
                  }}
                >
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
