import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getClaimById } from "@/services/claimsApi";
import { getFarmById } from "@/services/farmsApi";
import { LossBasicInfoTab } from "../assessor/tabs/loss/LossBasicInfoTab";
import { LossEvidenceTab } from "../assessor/tabs/loss/LossEvidenceTab";
import { LossDetailsTab } from "../assessor/tabs/loss/LossDetailsTab";
import { LossOverviewTab } from "../assessor/tabs/loss/LossOverviewTab";
import { 
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Building2,
  Crop,
  ExternalLink,
  Loader2
} from "lucide-react";

interface Claim {
  id: string;
  farmerId: string;
  farmerName: string;
  policyId: string;
  cropType: string;
  claimAmount: number;
  status: string;
  filedDate: string;
  incidentDate: string;
  description: string;
  location: string;
  assessorId: string;
  assessorName: string;
  priority: string;
}

interface ClaimDetailViewProps {
  claim: Claim;
  onBack: () => void;
  onApprove: (claimId: string, approvedAmount?: number, notes?: string) => void;
  onReject: (claimId: string, reason: string) => void;
  onViewPolicy?: (policyId: string) => void;
}

export default function ClaimDetailView({ claim, onBack, onApprove, onReject, onViewPolicy }: ClaimDetailViewProps) {
  const navigate = useNavigate();
  const [currentClaim, setCurrentClaim] = useState<any | null>(null);
  const [currentFarm, setCurrentFarm] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("basic-info");
  
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvedAmount, setApprovedAmount] = useState<string>(claim.claimAmount.toString());
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  useEffect(() => {
    async function loadClaimAndFarmData() {
      setLoading(true);
      try {
        const claimRes = await getClaimById(claim.id);
        const claimObj = claimRes?.data || claimRes;
        setCurrentClaim(claimObj);
        
        const farmId = claimObj?.farmId || claimObj?.fieldId || claimObj?.farm;
        if (farmId) {
          if (typeof farmId === 'object' && farmId !== null) {
            setCurrentFarm(farmId);
          } else {
            const farmRes = await getFarmById(farmId);
            setCurrentFarm(farmRes?.data || farmRes);
          }
        }
      } catch (err) {
        console.error("Failed to fetch full claim or farm details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadClaimAndFarmData();
  }, [claim.id]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_review": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "approved": return "bg-green-100 text-green-800 border-green-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      case "under_investigation": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const handleApprove = () => {
    const amount = approvedAmount ? parseFloat(approvedAmount) : undefined;
    onApprove(claim.id, amount, approvalNotes);
    setShowApprovalForm(false);
    setApprovalNotes("");
  };

  const handleReject = () => {
    onReject(claim.id, rejectionReason);
    setShowRejectionForm(false);
    setRejectionReason("");
  };

  const handleViewPolicy = () => {
    if (onViewPolicy) {
      onViewPolicy(claim.policyId);
    } else {
      navigate(`/policy-details/${claim.policyId}`);
    }
  };

  if (loading || !currentClaim) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-gray-100">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Claims
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Loading Claim Details...</h1>
        </div>
        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Claims
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Claim Review</h1>
            <p className="text-sm text-gray-500">Claim ID: {claim.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={`${getPriorityColor(claim.priority)} border`}>
            {claim.priority.toUpperCase()} PRIORITY
          </Badge>
          <Badge className={`${getStatusColor(claim.status)} border`}>
            {claim.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Claim Details with correct Assessor Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 border border-gray-200">
                  <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
                  <TabsTrigger value="evidence">Evidence</TabsTrigger>
                  <TabsTrigger value="details">Loss Details</TabsTrigger>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                  <TabsContent value="basic-info">
                    <LossBasicInfoTab 
                      field={currentFarm} 
                      claim={currentClaim} 
                      farmerName={claim.farmerName}
                    />
                  </TabsContent>

                  <TabsContent value="evidence">
                    <LossEvidenceTab 
                      claim={currentClaim} 
                      isInsurer={true}
                    />
                  </TabsContent>

                  <TabsContent value="details">
                    <LossDetailsTab 
                      claim={currentClaim} 
                      isInsurer={true}
                    />
                  </TabsContent>

                  <TabsContent value="overview">
                    <LossOverviewTab 
                      claim={currentClaim} 
                      fieldName={currentFarm?.name || "Field"} 
                      isInsurer={true}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Farmer Information */}
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2 text-green-600" />
                Farmer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm font-semibold text-gray-900">{claim.farmerName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <Building2 className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Farmer ID</p>
                  <p className="text-sm font-mono text-gray-900">{claim.farmerId}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-sm font-semibold text-gray-900">{claim.location}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Policy Information */}
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-green-600" />
                Policy Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <FileText className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Policy ID</p>
                  <button
                    onClick={handleViewPolicy}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors flex items-center space-x-1"
                  >
                    <span>
                      {typeof claim.policyId === 'object' && claim.policyId !== null 
                        ? ((claim.policyId as any).policyNumber || (claim.policyId as any)._id || '—') 
                        : (claim.policyId || '—')}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <Crop className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Coverage</p>
                  <p className="text-sm font-semibold text-gray-900">{claim.cropType}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">Review Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {claim.status === "pending_review" && !showApprovalForm && !showRejectionForm && (
                <>
                  <Button 
                    onClick={() => setShowApprovalForm(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Approve Claim
                  </Button>
                  <Button 
                    onClick={() => setShowRejectionForm(true)}
                    variant="outline"
                    className="w-full border-gray-200 hover:bg-red-50 hover:text-red-600 text-gray-700"
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Reject Claim
                  </Button>
                </>
              )}

              {showApprovalForm && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="approved-amount" className="text-sm font-medium text-gray-700">Approved Payout (RWF)</Label>
                    <Input
                      id="approved-amount"
                      type="number"
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(e.target.value)}
                      placeholder="Enter approved payout amount"
                      className="border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="approval-notes" className="text-sm font-medium text-gray-700">Approval Notes</Label>
                    <Textarea
                      id="approval-notes"
                      placeholder="Add notes for the farmer and assessor..."
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      className="border-gray-200"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleApprove}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm
                    </Button>
                    <Button 
                      onClick={() => setShowApprovalForm(false)}
                      variant="outline"
                      className="border-gray-200"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {showRejectionForm && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rejection-reason" className="text-sm font-medium text-gray-700">Rejection Reason</Label>
                    <Textarea
                      id="rejection-reason"
                      placeholder="Provide detailed reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="border-gray-200"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleReject}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button 
                      onClick={() => setShowRejectionForm(false)}
                      variant="outline"
                      className="border-gray-200"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {claim.status !== "pending_review" && (
                <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 border border-gray-100 rounded-lg text-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <p className="text-sm font-semibold text-gray-900">Review Completed</p>
                  <p className="text-xs text-gray-500">
                    This claim was marked as <strong className="capitalize">{claim.status.replace('_', ' ')}</strong> on {claim.filedDate}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
