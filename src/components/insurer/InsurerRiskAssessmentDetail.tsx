import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle, AlertTriangle, MapPin, Download, Shield, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import assessmentsApiService from "@/services/assessmentsApi";
import { createPolicyFromAssessment, getPolicies, updatePolicy } from "@/services/policiesApi";
import { Link } from "react-router-dom";
import OverviewTab from "../assessor/tabs/OverviewTab";
import DroneTab from "../assessor/tabs/DroneTab";
import { WeatherAnalysisTab } from "../assessor/tabs/WeatherAnalysisTab";
import { BasicInfoTab } from "../assessor/tabs/BasicInfoTab";

const CROP_HARVEST_DURATIONS_MONTHS: Record<string, number> = {
  maize: 6,
  rice: 5,
  wheat: 6,
  beans: 4,
  soybeans: 5,
  potatoes: 4,
  coffee: 12,
  tea: 12,
};


export default function InsurerRiskAssessmentDetail({ 
  assessmentId: propAssessmentId, 
  onBack, 
  onActionComplete 
}: { 
  assessmentId?: string; 
  onBack?: () => void;
  onActionComplete?: () => void;
}) {
  const { toast } = useToast();
  const { assessmentId: paramAssessmentId } = useParams();
  const assessmentId = propAssessmentId || paramAssessmentId || "";
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  
  // Rejection Dialog state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Flag Dialog state
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);
  const [correctionReason, setCorrectionReason] = useState("");

  // Policy Creation Dialog state
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [isCreatingPolicy, setIsCreatingPolicy] = useState(false);
  const [coverageLevel, setCoverageLevel] = useState<"BASIC" | "STANDARD" | "PREMIUM">("STANDARD");
  const [policyStartDate, setPolicyStartDate] = useState("");
  const [policyEndDate, setPolicyEndDate] = useState("");
  const [associatedPolicy, setAssociatedPolicy] = useState<any>(null);

  useEffect(() => {
    loadAssessment();
  }, [assessmentId]);

  useEffect(() => {
    if (assessment && (assessment.status === 'POLICY_ISSUED' || assessment.status === 'APPROVED')) {
      getPolicies().then((res: any) => {
        const policiesArray = Array.isArray(res?.data?.items) ? res.data.items : Array.isArray(res) ? res : res?.data || res?.items || res?.results || [];
        const policy = policiesArray.find((p: any) => 
          p.assessmentId === assessmentId || 
          (p.assessmentId && (p.assessmentId._id === assessmentId || p.assessmentId.id === assessmentId))
        );
        if (policy) {
          setAssociatedPolicy(policy);
        }
      }).catch(console.error);
    }
  }, [assessment, assessmentId]);

  useEffect(() => {
    if (showPolicyDialog && assessment) {
      if (associatedPolicy) {
        setCoverageLevel(associatedPolicy.coverageLevel || "STANDARD");
        setPolicyStartDate(associatedPolicy.startDate ? new Date(associatedPolicy.startDate).toISOString().split('T')[0] : "");
        setPolicyEndDate(associatedPolicy.endDate ? new Date(associatedPolicy.endDate).toISOString().split('T')[0] : "");
        return;
      }
      const today = new Date();
      setPolicyStartDate(today.toISOString().split('T')[0]);

      const farm = assessment.farmId || assessment.farm || {};
      const cropType = (farm.cropType || farm.crop || "maize").toLowerCase();
      
      const durationMonths = CROP_HARVEST_DURATIONS_MONTHS[cropType] || 6;
      
      // Use sowingDate if available, otherwise fallback to assessment creation date or today
      const sowingDateStr = farm.sowingDate || assessment.createdAt || today.toISOString();
      const sowingDate = new Date(sowingDateStr);
      
      const endDate = new Date(sowingDate);
      endDate.setMonth(endDate.getMonth() + durationMonths);
      
      // Ensure the end date is at least some days in the future, just in case
      if (endDate <= today) {
        endDate.setMonth(today.getMonth() + 1); // fallback to 1 month from today if already harvested
      }

      setPolicyEndDate(endDate.toISOString().split('T')[0]);
    }
  }, [showPolicyDialog, assessment]);

  const loadAssessment = async () => {
    setLoading(true);
    try {
      const response = await assessmentsApiService.getAssessmentById(assessmentId);
      setAssessment(response.data || response);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load assessment details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await assessmentsApiService.approveAssessment(assessmentId);
      toast({ title: "Success", description: "Assessment approved successfully" });
      await loadAssessment();
      if (onActionComplete) onActionComplete();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to approve", variant: "destructive" });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Rejection reason is required",
        variant: "destructive"
      });
      return;
    }
    setIsRejecting(true);
    try {
      await assessmentsApiService.rejectAssessment(assessmentId, rejectionReason);
      toast({ title: "Success", description: "Assessment rejected successfully" });
      setShowRejectDialog(false);
      await loadAssessment();
      if (onActionComplete) onActionComplete();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to reject", variant: "destructive" });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleFlag = async () => {
    if (!correctionReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Correction reason is required",
        variant: "destructive"
      });
      return;
    }
    setIsFlagging(true);
    try {
      await assessmentsApiService.flagAssessment(assessmentId, correctionReason);
      toast({ title: "Success", description: "Assessment flagged for correction" });
      setShowFlagDialog(false);
      await loadAssessment();
      if (onActionComplete) onActionComplete();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to flag assessment", variant: "destructive" });
    } finally {
      setIsFlagging(false);
    }
  };

  const handleCreatePolicy = async () => {
    if (!policyStartDate || !policyEndDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    setIsCreatingPolicy(true);
    try {
      // Convert dates to ISO format
      const startDateISO = new Date(policyStartDate + 'T00:00:00Z').toISOString();
      const endDateISO = new Date(policyEndDate + 'T23:59:59Z').toISOString();
      if (associatedPolicy) {
        await updatePolicy(associatedPolicy._id || associatedPolicy.id, {
          coverageLevel,
          startDate: startDateISO,
          endDate: endDateISO
        });
        toast({ title: "Success", description: associatedPolicy.status === 'DECLINED' ? "New policy issued successfully" : "Policy revised successfully" });
      } else {
        await createPolicyFromAssessment(
          assessmentId,
          coverageLevel,
          startDateISO,
          endDateISO
        );
        toast({ title: "Success", description: "Policy created successfully" });
      }
      setShowPolicyDialog(false);
      await loadAssessment();
      if (onActionComplete) onActionComplete();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to create policy", variant: "destructive" });
    } finally {
      setIsCreatingPolicy(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-12 text-center">
          <img src="/loading.gif" alt="Loading" className="w-16 h-16 mx-auto mb-4" />
          <p className="text-gray-500">Loading comprehensive assessment data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!assessment) return null;

  const farm = assessment.farmId || assessment.farm || {};
  const farmer = assessment.farmerId || farm.farmerId || assessment.farmer || {};

  return (
    <div className="space-y-6">
      {/* Insurer Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <Button variant="ghost" onClick={onBack || (() => window.history.back())} className="mb-2 -ml-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to List
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Risk Assessment Review</h1>
          <p className="text-sm text-gray-600 flex items-center mt-1">
            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
            {farm.name || "Unknown Farm"} • {farmer.name || farmer.email || "Unknown Farmer"}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {assessment.status === 'APPROVED' && !associatedPolicy ? (
            <Button onClick={() => setShowPolicyDialog(true)} disabled={isCreatingPolicy} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-10">
              <Shield className="h-4 w-4 mr-2" />
              {isCreatingPolicy ? "Creating..." : "Create Policy"}
            </Button>
          ) : assessment.status === 'SUBMITTED' || assessment.status === 'PENDING' ? (
            <>
              <Button onClick={() => setShowRejectDialog(true)} disabled={isRejecting} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl h-10">
                Reject
              </Button>
              <Button onClick={() => setShowFlagDialog(true)} disabled={isFlagging} variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50 rounded-xl h-10">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Flag for Correction
              </Button>
              <Button onClick={handleApprove} disabled={isApproving} className="bg-green-600 hover:bg-green-700 text-white rounded-xl h-10">
                <CheckCircle className="h-4 w-4 mr-2" />
                {isApproving ? "Approving..." : "Approve Assessment"}
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Badge className={`h-8 px-4 font-semibold border-none ${
                assessment.status === 'NEEDS_CORRECTION' 
                  ? 'bg-amber-100 text-amber-800'
                  : assessment.status === 'APPROVED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : assessment.status === 'REJECTED'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {assessment.status?.replace(/_/g, ' ').replace(/\w\S*/g, (txt: string) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())}
              </Badge>
              {associatedPolicy && (associatedPolicy.status === 'NEEDS_CORRECTION' || associatedPolicy.status === 'DECLINED') ? (
                <Button onClick={() => setShowPolicyDialog(true)} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-10">
                  <Shield className="h-4 w-4 mr-2" />
                  {associatedPolicy.status === 'DECLINED' ? "Issue New Policy" : "Revise Policy"}
                </Button>
              ) : associatedPolicy ? (
                <Link to={`/insurer/policies/${associatedPolicy._id || associatedPolicy.id}`} className="text-sm font-medium text-purple-700 hover:text-purple-900 hover:underline border border-purple-200 bg-purple-50 px-3 py-1.5 rounded-full flex items-center transition-colors">
                  <Shield className="w-3.5 h-3.5 mr-1.5" />
                  View Policy {associatedPolicy.policyNumber ? `#${associatedPolicy.policyNumber}` : ''}
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Reused Assessor Tabs for Data Representation */}
      <Tabs defaultValue="basic-info" className="w-full">
        <TabsList className="bg-white border border-gray-100 p-1 mb-6 rounded-xl flex flex-wrap gap-2 justify-start shadow-sm h-auto">
          <TabsTrigger value="basic-info" className="rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white">Basic Info</TabsTrigger>
          <TabsTrigger value="weather" className="rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white">Weather Analysis</TabsTrigger>
          <TabsTrigger value="drone" className="rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white">Drone Analysis</TabsTrigger>
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="basic-info" forceMount className="data-[state=inactive]:hidden mt-0">
          <BasicInfoTab 
            fieldId={farm._id || farm.id || ""}
            farmerId={farmer._id || farmer.id || ""}
            fieldName={farm.name || "Unknown Farm"}
            farmerName={`${farmer.firstName || ""} ${farmer.lastName || ""}`.trim() || farmer.name || "Unknown Farmer"}
            cropType={farm.cropType || farm.crop || "Unknown"}
            area={farm.area || farm.size || farm.farmSize || 0}
            season={
              farm.season ||
              (farm.sowingDate
                ? (() => {
                    const m = new Date(farm.sowingDate).getMonth();
                    return m >= 8 || m <= 0 ? "A" : "B";
                  })()
                : "B")
            }
            location={farm.locationName || (farm.location && typeof farm.location === 'string' ? farm.location : "N/A")}
            sowingDate={farm.sowingDate}
            boundary={farm.boundary}
            locationCoords={farm.location?.coordinates}
            showActions={false}
          />
        </TabsContent>
        <TabsContent value="weather" forceMount className="data-[state=inactive]:hidden mt-0">
          <WeatherAnalysisTab 
            fieldId={farm._id || farm.id || ""}
            farmerName={`${farmer.firstName || ""} ${farmer.lastName || ""}`.trim() || farmer.name || "Unknown Farmer"}
            cropType={farm.cropType || farm.crop || "Unknown"}
            location={farm.locationName || (farm.location && typeof farm.location === 'string' ? farm.location : "N/A")}
            readOnly={true}
          />
        </TabsContent>
        <TabsContent value="drone" forceMount className="data-[state=inactive]:hidden mt-0">
          <DroneTab assessment={assessment} readOnly={true} />
        </TabsContent>
        <TabsContent value="overview" forceMount className="data-[state=inactive]:hidden mt-0">
          <OverviewTab assessment={assessment} farm={farm} farmer={farmer} isInsurerView={true} />
        </TabsContent>
      </Tabs>

      {/* Reject Dialog overlay */}
      <Dialog open={showRejectDialog} onOpenChange={(open) => {
        if (!open) {
          setRejectionReason("");
        }
        setShowRejectDialog(open);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Reject Assessment</DialogTitle>
            <DialogDescription className="text-gray-600">
              Please provide a reason for rejecting this assessment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="text-sm">
                <span className="text-gray-600">Farm: </span>
                <span className="font-medium text-gray-900">{farm.name || "N/A"}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Crop: </span>
                <span className="font-medium text-gray-900">{farm.cropType || farm.crop || "N/A"}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Farmer: </span>
                <span className="font-medium text-gray-900">
                  {`${farmer.firstName || ""} ${farmer.lastName || ""}`.trim() || "N/A"}
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="rejectionReason" className="text-gray-900 font-semibold">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="mt-2 min-h-[100px] border-gray-300"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason("");
                }}
                className="border-gray-300 text-gray-900 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={isRejecting || !rejectionReason.trim()}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
              >
                {isRejecting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Reject Assessment
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Flag Dialog overlay */}
      <Dialog open={showFlagDialog} onOpenChange={(open) => {
        if (!open) {
          setCorrectionReason("");
        }
        setShowFlagDialog(open);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Flag for Correction</DialogTitle>
            <DialogDescription className="text-gray-600">
              Please specify what corrections or additional details are needed from the assessor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-orange-50 p-4 rounded-lg space-y-2 border border-orange-100">
              <div className="text-sm">
                <span className="text-orange-800">Farm: </span>
                <span className="font-medium text-orange-900">{farm.name || "N/A"}</span>
              </div>
              <div className="text-sm">
                <span className="text-orange-800">Crop: </span>
                <span className="font-medium text-orange-900">{farm.cropType || farm.crop || "N/A"}</span>
              </div>
            </div>

            <div>
              <Label htmlFor="correctionReason" className="text-gray-900 font-semibold">Corrections Needed *</Label>
              <Textarea
                id="correctionReason"
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="E.g., Please provide more detailed drone imagery for the northern quadrant..."
                className="mt-2 min-h-[100px] border-gray-300 focus-visible:ring-orange-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowFlagDialog(false);
                  setCorrectionReason("");
                }}
                className="border-gray-300 text-gray-900 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleFlag}
                disabled={isFlagging || !correctionReason.trim()}
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
              >
                {isFlagging ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Flagging...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Flag for Correction
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Policy Dialog overlay */}
      <Dialog open={showPolicyDialog} onOpenChange={(open) => setShowPolicyDialog(open)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {associatedPolicy && associatedPolicy.status === 'DECLINED' ? "Issue New Policy" :
               associatedPolicy ? "Revise Policy" : "Create Policy from Assessment"}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {associatedPolicy && associatedPolicy.status === 'DECLINED' 
                ? "Issue a new policy to replace the declined one"
                : associatedPolicy 
                ? "Revise the existing policy based on farmer feedback"
                : "Create an insurance policy based on the submitted assessment"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="text-sm">
                <span className="text-gray-600">Farm: </span>
                <span className="font-medium text-gray-900">{farm.name || "N/A"}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Crop: </span>
                <span className="font-medium text-gray-900">{farm.cropType || farm.crop || "N/A"}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Risk Score: </span>
                <span className="font-medium text-gray-900">{assessment.riskScore !== null && assessment.riskScore !== undefined ? `${assessment.riskScore}%` : "N/A"}</span>
              </div>
            </div>

            <div>
              <Label className="text-gray-700 font-semibold mb-2 block">Coverage Level *</Label>
              <Select 
                value={coverageLevel} 
                onValueChange={(val: any) => setCoverageLevel(val)}
              >
                <SelectTrigger className="border-gray-300 bg-white">
                  <SelectValue placeholder="Select coverage level" />
                </SelectTrigger>
                <SelectContent className="z-[9999]" position="popper">
                  <SelectItem value="BASIC">Basic Coverage</SelectItem>
                  <SelectItem value="STANDARD">Standard Coverage</SelectItem>
                  <SelectItem value="PREMIUM">Premium Coverage</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-md border border-gray-100">
                {coverageLevel === 'BASIC' && <span><strong>Basic:</strong> Covers catastrophic losses only (e.g., severe drought). Lowest premium.</span>}
                {coverageLevel === 'STANDARD' && <span><strong>Standard:</strong> Covers most weather risks and significant yield drops. Balanced premium.</span>}
                {coverageLevel === 'PREMIUM' && <span><strong>Premium:</strong> Comprehensive coverage including minor yield drops. Highest premium.</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 font-semibold">Policy Start Date *</Label>
                <Input
                  type="date"
                  value={policyStartDate}
                  onChange={(e) => setPolicyStartDate(e.target.value)}
                  className="mt-2 border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <Label className="text-gray-700 font-semibold">Policy End Date *</Label>
                <Input
                  type="date"
                  value={policyEndDate}
                  onChange={(e) => setPolicyEndDate(e.target.value)}
                  className="mt-2 border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setShowPolicyDialog(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePolicy}
                disabled={isCreatingPolicy || !policyStartDate || !policyEndDate}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
              >
                {isCreatingPolicy ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    {associatedPolicy && associatedPolicy.status === 'DECLINED' ? "Issuing..." :
                     associatedPolicy ? "Revising..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    {associatedPolicy && associatedPolicy.status === 'DECLINED' ? "Issue New Policy" :
                     associatedPolicy ? "Revise Policy" : "Create Policy"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
