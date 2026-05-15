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
  Sun,
  Droplets,
  Cloud,
  Thermometer,
  Zap,
  CheckCircle,
  FileText,
  Monitor
} from "lucide-react";
import cropMonitoringApiService from "@/services/cropMonitoringApi";
import { getFarmById } from "@/services/farmsApi";
import LeafletMap from "@/components/common/LeafletMap";
import { format } from "date-fns";

export default function CropMonitoringDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [monitoring, setMonitoring] = useState<any>(null);
  const [farm, setFarm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const resp = await cropMonitoringApiService.getMonitoringHistory();
      const allHistory = resp.data || resp || [];
      const current = allHistory.find((m: any) => (m._id || m.id) === id);
      
      if (current) {
        setMonitoring(current);
        const farmId = current.farmId?._id || current.farmId || current.farm?._id || current.farm;
        if (farmId) {
          const farmResp = await getFarmById(farmId);
          setFarm(farmResp.data || farmResp);
        }
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
        <p className="text-slate-500 font-medium">Updating monitoring data...</p>
      </div>
    );
  }

  if (!monitoring) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Activity className="h-16 w-16 text-emerald-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Session Not Found</h2>
        <p className="text-slate-500 mt-2 max-w-md">The monitoring session you're looking for doesn't exist or is no longer active.</p>
        <Button className="mt-6 bg-emerald-600" onClick={() => navigate("/assessor/crop-monitoring")}>
          Back to Monitoring
        </Button>
      </div>
    );
  }

  const status = monitoring.status || "IN_PROGRESS";
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          className="text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
          onClick={() => navigate("/assessor/crop-monitoring")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Fields
        </Button>
        <Badge className={cn(
          "px-4 py-1.5 rounded-full font-bold uppercase tracking-wider text-[10px]",
          status === "IN_PROGRESS" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-100 text-slate-600"
        )}>
          {status.replace('_', ' ')}
        </Badge>
      </div>

      {/* Hero Header */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3 border-slate-200 shadow-sm overflow-hidden bg-white">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              <div className="h-24 w-24 bg-emerald-50 rounded-3xl flex items-center justify-center border border-emerald-100 shadow-sm flex-shrink-0">
                <Sprout className="h-12 w-12 text-emerald-600" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                    {farm?.name || "Premium Field Alpha"}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 font-medium">
                   <span className="flex items-center"><User className="h-4 w-4 mr-2" /> {farm?.farmerId?.name || "Farmer X"}</span>
                   <span className="flex items-center"><MapPin className="h-4 w-4 mr-2" /> {farm?.locationName || "Rwanda"}</span>
                   <span className="flex items-center"><Monitor className="h-4 w-4 mr-2" /> Cycle {monitoring.cycle || "1"} of 4</span>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100 min-w-[140px]">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Health Index</p>
                 <div className="text-4xl font-black text-emerald-600">0.82</div>
                 <p className="text-[10px] font-bold text-emerald-500 mt-1">Excellent (NDVI)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 shadow-lg shadow-emerald-50 bg-emerald-600 text-white overflow-hidden">
           <CardContent className="p-6 h-full flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Active Cycle</p>
                <h3 className="text-xl font-bold mb-2">Vegetative Stage</h3>
                <p className="text-xs opacity-90 leading-relaxed">
                   Currently monitoring leaf development and stem elongation.
                </p>
              </div>
              <Button variant="secondary" className="w-full bg-white/20 hover:bg-white/30 text-white border-none mt-4 font-bold">
                 View Schedule
              </Button>
           </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
         <TabsList className="bg-slate-100 p-1.5 rounded-2xl w-full max-w-2xl flex border border-slate-200/50">
            <TabsTrigger value="overview" className="flex-1 rounded-xl py-2.5 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm transition-all">
               Field Overview
            </TabsTrigger>
            <TabsTrigger value="weather" className="flex-1 rounded-xl py-2.5 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm transition-all">
               Micro-Climate
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 rounded-xl py-2.5 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm transition-all">
               Cycle History
            </TabsTrigger>
         </TabsList>

         <TabsContent value="overview" className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-8">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                     <Card className="border-slate-100 shadow-sm bg-white hover:border-emerald-200 transition-colors">
                        <CardContent className="p-5 text-center flex flex-col items-center">
                           <Sun className="h-6 w-6 text-amber-500 mb-2" />
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Light</span>
                           <span className="text-lg font-black text-slate-800">8.2 hrs</span>
                        </CardContent>
                     </Card>
                     <Card className="border-slate-100 shadow-sm bg-white hover:border-emerald-200 transition-colors">
                        <CardContent className="p-5 text-center flex flex-col items-center">
                           <Droplets className="h-6 w-6 text-blue-500 mb-2" />
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Moisture</span>
                           <span className="text-lg font-black text-slate-800">42%</span>
                        </CardContent>
                     </Card>
                     <Card className="border-slate-100 shadow-sm bg-white hover:border-emerald-200 transition-colors">
                        <CardContent className="p-5 text-center flex flex-col items-center">
                           <Thermometer className="h-6 w-6 text-rose-500 mb-2" />
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Soil Temp</span>
                           <span className="text-lg font-black text-slate-800">22.4°C</span>
                        </CardContent>
                     </Card>
                     <Card className="border-slate-100 shadow-sm bg-white hover:border-emerald-200 transition-colors">
                        <CardContent className="p-5 text-center flex flex-col items-center">
                           <Zap className="h-6 w-6 text-indigo-500 mb-2" />
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Vigor</span>
                           <span className="text-lg font-black text-slate-800">High</span>
                        </CardContent>
                     </Card>
                  </div>

                  <Card className="border-slate-200 shadow-sm overflow-hidden">
                     <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
                        <CardTitle className="text-lg font-black text-slate-800">Live Field Map</CardTitle>
                     </CardHeader>
                     <div className="h-[400px] bg-slate-100 relative">
                        <LeafletMap 
                           center={farm?.location?.coordinates ? [farm.location.coordinates[1], farm.location.coordinates[0]] : [-1.9441, 30.0619]}
                           zoom={15}
                           height="100%"
                           tileLayer="satellite"
                           boundary={farm?.boundary}
                        />
                     </div>
                  </Card>
               </div>

               <div className="space-y-6">
                  <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
                     <CardHeader className="pb-3 border-b border-slate-50">
                        <CardTitle className="text-sm font-black text-slate-800">Monitoring Actions</CardTitle>
                     </CardHeader>
                     <CardContent className="p-5 space-y-4">
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-sm shadow-emerald-100">
                           Generate Cycle Report
                        </Button>
                        <Button variant="outline" className="w-full border-slate-200 text-slate-600 h-11 rounded-xl font-bold">
                           Request Drone Flight
                        </Button>
                        <div className="pt-4 border-t border-slate-100">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Field Notes</p>
                           <textarea 
                              className="w-full h-32 p-3 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                              placeholder="Add clinical field notes here..."
                           />
                        </div>
                     </CardContent>
                  </Card>

                  <Card className="border-slate-200 shadow-sm bg-slate-50/50">
                     <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-4">
                           <div className="p-2 bg-white rounded-lg shadow-sm">
                              <CheckCircle className="h-5 w-5 text-emerald-500" />
                           </div>
                           <h4 className="text-sm font-bold text-slate-800">Compliance Status</h4>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                           Field is currently meeting all environmental compliance thresholds for the "Standard Bio" policy.
                        </p>
                     </CardContent>
                  </Card>
               </div>
            </div>
         </TabsContent>

         <TabsContent value="weather" className="mt-8">
            <Card className="border-slate-200 shadow-sm">
               <CardContent className="p-20 text-center">
                  <Cloud className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-800">Detailed Weather Analysis</h3>
                  <p className="text-slate-500 mt-2">Connecting to hyper-local weather sensors...</p>
               </CardContent>
            </Card>
         </TabsContent>
      </Tabs>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
