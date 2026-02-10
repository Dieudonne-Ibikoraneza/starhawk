import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardTheme } from "@/utils/dashboardTheme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  MessageSquare, 
  Mail, 
  Smartphone, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  Globe, 
  MapPin, 
  Calendar,
  Filter,
  Search,
  Settings,
  Phone,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Plus,
  History
} from "lucide-react";
import { NotificationConfig } from "@/types/enhanced-api";

interface NotificationManagerProps {
  userType: 'farmer' | 'insurer' | 'assessor' | 'government';
  userId: string;
}

interface Notification {
  id: string;
  type: 'claim_update' | 'payment_reminder' | 'disaster_alert' | 'policy_renewal' | 'assessment_schedule' | 'system_alert';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  channels: ('sms' | 'email' | 'whatsapp' | 'push')[];
  recipients: string[];
  scheduledFor?: string;
  sentAt?: string;
  deliveryStatus: {
    sms?: 'pending' | 'delivered' | 'failed';
    email?: 'pending' | 'delivered' | 'failed';
    whatsapp?: 'pending' | 'delivered' | 'failed';
    push?: 'pending' | 'delivered' | 'failed';
  };
  createdAt: string;
  createdBy: string;
}

interface DisasterAlert {
  id: string;
  type: 'flood' | 'drought' | 'pest_outbreak' | 'disease_outbreak' | 'hail' | 'fire';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedRegions: string[];
  affectedFarmers: number;
  estimatedLoss: number;
  alertMessage: string;
  recommendations: string[];
  issuedAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'cancelled';
}

export function NotificationManager({ userType, userId }: NotificationManagerProps) {
  const [activeTab, setActiveTab] = useState("compose");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [composeNotification, setComposeNotification] = useState<Partial<Notification>>({
    type: 'claim_update',
    priority: 'medium',
    channels: ['sms'],
    recipients: [],
    message: '',
    title: ''
  });

  // Mock data - in real implementation, this would come from API
  const notifications: Notification[] = [
    {
      id: "notif_001",
      type: "disaster_alert",
      title: "Flood Warning - Eastern Province",
      message: "Heavy rainfall expected in Eastern Province. 3 farms in your area may be affected. Take necessary precautions.",
      priority: "high",
      status: "delivered",
      channels: ["sms", "whatsapp"],
      recipients: ["+250788123456", "+250788789012"],
      sentAt: "2024-03-15T14:30:00Z",
      deliveryStatus: {
        sms: "delivered",
        whatsapp: "delivered"
      },
      createdAt: "2024-03-15T14:25:00Z",
      createdBy: "system"
    },
    {
      id: "notif_002",
      type: "claim_update",
      title: "Claim Status Update",
      message: "Your claim C001 has been approved. Payment of RWF 500,000 will be processed within 3 business days.",
      priority: "medium",
      status: "delivered",
      channels: ["sms", "email"],
      recipients: ["+250788123456", "farmer@example.com"],
      sentAt: "2024-03-14T10:15:00Z",
      deliveryStatus: {
        sms: "delivered",
        email: "delivered"
      },
      createdAt: "2024-03-14T10:10:00Z",
      createdBy: "insurer_001"
    },
    {
      id: "notif_003",
      type: "payment_reminder",
      title: "Premium Payment Reminder",
      message: "Your insurance premium of RWF 120,000 is due in 3 days. Pay via USSD *1828# or mobile app.",
      priority: "medium",
      status: "pending",
      channels: ["sms", "whatsapp"],
      recipients: ["+250788123456"],
      scheduledFor: "2024-03-18T09:00:00Z",
      deliveryStatus: {
        sms: "pending",
        whatsapp: "pending"
      },
      createdAt: "2024-03-15T08:00:00Z",
      createdBy: "system"
    }
  ];

  const disasterAlerts: DisasterAlert[] = [
    {
      id: "alert_001",
      type: "flood",
      severity: "high",
      affectedRegions: ["Eastern Province", "Southern Province"],
      affectedFarmers: 245,
      estimatedLoss: 1250000000,
      alertMessage: "Heavy rainfall and flooding expected in Eastern and Southern provinces. All farmers in affected areas should take immediate protective measures.",
      recommendations: [
        "Move livestock to higher ground",
        "Secure farm equipment",
        "Harvest ready crops immediately",
        "Clear drainage systems"
      ],
      issuedAt: "2024-03-15T12:00:00Z",
      expiresAt: "2024-03-20T12:00:00Z",
      status: "active"
    },
    {
      id: "alert_002",
      type: "pest_outbreak",
      severity: "medium",
      affectedRegions: ["Northern Province"],
      affectedFarmers: 89,
      estimatedLoss: 450000000,
      alertMessage: "Armyworm outbreak detected in Northern Province. Early detection and treatment recommended.",
      recommendations: [
        "Monitor crops daily",
        "Apply recommended pesticides",
        "Report suspicious damage",
        "Coordinate with local extension services"
      ],
      issuedAt: "2024-03-14T08:30:00Z",
      expiresAt: "2024-03-21T08:30:00Z",
      status: "active"
    }
  ];

  const notificationTemplates = [
    {
      id: "template_001",
      name: "Claim Approval",
      type: "claim_update",
      title: "Claim Approved - {claimId}",
      message: "Your claim {claimId} has been approved for RWF {amount}. Payment will be processed within 3-5 business days.",
      channels: ["sms", "email"]
    },
    {
      id: "template_002",
      name: "Payment Reminder",
      type: "payment_reminder",
      title: "Premium Payment Due",
      message: "Your insurance premium of RWF {amount} is due on {dueDate}. Pay via USSD *1828# or mobile app.",
      channels: ["sms", "whatsapp"]
    },
    {
      id: "template_003",
      name: "Disaster Alert",
      type: "disaster_alert",
      title: "Weather Alert - {region}",
      message: "{disasterType} warning for {region}. {affectedCount} farms may be affected. Take necessary precautions.",
      channels: ["sms", "whatsapp", "push"]
    },
    {
      id: "template_004",
      name: "Assessment Schedule",
      type: "assessment_schedule",
      title: "Field Assessment Scheduled",
      message: "Your field assessment is scheduled for {date} at {time}. Please ensure access to your farm.",
      channels: ["sms", "email"]
    }
  ];

  const userConfig: NotificationConfig = {
    id: "config_001",
    userId,
    userType,
    channels: {
      sms: true,
      email: true,
      whatsapp: true,
      push: true
    },
    preferences: {
      claimUpdates: true,
      paymentReminders: true,
      disasterAlerts: true,
      policyRenewals: true,
      assessmentSchedules: true
    },
    language: "en",
    timezone: "Africa/Kigali"
  };

  const handleChannelToggle = (channel: 'sms' | 'email' | 'whatsapp' | 'push', enabled: boolean) => {
    if (enabled) {
      setComposeNotification(prev => ({
        ...prev,
        channels: [...(prev.channels || []), channel]
      }));
    } else {
      setComposeNotification(prev => ({
        ...prev,
        channels: (prev.channels || []).filter(c => c !== channel)
      }));
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = notificationTemplates.find(t => t.id === templateId);
    if (template) {
      setComposeNotification(prev => ({
        ...prev,
        type: template.type as any,
        title: template.title,
        message: template.message,
        channels: template.channels as any[]
      }));
    }
  };

  const sendNotification = () => {
    // In real implementation, this would call the API
    console.log("Sending notification:", composeNotification);
    // Reset form
    setComposeNotification({
      type: 'claim_update',
      priority: 'medium',
      channels: ['sms'],
      recipients: [],
      message: '',
      title: ''
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600';
      case 'sent': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const renderCompose = () => (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Quick Templates</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notificationTemplates.map((template) => (
              <div
                key={template.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedTemplate === template.id ? 'border-blue-500 bg-blue-50' : 'hover:shadow-md'
                }`}
                onClick={() => {
                  setSelectedTemplate(template.id);
                  handleTemplateSelect(template.id);
                }}
              >
                <h3 className="font-semibold">{template.name}</h3>
                <p className="text-sm text-white/80 mt-1">{template.title}</p>
                <div className="flex space-x-2 mt-2">
                  {template.channels.map((channel) => (
                    <Badge key={channel} variant="outline" className="text-xs">
                      {channel.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notification Composer */}
      <Card>
        <CardHeader>
          <CardTitle>Compose Notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="notificationType">Notification Type</Label>
              <Select
                value={composeNotification.type || ''}
                onValueChange={(value) => setComposeNotification(prev => ({ ...prev, type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claim_update">Claim Update</SelectItem>
                  <SelectItem value="payment_reminder">Payment Reminder</SelectItem>
                  <SelectItem value="disaster_alert">Disaster Alert</SelectItem>
                  <SelectItem value="policy_renewal">Policy Renewal</SelectItem>
                  <SelectItem value="assessment_schedule">Assessment Schedule</SelectItem>
                  <SelectItem value="system_alert">System Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={composeNotification.priority || 'medium'}
                onValueChange={(value) => setComposeNotification(prev => ({ ...prev, priority: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter notification title"
              value={composeNotification.title || ''}
              onChange={(e) => setComposeNotification(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter notification message"
              value={composeNotification.message || ''}
              onChange={(e) => setComposeNotification(prev => ({ ...prev, message: e.target.value }))}
              rows={4}
            />
            <p className="text-sm text-white/70">
              SMS limit: 160 characters | Current: {(composeNotification.message || '').length}
            </p>
          </div>

          <div className="space-y-4">
            <Label>Delivery Channels</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={composeNotification.channels?.includes('sms') || false}
                  onCheckedChange={(checked) => handleChannelToggle('sms', checked)}
                />
                <Label className="flex items-center space-x-1">
                  <Phone className="h-4 w-4" />
                  <span>SMS</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={composeNotification.channels?.includes('email') || false}
                  onCheckedChange={(checked) => handleChannelToggle('email', checked)}
                />
                <Label className="flex items-center space-x-1">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={composeNotification.channels?.includes('whatsapp') || false}
                  onCheckedChange={(checked) => handleChannelToggle('whatsapp', checked)}
                />
                <Label className="flex items-center space-x-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>WhatsApp</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={composeNotification.channels?.includes('push') || false}
                  onCheckedChange={(checked) => handleChannelToggle('push', checked)}
                />
                <Label className="flex items-center space-x-1">
                  <Bell className="h-4 w-4" />
                  <span>Push</span>
                </Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline">Save Draft</Button>
            <Button onClick={sendNotification} className="bg-blue-600 hover:bg-blue-700">
              <Send className="h-4 w-4 mr-2" />
              Send Notification
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <Card key={notification.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-semibold">{notification.title}</h3>
                  <Badge className={getPriorityColor(notification.priority)}>
                    {notification.priority.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className={getStatusColor(notification.status)}>
                    {notification.status.toUpperCase()}
                  </Badge>
                </div>
                
                <p className="text-white/80 mb-3">{notification.message}</p>
                
                <div className="flex items-center space-x-4 text-sm text-white/60">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {notification.sentAt 
                        ? new Date(notification.sentAt).toLocaleString()
                        : new Date(notification.createdAt).toLocaleString()
                      }
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{notification.recipients.length} recipients</span>
                  </div>
                  <div className="flex space-x-1">
                    {notification.channels.map((channel) => (
                      <Badge key={channel} variant="outline" className="text-xs">
                        {channel.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Delivery Status */}
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(notification.deliveryStatus).map(([channel, status]) => (
                    <div key={channel} className="flex items-center space-x-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${
                        status === 'delivered' ? 'bg-green-500' :
                        status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className="capitalize">{channel}: {status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 ml-4">
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderDisasterAlerts = () => (
    <div className="space-y-4">
      {disasterAlerts.map((alert) => (
        <Card key={alert.id} className={`border-l-4 ${
          alert.severity === 'critical' ? 'border-red-500' :
          alert.severity === 'high' ? 'border-orange-500' :
          alert.severity === 'medium' ? 'border-yellow-500' : 'border-green-500'
        }`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className={`h-6 w-6 ${
                  alert.severity === 'critical' ? 'text-red-600' :
                  alert.severity === 'high' ? 'text-orange-600' :
                  alert.severity === 'medium' ? 'text-yellow-600' : 'text-green-600'
                }`} />
                <div>
                  <CardTitle className="text-lg">
                    {alert.type.replace('_', ' ').toUpperCase()} Alert
                  </CardTitle>
                  <p className="text-sm text-white/80">
                    {alert.affectedRegions.join(', ')}
                  </p>
                </div>
              </div>
              <Badge className={getSeverityColor(alert.severity)}>
                {alert.severity.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-white/80 mb-4">{alert.alertMessage}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{alert.affectedFarmers}</div>
                <div className="text-sm text-gray-600">Affected Farmers</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  RWF {(alert.estimatedLoss / 1000000).toFixed(0)}M
                </div>
                <div className="text-sm text-gray-600">Estimated Loss</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {new Date(alert.expiresAt).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-600">Expires</div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Recommendations</Label>
              <ul className="mt-2 space-y-1">
                {alert.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700">
                <Send className="h-4 w-4 mr-2" />
                Send Alert
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Notification Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-lg font-semibold">Delivery Channels</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              {Object.entries(userConfig.channels).map(([channel, enabled]) => (
                <div key={channel} className="flex items-center space-x-2">
                  <Switch checked={enabled} />
                  <Label className="capitalize">{channel}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-lg font-semibold">Notification Types</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              {Object.entries(userConfig.preferences).map(([preference, enabled]) => (
                <div key={preference} className="flex items-center space-x-2">
                  <Switch checked={enabled} />
                  <Label className="capitalize">{preference.replace(/([A-Z])/g, ' $1').trim()}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select defaultValue={userConfig.language}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="rw">Kinyarwanda</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select defaultValue={userConfig.timezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Kigali">Africa/Kigali (GMT+2)</SelectItem>
                  <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button className="w-full">
            <Settings className="h-4 w-4 mr-2" />
            Save Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Notification Manager</h1>
        <p className="text-gray-600">Manage SMS, WhatsApp, Email, and Push notifications</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="alerts">Disaster Alerts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="mt-6">
          {renderCompose()}
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          {renderNotifications()}
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          {renderDisasterAlerts()}
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          {renderSettings()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
