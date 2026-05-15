import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Shield, 
  MapPin, 
  Calendar, 
  User, 
  Clock, 
  FileText, 
  Activity, 
  CloudRain, 
  Leaf,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Download,
  Share2,
  RefreshCw
} from "lucide-react";
import assessmentsApiService from "@/services/assessmentsApi";
import { getFarmById, getVegetationStats, getHistoricalWeather } from "@/services/farmsApi";
import LeafletMap from "@/components/common/LeafletMap";
import { format } from "date-fns";

export default function RiskAssessmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [assessment, setAssessment] = useState<any>(null);
  const [farm, setFarm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const resp = await assessmentsApiService.getAssessmentById(id);
      const data = resp.data || resp;
      setAssessment(data);
      
      const farmId = data.farmId?._id || data.farmId;
      if (farmId) {
        const farmResp = await getFarmById(farmId);
        setFarm(farmResp.data || farmResp);
      }
    } catch (err: any) {
      console.error("Failed to load assessment details:", err);
      toast({
        title: "Error",
        description: "Could not load assessment details",
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
        <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading assessment details...</p>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Assessment Not Found</h2>
        <p className="text-slate-500 mt-2 max-w-md">The assessment you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button className="mt-6 bg-indigo-600" onClick={() => navigate("/assessor/risk-assessments")}>
          Back to Assessments
        </Button>
      </div>
    );
  }

  const status = assessment.status?.toLowerCase() || "pending";
  const riskScore = assessment.riskScore || 0;
  
  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-rose-600 bg-rose-50 border-rose-100";
    if (score >= 40) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-emerald-600 bg-emerald-50 border-emerald-100";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button 
          variant="ghost" 
          className="w-fit text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 -ml-2"
          onClick={() => navigate("/assessor/risk-assessments")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assessments
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="border-slate-200">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" className="border-slate-200">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Header Card */}
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Shield className="h-6 w-6 text-indigo-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Risk Assessment: {assessment._id?.slice(-8).toUpperCase()}
                </h1>
                <Badge className={cn(
                  "px-3 py-1 uppercase text-[10px] font-bold tracking-wider",
                  status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                  status === "pending" ? "bg-amber-50 text-amber-700 border-amber-100" :
                  "bg-indigo-50 text-indigo-700 border-indigo-100"
                )}>
                  {status}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm text-slate-500">
                <span className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-slate-400" />
                  Farmer: <span className="font-semibold text-slate-900 ml-1">
                    {assessment.farmId?.farmerId?.firstName} {assessment.farmId?.farmerId?.lastName || "Gad KALISA"}
                  </span>
                </span>
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                  Location: <span className="font-semibold text-slate-900 ml-1">{farm?.locationName || "Rwanda"}</span>
                </span>
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                  Date: <span className="font-semibold text-slate-900 ml-1">
                    {assessment.createdAt ? format(new Date(assessment.createdAt), 'MMM dd, yyyy') : "N/A"}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Overall Risk</p>
                <div className={cn("text-3xl font-black rounded-xl px-4 py-2 border", getRiskColor(riskScore))}>
                  {riskScore}%
                </div>
              </div>
              <div className="h-12 w-[1px] bg-slate-200" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Recommendation</p>
                <p className="text-sm font-bold text-slate-700">
                  {riskScore < 40 ? "Proceed with Policy" : riskScore < 70 ? "Requires Review" : "High Risk - Deny"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-slate-100 p-1 rounded-xl w-full flex">
              <TabsTrigger value="overview" className="flex-1 rounded-lg py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Overview
              </TabsTrigger>
              <TabsTrigger value="drone" className="flex-1 rounded-lg py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Drone Analysis
              </TabsTrigger>
              <TabsTrigger value="weather" className="flex-1 rounded-lg py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Weather History
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-4 space-y-6">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-indigo-500" />
                    Assessor Observations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-slate max-w-none">
                    <p className="text-slate-700 leading-relaxed italic bg-slate-50 p-4 rounded-xl border border-slate-100">
                      "{assessment.reportText || "No detailed observations provided for this assessment."}"
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Key Strengths</p>
                      <ul className="text-xs text-emerald-700 space-y-1">
                        <li className="flex items-center"><CheckCircle className="h-3 w-3 mr-1.5" /> Proper irrigation systems</li>
                        <li className="flex items-center"><CheckCircle className="h-3 w-3 mr-1.5" /> High quality seed variety</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                      <p className="text-[10px] font-bold text-rose-600 uppercase mb-1">Potential Hazards</p>
                      <ul className="text-xs text-rose-700 space-y-1">
                        <li className="flex items-center"><AlertTriangle className="h-3 w-3 mr-1.5" /> Steep terrain slope</li>
                        <li className="flex items-center"><AlertTriangle className="h-3 w-3 mr-1.5" /> Previous pest infestation</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Photos Section */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold">Field Media</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {assessment.photoUrls?.length > 0 ? (
                      assessment.photoUrls.map((url: string, index: number) => (
                        <div key={index} className="aspect-square rounded-xl overflow-hidden border border-slate-100 shadow-sm group relative">
                          <img src={url} alt={`Field ${index}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full">
                               <Eye className="h-4 w-4" />
                             </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                         <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                         <p className="text-sm text-slate-400">No field photos uploaded</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="drone" className="mt-4">
               <Card className="border-slate-200 shadow-sm">
                 <CardContent className="p-8 text-center">
                    <Activity className="h-12 w-12 text-indigo-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">Advanced Drone Analysis</h3>
                    <p className="text-slate-500 mt-2 max-w-md mx-auto">
                      View multi-spectral imaging, plant health (NDVI) mapping, and automated pest detection reports for this field.
                    </p>
                    <Button className="mt-6 bg-indigo-600">
                      View Interactive Report
                    </Button>
                 </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="weather" className="mt-4">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                   <CardTitle className="text-lg font-bold">Historical Climate Data</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="space-y-4">
                      <div className="h-48 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                         <CloudRain className="h-8 w-8 text-indigo-300 animate-pulse" />
                         <span className="ml-3 text-slate-400 font-medium">Loading weather charts...</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                         <div className="p-3 bg-blue-50 rounded-xl text-center">
                            <p className="text-[10px] font-bold text-blue-400 uppercase">Avg Rainfall</p>
                            <p className="text-xl font-black text-blue-700">1,240mm</p>
                         </div>
                         <div className="p-3 bg-orange-50 rounded-xl text-center">
                            <p className="text-[10px] font-bold text-orange-400 uppercase">Avg Temp</p>
                            <p className="text-xl font-black text-orange-700">24°C</p>
                         </div>
                         <div className="p-3 bg-purple-50 rounded-xl text-center">
                            <p className="text-[10px] font-bold text-purple-400 uppercase">Humidity</p>
                            <p className="text-xl font-black text-purple-700">72%</p>
                         </div>
                      </div>
                   </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Sidebar info */}
        <div className="space-y-6">
          {/* Map Card */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-indigo-500" />
                Field Boundary
              </CardTitle>
            </CardHeader>
            <div className="h-64 bg-slate-200 relative">
              <LeafletMap 
                center={farm?.location?.coordinates ? [farm.location.coordinates[1], farm.location.coordinates[0]] : [-1.9441, 30.0619]}
                zoom={14}
                height="100%"
                tileLayer="satellite"
                boundary={farm?.boundary}
              />
            </div>
            <CardContent className="p-4 bg-white">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Total Area:</span>
                <span className="font-bold text-slate-900">{farm?.area || "1.2"} Hectares</span>
              </div>
            </CardContent>
          </Card>

          {/* Farm Details */}
          <Card className="border-slate-200 shadow-sm">
             <CardHeader className="pb-3 border-b border-slate-50">
               <CardTitle className="text-sm font-bold">Field Specification</CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                   <div className="px-4 py-3 flex justify-between items-center">
                      <span className="text-xs text-slate-500">Crop Variety</span>
                      <span className="text-xs font-bold text-slate-800">{farm?.cropType || "Maize"}</span>
                   </div>
                   <div className="px-4 py-3 flex justify-between items-center">
                      <span className="text-xs text-slate-500">Sowing Date</span>
                      <span className="text-xs font-bold text-slate-800">{farm?.sowingDate || "Oct 12, 2025"}</span>
                   </div>
                   <div className="px-4 py-3 flex justify-between items-center">
                      <span className="text-xs text-slate-500">Soil Type</span>
                      <span className="text-xs font-bold text-slate-800">Sandy Loam</span>
                   </div>
                   <div className="px-4 py-3 flex justify-between items-center">
                      <span className="text-xs text-slate-500">Irrigation</span>
                      <span className="text-xs font-bold text-emerald-600">Available</span>
                   </div>
                </div>
             </CardContent>
          </Card>

          {/* Action Card */}
          <Card className="bg-indigo-600 border-none shadow-md shadow-indigo-200">
             <CardContent className="p-6">
                <h3 className="text-white font-bold mb-2">Ready to submit?</h3>
                <p className="text-indigo-100 text-xs mb-4">Finalize this assessment and send it to the insurer for policy approval.</p>
                <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-bold border-none shadow-sm">
                   Submit to Insurer
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
