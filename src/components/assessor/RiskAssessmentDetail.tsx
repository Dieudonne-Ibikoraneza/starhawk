import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  CheckCircle2,
  TrendingUp,
  Download,
  Share2,
  RefreshCw,
  Upload,
  Eye,
  CheckCircle
} from "lucide-react";
import assessmentsApiService from "@/services/assessmentsApi";
import { getFarmById } from "@/services/farmsApi";
import { getUserById } from "@/services/usersApi";
import { BasicInfoTab } from "./tabs/BasicInfoTab";
import { WeatherAnalysisTab } from "./tabs/WeatherAnalysisTab";
import DroneTab from "./tabs/DroneTab";
import OverviewTab from "./tabs/OverviewTab";

const API_BASE_URL = "https://starhawk-backend-agriplatform.onrender.com/api";

export default function RiskAssessmentDetail({ assessmentId, onBack, readOnly }: { assessmentId?: string, onBack?: () => void, readOnly?: boolean } = {}) {
  const params = useParams<{ id: string }>();
  const id = assessmentId || params.id;
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [assessment, setAssessment] = useState<any>(null);
  const [farm, setFarm] = useState<any>(null);
  const [farmer, setFarmer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("basic");
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedPdfType, setSelectedPdfType] = useState<string | null>(null);
  
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
        const farmData = farmResp.data || farmResp;
        setFarm(farmData);
        
        // Use the farmer data if populated, or fetch it
        if (farmData.farmerId && typeof farmData.farmerId === 'object') {
          setFarmer(farmData.farmerId);
        } else if (data.farmerId && typeof data.farmerId === 'object') {
          setFarmer(data.farmerId);
        } else {
          const farmerIdStr = farmData.farmerId || data.farmerId;
          if (typeof farmerIdStr === 'string' && farmerIdStr) {
            try {
              const userResp = await getUserById(farmerIdStr);
              setFarmer(userResp.data || userResp);
            } catch (err) {
              console.error("Failed to fetch farmer:", err);
            }
          }
        }
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
        <RefreshCw className="h-10 w-10 text-green-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Loading assessment details...</p>
      </div>
    );
  }

  if (!assessment || !farm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Assessment Not Found</h2>
        <p className="text-gray-500 mt-2 max-w-md">The assessment data is incomplete or unavailable.</p>
        <Button className="mt-6 bg-green-600" onClick={() => navigate("/assessor/risk-assessments")}>
          Back to Assessments
        </Button>
      </div>
    );
  }

  const getFullPdfUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const calculateOverallRisk = (dronePdfs: any[], weatherData: any) => {
    let score = 45; // Base score
    if (dronePdfs?.length > 0) score += 15;
    if (weatherData) score += 10;
    return { score: Math.min(score, 100) };
  };

  const computedRisk = calculateOverallRisk(assessment.dronePdfs || [], assessment.weatherData);
  const finalRiskScore = assessment.riskScore !== null && assessment.riskScore !== undefined
    ? assessment.riskScore
    : computedRisk.score;

  return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-8">
      {/* Header */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onBack ? onBack() : navigate("/assessor/risk-assessments")}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
            <Shield className="h-6 w-6 text-green-600" />
            Assessment Details
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {farmer?.firstName} {farmer?.lastName} • {farm.cropType} • {farm.name || "Farm"}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-600 mb-1">Risk Score</p>
                  <p className="text-2xl font-bold text-green-900">{finalRiskScore.toFixed(1)}</p>
                </div>
                <Activity className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br shadow-md ${
            assessment.status === "APPROVED" || assessment.status === "COMPLETED"
              ? "from-emerald-50 to-emerald-100 border-emerald-200"
              : assessment.status === "REJECTED"
              ? "from-rose-50 to-rose-100 border-rose-200"
              : "from-blue-50 to-blue-100 border-blue-200"
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-medium mb-1 ${
                    assessment.status === "APPROVED" || assessment.status === "COMPLETED"
                      ? "text-emerald-600"
                      : assessment.status === "REJECTED"
                      ? "text-rose-600"
                      : "text-blue-600"
                  }`}>Status</p>
                  <p className={`text-lg font-bold capitalize ${
                    assessment.status === "APPROVED" || assessment.status === "COMPLETED"
                      ? "text-emerald-900"
                      : assessment.status === "REJECTED"
                      ? "text-rose-900"
                      : "text-blue-900"
                  }`}>
                    {assessment.status ? assessment.status.toLowerCase().replace("_", " ") : "N/A"}
                  </p>
                </div>
                {(() => {
                  switch (assessment.status) {
                    case "APPROVED":
                    case "COMPLETED": return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
                    case "REJECTED": return <AlertTriangle className="h-5 w-5 text-rose-600" />;
                    case "PENDING": return <Clock className="h-5 w-5 text-amber-600" />;
                    default: return <FileText className="h-5 w-5 text-blue-600" />;
                  }
                })()}
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${
            (assessment.droneAnalysisPdfs?.length ?? 0) > 0 || assessment.droneAnalysisPdfUrl
              ? "from-purple-50 to-purple-100 border-purple-200"
              : "from-gray-50 to-gray-100 border-gray-200"
          } shadow-md`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-600 mb-1">Drone PDF</p>
                  <p className="text-lg font-bold text-purple-900">
                    {(assessment.droneAnalysisPdfs?.length ?? 0) > 0 || assessment.droneAnalysisPdfUrl
                      ? `${(assessment.droneAnalysisPdfs?.length || 0) + (assessment.dronePdfs?.length || 0) || 1} Uploaded`
                      : "Not Uploaded"}
                  </p>
                </div>
                <Upload className="h-5 w-5 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${
            assessment.reportGenerated
              ? "from-emerald-50 to-emerald-100 border-emerald-200"
              : "from-gray-50 to-gray-100 border-gray-200"
          } shadow-md`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-emerald-600 mb-1">Report</p>
                  <p className="text-lg font-bold text-emerald-900">
                    {assessment.reportGenerated ? "Generated" : "Pending"}
                  </p>
                </div>
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-gray-200 shadow-md inline-flex h-12 items-center justify-center rounded-xl p-1.5 gap-1">
            <TabsTrigger value="basic" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all">
              <FileText className="h-4 w-4 mr-2" /> Basic Info
            </TabsTrigger>
            <TabsTrigger value="weather" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all">
              <CloudRain className="h-4 w-4 mr-2" /> Weather
            </TabsTrigger>
            <TabsTrigger value="drone" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all">
              <Activity className="h-4 w-4 mr-2" /> Drone Analysis
            </TabsTrigger>
            <TabsTrigger value="overview" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all">
              <Activity className="h-4 w-4 mr-2" /> Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <BasicInfoTab
              fieldId={farm?._id || farm?.id}
              farmerId={farmer?.id || ""}
              fieldName={farm?.name || farm?.cropType || "Unknown"}
              farmerName={`${farmer?.firstName || ""} ${farmer?.lastName || ""}`.trim() || farm?.farmerName || ""}
              cropType={farm?.cropType || ""}
              area={farm?.area || 0}
              season={farm?.season || "B"}
              location={farm?.locationName || "N/A"}
              sowingDate={farm?.sowingDate}
              boundary={farm?.boundary}
              locationCoords={farm?.location?.coordinates}
            />
          </TabsContent>

          <TabsContent value="weather" forceMount className="data-[state=inactive]:hidden mt-0">
            <WeatherAnalysisTab
              fieldId={farm?._id || farm?.id}
              farmerName={`${farmer?.firstName || ""} ${farmer?.lastName || ""}`.trim()}
              cropType={farm?.cropType}
              location={farm?.locationName || "N/A"}
            />
          </TabsContent>

          <TabsContent value="drone">
            <DroneTab assessment={assessment} onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="overview">
            <OverviewTab assessment={assessment} farm={farm} farmer={farmer} onRefresh={loadData} isInsurerView={readOnly} />
          </TabsContent>
        </Tabs>
      </div>

      {/* PDF Modal */}
      <Dialog open={pdfModalOpen} onOpenChange={setPdfModalOpen}>
        <DialogContent className="max-w-5xl w-full h-[90vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600" />
              Drone Analysis PDF
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-gray-100">
            {assessment.droneAnalysisPdfUrl && (
              <iframe
                src={`${getFullPdfUrl(assessment.droneAnalysisPdfUrl)}#toolbar=0`}
                className="w-full h-full border-0"
                title="Drone Analysis PDF Viewer"
                style={{ minHeight: "calc(90vh - 100px)" }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
