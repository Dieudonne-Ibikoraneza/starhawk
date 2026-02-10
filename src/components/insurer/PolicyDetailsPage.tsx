import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "../layout/DashboardLayout";
import { 
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  DollarSign,
  Shield,
  Crop,
  Building2,
  FileText,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Download,
  Edit,
  Eye,
  BarChart3,
  PieChart,
  Bell,
  ClipboardCheck
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
  status: string;
  location: string;
  farmSize: number;
  riskLevel: string;
  deductible: number;
  claimHistory: any[];
  paymentHistory: any[];
  documents: string[];
}

export default function PolicyDetailsPage() {
  const { policyId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Navigation items for the sidebar
  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "claims", label: "Claims", icon: FileText },
    { id: "policies", label: "Policies", icon: Shield },
    { id: "assessments", label: "Assessments", icon: ClipboardCheck },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "profile", label: "Profile Settings", icon: User }
  ];

  // Mock policy data - in real app, this would be fetched based on policyId
  const policy: Policy = {
    id: policyId || "POL-001",
    farmerId: "FMR-0247",
    farmerName: "Jean Baptiste",
    cropType: "Maize",
    coverageAmount: 250000,
    premiumAmount: 15000,
    startDate: "2024-01-15",
    endDate: "2024-12-31",
    status: "active",
    location: "Nyagatare District, Eastern Province",
    farmSize: 2.5,
    riskLevel: "low",
    deductible: 5000,
    claimHistory: [
      {
        id: "CLM-001",
        date: "2024-08-15",
        amount: 45000,
        status: "approved",
        description: "Drought damage"
      }
    ],
    paymentHistory: [
      {
        id: "PAY-001",
        date: "2024-01-15",
        amount: 15000,
        status: "paid",
        method: "Mobile Money"
      }
    ],
    documents: ["Policy Document", "Terms & Conditions", "Premium Schedule"]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "expired": return "bg-red-100 text-red-800 border-red-200";
      case "suspended": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "pending": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-white/90 border-gray-200";
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low": return "bg-green-100 text-green-800 border-green-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "high": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-white/90 border-gray-200";
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Eye },
    { id: "claims", label: "Claims History", icon: FileText },
    { id: "payments", label: "Payments", icon: DollarSign },
    { id: "documents", label: "Documents", icon: Download }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Policy Summary */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg shadow-green-100/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Coverage Amount</p>
                <p className="text-2xl font-bold text-white/90">{policy.coverageAmount.toLocaleString()} RWF</p>
              </div>
              <div className="w-12 h-12 bg-green-100/80 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-md shadow-green-200/30">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg shadow-blue-100/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Premium Amount</p>
                <p className="text-2xl font-bold text-white/90">{policy.premiumAmount.toLocaleString()} RWF</p>
              </div>
              <div className="w-12 h-12 bg-blue-100/80 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-md shadow-blue-200/30">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg shadow-orange-100/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Deductible</p>
                <p className="text-2xl font-bold text-white/90">{policy.deductible.toLocaleString()} RWF</p>
              </div>
              <div className="w-12 h-12 bg-orange-100/80 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-md shadow-orange-200/30">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg shadow-purple-100/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Farm Size</p>
                <p className="text-2xl font-bold text-white/90">{policy.farmSize} hectares</p>
              </div>
              <div className="w-12 h-12 bg-purple-100/80 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-md shadow-purple-200/30">
                <Crop className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Policy Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg shadow-green-100/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white/90">
              <Shield className="h-5 w-5 mr-2" />
              Policy Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
              <span className="text-sm text-gray-500">Policy ID</span>
              <span className="font-semibold text-white/90">{policy.id}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
              <span className="text-sm text-gray-500">Status</span>
              <Badge className={`${getStatusColor(policy.status)} border`}>
                {policy.status.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
              <span className="text-sm text-gray-500">Risk Level</span>
              <Badge className={`${getRiskLevelColor(policy.riskLevel)} border`}>
                {policy.riskLevel.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
              <span className="text-sm text-gray-500">Start Date</span>
              <span className="font-semibold text-white/90">{policy.startDate}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
              <span className="text-sm text-gray-500">End Date</span>
              <span className="font-semibold text-white/90">{policy.endDate}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg shadow-blue-100/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white/90">
              <User className="h-5 w-5 mr-2" />
              Farmer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-semibold text-white/90">{policy.farmerName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
              <Building2 className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Farmer ID</p>
                <p className="font-semibold text-white/90">{policy.farmerId}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
              <MapPin className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-semibold text-white/90">{policy.location}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
              <Crop className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Crop Type</p>
                <p className="font-semibold text-white/90">{policy.cropType}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderClaimsHistory = () => (
    <Card className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg shadow-orange-100/20">
      <CardHeader>
        <CardTitle className="flex items-center text-white/90">
          <FileText className="h-5 w-5 mr-2" />
          Claims History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {policy.claimHistory.map((claim) => (
            <div key={claim.id} className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-white/90">{claim.id}</p>
                  <p className="text-sm text-gray-500">{claim.description}</p>
                  <p className="text-xs text-gray-400">{claim.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-white/90">{claim.amount.toLocaleString()} RWF</p>
                <Badge className={`${getStatusColor(claim.status)} border`}>
                  {claim.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderPayments = () => (
    <Card className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg shadow-green-100/20">
      <CardHeader>
        <CardTitle className="flex items-center text-white/90">
          <DollarSign className="h-5 w-5 mr-2" />
          Payment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {policy.paymentHistory.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-green-100/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-white/90">{payment.id}</p>
                  <p className="text-sm text-gray-500">{payment.method}</p>
                  <p className="text-xs text-gray-400">{payment.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-white/90">{payment.amount.toLocaleString()} RWF</p>
                <Badge className={`${getStatusColor(payment.status)} border`}>
                  {payment.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderDocuments = () => (
    <Card className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg shadow-purple-100/20">
      <CardHeader>
        <CardTitle className="flex items-center text-white/90">
          <Download className="h-5 w-5 mr-2" />
          Policy Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {policy.documents.map((doc, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-gray-500" />
                <span className="text-white/80">{doc}</span>
              </div>
              <Button size="sm" variant="outline" className="hover:bg-green-50/60 backdrop-blur-sm border-white/40">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout
      userType="insurer"
      userId="INS-001"
      userName="Insurance Company"
      navigationItems={navigationItems}
      activePage="policies"
      onPageChange={(page) => {
        if (page === "dashboard") navigate("/insurer-dashboard");
        else if (page === "claims") navigate("/insurer-dashboard?tab=claims");
        else if (page === "policies") navigate("/insurer-dashboard?tab=policies");
        else if (page === "assessments") navigate("/insurer-dashboard?tab=assessments");
        else if (page === "notifications") navigate("/insurer-dashboard?tab=notifications");
        else if (page === "profile") navigate("/insurer-dashboard?tab=profile");
      }}
      onLogout={() => {
        localStorage.removeItem("userToken");
        localStorage.removeItem("userType");
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
        navigate("/role-selection");
      }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="hover:bg-green-50/60 backdrop-blur-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white/90">Policy Details</h1>
              <p className="text-gray-500">Policy ID: {policy.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={`${getStatusColor(policy.status)} border`}>
              {policy.status.toUpperCase()}
            </Badge>
            <Button variant="outline" className="hover:bg-green-50/60 backdrop-blur-sm border-white/40">
              <Edit className="h-4 w-4 mr-2" />
              Edit Policy
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white/60 backdrop-blur-sm rounded-xl p-1 border border-white/40">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-green-500/80 to-emerald-600/80 text-white shadow-md'
                    : 'text-white/70 hover:bg-white/40'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === "overview" && renderOverview()}
          {activeTab === "claims" && renderClaimsHistory()}
          {activeTab === "payments" && renderPayments()}
          {activeTab === "documents" && renderDocuments()}
        </div>
      </div>
    </DashboardLayout>
  );
}
