import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardTheme } from "@/utils/dashboardTheme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNotifications, NotificationItem } from "@/contexts/NotificationContext";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Bell, 
  Search, 
  Filter,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  User,
  FileText,
  MapPin,
  Settings,
  Phone,
  Mail,
  Calendar,
  X,
  RefreshCw
} from "lucide-react";
import assessmentsApiService from "@/services/assessmentsApi";
import { getClaims } from "@/services/claimsApi";
import { getUserId } from "@/services/authAPI";
import { getUserById } from "@/services/usersAPI";
import { getFarmById } from "@/services/farmsApi";
import { useToast } from "@/hooks/use-toast";

export default function AssessorNotifications() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { 
    notifications, 
    loading, 
    refreshNotifications: loadNotifications,
    markAsRead,
    markAllAsRead
  } = useNotifications();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assessorId = getUserId() || "";

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = 
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.farmerName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || n.type === filterType;
    const matchesStatus = filterStatus === "all" || n.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_assignment": return <FileText className="h-5 w-5" />;
      case "assessment_reminder": return <Clock className="h-5 w-5" />;
      case "claim_assignment": return <AlertTriangle className="h-5 w-5" />;
      case "assessment_approved": return <CheckCircle className="h-5 w-5" />;
      case "training_reminder": return <Calendar className="h-5 w-5" />;
      case "equipment_update": return <Settings className="h-5 w-5" />;
      default: return <Info className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700 border border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      case "low": return "bg-green-100 text-green-700 border border-green-200";
      default: return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "new_assignment": return "bg-blue-100 text-blue-800";
      case "assessment_reminder": return "bg-orange-100 text-orange-800";
      case "claim_assignment": return "bg-red-100 text-red-800";
      case "assessment_approved": return "bg-green-100 text-green-800";
      case "training_reminder": return "bg-purple-100 text-purple-800";
      case "equipment_update": return "bg-gray-800/20 text-white";
      default: return "bg-gray-800/20 text-white";
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: NotificationItem) => {
    setSelectedNotification(notification);
    setIsDetailOpen(true);
    // Mark as read when clicked
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    markAsRead(notificationId);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-8">
      {/* Clean Header */}
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-500 mt-1">Stay updated with your assessment assignments and tasks</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadNotifications} 
                disabled={loading}
                className="text-gray-600 border-gray-200"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Badge className="bg-green-50 text-green-700 border border-green-200">
                {unreadCount} unread
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6">
        {/* Search and Filters */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search notifications..."
                className="pl-10 bg-gray-50 border-gray-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <SelectValue placeholder="All Types" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="new_assignment">New Assignments</SelectItem>
                <SelectItem value="assessment_reminder">Reminders</SelectItem>
                <SelectItem value="claim_assignment">Claims</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread Only</SelectItem>
                <SelectItem value="read">Read Only</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              className="border-gray-200 text-gray-600"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-gray-200">
              <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
              <p className="text-gray-500">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-gray-200">
              <Bell className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">No notifications found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search term</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`overflow-hidden transition-all hover:shadow-md cursor-pointer border-gray-200 ${
                  !notification.read ? 'border-l-4 border-l-indigo-500 bg-white' : 'bg-white opacity-80'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-0">
                  <div className="p-5 flex items-start gap-4">
                    <div className={`mt-1 p-2.5 rounded-lg ${
                      !notification.read ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-semibold truncate ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                            {notification.title}
                          </h3>
                          {!notification.read && <Badge className="bg-indigo-500 hover:bg-indigo-600 text-white border-0 text-[10px] h-4 px-1.5">NEW</Badge>}
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {notification.createdAt}
                        </span>
                      </div>
                      <p className={`text-sm mb-3 line-clamp-2 ${!notification.read ? 'text-gray-700' : 'text-gray-500'}`}>
                        {notification.message}
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getPriorityColor(notification.priority)}`}>
                          {notification.priority} priority
                        </span>
                        {notification.farmerName && (
                          <span className="flex items-center text-xs text-gray-500">
                            <User className="h-3 w-3 mr-1" />
                            {notification.farmerName}
                          </span>
                        )}
                        {notification.location && (
                          <span className="flex items-center text-xs text-gray-500">
                            <MapPin className="h-3 w-3 mr-1" />
                            {notification.location}
                          </span>
                        )}
                      </div>
                    </div>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                        onClick={(e) => handleMarkAsRead(e, notification.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          {selectedNotification && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${getPriorityColor(selectedNotification.priority)}`}>
                    {getNotificationIcon(selectedNotification.type)}
                  </div>
                  <Badge className={getTypeColor(selectedNotification.type)}>
                    {selectedNotification.type.replace('_', ' ')}
                  </Badge>
                </div>
                <DialogTitle className="text-xl">{selectedNotification.title}</DialogTitle>
                <DialogDescription className="text-sm text-gray-500 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Received {selectedNotification.createdAt}
                </DialogDescription>
              </DialogHeader>

              <div className="py-6 space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <p className="text-gray-800 leading-relaxed">{selectedNotification.message}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedNotification.farmerName && (
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-50 p-2 rounded-full">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Farmer</p>
                        <p className="font-medium text-gray-900">{selectedNotification.farmerName}</p>
                      </div>
                    </div>
                  )}

                  {selectedNotification.location && (
                    <div className="flex items-start gap-3">
                      <div className="bg-green-50 p-2 rounded-full">
                        <MapPin className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Location</p>
                        <p className="font-medium text-gray-900">{selectedNotification.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <Badge className={getPriorityColor(selectedNotification.priority)}>
                    {selectedNotification.priority} Priority
                  </Badge>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Close</Button>
                  {selectedNotification.href && (
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={() => {
                        setIsDetailOpen(false);
                        if (selectedNotification.href) {
                          navigate(selectedNotification.href);
                        }
                      }}
                    >
                      View Details
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
