import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Bell, CheckCircle2, AlertTriangle, Info, 
  Trash2, MailOpen, Clock, Loader2, ChevronRight,
  ShieldCheck, Activity, CloudRain
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL, getAuthToken } from "@/config/api";

export default function NotificationsTab() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/monitoring/alerts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
      // Mock data for demo if API fails
      setNotifications([
        {
          _id: "1",
          type: "WEATHER",
          severity: "HIGH",
          message: "Heavy rainfall predicted in your area over the next 48 hours. Ensure proper drainage in your Maize fields.",
          createdAt: new Date().toISOString(),
          isRead: false
        },
        {
          _id: "2",
          type: "POLICY",
          severity: "INFO",
          message: "Your insurance policy SH-99210-RW has been successfully activated.",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          isRead: true
        },
        {
          _id: "3",
          type: "HEALTH",
          severity: "MEDIUM",
          message: "A slight decline in NDVI (Vegetation Index) was detected in Farm 'East Plot A'.",
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          isRead: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = getAuthToken();
      await fetch(`${API_BASE_URL}/monitoring/alerts/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      // Optimistic update
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n._id !== id));
    toast({
      title: "Notification removed",
      description: "The alert has been dismissed.",
    });
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "unread") return !n.isRead;
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "WEATHER": return <CloudRain className="h-5 w-5 text-blue-500" />;
      case "POLICY": return <ShieldCheck className="h-5 w-5 text-green-500" />;
      case "HEALTH": return <Activity className="h-5 w-5 text-amber-500" />;
      case "CLAIM": return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default: return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">Stay updated with alerts, weather warnings, and policy updates.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadNotifications}>
            <Clock className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setNotifications(notifications.map(n => ({...n, isRead: true})))}>
            <MailOpen className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setFilter}>
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="all" className="data-[state=active]:bg-gray-100">All Alerts</TabsTrigger>
            <TabsTrigger value="unread" className="data-[state=active]:bg-gray-100">
              Unread
              {notifications.filter(n => !n.isRead).length > 0 && (
                <Badge className="ml-2 bg-red-500 hover:bg-red-500 h-5 px-1.5 min-w-[20px] justify-center">
                  {notifications.filter(n => !n.isRead).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="m-0">
          <NotificationList 
            notifications={filteredNotifications} 
            loading={loading} 
            onRead={markAsRead} 
            onDelete={deleteNotification}
            getIcon={getIcon}
          />
        </TabsContent>
        <TabsContent value="unread" className="m-0">
          <NotificationList 
            notifications={filteredNotifications} 
            loading={loading} 
            onRead={markAsRead} 
            onDelete={deleteNotification}
            getIcon={getIcon}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationList({ notifications, loading, onRead, onDelete, getIcon }: any) {
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-200 bg-transparent shadow-none">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No notifications yet</h3>
          <p className="text-gray-500 text-center max-w-xs mt-1">
            We'll notify you here when there are updates about your farms or policies.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {notifications.map((n: any) => (
        <Card key={n._id} className={`transition-all hover:shadow-md border-l-4 ${
          n.isRead ? 'bg-white border-l-gray-200' : 'bg-green-50/30 border-l-green-500 shadow-sm'
        }`}>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                n.isRead ? 'bg-gray-100' : 'bg-white shadow-sm border border-gray-100'
              }`}>
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{n.type}</span>
                    {!n.isRead && <Badge className="bg-green-500 h-2 w-2 p-0 rounded-full" />}
                  </div>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(n.createdAt), "MMM d, h:mm a")}
                  </span>
                </div>
                <h4 className={`text-sm font-bold text-gray-900 mb-1 ${!n.isRead ? 'pr-8' : ''}`}>
                  {n.message}
                </h4>
                <div className="flex items-center gap-4 mt-4">
                  {!n.isRead && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 font-bold"
                      onClick={() => onRead(n._id)}
                    >
                      Mark as read
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 text-gray-400 hover:text-red-500 hover:bg-red-50"
                    onClick={() => onDelete(n._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center">
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
