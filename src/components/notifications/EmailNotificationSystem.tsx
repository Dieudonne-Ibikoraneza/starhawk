import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail,
  Send,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  FileText,
  Shield,
  Calendar,
  Settings,
  Bell,
  Eye,
  Edit,
  Trash2,
  Plus
} from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'assessment_assignment' | 'claim_assignment' | 'policy_approved' | 'claim_approved' | 'monitoring_due' | 'payment_reminder';
  variables: string[];
  isActive: boolean;
}

interface EmailNotification {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  body: string;
  type: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  sentAt?: string;
  deliveredAt?: string;
  relatedEntityId?: string; // Policy ID, Claim ID, etc.
  relatedEntityType?: string;
}

interface EmailNotificationSystemProps {
  userRole: 'insurer' | 'assessor' | 'admin';
  userId: string;
}

export function EmailNotificationSystem({ userRole, userId }: EmailNotificationSystemProps) {
  const [activeTab, setActiveTab] = useState("templates");
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [emailNotifications, setEmailNotifications] = useState<EmailNotification[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  // Mock email templates
  useEffect(() => {
    const mockTemplates: EmailTemplate[] = [
      {
        id: "template_001",
        name: "Risk Assessment Assignment",
        subject: "New Risk Assessment Assignment - {farmerName}",
        body: `Dear {assessorName},

You have been assigned a new risk assessment for the following farmer:

Farmer Details:
- Name: {farmerName}
- Location: {location}
- Crop Type: {cropType}
- Farm Size: {farmSize} hectares

Please log in to the system to view the full details and schedule your field visit.

Assessment ID: {assessmentId}

Best regards,
Insurance Team`,
        type: 'assessment_assignment',
        variables: ['assessorName', 'farmerName', 'location', 'cropType', 'farmSize', 'assessmentId'],
        isActive: true
      },
      {
        id: "template_002",
        name: "Policy Approval Notification",
        subject: "Your Insurance Policy Has Been Approved - Policy {policyId}",
        body: `Dear {farmerName},

Congratulations! Your insurance policy has been approved.

Policy Details:
- Policy ID: {policyId}
- Crop Type: {cropType}
- Coverage Amount: RWF {coverageAmount}
- Premium Amount: RWF {premiumAmount}
- Policy Duration: {duration} days

Please log in to the system to review your policy details and proceed with premium payment.

Best regards,
Insurance Team`,
        type: 'policy_approved',
        variables: ['farmerName', 'policyId', 'cropType', 'coverageAmount', 'premiumAmount', 'duration'],
        isActive: true
      },
      {
        id: "template_003",
        name: "Claim Assignment",
        subject: "New Claim Assessment Assignment - Claim {claimId}",
        body: `Dear {assessorName},

A new claim has been filed and assigned to you for assessment.

Claim Details:
- Claim ID: {claimId}
- Farmer: {farmerName}
- Crop Type: {cropType}
- Disaster Type: {disasterType}
- Location: {location}
- Incident Date: {incidentDate}

Please log in to the system to view the claim details and schedule your field visit.

Best regards,
Claims Team`,
        type: 'claim_assignment',
        variables: ['assessorName', 'claimId', 'farmerName', 'cropType', 'disasterType', 'location', 'incidentDate'],
        isActive: true
      },
      {
        id: "template_004",
        name: "Monitoring Due Notification",
        subject: "Scheduled Monitoring Due - Policy {policyId}",
        body: `Dear {assessorName},

You have a scheduled monitoring visit due for the following policy:

Policy Details:
- Policy ID: {policyId}
- Farmer: {farmerName}
- Crop Type: {cropType}
- Location: {location}
- Monitoring Stage: {stage}
- Due Date: {dueDate}

Please log in to the system to confirm your visit and update the monitoring schedule if needed.

Best regards,
Monitoring Team`,
        type: 'monitoring_due',
        variables: ['assessorName', 'policyId', 'farmerName', 'cropType', 'location', 'stage', 'dueDate'],
        isActive: true
      },
      {
        id: "template_005",
        name: "Claim Approval Notification",
        subject: "Your Claim Has Been Approved - Claim {claimId}",
        body: `Dear {farmerName},

Your claim has been reviewed and approved.

Claim Details:
- Claim ID: {claimId}
- Policy ID: {policyId}
- Approved Amount: RWF {approvedAmount}
- Payment Method: {paymentMethod}

The approved amount will be processed according to your policy terms. You will receive payment confirmation shortly.

Best regards,
Claims Team`,
        type: 'claim_approved',
        variables: ['farmerName', 'claimId', 'policyId', 'approvedAmount', 'paymentMethod'],
        isActive: true
      }
    ];

    const mockNotifications: EmailNotification[] = [
      {
        id: "notif_001",
        recipientId: "ASS001",
        recipientName: "John Assessor",
        recipientEmail: "john.assessor@example.com",
        subject: "New Risk Assessment Assignment - Jane Mukamana",
        body: "Assessment assignment details...",
        type: "assessment_assignment",
        status: "sent",
        sentAt: "2024-03-15T10:30:00Z",
        deliveredAt: "2024-03-15T10:31:00Z",
        relatedEntityId: "ASSESS001",
        relatedEntityType: "assessment"
      },
      {
        id: "notif_002",
        recipientId: "FARM001",
        recipientName: "Jane Mukamana",
        recipientEmail: "jane.mukamana@example.com",
        subject: "Your Insurance Policy Has Been Approved - Policy POL001",
        body: "Policy approval details...",
        type: "policy_approved",
        status: "delivered",
        sentAt: "2024-03-14T14:20:00Z",
        deliveredAt: "2024-03-14T14:21:00Z",
        relatedEntityId: "POL001",
        relatedEntityType: "policy"
      },
      {
        id: "notif_003",
        recipientId: "ASS002",
        recipientName: "Mary Assessor",
        recipientEmail: "mary.assessor@example.com",
        subject: "New Claim Assessment Assignment - Claim CLAIM001",
        body: "Claim assignment details...",
        type: "claim_assignment",
        status: "pending",
        relatedEntityId: "CLAIM001",
        relatedEntityType: "claim"
      }
    ];

    setEmailTemplates(mockTemplates);
    setEmailNotifications(mockNotifications);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'assessment_assignment': return <User className="h-4 w-4" />;
      case 'claim_assignment': return <AlertTriangle className="h-4 w-4" />;
      case 'policy_approved': return <Shield className="h-4 w-4" />;
      case 'claim_approved': return <CheckCircle className="h-4 w-4" />;
      case 'monitoring_due': return <Calendar className="h-4 w-4" />;
      case 'payment_reminder': return <Mail className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const renderEmailTemplates = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Email Templates</h3>
          <p className="text-gray-600">Manage automated email notifications</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid gap-4">
        {emailTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    {getTypeIcon(template.type)}
                  </div>
                  <div>
                    <h4 className="font-semibold">{template.name}</h4>
                    <p className="text-sm text-gray-600">{template.subject}</p>
                    <p className="text-xs text-gray-500">
                      Variables: {template.variables.join(', ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={template.isActive ? 'default' : 'secondary'}>
                    {template.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 line-clamp-3">{template.body}</p>
              </div>

              <div className="flex justify-end mt-4">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setSelectedTemplate(template)}
                >
                  Preview Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderEmailNotifications = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Email Notifications</h3>
          <p className="text-gray-600">Recent email notifications sent</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          <Send className="h-4 w-4 mr-2" />
          Send Manual Email
        </Button>
      </div>

      <div className="grid gap-4">
        {emailNotifications.map((notification) => (
          <Card key={notification.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    {getTypeIcon(notification.type)}
                  </div>
                  <div>
                    <h4 className="font-semibold">{notification.recipientName}</h4>
                    <p className="text-sm text-gray-600">{notification.recipientEmail}</p>
                    <p className="text-sm text-gray-500">{notification.subject}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(notification.status)}>
                    {notification.status.toUpperCase()}
                  </Badge>
                  {notification.sentAt && (
                    <p className="text-sm text-gray-600 mt-1">
                      Sent: {new Date(notification.sentAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span>Type: {notification.type.replace('_', ' ')}</span>
                </div>
                {notification.relatedEntityId && (
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <span>Related: {notification.relatedEntityId}</span>
                  </div>
                )}
                {notification.deliveredAt && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-gray-500" />
                    <span>Delivered: {new Date(notification.deliveredAt).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-4">
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Email Configuration</h3>
        <p className="text-gray-600">Configure email server and notification settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>SMTP Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="smtpHost">SMTP Host</Label>
              <Input id="smtpHost" placeholder="smtp.gmail.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPort">SMTP Port</Label>
              <Input id="smtpPort" placeholder="587" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpUser">Username</Label>
              <Input id="smtpUser" placeholder="your-email@gmail.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPass">Password</Label>
              <Input id="smtpPass" type="password" placeholder="••••••••" />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Test Connection
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notification Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senderName">Sender Name</Label>
              <Input id="senderName" placeholder="Rwanda Agri-Insurance" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderEmail">Sender Email</Label>
              <Input id="senderEmail" placeholder="noreply@agri-insurance.rw" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retryAttempts">Retry Attempts</Label>
              <Input id="retryAttempts" placeholder="3" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retryDelay">Retry Delay (minutes)</Label>
              <Input id="retryDelay" placeholder="5" />
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700">
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Mail className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-semibold">
                {emailNotifications.filter(n => n.status === 'sent' || n.status === 'delivered').length}
              </p>
              <p className="text-sm text-gray-600">Sent Today</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-semibold">
                {emailNotifications.filter(n => n.status === 'delivered').length}
              </p>
              <p className="text-sm text-gray-600">Delivered</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Clock className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
              <p className="text-2xl font-semibold">
                {emailNotifications.filter(n => n.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <AlertTriangle className="h-8 w-8 mx-auto text-red-600 mb-2" />
              <p className="text-2xl font-semibold">
                {emailNotifications.filter(n => n.status === 'failed').length}
              </p>
              <p className="text-sm text-gray-600">Failed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Email Notification System</CardTitle>
          <p className="text-center text-gray-600">
            Automated email workflows for seamless communication
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="mt-6">
              {renderEmailTemplates()}
            </TabsContent>

            <TabsContent value="notifications" className="mt-6">
              {renderEmailNotifications()}
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              {renderEmailSettings()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
