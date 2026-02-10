import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Menu, 
  X, 
  Phone, 
  Mail, 
  MapPin,
  Shield,
  Users,
  Briefcase,
  FileText,
  MessageCircle,
  ArrowRight,
  ChevronDown
} from "lucide-react";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const services = [
    {
      title: "Risk Assessment",
      description: "AI-powered risk evaluation using satellite imagery and drone data",
      icon: Shield,
      href: "/services/risk-assessment"
    },
    {
      title: "Claims Processing",
      description: "Automated claims processing with real-time damage assessment",
      icon: FileText,
      href: "/services/claims"
    },
    {
      title: "Crop Monitoring",
      description: "4-stage continuous crop surveillance and health monitoring",
      icon: Users,
      href: "/services/monitoring"
    },
    {
      title: "Policy Management",
      description: "Comprehensive policy creation and management tools",
      icon: Briefcase,
      href: "/services/policies"
    }
  ];

  const teamMembers = [
    {
      name: "Victor Muragwa",
      role: "Chief Executive Officer",
      expertise: "Strategic Leadership & Vision"
    },
    {
      name: "Gad Kalisa",
      role: "Software Engineer & Product Designer",
      expertise: "Full-Stack Development & UX Design"
    }
  ];

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img 
              src="/logo.png" 
              alt="STARHAWK - Agricultural Insurance Platform" 
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link to="/" className="px-4 py-2.5 text-base font-medium text-gray-600">
                    Home
                  </Link>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-base font-medium text-gray-600">
                    Services
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-6 w-[500px] bg-white border border-gray-100 rounded-xl shadow-lg">
                      {services.map((service) => {
                        const Icon = service.icon;
                        return (
                          <NavigationMenuLink key={service.title} asChild>
                            <Link
                              to={service.href}
                              className="block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none"
                            >
                              <div className="flex items-center gap-3">
                                <Icon className="h-5 w-5 text-gray-600" />
                                <div>
                                  <div className="text-sm font-medium leading-none text-gray-900">{service.title}</div>
                                  <p className="line-clamp-2 text-sm leading-snug text-gray-500 mt-1">
                                    {service.description}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        );
                      })}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-base font-medium text-gray-600">
                    Team
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-6 w-[400px] bg-white border border-gray-100 rounded-xl shadow-lg">
                      <div className="text-sm font-medium mb-2 text-gray-900">Our Expert Team</div>
                      {teamMembers.map((member, index) => (
                        <NavigationMenuLink key={index} asChild>
                          <div className="block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none">
                            <div className="text-sm font-medium leading-none text-gray-900">{member.name}</div>
                            <p className="text-sm text-gray-500">{member.role}</p>
                            <p className="text-xs text-gray-600">{member.expertise}</p>
                          </div>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link to="/contact" className="px-4 py-2.5 text-base font-medium text-gray-600">
                    Contact
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link to="/claim" className="px-4 py-2.5 text-base font-medium text-gray-600">
                    File a Claim
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Action Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              onClick={() => navigate("/role-selection")}
            >
              <Users className="h-4 w-4" />
              Login
            </Button>
            <Button 
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-6"
              onClick={() => navigate("/role-selection")}
            >
              Get Started
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-6">
            <div className="space-y-6">
              <Link
                to="/"
                className="block px-4 py-2.5 text-base font-medium text-gray-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <div className="px-4 py-2.5">
                <div className="text-base font-medium mb-3 text-gray-900">Services</div>
                <div className="space-y-3 ml-4">
                  {services.map((service) => (
                    <Link
                      key={service.title}
                      to={service.href}
                      className="block text-base text-gray-500"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {service.title}
                    </Link>
                  ))}
                </div>
              </div>
              <Link
                to="/team"
                className="block px-4 py-2.5 text-base font-medium text-gray-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Team
              </Link>
              <Link
                to="/contact"
                className="block px-4 py-2.5 text-base font-medium text-gray-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <Link
                to="/claim"
                className="block px-4 py-2.5 text-base font-medium text-gray-600"
                onClick={() => setIsMenuOpen(false)}
              >
                File a Claim
              </Link>
              <div className="px-3 py-2 space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-gray-200 text-gray-600 hover:bg-gray-50"
                  onClick={() => {
                    navigate("/role-selection");
                    setIsMenuOpen(false);
                  }}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Login
                </Button>
                <Button 
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full"
                  onClick={() => {
                    navigate("/role-selection");
                    setIsMenuOpen(false);
                  }}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
