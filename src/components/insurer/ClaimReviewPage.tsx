import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { approveClaim as approveClaimApi, rejectClaim as rejectClaimApi, flagClaim as flagClaimApi, getClaimById, getClaims } from "@/services/claimsApi";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import { 
  ArrowLeft,
  FileText, 
  User, 
  MapPin, 
  Calendar,
  DollarSign,
  Camera,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  MessageSquare,
  Phone,
  Mail,
  Building2,
  Crop,
  TrendingUp,
  Shield,
  Sparkles,
  Loader2,
  Activity
} from "lucide-react";
import { AiChatInterface } from "../common/AiChatInterface";
import { getRiskAnalysis, getInsight } from "@/services/aiApi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LossOverviewTab } from "../assessor/tabs/loss/LossOverviewTab";
import { LossEvidenceTab } from "../assessor/tabs/loss/LossEvidenceTab";
import { LossBasicInfoTab } from "../assessor/tabs/loss/LossBasicInfoTab";
import { LossDetailsTab } from "../assessor/tabs/loss/LossDetailsTab";
import { getFarmById } from "@/services/farmsApi";

export default function ClaimReviewPage() {
  const { toast } = useToast();
  const { claimId } = useParams();
  const [selectedClaimId, setSelectedClaimId] = useState<string>(claimId || "");
  const [claims, setClaims] = useState<any[]>([]);
  const [currentClaim, setCurrentClaim] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingClaim, setLoadingClaim] = useState(false);
  const [reviewDecision, setReviewDecision] = useState("");
  const [reviewComments, setReviewComments] = useState("");
  const [approvedAmount, setApprovedAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentFarm, setCurrentFarm] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("info");
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [isFlagDialogOpen, setIsFlagDialogOpen] = useState(false);
  const [correctionReason, setCorrectionReason] = useState("");

  // AI States
  const [aiRiskAnalysis, setAiRiskAnalysis] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Load claims list
  useEffect(() => {
    loadClaims();
  }, []);

  // Load specific claim when selected
  useEffect(() => {
    if (selectedClaimId) {
      loadClaimDetails(selectedClaimId);
    }
  }, [selectedClaimId]);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const response: any = await getClaims(1, 100);
      let claimsData: any[] = [];
      
      if (Array.isArray(response)) {
        claimsData = response;
      } else if (response && typeof response === 'object') {
        claimsData = response.data || response.claims || [];
      }
      
      setClaims(claimsData);
      // Auto-select first pending claim if available
      const firstPending = claimsData.find((c: any) => c.status === 'pending_review' || c.status === 'pending');
      if (firstPending && !selectedClaimId) {
        setSelectedClaimId(firstPending._id || firstPending.id);
      }
    } catch (err: any) {
      console.error('Failed to load claims:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to load claims',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClaimDetails = async (claimId: string) => {
    setLoadingClaim(true);
    try {
      const response: any = await getClaimById(claimId);
      const claimData = response.data || response;
      setCurrentClaim(claimData);
      
      const farmId = claimData?.farmId || claimData?.fieldId || claimData?.farm;
      if (farmId) {
        if (typeof farmId === 'object' && farmId !== null) {
          setCurrentFarm(farmId);
        } else {
          try {
            const farmRes = await getFarmById(farmId);
            setCurrentFarm(farmRes?.data || farmRes);
          } catch (err) {
            console.error("Failed to fetch farm details:", err);
          }
        }
      }

      // Auto-fetch existing AI analysis
      try {
        const existingAnalysis = await getInsight(claimId, 'RISK_ANALYSIS', 'INSURER');
        if (existingAnalysis) {
          setAiRiskAnalysis(existingAnalysis);
        }
      } catch (err) {
        console.warn("Failed to fetch existing AI analysis:", err);
      }
    } catch (err: any) {
      console.error('Failed to load claim details:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to load claim details',
        variant: "destructive",
      });
    } finally {
      setLoadingClaim(false);
    }
  };

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

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "pending":
      case "pending_review": return "bg-amber-100 text-amber-800 border-amber-200";
      case "approved": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "rejected": return "bg-rose-100 text-rose-800 border-rose-200";
      case "under_investigation":
      case "in_progress": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "pending":
      case "pending_review": return <Clock className="h-3.5 w-3.5" />;
      case "approved": return <CheckCircle className="h-3.5 w-3.5" />;
      case "rejected": return <XCircle className="h-3.5 w-3.5" />;
      case "under_investigation":
      case "in_progress": return <Activity className="h-3.5 w-3.5" />;
      default: return <Clock className="h-3.5 w-3.5" />;
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewDecision) return;

    if (!selectedClaimId) {
      toast({
        title: "Error",
        description: "No claim selected",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (reviewDecision === "approve") {
        if (!approvedAmount) {
           toast({ title: "Error", description: "Please provide payout amount", variant: "destructive" });
           setIsSubmitting(false);
           return;
        }
        const amount = parseFloat(approvedAmount);
        await approveClaimApi(selectedClaimId, amount, reviewComments || "Claim approved after verification.");
        toast({
          title: "Success",
          description: "Claim approved successfully",
          variant: "default",
        });
        setIsApprovalDialogOpen(false);
      } else if (reviewDecision === "reject") {
        if (!reviewComments) {
          toast({ title: "Error", description: "Please provide a rejection reason", variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
        await rejectClaimApi(selectedClaimId, reviewComments);
        toast({
          title: "Success",
          description: "Claim rejected successfully",
          variant: "default",
        });
        setIsRejectionDialogOpen(false);
      } else if (reviewDecision === "flag") {
        if (!correctionReason) {
          toast({ title: "Error", description: "Please provide a correction reason", variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
        await flagClaimApi(selectedClaimId, correctionReason);
        toast({
          title: "Success",
          description: "Claim flagged for correction successfully",
          variant: "default",
        });
        setIsFlagDialogOpen(false);
      }
      
      await loadClaimDetails(selectedClaimId);
      loadClaims();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setReviewDecision("");
      setReviewComments("");
      setApprovedAmount("");
      setCorrectionReason("");
    }
  };

  const renderClaimSummary = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Claim Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-sm font-medium text-gray-700">Claim ID</Label>
            <p className="text-lg font-semibold">{currentClaim?._id || currentClaim?.id || 'N/A'}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-400">Status</Label>
            <div className="mt-1">
              <Badge className={getStatusColor(currentClaim?.status || "")}>
                {getStatusIcon(currentClaim?.status || "")}
                <span className="ml-1 capitalize">{currentClaim?.status?.replace('_', ' ')}</span>
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-400">Claim Amount</Label>
            <p className="text-lg font-semibold text-green-600">
              {(currentClaim?.amount || currentClaim?.claimAmount || 0).toLocaleString()} RWF
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-400">Filed Date</Label>
            <p className="text-lg">{currentClaim?.filedDate || currentClaim?.createdAt || 'N/A'}</p>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-400">Description</Label>
          <p className="text-gray-900 mt-1">{currentClaim?.description || currentClaim?.lossDescription || 'No description available'}</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderFarmerInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="h-5 w-5 mr-2" />
          Farmer Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-sm font-medium text-gray-700">Farmer Name</Label>
            <p className="text-lg font-semibold">
              {currentClaim?.farmer?.firstName && currentClaim?.farmer?.lastName
                ? `${currentClaim.farmer.firstName} ${currentClaim.farmer.lastName}`
                : currentClaim?.farmer?.name || currentClaim?.farmerName || 'Unknown Farmer'}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Farmer ID</Label>
            <p className="text-lg">{currentClaim?.farmerId || currentClaim?.farmer?._id || currentClaim?.farmer?.id || 'N/A'}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-sm font-medium text-gray-700">Location</Label>
            <p className="text-gray-900">{currentClaim?.location || currentClaim?.farm?.location || 'N/A'}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Farm Size</Label>
            <p className="text-gray-900">{currentClaim?.farmSize || currentClaim?.farm?.size || 'N/A'} {currentClaim?.farmSize ? 'hectares' : ''}</p>
          </div>
        </div>

        <div className="flex space-x-4">
          <Button variant="outline" size="sm">
            <Phone className="h-4 w-4 mr-2" />
            Call Farmer
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderPolicyInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Policy Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-sm font-medium text-gray-700">Policy ID</Label>
            <p className="text-lg font-semibold">
              {typeof currentClaim?.policyId === 'object' && currentClaim?.policyId !== null 
                ? (currentClaim?.policyId.policyNumber || currentClaim?.policyId._id || '—') 
                : (currentClaim?.policyId || '—')}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Crop Type</Label>
            <p className="text-lg">{currentClaim?.cropType}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label className="text-sm font-medium text-gray-700">Coverage</Label>
            <p className="text-lg font-semibold text-blue-600">
              {(currentClaim?.policy?.coverageAmount || currentClaim?.policy?.coverage || currentClaim?.policyDetails?.coverage || 0).toLocaleString()} RWF
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Premium</Label>
            <p className="text-lg">{(currentClaim?.policy?.premiumAmount || currentClaim?.policy?.premium || currentClaim?.policyDetails?.premium || 0).toLocaleString()} RWF</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Deductible</Label>
            <p className="text-lg">{(currentClaim?.policy?.deductible || currentClaim?.policyDetails?.deductible || 0).toLocaleString()} RWF</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-sm font-medium text-gray-700">Policy Start</Label>
            <p className="text-gray-900">{currentClaim?.policy?.startDate || currentClaim?.policy?.validityPeriod?.start || currentClaim?.policyDetails?.startDate || 'N/A'}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Policy End</Label>
            <p className="text-gray-900">{currentClaim?.policy?.endDate || currentClaim?.policy?.validityPeriod?.end || currentClaim?.policy?.validityPeriod || currentClaim?.policyDetails?.endDate || 'N/A'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderAssessmentInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Assessment Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-sm font-medium text-gray-700">Assessor</Label>
            <p className="text-lg font-semibold">
              {currentClaim?.assessor?.firstName && currentClaim?.assessor?.lastName
                ? `${currentClaim.assessor.firstName} ${currentClaim.assessor.lastName}`
                : currentClaim?.assessor?.name || currentClaim?.assessorName || 'Unassigned'}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Assessment Date</Label>
            <p className="text-lg">{currentClaim?.assessmentDate || currentClaim?.assessment?.date || currentClaim?.createdAt || 'N/A'}</p>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700">Assessment Notes</Label>
          <p className="text-gray-900 mt-1">{currentClaim?.assessmentNotes || currentClaim?.assessment?.notes || currentClaim?.notes || 'No assessment notes available'}</p>
        </div>

        <div className="flex space-x-4">
          <Button variant="outline" size="sm">
            <Phone className="h-4 w-4 mr-2" />
            Call Assessor
          </Button>
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Message Assessor
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderPhotos = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Camera className="h-5 w-5 mr-2" />
          Field Photos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {currentClaim?.photos && Array.isArray(currentClaim.photos) && currentClaim.photos.length > 0 ? (
            currentClaim.photos.map((photo: any, index: number) => (
              <div key={photo.id || photo._id || index} className="space-y-2">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={photo.url || photo.photoUrl || photo.src || '/api/placeholder/400/300'} 
                    alt={photo.description || photo.alt || 'Claim photo'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                  />
                </div>
                <p className="text-sm text-gray-700 text-center">{photo.description || 'Claim photo'}</p>
              </div>
            ))
          ) : currentClaim?.damagePhotos && Array.isArray(currentClaim.damagePhotos) && currentClaim.damagePhotos.length > 0 ? (
            currentClaim.damagePhotos.map((photoUrl: string, index: number) => (
              <div key={index} className="space-y-2">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={photoUrl || '/api/placeholder/400/300'} 
                    alt="Claim photo"
                    className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                  />
                </div>
                <p className="text-sm text-gray-700 text-center">Damage photo {index + 1}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 col-span-full text-center py-8">No photos available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderDocuments = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Supporting Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {currentClaim?.documents && Array.isArray(currentClaim.documents) && currentClaim.documents.length > 0 ? (
            currentClaim.documents.map((doc: any, index: number) => (
              <div key={doc.id || doc._id || index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-white">{doc.name || doc.fileName || 'Document'}</p>
                    <p className="text-sm text-gray-500">{doc.type || 'File'} • {doc.size || 'N/A'}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No documents available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderDecisionDialogs = () => (
    <>
      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Approve Claim
            </DialogTitle>
            <DialogDescription>
              Set the final payout amount for this claim settlement.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="approvedAmount" className="text-xs font-bold text-gray-500 uppercase">Payout Amount (RWF)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="approvedAmount"
                  type="number"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                  placeholder="e.g. 500000"
                  className="pl-10 h-12 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="appComments" className="text-xs font-bold text-gray-500 uppercase">Approval Comments (Optional)</Label>
              <Textarea
                id="appComments"
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder="Add any internal notes..."
                className="rounded-xl min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                setReviewDecision("approve");
                handleSubmitReview();
              }}
              disabled={isSubmitting || !approvedAmount}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Reject Claim
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this claim. This will be visible to the farmer and assessor.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason" className="text-xs font-bold text-gray-500 uppercase">Rejection Reason</Label>
              <Textarea
                id="rejectReason"
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder="Explain why this claim is being rejected..."
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsRejectionDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                setReviewDecision("reject");
                handleSubmitReview();
              }}
              disabled={isSubmitting || !reviewComments}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFlagDialogOpen} onOpenChange={setIsFlagDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Flag for Correction
            </DialogTitle>
            <DialogDescription>
              Please provide instructions for the assessor on what needs to be corrected or verified.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="correctionReason" className="text-xs font-bold text-gray-500 uppercase">Correction Reason</Label>
              <Textarea
                id="correctionReason"
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="What should the assessor review or correct?"
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsFlagDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                setReviewDecision("flag");
                handleSubmitReview();
              }}
              disabled={isSubmitting || !correctionReason}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
              Flag for Correction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  const farmerName = currentClaim?.farmerId?.firstName && currentClaim?.farmerId?.lastName
    ? `${currentClaim.farmerId.firstName} ${currentClaim.farmerId.lastName}`
    : currentClaim?.farmer?.firstName && currentClaim?.farmer?.lastName
    ? `${currentClaim.farmer.firstName} ${currentClaim.farmer.lastName}`
    : currentClaim?.farmerName || currentFarm?.farmerId?.firstName || currentFarm?.farmerName || 'N/A';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="text-gray-500 hover:text-gray-700 -ml-2 mb-2 h-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Claims
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Claim Review: {currentClaim?._id?.slice(-8).toUpperCase() || currentClaim?.id?.slice(-8).toUpperCase() || 'N/A'}
            </h1>
            <Badge className={getStatusColor(currentClaim?.status || "") + " border-0 shadow-none px-3 py-1 font-bold text-[10px]"}>
              {getStatusIcon(currentClaim?.status || "")}
              <span className="ml-1.5 capitalize">{currentClaim?.status?.replace('_', ' ')}</span>
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1 font-medium flex items-center">
            <User className="h-4 w-4 mr-1.5 text-gray-400" />
            Farmer: <span className="text-gray-900 ml-1">{farmerName}</span>
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-4">
           {currentClaim?.status?.toLowerCase() === 'approved' ? (
             <div className="text-right hidden md:block">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payout Amount</p>
                <p className="text-lg font-bold text-green-600">
                  {(currentClaim?.payoutAmount || currentClaim?.amount || currentClaim?.claimAmount || 0).toLocaleString()} RWF
                </p>
             </div>
           ) : (
             (currentClaim?.status?.toLowerCase() === 'pending' || 
              currentClaim?.status?.toLowerCase() === 'pending_review' || 
              currentClaim?.status?.toLowerCase() === 'submitted' || 
              currentClaim?.status?.toLowerCase() === 'in_progress') && (
               <div className="flex gap-2 flex-wrap">
                  <Button 
                    onClick={() => setIsApprovalDialogOpen(true)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold h-10 px-4 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
                  >
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    Approve
                  </Button>
                  <Button 
                    onClick={() => setIsFlagDialogOpen(true)}
                    variant="outline"
                    className="border-amber-200 text-amber-600 hover:bg-amber-50 font-bold h-10 px-4 rounded-xl transition-all hover:scale-105 active:scale-95"
                  >
                    <AlertTriangle className="h-4 w-4 mr-1.5" />
                    Flag for Correction
                  </Button>
                  <Button 
                    onClick={() => setIsRejectionDialogOpen(true)}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 font-bold h-10 px-4 rounded-xl transition-all hover:scale-105 active:scale-95"
                  >
                    <XCircle className="h-4 w-4 mr-1.5" />
                    Reject
                  </Button>
               </div>
             )
           )}
        </div>
      </div>
        
      {/* Loading State */}
      {loadingClaim ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="text-center">
            <Clock className="h-10 w-10 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Loading comprehensive claim data...</p>
          </div>
        </div>
      ) : !currentClaim ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-200" />
            <p className="text-gray-500 font-medium">Claim not found or access denied</p>
            <Button onClick={() => window.history.back()} variant="link" className="mt-2">Return to claims list</Button>
          </div>
        </div>
      ) : (
        <>
          {/* Alert for pending review */}
          {(currentClaim?.status === "pending_review" || currentClaim?.status === "pending") && (
            <Alert className="bg-blue-50 border-blue-100 text-blue-800 rounded-xl">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="font-medium">
                This claim is pending review. Please verify all satellite evidence and assessor reports before making a final decision.
              </AlertDescription>
            </Alert>
          )}

          {/* Main Content Grid */}
          <div className="space-y-6">
            {/* Starhawk AI Insights Card - Header Takeover */}
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

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Content - Tabs */}
              <div className="lg:col-span-3 space-y-6">
                <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                  <CardContent className="p-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-4 border border-gray-100 bg-gray-50/50 p-1">
                        <TabsTrigger value="info" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Basic Info</TabsTrigger>
                        <TabsTrigger value="evidence" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Evidence</TabsTrigger>
                        <TabsTrigger value="details" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Loss Details</TabsTrigger>
                        <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
                      </TabsList>

                      <div className="mt-6">
                        <TabsContent value="info">
                          <LossBasicInfoTab 
                            field={currentFarm} 
                            claim={currentClaim} 
                            farmerName={farmerName}
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
            </div>
          </div>
          {renderDecisionDialogs()}
        </>
      )}
    </div>
  );
}
