import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Edit,
  Download,
  Share,
  Trash2,
  User,
  MapPin,
  Calendar,
  DollarSign,
  Shield,
  Crop,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  FileText,
  TrendingUp,
  BarChart3,
  Phone,
  Mail,
  Building2
} from "lucide-react";

interface Policy {
  id: string;
  farmerId: string;
  farmerName: string;
  cropType: string;
  coverageAmount: number;
  premiumAmount: number;
  startDate: string;
  endDate: string;
  status: "active" | "pending" | "expired" | "cancelled";
  location: string;
  farmSize: number;
  riskLevel: "low" | "medium" | "high";
  deductible: number;
  createdAt: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  policyType?: string;
  renewalDate?: string;
  lastPaymentDate?: string;
  nextPaymentDate?: string;
  claimsCount?: number;
  totalClaimsPaid?: number;
}

interface PolicyDetailsViewProps {
  policy: Policy;
  onBack: () => void;
  onEdit: (policy: Policy) => void;
  onDelete: (policyId: string) => void;
}

export default function PolicyDetailsView({ policy, onBack, onEdit, onDelete }: PolicyDetailsViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPolicy, setEditedPolicy] = useState<Policy>(policy);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "expired": return "bg-red-100 text-red-800";
      case "cancelled": return "bg-gray-100 text-white/90";
      default: return "bg-gray-100 text-white/90";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4" />;
      case "pending": return <Clock className="h-4 w-4" />;
      case "expired": return <AlertTriangle className="h-4 w-4" />;
      case "cancelled": return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "low": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-white/90";
    }
  };

  const handleSave = () => {
    // Here you would typically save the changes to your backend
    setIsEditing(false);
    onEdit(editedPolicy);
  };

  const handleCancel = () => {
    setEditedPolicy(policy);
    setIsEditing(false);
  };

  // Claims and payments will be loaded from API in the future
  const mockClaims: any[] = [];
  const mockPayments: any[] = [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Policies
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Policy Details</h1>
            <p className="text-white/70 mt-1">Policy ID: {policy.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className={getStatusColor(policy.status)}>
            {getStatusIcon(policy.status)}
            <span className="ml-1 capitalize">{policy.status}</span>
          </Badge>
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Policy
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Policy Overview Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/70">Coverage Amount</p>
                <p className="text-2xl font-bold text-white">
                  {policy.coverageAmount.toLocaleString()} RWF
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/70">Premium Amount</p>
                <p className="text-2xl font-bold text-white">
                  {policy.premiumAmount.toLocaleString()} RWF
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/70">Risk Level</p>
                <p className="text-2xl font-bold text-white capitalize">
                  {policy.riskLevel}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/70">Claims Filed</p>
                <p className="text-2xl font-bold text-white">
                  {policy.claimsCount || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="farmer">Farmer Details</TabsTrigger>
          <TabsTrigger value="claims">Claims History</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Policy Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Policy Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Policy ID</Label>
                    <Input value={isEditing ? editedPolicy.id : policy.id} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Policy Type</Label>
                    <Input value={isEditing ? editedPolicy.policyType || "Crop Insurance" : policy.policyType || "Crop Insurance"} 
                           onChange={(e) => isEditing && setEditedPolicy({...editedPolicy, policyType: e.target.value})} 
                           disabled={!isEditing} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" 
                           value={isEditing ? editedPolicy.startDate : policy.startDate}
                           onChange={(e) => isEditing && setEditedPolicy({...editedPolicy, startDate: e.target.value})}
                           disabled={!isEditing} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" 
                           value={isEditing ? editedPolicy.endDate : policy.endDate}
                           onChange={(e) => isEditing && setEditedPolicy({...editedPolicy, endDate: e.target.value})}
                           disabled={!isEditing} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Coverage Amount (RWF)</Label>
                    <Input type="number" 
                           value={isEditing ? editedPolicy.coverageAmount : policy.coverageAmount}
                           onChange={(e) => isEditing && setEditedPolicy({...editedPolicy, coverageAmount: parseFloat(e.target.value)})}
                           disabled={!isEditing} />
                  </div>
                  <div className="space-y-2">
                    <Label>Premium Amount (RWF)</Label>
                    <Input type="number" 
                           value={isEditing ? editedPolicy.premiumAmount : policy.premiumAmount}
                           onChange={(e) => isEditing && setEditedPolicy({...editedPolicy, premiumAmount: parseFloat(e.target.value)})}
                           disabled={!isEditing} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Deductible (RWF)</Label>
                    <Input type="number" 
                           value={isEditing ? editedPolicy.deductible : policy.deductible}
                           onChange={(e) => isEditing && setEditedPolicy({...editedPolicy, deductible: parseFloat(e.target.value)})}
                           disabled={!isEditing} />
                  </div>
                  <div className="space-y-2">
                    <Label>Risk Level</Label>
                    <Select value={isEditing ? editedPolicy.riskLevel : policy.riskLevel}
                            onValueChange={(value) => isEditing && setEditedPolicy({...editedPolicy, riskLevel: value as "low" | "medium" | "high"})}
                            disabled={!isEditing}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Risk</SelectItem>
                        <SelectItem value="medium">Medium Risk</SelectItem>
                        <SelectItem value="high">High Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Crop Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Crop className="h-5 w-5 mr-2" />
                  Crop Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Crop Type</Label>
                  <Select value={isEditing ? editedPolicy.cropType : policy.cropType}
                          onValueChange={(value) => isEditing && setEditedPolicy({...editedPolicy, cropType: value})}
                          disabled={!isEditing}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maize">Maize</SelectItem>
                      <SelectItem value="rice">Rice</SelectItem>
                      <SelectItem value="potatoes">Potatoes</SelectItem>
                      <SelectItem value="beans">Beans</SelectItem>
                      <SelectItem value="wheat">Wheat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Farm Size (hectares)</Label>
                  <Input type="number" 
                         value={isEditing ? editedPolicy.farmSize : policy.farmSize}
                         onChange={(e) => isEditing && setEditedPolicy({...editedPolicy, farmSize: parseFloat(e.target.value)})}
                         disabled={!isEditing} />
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={isEditing ? editedPolicy.location : policy.location}
                         onChange={(e) => isEditing && setEditedPolicy({...editedPolicy, location: e.target.value})}
                         disabled={!isEditing} />
                </div>

                <div className="space-y-2">
                  <Label>Policy Status</Label>
                  <Select value={isEditing ? editedPolicy.status : policy.status}
                          onValueChange={(value) => isEditing && setEditedPolicy({...editedPolicy, status: value as Policy["status"]})}
                          disabled={!isEditing}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="farmer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Farmer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Farmer ID</Label>
                  <Input value={isEditing ? editedPolicy.farmerId : policy.farmerId}
                         onChange={(e) => isEditing && setEditedPolicy({...editedPolicy, farmerId: e.target.value})}
                         disabled={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label>Farmer Name</Label>
                  <Input value={isEditing ? editedPolicy.farmerName : policy.farmerName}
                         onChange={(e) => isEditing && setEditedPolicy({...editedPolicy, farmerName: e.target.value})}
                         disabled={!isEditing} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input value={isEditing ? editedPolicy.phoneNumber || "" : policy.phoneNumber || ""}
                         onChange={(e) => isEditing && setEditedPolicy({...editedPolicy, phoneNumber: e.target.value})}
                         disabled={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" 
                         value={isEditing ? editedPolicy.email || "" : policy.email || ""}
                         onChange={(e) => isEditing && setEditedPolicy({...editedPolicy, email: e.target.value})}
                         disabled={!isEditing} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea value={isEditing ? editedPolicy.address || "" : policy.address || ""}
                          onChange={(e) => isEditing && setEditedPolicy({...editedPolicy, address: e.target.value})}
                          disabled={!isEditing}
                          rows={3} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="claims" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Claims History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockClaims.map((claim) => (
                  <div key={claim.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{claim.id}</p>
                        <p className="text-sm text-gray-500">{claim.description}</p>
                        <p className="text-xs text-gray-400">{claim.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{claim.amount.toLocaleString()} RWF</p>
                      <Badge className={claim.status === "approved" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                        {claim.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{payment.id}</p>
                        <p className="text-sm text-gray-500 capitalize">{payment.type} payment</p>
                        <p className="text-xs text-gray-400">{payment.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{payment.amount.toLocaleString()} RWF</p>
                      <Badge className={payment.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Delete Policy</h3>
              <p className="text-sm text-gray-500">Once deleted, this policy cannot be recovered.</p>
            </div>
            <Button variant="destructive" onClick={() => onDelete(policy.id)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Policy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
