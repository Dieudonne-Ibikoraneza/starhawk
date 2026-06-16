import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Activity, 
  MapPin, 
  Calendar, 
  User, 
  Clock, 
  RefreshCw,
  Sprout,
  FileText,
  CloudRain,
  Plane,
  History,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import cropMonitoringApiService, { startCropMonitoring } from "@/services/cropMonitoringApi";
import { getFarmById } from "@/services/farmsApi";
import { getRequiredMonitoringCycles } from "@/lib/crops";
import policiesApiService from "@/services/policiesApi";
import { MonitoringBasicInfoTab } from "./tabs/MonitoringBasicInfoTab";
import { MonitoringWeatherTab } from "./tabs/MonitoringWeatherTab";
import { MonitoringDroneReportTab } from "./tabs/MonitoringDroneReportTab";
import { MonitoringOverviewTab } from "./tabs/MonitoringOverviewTab";

export default function CropMonitoringDetail() {
  const { id } = useParams<{ id: string }>(); // This is the Field ID (farmId)
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [monitoringHistory, setMonitoringHistory] = useState<any[]>([]);
  const [farm, setFarm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("basic-info");
  const [isStartingCycle, setIsStartingCycle] = useState(false);
  const [activePolicy, setActivePolicy] = useState<any>(null);
  
  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Load Crop Monitoring Details (which includes farm, policy, and nested cycles)
      const monitoringResp = await cropMonitoringApiService.getMonitoringById(id);
      const monitoringData = monitoringResp.data || monitoringResp;
      
      if (monitoringData) {
        setFarm(monitoringData.farmId);
        setActivePolicy(monitoringData.policyId);
        
        // Sort descending by monitoringNumber so the newest is at index 0 (activeCycle)
        const cycles = monitoringData.monitoringCycles || [];
        const sortedHistory = [...cycles].sort((a: any, b: any) => b.monitoringNumber - a.monitoringNumber);
        
        // Map policyId down to cycles if needed by downstream components
        const enrichedCycles = sortedHistory.map(c => ({...c, policyId: monitoringData.policyId, farmId: monitoringData.farmId}));
        setMonitoringHistory(enrichedCycles);
      }
      
    } catch (err: any) {
      console.error("Failed to load crop monitoring details:", err);
      toast({
        title: "Error",
        description: "Could not load monitoring details",
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
        <RefreshCw className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading monitoring data...</p>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Activity className="h-16 w-16 text-emerald-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Field Not Found</h2>
        <p className="text-slate-500 mt-2 max-w-md">The field you're looking for doesn't exist or you don't have access.</p>
        <Button className="mt-6 bg-emerald-600" onClick={() => navigate("/assessor/crop-monitoring")}>
          Back to Monitoring
        </Button>
      </div>
    );
  }

  if (!loading && !activePolicy) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border border-red-100 shadow-2xl bg-white rounded-2xl overflow-hidden text-center p-8 relative">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-amber-500" />
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100 animate-pulse">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <Badge className="bg-red-50 text-red-700 border border-red-100 mb-4 px-3 py-1 font-semibold rounded-full select-none">
            No Active Policy
          </Badge>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Crop health and NDVI satellite monitoring are reserved exclusively for active, insured farm fields. 
            This field does not currently have an active insurance policy.
          </p>
          <div className="flex flex-col gap-2">
            <Button 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl py-2.5 transition-all shadow-md flex items-center justify-center gap-2"
              onClick={() => navigate("/assessor/crop-monitoring")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Monitoring
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const activeCycle = monitoringHistory.find((c: any) => c.status === "IN_PROGRESS" || c.status === "DRAFT") || null;
  const latestCycle = monitoringHistory.length > 0 ? monitoringHistory[0] : null;
  const displayCycle = activeCycle || latestCycle;
  const monitoringId = displayCycle?._id || displayCycle?.id || "";
  const policyId = displayCycle?.policyId?._id || displayCycle?.policyId || "";
  const totalRecommendedCycles = getRequiredMonitoringCycles(farm?.cropType);

  const handleStartCycle = async () => {
    // Resolve the policy ID from active policy state, active cycle, or farm
    const resolvedPolicyId = activePolicy?._id || activePolicy?.id || policyId || farm?.policyId?._id || farm?.policyId || "";
    if (!resolvedPolicyId) {
      toast({
        title: "Cannot Start Cycle",
        description: "No active policy found for this field. Please assign a policy first.",
        variant: "destructive"
      });
      return;
    }
    setIsStartingCycle(true);
    try {
      await startCropMonitoring(resolvedPolicyId);
      toast({
        title: "Success",
        description: "Monitoring cycle started successfully."
      });
      await loadData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to start monitoring cycle",
        variant: "destructive"
      });
    } finally {
      setIsStartingCycle(false);
    }
  };
    const farmerObj = activePolicy?.farmerId || farm?.farmerId || farm?.farmer;
    let farmerName = farm?.farmerName || "N/A";
    if (farmerObj && typeof farmerObj === 'object') {
      farmerName = farmerObj.name || `${farmerObj.firstName || ""} ${farmerObj.lastName || ""}`.trim() || farmerName;
    }
    
    // If we only got IDs and no name was found
    if (!farmerName || farmerName.trim() === "" || farmerName === "N/A") {
       // Since the farm belongs to a farmer, maybe the policy has it
       if (activePolicy?.farmerName) {
         farmerName = activePolicy.farmerName;
       } else if (farmerObj && typeof farmerObj === 'string') {
         farmerName = "Loading Farmer...";
       } else {
         farmerName = "Unknown Farmer";
       }
    }

  const ndviValue = displayCycle?.ndvi?.average || 0.65;
  const growthStage = displayCycle?.growthStage || "Vegetative";
  const waterStress = displayCycle?.waterStress || "Low";
  const healthStatus = ndviValue > 0.6 ? "Excellent" : ndviValue > 0.4 ? "Good" : "Poor";

  return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-8">
      <div className="max-w-7xl mx-auto px-6 space-y-6">
        {/* Header - Standardized Style */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/assessor/crop-monitoring")}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
              <Sprout className="h-6 w-6 text-emerald-600" />
              Monitoring Details
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {farmerName} • {farm.cropType} • {farm.name || "Field"}
            </p>
          </div>
        </div>

        {/* Stats Cards - Standardized Look */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-emerald-600 mb-1">Crop Health (NDVI)</p>
                  <p className="text-2xl font-bold text-emerald-900">{ndviValue.toFixed(2)}</p>
                  <p className="text-[10px] text-emerald-700 font-medium">{healthStatus}</p>
                </div>
                <Activity className="h-5 w-5 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600 mb-1">Growth Stage</p>
                  <p className="text-lg font-bold text-blue-900 capitalize">{growthStage}</p>
                  <p className="text-[10px] text-blue-700 font-medium">Season 2024A</p>
                </div>
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-cyan-600 mb-1">Water Stress</p>
                  <p className="text-lg font-bold text-cyan-900">{waterStress}</p>
                  <p className="text-[10px] text-cyan-700 font-medium">Based on SMAP data</p>
                </div>
                <CloudRain className="h-5 w-5 text-cyan-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-600 mb-1">Monitoring Status</p>
                  <p className="text-lg font-bold text-purple-900">
                    {activeCycle ? "Active Cycle" : "Pending Sync"}
                  </p>
                  <p className="text-[10px] text-purple-700 font-medium">
                    {activeCycle ? `Cycle #${activeCycle.monitoringNumber}` : "No active monitoring"}
                  </p>
                </div>
                <RefreshCw className="h-5 w-5 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="bg-white border border-gray-200 shadow-md inline-flex h-12 items-center justify-center rounded-xl p-1.5 gap-1">
            <TabsTrigger value="basic-info" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all">
              <FileText className="h-4 w-4 mr-2" /> Basic Info
            </TabsTrigger>
            <TabsTrigger value="weather" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all">
              <CloudRain className="h-4 w-4 mr-2" /> Weather
            </TabsTrigger>
            <TabsTrigger value="drone" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all">
              <Plane className="h-4 w-4 mr-2" /> Drone Analysis
            </TabsTrigger>
            <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all">
              <History className="h-4 w-4 mr-2" /> History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic-info" className="mt-0">
            <MonitoringBasicInfoTab 
              policyId={policyId}
              monitoringId={monitoringId}
              fieldId={id!}
              fieldName={farm.name}
              farmerName={farmerName}
              cropType={farm.cropType}
              area={farm.area}
              location={farm.locationName}
              boundary={farm.boundary}
              locationCoords={farm.location?.coordinates}
              cycles={monitoringHistory}
              activeCycle={activeCycle}
              totalRecommendedCycles={totalRecommendedCycles}
              sowingDate={farm.sowingDate}
              onStartCycle={handleStartCycle}
              isStartingCycle={isStartingCycle}
              onStatusUpdate={loadData}
            />
          </TabsContent>

          <TabsContent value="weather" className="mt-0">
            <MonitoringWeatherTab cycles={monitoringHistory} />
          </TabsContent>

          <TabsContent value="drone" className="mt-0">
            <MonitoringDroneReportTab 
              monitoringId={monitoringId}
              activeCycle={activeCycle}
              cycles={monitoringHistory}
              fieldName={farm.name}
              farmerName={farmerName}
              location={farm.locationName}
              cropType={farm.cropType}
              area={farm.area}
              onRefresh={loadData}
            />
          </TabsContent>

          <TabsContent value="overview" className="mt-0">
            <MonitoringOverviewTab 
              monitoringId={monitoringId}
              policyId={policyId}
              fieldName={farm.name}
              farmerName={farmerName}
              cropType={farm.cropType}
              area={farm.area}
              location={farm.locationName}
              cycles={monitoringHistory}
              activeCycle={activeCycle}
              onRefresh={loadData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
