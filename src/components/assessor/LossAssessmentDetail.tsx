import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  FileText, 
  MapPin, 
  Calendar, 
  User, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Download,
  Share2,
  RefreshCw,
  Flame,
  CloudRain,
  Wind,
  Droplets,
  DollarSign
} from "lucide-react";
import { getClaims, getClaimById } from "@/services/claimsApi";
import { getFarmById } from "@/services/farmsApi";
import { LossBasicInfoTab } from "./tabs/loss/LossBasicInfoTab";
import { LossEvidenceTab } from "./tabs/loss/LossEvidenceTab";
import { LossDetailsTab } from "./tabs/loss/LossDetailsTab";
import { LossOverviewTab } from "./tabs/loss/LossOverviewTab";

export default function LossAssessmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [claim, setClaim] = useState<any>(null);
  const [farm, setFarm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("basic-info");
  
  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const claimResp: any = await getClaimById(id);
      const currentClaim = claimResp.data || claimResp;
      
      if (currentClaim) {
        setClaim(currentClaim);
        const farmId = currentClaim.farmId?._id || currentClaim.farmId || currentClaim.fieldId?._id || currentClaim.fieldId || currentClaim.farm?._id || currentClaim.farm;
        
        if (farmId) {
          const farmResp = await getFarmById(farmId);
          setFarm(farmResp.data || farmResp);
        }
      }
    } catch (err: any) {
      console.error("Failed to load loss assessment details:", err);
      toast({
        title: "Error",
        description: "Could not load claim details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-10 w-10 text-rose-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading loss assessment details...</p>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertTriangle className="h-16 w-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Claim Not Found</h2>
        <p className="text-slate-500 mt-2 max-w-md">The claim you're looking for doesn't exist or hasn't been assigned to you yet.</p>
        <Button className="mt-6 bg-rose-600" onClick={() => navigate("/assessor/loss-assessments")}>
          Back to Assessments
        </Button>
      </div>
    );
  }

  const farmerName = [claim.farmer?.firstName, claim.farmer?.lastName].filter(Boolean).join(" ").trim() || 
                    claim.farmerName || 
                    (claim.farmerId && typeof claim.farmerId === 'object' ? `${claim.farmerId.firstName} ${claim.farmerId.lastName}` : "Unknown Farmer");

  const lossLevel = claim.lossLevel || "Medium";
  const claimAmount = claim.claimAmount || 0;
  const evidenceCount = (claim.photos?.length || 0) + (claim.documents?.length || 0);

  return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-8">
      <div className="max-w-7xl mx-auto px-6 space-y-6">
        {/* Header - Standardized Style */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/assessor/loss-assessments")}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-rose-600" />
              Loss Assessment Details
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Evaluating loss for <strong>{farm?.name || claim.fieldId}</strong> • {farmerName}
            </p>
          </div>
        </div>

        {/* Stats Cards - Standardized Look */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-rose-600 mb-1">Claim Amount</p>
                  <p className="text-2xl font-bold text-rose-900">{claimAmount.toLocaleString()} RWF</p>
                  <p className="text-[10px] text-rose-700 font-medium">Estimated payout</p>
                </div>
                <DollarSign className="h-5 w-5 text-rose-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-orange-600 mb-1">Loss Level</p>
                  <p className="text-lg font-bold text-orange-900 capitalize">{lossLevel}</p>
                  <p className="text-[10px] text-orange-700 font-medium">Severity assessment</p>
                </div>
                <Flame className="h-5 w-5 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600 mb-1">Evidence</p>
                  <p className="text-lg font-bold text-blue-900">{evidenceCount} Files</p>
                  <p className="text-[10px] text-blue-700 font-medium">Photos & Documents</p>
                </div>
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-600 mb-1">Status</p>
                  <p className="text-lg font-bold text-purple-900">
                    {claim.status?.replace('_', ' ') || 'PENDING'}
                  </p>
                  <p className="text-[10px] text-purple-700 font-medium">Workflow progress</p>
                </div>
                <RefreshCw className="h-5 w-5 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="bg-white border border-gray-200 shadow-md inline-flex h-12 items-center justify-center rounded-xl p-1.5 gap-1">
            <TabsTrigger value="basic-info" className="data-[state=active]:bg-rose-600 data-[state=active]:text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all">
              <FileText className="h-4 w-4 mr-2" /> Basic Info
            </TabsTrigger>
            <TabsTrigger value="evidence" className="data-[state=active]:bg-rose-600 data-[state=active]:text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all">
              <CheckCircle className="h-4 w-4 mr-2" /> Evidence
            </TabsTrigger>
            <TabsTrigger value="details" className="data-[state=active]:bg-rose-600 data-[state=active]:text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all">
              <AlertTriangle className="h-4 w-4 mr-2" /> Loss Details
            </TabsTrigger>
            <TabsTrigger value="overview" className="data-[state=active]:bg-rose-600 data-[state=active]:text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all">
              <CheckCircle className="h-4 w-4 mr-2" /> Final Review
            </TabsTrigger>
          </TabsList>

          <div className="mt-0">
            <TabsContent value="basic-info" className="mt-0">
               <LossBasicInfoTab 
                 field={farm} 
                 claim={claim} 
                 farmerName={farmerName}
               />
            </TabsContent>

            <TabsContent value="evidence" className="mt-0">
              <LossEvidenceTab claim={claim} />
            </TabsContent>

            <TabsContent value="details" className="mt-0">
              <LossDetailsTab claim={claim} />
            </TabsContent>

            <TabsContent value="overview" className="mt-0">
              <LossOverviewTab 
                claim={claim} 
                fieldName={farm?.name || claim.fieldId} 
                onSubmitSuccess={loadData}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
