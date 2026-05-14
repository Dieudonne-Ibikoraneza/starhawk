import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getClaimById } from "@/services/claimsApi";
import { getFarmById } from "@/services/farmsApi";
import { getRiskAnalysis, getInsight } from "@/services/aiApi";
import { useToast } from "@/hooks/use-toast";
import { AiChatInterface } from "../common/AiChatInterface";
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
  Loader2,
  Sparkles,
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
  onApprove: (claimId: string, approvedAmount?: number, notes?: string) => void | Promise<void>;
  onReject: (claimId: string, reason: string) => void | Promise<void>;
  onViewPolicy?: (policyId: string) => void;
}

export default function ClaimDetailView({ claim, onBack, onApprove, onReject, onViewPolicy }: ClaimDetailViewProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentClaim, setCurrentClaim] = useState<any | null>(null);
  const [currentFarm, setCurrentFarm] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("basic-info");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvedAmount, setApprovedAmount] = useState<string>(claim.claimAmount.toString());
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  // AI States
  const [aiRiskAnalysis, setAiRiskAnalysis] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleFetchAiInsights = async () => {
    if (!currentClaim) return;
    setAiLoading(true);
    try {
      const analysis = await getRiskAnalysis(currentClaim, currentFarm || {}, {}, 'INSURER');
      if (analysis) {
        setAiRiskAnalysis(analysis);
        toast({
          title: "AI Analysis Complete",
          description: "Starhawk AI has completed the claim risk evaluation.",
        });
      }
    } catch (err: any) {
      toast({
        title: "AI Error",
        description: err.message || "Failed to connect to AI risk engine.",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

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

        // Auto-fetch existing AI analysis
        const existingAnalysis = await getInsight(claim.id, 'RISK_ANALYSIS', 'INSURER');
        if (existingAnalysis) {
          setAiRiskAnalysis(existingAnalysis);
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

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const amount = approvedAmount ? parseFloat(approvedAmount) : undefined;
      await onApprove(claim.id, amount, undefined); // notes removed as requested!
      setShowApprovalForm(false);
    } catch (err) {
      console.error("Approve failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      await onReject(claim.id, rejectionReason);
      setShowRejectionForm(false);
      setRejectionReason("");
    } catch (err) {
      console.error("Reject failed:", err);
    } finally {
      setIsSubmitting(false);
    }
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
          {/* Starhawk AI Insights Card */}
          <Card className="border-green-200 shadow-md bg-gradient-to-br from-white to-green-50 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Sparkles className="h-24 w-24 text-green-600" />
            </div>
            <CardHeader className="border-b border-green-100/50 pb-4">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-green-900 font-bold">Starhawk AI Decision Support</span>
                </div>
                {!aiRiskAnalysis && !aiLoading && (
                  <Button 
                    size="sm" 
                    onClick={handleFetchAiInsights}
                    className="bg-green-600 hover:bg-green-700 text-white shadow-sm gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Verify with AI
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="h-10 w-10 animate-spin text-green-600" />
                  <p className="text-sm text-green-700 animate-pulse font-medium">Starhawk AI is validating claim parameters...</p>
                </div>
              ) : aiRiskAnalysis ? (
                <AiChatInterface 
                  initialInsight={aiRiskAnalysis}
                  title="Starhawk AI Decision Support"
                  role="INSURER"
                  borderless={true}
                  suggestedQuestions={[
                    "Why is this claim High Risk?",
                    "Are the drone reports valid?",
                    "What are the specific red flags?",
                    "How does the NDVI compare?"
                  ]}
                />
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 italic">
                    Utilize Starhawk AI to cross-reference this claim against satellite vegetation indices and weather reports.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

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
          <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-gray-50 bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-wider">Review Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {!["approved", "rejected"].includes(claim.status?.toLowerCase()) && (
                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={() => setShowApprovalForm(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Approve & Payout
                  </Button>
                  <Button 
                    onClick={() => setShowRejectionForm(true)}
                    variant="outline"
                    className="w-full border-rose-200 hover:bg-rose-50 text-rose-600 hover:text-rose-700 font-bold rounded-xl h-11 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    Reject Claim
                  </Button>
                </div>
              )}

              {["approved", "rejected"].includes(claim.status?.toLowerCase()) && (
                <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 border border-gray-100 rounded-xl text-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <p className="text-sm font-bold text-gray-900">Review Completed</p>
                  <p className="text-xs text-gray-500">
                    This claim was marked as <strong className="capitalize">{claim.status.replace('_', ' ')}</strong> on {claim.filedDate}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approve & Payout Dialog */}
          <Dialog open={showApprovalForm} onOpenChange={(open) => !isSubmitting && setShowApprovalForm(open)}>
            <DialogContent className="sm:max-w-[450px] bg-white rounded-2xl p-6 border border-gray-100">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                  Approve Payout
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500 mt-1">
                  Specify the final payout amount to settle this claim. This will notify the farmer.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-4">
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Original Claim Amount</p>
                    <p className="text-lg font-bold text-slate-800 mt-0.5">${claim.claimAmount.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-emerald-600 opacity-20" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="approved-amount" className="text-sm font-semibold text-gray-700">Payout Amount ($)</Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">$</span>
                    <Input
                      id="approved-amount"
                      type="number"
                      disabled={isSubmitting}
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(e.target.value)}
                      placeholder="Enter payout amount"
                      className="pl-8 h-12 border-gray-200 rounded-xl focus-visible:ring-emerald-500 font-semibold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-gray-50">
                <Button
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setShowApprovalForm(false)}
                  className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl px-4 h-11"
                >
                  Cancel
                </Button>
                <Button
                  disabled={isSubmitting || !approvedAmount}
                  onClick={handleApprove}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-5 h-11"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Approve & Pay
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Reject Claim Dialog */}
          <Dialog open={showRejectionForm} onOpenChange={(open) => !isSubmitting && setShowRejectionForm(open)}>
            <DialogContent className="sm:max-w-[450px] bg-white rounded-2xl p-6 border border-gray-100">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-rose-600" />
                  Reject Claim
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500 mt-1">
                  Provide a clear, detailed reason for declining this claim.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="rejection-reason" className="text-sm font-semibold text-gray-700">Reason for Rejection *</Label>
                  <Textarea
                    id="rejection-reason"
                    disabled={isSubmitting}
                    placeholder="Describe why this claim is being rejected (e.g., Insufficient weather threshold met)..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="min-h-[120px] border-gray-200 rounded-xl focus-visible:ring-rose-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-gray-50">
                <Button
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setShowRejectionForm(false)}
                  className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl px-4 h-11"
                >
                  Cancel
                </Button>
                <Button
                  disabled={isSubmitting || !rejectionReason.trim()}
                  onClick={handleReject}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl px-5 h-11"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Declining...
                    </>
                  ) : (
                    <>
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      Decline Claim
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
