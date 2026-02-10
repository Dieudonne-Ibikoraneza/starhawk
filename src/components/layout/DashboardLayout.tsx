import { ReactNode, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import CustomScrollbar from "@/components/ui/CustomScrollbar";
import { 
  BarChart3,
  FileText,
  AlertTriangle,
  CheckCircle,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  User,
  Shield,
  Building2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  userType: "farmer" | "assessor" | "insurer" | "admin" | "government";
  userId: string;
  userName: string;
  navigationItems: Array<{
    id: string;
    label: string;
    icon: any;
    badge?: number;
  }>;
  activePage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
}

export default function DashboardLayout({
  children,
  userType,
  userId,
  userName,
  navigationItems,
  activePage,
  onPageChange,
  onLogout
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Load collapsed state from localStorage
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  const navigate = useNavigate();

  // Remove dark mode - use light theme
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    // Dispatch custom event for same-tab listeners
    window.dispatchEvent(new Event('sidebarToggle'));
  };

  const handleLogout = () => {
    // Clear any stored authentication data
    localStorage.removeItem('userToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    
    // Call the custom logout handler if provided
    if (onLogout) {
      onLogout();
    }
    
    // Navigate back to role selection
    navigate('/role-selection');
  };

  const getUserIcon = () => {
    switch (userType) {
      case "farmer": return <User className="h-6 w-6" />;
      case "assessor": return <img src="/assessor.webp" alt="Assessor" className="h-6 w-6 object-contain" />;
      case "insurer": return <Building2 className="h-6 w-6" />;
      case "admin": return <Settings className="h-6 w-6" />;
      case "government": return <BarChart3 className="h-6 w-6" />;
      default: return <User className="h-6 w-6" />;
    }
  };

  const getUserColor = () => {
    switch (userType) {
      case "farmer": return "bg-[rgba(20,40,75,1)]";
      case "assessor": return "bg-orange-600";
      case "insurer": return "bg-blue-600";
      case "admin": return "bg-purple-600";
      case "government": return "bg-indigo-600";
      default: return "bg-gray-600";
    }
  };

  const getSidebarTheme = () => {
    // Use light theme for sidebar
    return "from-white to-gray-50 border-gray-200";
  };

  const getMainContentTheme = () => {
    // Always use dark theme like Chainex dashboard
    return "";
  };

  const getNavigationColors = (itemIndex?: number) => {
    // Use consistent green color for assessor active state
    if (userType === "assessor") {
      return {
        activeBg: "bg-green-600",
        activeText: "text-white",
        activeBorder: "border-0",
        activeIcon: "text-green-100",
        hover: "hover:bg-green-50 hover:text-green-700"
      };
    }
    // Use primary color for other user types
    return {
      activeBg: "bg-[rgba(20,40,75,0.1)]",
      activeText: "text-[rgba(15,30,56,1)]",
      activeBorder: "border-0",
      activeIcon: "text-[rgba(20,40,75,1)]",
      hover: "hover:text-[rgba(20,40,75,1)]"
    };
  };

  const getUserLabel = () => {
    switch (userType) {
      case "farmer": return "Farmer";
      case "assessor": return "Assessor";
      case "insurer": return "Insurer";
      case "admin": return "Admin";
      case "government": return "Government";
      default: return "User";
    }
  };

  return (
     <div className="dashboard-layout min-h-screen bg-gray-50 flex relative">
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-gradient-to-br ${getSidebarTheme()} backdrop-blur-xl border-r transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64`}>
        <div className="flex flex-col h-full">
          {/* Mobile Close Button & Desktop Toggle */}
          <div className={`flex items-center border-b border-gray-200 ${sidebarCollapsed ? 'justify-center p-4' : 'justify-between p-4'}`}>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0 lg:block hidden">
                <div className="flex items-center space-x-3 p-3 rounded-xl">
                  {userType === "assessor" ? (
                    <img src="/assessor.webp" alt="Assessor" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className={`w-10 h-10 ${getUserColor()} rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                      <div className="text-white">
                        {getUserIcon()}
                      </div>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                    <p className="text-xs text-gray-600 truncate">{getUserLabel()}</p>
                  </div>
                </div>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="flex items-center justify-center gap-2 w-full lg:block hidden">
                {userType === "assessor" ? (
                  <img src="/assessor.webp" alt="Assessor" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className={`w-10 h-10 ${getUserColor()} rounded-full flex items-center justify-center overflow-hidden`}>
                    <div className="text-white">
                      {getUserIcon()}
                    </div>
                  </div>
                )}
                {/* Desktop Toggle Button - Next to icon when collapsed */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-gray-100 text-gray-700 p-1 h-auto"
                  onClick={toggleSidebar}
                  title="Expand sidebar"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 lg:block hidden">
                {/* Desktop Toggle Button - Right side when expanded */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-gray-100 text-gray-700"
                  onClick={toggleSidebar}
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
            {/* Mobile Close Button */}
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-gray-100 text-gray-700 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* User Info - Mobile Only */}
          <div className="p-4 border-b border-gray-200 lg:hidden">
            <div className="flex items-center space-x-3 p-3 rounded-xl">
              {userType === "assessor" ? (
                <img src="/assessor.webp" alt="Assessor" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className={`w-10 h-10 ${getUserColor()} rounded-full flex items-center justify-center overflow-hidden`}>
                  <div className="text-white">
                    {getUserIcon()}
                  </div>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                <p className="text-xs text-gray-600 truncate">{getUserLabel()}</p>
              </div>
            </div>
          </div>


          {/* Navigation */}
          <nav 
            className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <div className="h-full">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              const colors = getNavigationColors(index);
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'} py-4 text-sm font-medium transition-all duration-300 ease-in-out group relative ${
                    isActive
                      ? `${colors.activeBg} ${colors.activeText} shadow-sm ${colors.activeBorder}`
                      : `text-gray-700 ${colors.hover}`
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  {sidebarCollapsed ? (
                    // Collapsed: Only icon
                    <div className="flex items-center justify-center relative">
                      <Icon className={`h-5 w-5 ${isActive ? colors.activeIcon : 'text-gray-600'}`} />
                      {item.badge && item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                      )}
                    </div>
                  ) : (
                    // Expanded: Icon + label + badge
                    <>
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? colors.activeIcon : 'text-gray-600'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && item.badge > 0 && (
                        <Badge variant="secondary" className={`text-xs ${
                          isActive 
                            ? `${colors.activeBg} text-white`
                            : 'bg-[rgba(20,40,75,0.15)] text-[rgba(15,30,56,1)]'
                        }`}>
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </button>
              );
            })}
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-center">
              {/* Logout Button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`w-full ${sidebarCollapsed ? 'justify-center px-2' : 'justify-center'} hover:text-red-600 transition-all duration-300 text-gray-700`}
                    title={sidebarCollapsed ? "Logout" : undefined}
                  >
                    <LogOut className="h-4 w-4 flex-shrink-0" />
                    {!sidebarCollapsed && <span className="ml-2">Logout</span>}
                  </Button>
                </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to logout? You will be redirected to the role selection page.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 bg-gray-50 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      }`}>
        {/* Mobile Menu Button */}
        <div className="lg:hidden fixed top-4 left-4 z-40">
          <Button
            variant="ghost"
            size="sm"
            className="bg-white backdrop-blur-sm hover:bg-gray-100 shadow-lg rounded-2xl border border-gray-200"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </Button>
        </div>

         {/* Page Content */}
         <main className="flex-1 overflow-auto bg-gray-50">
           <CustomScrollbar className="h-full">
             {children}
           </CustomScrollbar>
         </main>
      </div>
    </div>
  );
}
