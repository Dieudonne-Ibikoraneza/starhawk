import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Building2, 
  MapPin, 
  BarChart3, 
  Settings,
  Users,
  FileText,
  Calendar,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Activity,
  Shield,
  Database,
  Globe,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wheat,
  DollarSign,
  Percent,
  Crop,
  Camera,
  UserPlus,
  Plus,
  CreditCard,
  Smartphone,
  Mail
} from "lucide-react";

interface RoleSidebarProps {
  role: "insurer" | "government" | "assessor" | "admin" | "farmer";
  onPageChange: (page: string) => void;
  activePage?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function RoleSidebar({ role, onPageChange, activePage = "dashboard", isOpen = true, onToggle }: RoleSidebarProps) {
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const roleConfig = {
    insurer: {
      title: "Insurer Dashboard",
      icon: Building2,
      color: "bg-blue-500",
      menuItems: [
        { id: "dashboard", label: "Dashboard", icon: Home, description: "Overview & Analytics" },
        { id: "policies", label: "Policies", icon: FileText, description: "Policy Management" },
        { id: "claims", label: "Claims", icon: AlertTriangle, description: "Claims Processing" },
        { id: "underwriting", label: "Underwriting", icon: Shield, description: "AI Risk Assessment" },
        { id: "policy-creation", label: "Policy Creation", icon: FileText, description: "Automated Policy Engine" },
        { id: "risk", label: "Risk Assessment", icon: TrendingUp, description: "Weather & Risk Analysis" },
        { id: "monitoring", label: "Monitoring", icon: Crop, description: "Continuous Surveillance" },
        { id: "payments", label: "Payments", icon: CreditCard, description: "Payment Processing" },
        { id: "portfolio", label: "Portfolio", icon: BarChart3, description: "Portfolio Overview" },
        { id: "reports", label: "Reports", icon: FileText, description: "Analytics & Reports" }
      ],
      stats: [
        { label: "Active Policies", value: "1,247", icon: CheckCircle, color: "text-green-600" },
        { label: "Pending Claims", value: "23", icon: Clock, color: "text-yellow-600" },
        { label: "Total Premium", value: "RWF 2.4B", icon: TrendingUp, color: "text-blue-600" }
      ]
    },
    government: {
      title: "Government Analytics",
      icon: BarChart3,
      color: "bg-red-500",
      menuItems: [
        { id: "dashboard", label: "Overview", icon: Home, description: "National Statistics" },
        { id: "analytics", label: "Analytics", icon: BarChart3, description: "AI Analytics Dashboard" },
        { id: "monitoring", label: "Monitoring", icon: Activity, description: "Policy Monitoring" },
        { id: "sector", label: "Sector Analysis", icon: BarChart3, description: "Agricultural Sector" },
        { id: "trends", label: "Trends", icon: TrendingUp, description: "Market Trends" },
        { id: "notifications", label: "Notifications", icon: Bell, description: "Alert Management" },
        { id: "email-notifications", label: "Email System", icon: Mail, description: "Email Templates & Logs" },
        { id: "reports", label: "Reports", icon: FileText, description: "Government Reports" },
        { id: "settings", label: "Settings", icon: Settings, description: "System Settings" }
      ],
      stats: [
        { label: "Total Farmers", value: "7,950", icon: Users, color: "text-blue-600" },
        { label: "Active Policies", value: "5,900", icon: CheckCircle, color: "text-green-600" },
        { label: "Total Premiums", value: "RWF 5.94B", icon: DollarSign, color: "text-green-600" }
      ]
    },
    assessor: {
      title: "Assessor Tasks",
      icon: MapPin,
      color: "bg-orange-500",
      menuItems: [
        { id: "dashboard", label: "Dashboard", icon: Home, description: "Task Overview" },
        { id: "assessments", label: "Assessments", icon: MapPin, description: "Field Assessments" },
        { id: "risk-assessment", label: "Risk Assessment", icon: Shield, description: "AI-Powered Assessment" },
        { id: "monitoring", label: "Monitoring", icon: Activity, description: "Continuous Surveillance" },
        { id: "tasks", label: "My Tasks", icon: Calendar, description: "Assigned Tasks" },
        { id: "reports", label: "Reports", icon: FileText, description: "Assessment Reports" },
        { id: "history", label: "History", icon: Clock, description: "Completed Tasks" },
        { id: "settings", label: "Settings", icon: Settings, description: "Profile Settings" }
      ],
      stats: [
        { label: "Pending Tasks", value: "12", icon: Clock, color: "text-yellow-600" },
        { label: "Completed", value: "89", icon: CheckCircle, color: "text-green-600" },
        { label: "This Month", value: "23", icon: Calendar, color: "text-blue-600" }
      ]
    },
    admin: {
      title: "Admin Panel",
      icon: Settings,
      color: "bg-gray-500",
      menuItems: [
        { id: "dashboard", label: "Dashboard", icon: Home, description: "System Overview" },
        { id: "monetization", label: "Monetization", icon: DollarSign, description: "Revenue & Transactions" },
        { id: "commission", label: "Commission", icon: Percent, description: "Commission Settings" },
        { id: "users", label: "Users", icon: Users, description: "User Management" },
        { id: "system", label: "System", icon: Database, description: "System Settings" },
        { id: "analytics", label: "Analytics", icon: BarChart3, description: "Platform Analytics" },
        { id: "security", label: "Security", icon: Shield, description: "Security & Access" },
        { id: "logs", label: "Logs", icon: FileText, description: "System Logs" },
        { id: "backup", label: "Backup", icon: Database, description: "Data Management" },
        { id: "settings", label: "Settings", icon: Settings, description: "Platform Settings" }
      ],
      stats: [
        { label: "Monthly Revenue", value: "RWF 15.65M", icon: DollarSign, color: "text-green-600" },
        { label: "System Health", value: "99.9%", icon: CheckCircle, color: "text-green-600" },
        { label: "Active Sessions", value: "156", icon: Activity, color: "text-orange-600" }
      ]
    },
    farmer: {
      title: "Farmer Portal",
      icon: Wheat,
      color: "bg-green-500",
      menuItems: [
        { id: "dashboard", label: "Dashboard", icon: Home, description: "Farm Overview" },
        { id: "registration", label: "Registration", icon: UserPlus, description: "Complete Profile" },
        { id: "policy-request", label: "Request Policy", icon: Plus, description: "Apply for Insurance" },
        { id: "policies", label: "My Policies", icon: FileText, description: "Insurance Policies" },
        { id: "claims", label: "Claims", icon: AlertTriangle, description: "File & Track Claims" },
        { id: "monitoring", label: "Field Monitoring", icon: MapPin, description: "Crop Surveillance" },
        { id: "payments", label: "Payments", icon: CreditCard, description: "Mobile Money & USSD" },
        { id: "file-claim", label: "File Claim", icon: AlertTriangle, description: "Report Crop Damage" },
        { id: "reports", label: "Reports", icon: BarChart3, description: "Farm Reports" },
        { id: "notifications", label: "Notifications", icon: Bell, description: "Alerts & Updates" },
        { id: "profile", label: "Profile", icon: Users, description: "Account Settings" }
      ],
      stats: [
        { label: "Active Policies", value: "3", icon: CheckCircle, color: "text-green-600" },
        { label: "Pending Claims", value: "1", icon: Clock, color: "text-yellow-600" },
        { label: "Total Coverage", value: "RWF 9M", icon: TrendingUp, color: "text-blue-600" }
      ]
    }
  };

  const config = roleConfig[role];
  const Icon = config.icon;

  const handlePageChange = (page: string) => {
    onPageChange(page);
    setIsMobileOpen(false);
  };

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative z-50 h-full transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        w-80 bg-white border-r border-gray-200 flex flex-col
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color} text-white`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">{config.title}</h2>
                <p className="text-sm text-muted-foreground capitalize">{role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="grid grid-cols-3 gap-3">
            {config.stats.map((stat, index) => {
              const StatIcon = stat.icon;
              return (
                <div key={index} className="text-center p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-gray-600 font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-2">
            {config.menuItems.map((item) => {
              const ItemIcon = item.icon;
              const isActive = activePage === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start h-auto p-3 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                      : 'hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 hover:shadow-md'
                  }`}
                  onClick={() => handlePageChange(item.id)}
                >
                  <ItemIcon className={`h-4 w-4 mr-3 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                  <div className="flex-1 text-left">
                    <div className={`font-medium ${isActive ? 'text-white' : 'text-gray-800'}`}>{item.label}</div>
                    <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>{item.description}</div>
                  </div>
                  <ChevronRight className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                </Button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-3" />
            Back to Home
          </Button>
        </div>
      </div>

      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="sm"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </Button>
    </>
  );
}
