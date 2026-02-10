import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardTheme } from "@/utils/dashboardTheme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: "high" | "medium" | "low";
  status: "read" | "unread";
  timestamp: string;
  farmerId?: string;
  farmerName?: string;
  location?: string;
  dueDate?: string;
  assessmentType?: string;
  claimId?: string;
  assessmentId?: string;
  trainingDate?: string;
  trainingTopic?: string;
  equipmentType?: string;
}

export default function AssessorNotifications() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const assessorId = getUserId() || "";

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const [assessmentsResp, claimsResp] = await Promise.allSettled([
        assessmentsApiService.getAllAssessments(),
        getClaims()
      ]);

      const notificationsList: Notification[] = [];

      // Process assessments
      if (assessmentsResp.status === 'fulfilled') {
        const assessmentsData = (assessmentsResp.value as any).data || assessmentsResp.value || [];
        const assessmentsArray = Array.isArray(assessmentsData) ? assessmentsData : (assessmentsData.items || assessmentsData.results || []);
        
        // Filter assessments assigned to this assessor
        const assignedAssessments = assessmentsArray.filter((assessment: any) => {
          if (!assessorId) return false;
          const assessmentAssessorId = assessment.assessorId || assessment.assessor?._id || assessment.assessor?.id;
          return assessmentAssessorId === assessorId || assessmentAssessorId === assessorId.toString();
        });

        // Generate notifications from assessments
        for (const assessment of assignedAssessments) {
          const farmId = assessment.farmId || assessment.farm?._id || assessment.farm?.id;
          let farmerName = "Unknown Farmer";
          let location = "Unknown Location";
          let farmerId = "";

          // Try to get farmer info from assessment data
          if (assessment.farm) {
            if (assessment.farm.farmerId) {
              farmerId = assessment.farm.farmerId._id || assessment.farm.farmerId.id || assessment.farm.farmerId || "";
              farmerName = assessment.farm.farmerId.firstName && assessment.farm.farmerId.lastName
                ? `${assessment.farm.farmerId.firstName} ${assessment.farm.farmerId.lastName}`
                : assessment.farm.farmerId.email || assessment.farm.farmerId.phoneNumber || "Unknown Farmer";
            }
            
            if (assessment.farm.location) {
              if (typeof assessment.farm.location === 'string') {
                location = assessment.farm.location;
              } else if (assessment.farm.location.coordinates && Array.isArray(assessment.farm.location.coordinates)) {
                location = `${assessment.farm.location.coordinates[1]?.toFixed(4)}, ${assessment.farm.location.coordinates[0]?.toFixed(4)}`;
              }
            }
          }

          // Try to get farmer info from API if not in assessment
          if (farmerName === "Unknown Farmer" && farmId) {
            try {
              const farmData = await getFarmById(farmId);
              const farm = farmData.data || farmData;
              if (farm?.farmerId) {
                const farmerInfo = typeof farm.farmerId === 'string' 
                  ? await getUserById(farm.farmerId).catch(() => null)
                  : farm.farmerId;
                if (farmerInfo) {
                  const farmer = farmerInfo.data || farmerInfo;
                  farmerId = farmer._id || farmer.id || "";
                  farmerName = farmer.firstName && farmer.lastName
                    ? `${farmer.firstName} ${farmer.lastName}`
                    : farmer.email || farmer.phoneNumber || "Unknown Farmer";
                }
              }
              if (farm?.location && !location) {
                if (typeof farm.location === 'string') {
                  location = farm.location;
                } else if (farm.location.coordinates && Array.isArray(farm.location.coordinates)) {
                  location = `${farm.location.coordinates[1]?.toFixed(4)}, ${farm.location.coordinates[0]?.toFixed(4)}`;
                }
              }
            } catch (err) {
              console.error('Failed to load farm data:', err);
            }
          }

          const assessmentId = assessment._id || assessment.id || "";
          const assessmentDate = assessment.createdAt || assessment.assessmentDate || new Date().toISOString();
          const status = assessment.status?.toLowerCase() || "pending";
          
          // Create notification based on assessment status
          if (status === "pending" || status === "in_progress") {
            const daysSinceCreation = Math.floor((new Date().getTime() - new Date(assessmentDate).getTime()) / (1000 * 60 * 60 * 24));
            const isNew = daysSinceCreation <= 1;
            
            notificationsList.push({
              id: `assessment-${assessmentId}`,
              type: isNew ? "new_assignment" : "assessment_reminder",
              title: isNew ? "New Assessment Assignment" : "Assessment Due Soon",
              message: isNew 
                ? `You have been assigned a new risk assessment for farmer ${farmerName}${location !== "Unknown Location" ? ` in ${location}` : ""}.`
                : `Risk assessment for farmer ${farmerName}${location !== "Unknown Location" ? ` in ${location}` : ""} is pending. Please complete your field visit.`,
              priority: isNew ? "high" : "medium",
              status: "unread",
              timestamp: assessmentDate,
              farmerId,
              farmerName,
              location,
              assessmentType: "risk_assessment",
              assessmentId
            });
          } else if (status === "submitted" || status === "approved") {
            notificationsList.push({
              id: `assessment-approved-${assessmentId}`,
              type: "assessment_approved",
              title: "Assessment Approved",
              message: `Your risk assessment for farmer ${farmerName}${location !== "Unknown Location" ? ` in ${location}` : ""} has been ${status === "approved" ? "approved" : "submitted"} ${status === "approved" ? "by the insurer" : ""}.`,
              priority: "low",
              status: "read",
              timestamp: assessmentDate,
              farmerId,
              farmerName,
              location,
              assessmentId,
              assessmentType: "risk_assessment"
            });
          }
        }
      }

      // Process claims
      if (claimsResp.status === 'fulfilled') {
        const claimsData = (claimsResp.value as any).data || claimsResp.value || [];
        const claimsArray = Array.isArray(claimsData) ? claimsData : (claimsData.items || claimsData.results || []);
        
        // Filter claims assigned to this assessor
        const assignedClaims = claimsArray.filter((claim: any) => {
          if (!assessorId) return false;
          const claimAssessorId = claim.assessorId || claim.assessor?._id || claim.assessor?.id;
          return claimAssessorId === assessorId || claimAssessorId === assessorId.toString();
        });

        // Generate notifications from claims
        for (const claim of assignedClaims) {
          const claimId = claim._id || claim.id || "";
          const claimDate = claim.createdAt || claim.submittedAt || new Date().toISOString();
          const farmerId = claim.farmerId?._id || claim.farmerId || claim.farmer?.id || "";
          let farmerName = "Unknown Farmer";
          let location = "Unknown Location";

          // Get farmer info
          if (claim.farmer || claim.farmerId) {
            const farmer = claim.farmer || claim.farmerId;
            if (typeof farmer === 'object') {
              farmerName = farmer.firstName && farmer.lastName
                ? `${farmer.firstName} ${farmer.lastName}`
                : farmer.email || farmer.phoneNumber || "Unknown Farmer";
            }
          }

          // Try to get farmer info from API if needed
          if (farmerName === "Unknown Farmer" && farmerId) {
            try {
              const farmerData: any = await getUserById(farmerId);
              const farmer = farmerData.data || farmerData;
              farmerName = farmer.firstName && farmer.lastName
                ? `${farmer.firstName} ${farmer.lastName}`
                : farmer.email || farmer.phoneNumber || "Unknown Farmer";
            } catch (err) {
              console.error('Failed to load farmer data:', err);
            }
          }

          notificationsList.push({
            id: `claim-${claimId}`,
            type: "claim_assignment",
            title: "New Claim Assessment",
            message: `You have been assigned to assess claim ${claim.claimNumber || claimId} for farmer ${farmerName}${location !== "Unknown Location" ? ` in ${location}` : ""} regarding ${claim.lossEventType || claim.damageType || "damage"}.`,
            priority: "high",
            status: claim.status === "pending" ? "unread" : "read",
            timestamp: claimDate,
            farmerId,
            farmerName,
            location,
            claimId,
            assessmentType: "loss_assessment"
          });
        }
      }

      // Sort notifications by timestamp (newest first)
      notificationsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setNotifications(notificationsList);
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
      setError(err.message || 'Failed to load notifications');
      toast({
        title: 'Error loading notifications',
        description: err.message || 'Failed to load notifications',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

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

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.farmerName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || notification.type === filterType;
    const matchesStatus = filterStatus === "all" || notification.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const unreadCount = notifications.filter(n => n.status === "unread").length;

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsDetailOpen(true);
    // Mark as read when clicked
    if (notification.status === "unread") {
      setNotifications(prev => prev.map(n => 
        n.id === notification.id ? { ...n, status: "read" as const } : n
      ));
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, status: "read" as const } : n
    ));
    if (selectedNotification?.id === notificationId) {
      setSelectedNotification({ ...selectedNotification, status: "read" });
    }
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
            <Badge className="bg-green-50 text-green-700 border border-green-200">
              {unreadCount} unread
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6">
        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
          />
        </div>
          <div className="flex gap-3">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40 bg-gray-50 border-gray-200 text-gray-900 text-xs h-9">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="new_assignment">New Assignment</SelectItem>
                <SelectItem value="assessment_reminder">Assessment Reminder</SelectItem>
                <SelectItem value="claim_assignment">Claim Assignment</SelectItem>
                <SelectItem value="assessment_approved">Assessment Approved</SelectItem>
                <SelectItem value="training_reminder">Training Reminder</SelectItem>
                <SelectItem value="equipment_update">Equipment Update</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 bg-gray-50 border-gray-200 text-gray-900 text-xs h-9">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={loadNotifications}
              variant="outline"
              size="sm"
              className="border-gray-200 hover:bg-gray-50 text-xs h-9 ml-auto"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-12">
              <div className="flex items-center justify-center">
                <img src="/loading.gif" alt="Loading" className="w-16 h-16" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="text-center text-red-600">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                <p className="text-sm">{error}</p>
                <Button 
                  onClick={loadNotifications} 
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications List */}
        {!loading && !error && (
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-12 text-center">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No notifications found</h3>
                  <p className="text-xs text-gray-500">
                    {notifications.length === 0 
                      ? "You have no notifications yet. Notifications will appear here when you receive new assignments."
                      : "Try adjusting your search or filter criteria."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`bg-white border border-gray-200 shadow-sm transition-all duration-200 cursor-pointer hover:bg-green-50/30 ${
                  notification.status === "unread" ? "border-l-4 border-l-green-500 bg-green-50/50" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      notification.status === "unread" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                          {notification.title}
                        </h3>
                        <Badge className={`${getPriorityColor(notification.priority)} text-xs`}>
                          {notification.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(notification.timestamp).toLocaleString()}
                        </div>
                        {notification.farmerName && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {notification.farmerName}
                          </div>
                        )}
                        {notification.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {notification.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
            )}
          </div>
        )}
      </div>

      {/* Notification Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-gray-200">
          {selectedNotification && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      selectedNotification.status === "unread" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
                    }`}>
                      {getNotificationIcon(selectedNotification.type)}
                    </div>
                    <div>
                      <DialogTitle className="text-xl text-gray-900">{selectedNotification.title}</DialogTitle>
                      <DialogDescription className="text-sm text-gray-600 mt-1">
                        {selectedNotification.type.replace(/_/g, ' ')}
                      </DialogDescription>
                    </div>
                  </div>
                  <Badge className={getPriorityColor(selectedNotification.priority)}>
                    {selectedNotification.priority}
                  </Badge>
                </div>
              </DialogHeader>
              
              <div className="space-y-6 mt-4">
                <div>
                  <p className="text-gray-700 leading-relaxed">{selectedNotification.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Timestamp</p>
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <Clock className="h-4 w-4 text-gray-600" />
                      {new Date(selectedNotification.timestamp).toLocaleString()}
                    </div>
                  </div>
                  {selectedNotification.dueDate && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Due Date</p>
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        {selectedNotification.dueDate}
                      </div>
                    </div>
                  )}
                </div>

                {selectedNotification.farmerName && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-600" />
                      Farmer Information
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-600">Name</p>
                        <p className="text-sm text-gray-900 font-medium">{selectedNotification.farmerName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Farmer ID</p>
                        <p className="text-sm text-gray-900 font-medium">{selectedNotification.farmerId}</p>
                      </div>
                      {selectedNotification.location && (
                        <div>
                          <p className="text-xs text-gray-600">Location</p>
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <MapPin className="h-3 w-3 text-gray-600" />
                            {selectedNotification.location}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedNotification.claimId && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Claim Details</h4>
                    <div>
                      <p className="text-xs text-gray-600">Claim ID</p>
                      <p className="text-sm text-gray-900 font-medium">{selectedNotification.claimId}</p>
                    </div>
                  </div>
                )}

                {selectedNotification.assessmentId && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Assessment Details</h4>
                    <div>
                      <p className="text-xs text-gray-600">Assessment ID</p>
                      <p className="text-sm text-gray-900 font-medium">{selectedNotification.assessmentId}</p>
                    </div>
                  </div>
                )}

                {selectedNotification.trainingDate && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Training Information</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-600">Date</p>
                        <p className="text-sm text-gray-900 font-medium">{selectedNotification.trainingDate}</p>
                      </div>
                      {selectedNotification.trainingTopic && (
                        <div>
                          <p className="text-xs text-gray-600">Topic</p>
                          <p className="text-sm text-gray-900 font-medium">{selectedNotification.trainingTopic}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedNotification.equipmentType && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Equipment Details</h4>
                    <div>
                      <p className="text-xs text-gray-600">Equipment</p>
                      <p className="text-sm text-gray-900 font-medium">{selectedNotification.equipmentType}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <Button 
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-white"
                    onClick={() => {
                      // Handle action based on notification type
                      setIsDetailOpen(false);
                    }}
                  >
                    Take Action
                  </Button>
                  {selectedNotification.status === "unread" && (
                    <Button 
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(e, selectedNotification.id);
                      }}
                    >
                      Mark as Read
                    </Button>
                  )}
                  {selectedNotification.farmerName && (
                    <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                      <Phone className="h-4 w-4" />
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
