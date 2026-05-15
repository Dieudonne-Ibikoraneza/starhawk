import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardTheme } from "@/utils/dashboardTheme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNotifications, NotificationItem } from "@/contexts/NotificationContext";
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
  DollarSign,
  Settings,
  RefreshCw
} from "lucide-react";

export default function InsurerNotifications() {
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "assessment_submitted": return <FileText className="h-5 w-5" />;
      case "claim_submitted": return <AlertTriangle className="h-5 w-5" />;
      case "payment_due": return <DollarSign className="h-5 w-5" />;
      case "assessment_completed": return <CheckCircle className="h-5 w-5" />;
      case "system_alert": return <Settings className="h-5 w-5" />;
      default: return <Info className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-50 text-red-700 border-red-200";
      case "medium": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "low": return "bg-green-50 text-green-700 border-green-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "assessment_submitted": return "bg-blue-50 text-blue-700";
      case "claim_submitted": return "bg-orange-50 text-orange-700";
      case "payment_due": return "bg-purple-50 text-purple-700";
      case "assessment_completed": return "bg-green-50 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.farmerName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || notification.type === filterType;
    const matchesStatus = filterStatus === "all" || (filterStatus === "unread" ? !notification.read : notification.read);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">Stay updated with system activities and alerts</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadNotifications} 
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sync Feed
          </Button>
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 px-3 py-1">
            {unreadCount} unread
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 shadow-sm overflow-visible">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-200 focus:border-indigo-500 bg-slate-50/50"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-44 border-slate-200">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="assessment_submitted">Assessment Submitted</SelectItem>
                  <SelectItem value="claim_submitted">Claim Submitted</SelectItem>
                  <SelectItem value="payment_due">Payment Due</SelectItem>
                  <SelectItem value="assessment_completed">Assessment Completed</SelectItem>
                  <SelectItem value="system_alert">System Alert</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36 border-slate-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="border-slate-200 text-slate-600"
              >
                Mark all read
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {loading && notifications.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
             <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
             <p className="text-slate-500 font-medium">Updating notification feed...</p>
           </div>
        ) : filteredNotifications.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-16 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <Bell className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">All caught up!</h3>
              <p className="text-slate-500">No notifications found matching your current filters.</p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card key={notification.id} className={`transition-all duration-200 border-slate-200 hover:shadow-md ${
              !notification.read ? "border-l-4 border-l-indigo-500 bg-white shadow-sm" : "bg-slate-50/40 opacity-90"
            }`}>
              <CardContent className="p-5">
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    !notification.read ? "bg-indigo-50 text-indigo-600 shadow-sm" : "bg-slate-200 text-slate-500"
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-base font-bold ${!notification.read ? "text-slate-900" : "text-slate-600"}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider border ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider border ${getTypeColor(notification.type)}`}>
                          {notification.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className={`text-sm mb-4 leading-relaxed ${!notification.read ? "text-slate-700" : "text-slate-500"}`}>
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <div className="flex items-center space-x-5 text-xs text-slate-500 font-medium">
                        <div className="flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                          {notification.createdAt}
                        </div>
                        {notification.farmerName && (
                          <div className="flex items-center">
                            <User className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                            {notification.farmerName}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {!notification.read && (
                          <Button size="sm" variant="ghost" className="h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" onClick={() => markAsRead(notification.id)}>
                            Mark as Read
                          </Button>
                        )}
                        {notification.href && (
                          <Button size="sm" className="h-8 bg-slate-900 hover:bg-slate-800 text-white" onClick={() => window.location.href = notification.href!}>
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
