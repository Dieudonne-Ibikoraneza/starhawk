import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  DollarSign,
  Shield,
  Crop,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  Sprout,
  Maximize2
} from "lucide-react";

interface Policy {
  id: string;
  policyNumber: string;
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
  farmName: string;
  riskLevel: "low" | "medium" | "high";
  deductible: number;
  createdAt: string;
  coverageLevel: string;
}

interface PolicyDetailsViewProps {
  policy: Policy;
  onBack: () => void;
}

export default function PolicyDetailsView({ policy, onBack }: PolicyDetailsViewProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "expired": return "bg-red-100 text-red-800 border-red-200";
      case "cancelled": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending": return <Clock className="h-4 w-4 text-yellow-600" />;
      case "expired": return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "cancelled": return <X className="h-4 w-4 text-gray-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCoverageLevelBadgeColor = (level: string) => {
    const l = level.toUpperCase();
    if (l === "PREMIUM") return "bg-indigo-100 text-indigo-800 border-indigo-200";
    if (l === "STANDARD") return "bg-sky-100 text-sky-800 border-sky-200";
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  const formatCropTypeLabel = (crop: string) => {
    if (!crop || crop === "Unknown") return "Unknown Crop";
    return crop.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const formattedDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Policies
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Policy Details</h1>
            <p className="text-sm font-semibold text-gray-500 mt-1 font-mono">Number: {policy.policyNumber}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className={`${getStatusColor(policy.status)} py-1.5 px-3 rounded-xl flex items-center gap-1.5 shadow-none text-xs font-bold`}>
            {getStatusIcon(policy.status)}
            <span className="capitalize">{policy.status}</span>
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Policy Status & Period Card */}
        <Card className="border border-gray-100 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/70 border-b border-gray-100 py-4">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Policy Status & Period
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-sm font-semibold text-gray-500">Current Status</span>
              <Badge variant="outline" className={`${getStatusColor(policy.status)} py-1 px-2.5 rounded-lg shadow-none text-xs font-bold capitalize`}>
                {policy.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-sm font-semibold text-gray-500">Date Issued</span>
              <span className="text-sm font-bold text-gray-900">{formattedDate(policy.createdAt)}</span>
            </div>
            <div className="space-y-2 pt-2">
              <span className="text-sm font-semibold text-gray-500 block">Coverage Period</span>
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium">Valid From</span>
                  <span className="text-sm font-bold text-slate-900">{formattedDate(policy.startDate)} to {formattedDate(policy.endDate)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coverage & Premium Card */}
        <Card className="border border-gray-100 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/70 border-b border-gray-100 py-4">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              Coverage & Premium
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-sm font-semibold text-gray-500">Coverage Level</span>
              <Badge variant="outline" className={`${getCoverageLevelBadgeColor(policy.coverageLevel)} py-1 px-2.5 rounded-lg shadow-none text-xs font-bold`}>
                {policy.coverageLevel.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2 pt-4">
              <span className="text-sm font-semibold text-gray-500">Premium Amount</span>
              <div className="text-right">
                <p className="text-2xl font-black text-gray-900">{policy.premiumAmount.toLocaleString()} RWF</p>
                <p className="text-[10px] text-gray-400 font-medium">Total policy cost</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Farmer & Farm Details Card */}
        <Card className="border border-gray-100 shadow-sm bg-white rounded-2xl overflow-hidden md:col-span-2">
          <CardHeader className="bg-slate-50/70 border-b border-gray-100 py-4">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              Farmer & Farm Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Farmer Name</span>
                <span className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  {policy.farmerName}
                </span>
              </div>
              <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Farm Name</span>
                <span className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Maximize2 className="h-4 w-4 text-slate-400" />
                  {policy.farmName}
                </span>
              </div>
              <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Farm Size</span>
                <span className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Maximize2 className="h-4 w-4 text-slate-400" />
                  {policy.farmSize.toFixed(2)} hectares
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Location</span>
                <span className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {policy.location}
                </span>
              </div>
              <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Crop Type</span>
                <span className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Sprout className="h-4 w-4 text-slate-400" />
                  {formatCropTypeLabel(policy.cropType)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
