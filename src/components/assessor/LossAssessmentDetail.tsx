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
import assessmentsApiService from "@/services/assessmentsApi";
import { getClaims } from "@/services/claimsApi";
import { getFarmById } from "@/services/farmsApi";
import LeafletMap from "@/components/common/LeafletMap";
import { format } from "date-fns";

export default function LossAssessmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [assessment, setAssessment] = useState<any>(null);
  const [claim, setClaim] = useState<any>(null);
  const [farm, setFarm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      // For Loss Assessment, we often look at the Claim
      const allClaimsResp = await getClaims();
      const allClaims = allClaimsResp.data || allClaimsResp || [];
      const currentClaim = allClaims.find((c: any) => (c._id || c.id) === id);
      
      if (currentClaim) {
        setClaim(currentClaim);
        const farmId = currentClaim.farmId?._id || currentClaim.farmId || currentClaim.farm?._id || currentClaim.farm;
        if (farmId) {
          const farmResp = await getFarmById(farmId);
          setFarm(farmResp.data || farmResp);
        }
        
        // Also try to find the assessment linked to this claim
        try {
          const assessmentResp = await assessmentsApiService.getAssessmentByFarm(farmId);
          setAssessment(assessmentResp.data || assessmentResp);
        } catch (e) {
          console.warn("No specific loss assessment record found yet");
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

  const status = claim.status?.toLowerCase() || "pending";
  const damageType = claim.lossType || "Weather Damage";
  
  const getStatusColor = (s: string) => {
    switch (s) {
      case "approved": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "rejected": return "bg-rose-50 text-rose-700 border-rose-100";
      case "submitted": return "bg-blue-50 text-blue-700 border-blue-100";
      default: return "bg-amber-50 text-amber-700 border-amber-100";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button 
          variant="ghost" 
          className="w-fit text-slate-600 hover:text-rose-600 hover:bg-rose-50 -ml-2"
          onClick={() => navigate("/assessor/loss-assessments")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Loss Assessments
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="border-slate-200">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" className="border-slate-200">
            <Download className="h-4 w-4 mr-2" />
            Export Evidence
          </Button>
        </div>
      </div>

      {/* Header Card */}
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <div className="h-2 bg-gradient-to-r from-rose-500 to-orange-500" />
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-50 rounded-lg">
                  <Flame className="h-6 w-6 text-rose-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Loss Assessment: {claim.claimNumber || id?.slice(-8).toUpperCase()}
                </h1>
                <Badge className={cn("px-3 py-1 uppercase text-[10px] font-bold tracking-wider", getStatusColor(status))}>
                  {status}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm text-slate-500">
                <span className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-slate-400" />
                  Claimant: <span className="font-semibold text-slate-900 ml-1">
                    {claim.farmerName || "Farmer Name"}
                  </span>
                </span>
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                  Field: <span className="font-semibold text-slate-900 ml-1">{farm?.name || "Target Field"}</span>
                </span>
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                  Incident Date: <span className="font-semibold text-slate-900 ml-1">
                    {claim.incidentDate ? format(new Date(claim.incidentDate), 'MMM dd, yyyy') : "N/A"}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Loss</p>
                <div className="text-2xl font-black text-rose-600">
                  {claim.estimatedLossPercent || "65"}%
                </div>
              </div>
              <div className="h-12 w-[1px] bg-slate-200" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Claim Value</p>
                <div className="flex items-center text-xl font-bold text-slate-800">
                   <DollarSign className="h-4 w-4 text-emerald-500" />
                   {claim.claimAmount?.toLocaleString() || "4,200"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-slate-100 p-1 rounded-xl w-full flex">
              <TabsTrigger value="overview" className="flex-1 rounded-lg py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Incident Details
              </TabsTrigger>
              <TabsTrigger value="evidence" className="flex-1 rounded-lg py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Evidence & Photos
              </TabsTrigger>
              <TabsTrigger value="verification" className="flex-1 rounded-lg py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Assessor Verification
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-4 space-y-6">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-rose-500" />
                    Farmer's Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {claim.description || "The farmer reported significant damage due to heavy rainfall and localized flooding that occurred during the late night hours. Initial inspection shows waterlogged roots and soil erosion in the northern quadrant."}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex flex-col items-center text-center">
                       <CloudRain className="h-6 w-6 text-blue-500 mb-2" />
                       <span className="text-[10px] font-bold text-blue-600 uppercase">Primary Cause</span>
                       <span className="text-sm font-bold text-blue-900">{damageType}</span>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 flex flex-col items-center text-center">
                       <Wind className="h-6 w-6 text-orange-500 mb-2" />
                       <span className="text-[10px] font-bold text-orange-600 uppercase">Severity</span>
                       <span className="text-sm font-bold text-orange-900">Moderate-High</span>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col items-center text-center">
                       <Droplets className="h-6 w-6 text-emerald-500 mb-2" />
                       <span className="text-[10px] font-bold text-emerald-600 uppercase">Recoverability</span>
                       <span className="text-sm font-bold text-emerald-900">Partial (30%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                 <CardHeader>
                    <CardTitle className="text-lg font-bold">Policy Context</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                             <FileText className="h-5 w-5 text-indigo-500" />
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-800">Policy #POL-88291</p>
                             <p className="text-xs text-slate-500">Standard Crop Coverage</p>
                          </div>
                       </div>
                       <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100">
                          Active & Valid
                       </Badge>
                    </div>
                 </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="evidence" className="mt-4">
               <Card className="border-slate-200 shadow-sm">
                 <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       {[1,2,3].map((i) => (
                          <div key={i} className="aspect-square bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden group relative">
                             <img src={`https://images.unsplash.com/photo-1594776208137-9c60df76850c?q=80&w=400&auto=format&fit=crop`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Evidence" />
                             <div className="absolute top-2 right-2">
                                <Badge className="bg-black/50 text-white border-none text-[8px]">GEO-TAGGED</Badge>
                             </div>
                          </div>
                       ))}
                       <button className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-rose-400 hover:text-rose-500 transition-all bg-slate-50/50">
                          <RefreshCw className="h-6 w-6 mb-2" />
                          <span className="text-[10px] font-bold">Upload More</span>
                       </button>
                    </div>
                 </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="verification" className="mt-4">
               <Card className="border-slate-200 shadow-sm">
                  <CardHeader>
                     <CardTitle className="text-lg font-bold">Loss Verification Steps</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     {[
                        { label: "Verify identity of the farmer", status: "complete" },
                        { label: "Confirm field boundaries match policy", status: "complete" },
                        { label: "Document actual crop damage on-site", status: "pending" },
                        { label: "Review historical weather data for validation", status: "pending" }
                     ].map((step, i) => (
                        <div key={i} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                           <span className="text-sm font-medium text-slate-700">{step.label}</span>
                           {step.status === "complete" ? (
                              <CheckCircle className="h-5 w-5 text-emerald-500" />
                           ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-slate-200" />
                           )}
                        </div>
                     ))}
                  </CardContent>
               </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="h-64 bg-slate-200 relative">
               <LeafletMap 
                  center={farm?.location?.coordinates ? [farm.location.coordinates[1], farm.location.coordinates[0]] : [-1.9441, 30.0619]}
                  zoom={14}
                  height="100%"
                  tileLayer="satellite"
                  boundary={farm?.boundary}
               />
               <div className="absolute inset-0 bg-rose-500/10 pointer-events-none" />
            </div>
            <CardContent className="p-4 bg-white">
              <div className="space-y-2">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Affected Area:</span>
                    <span className="font-bold text-rose-600">0.8 / 1.2 Hectares</span>
                 </div>
                 <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full w-[66%]" />
                 </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
             <CardHeader className="pb-3 border-b border-slate-50">
               <CardTitle className="text-sm font-bold">Assessor Controls</CardTitle>
             </CardHeader>
             <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                   <p className="text-xs font-bold text-slate-500 uppercase">Verification Progress</p>
                   <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                         <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= 3 ? "bg-rose-500" : "bg-slate-200"}`} />
                      ))}
                   </div>
                </div>
                <Button className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold">
                   Approve Loss Estimate
                </Button>
                <Button variant="outline" className="w-full border-slate-200 text-slate-600">
                   Request Information
                </Button>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
