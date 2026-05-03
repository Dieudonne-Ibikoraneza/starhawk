import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { 
  ArrowLeft, MapPin, Sprout, Shield, FileWarning, 
  ClipboardList, Activity, Satellite, Hash, Loader2, 
  ChevronRight, TrendingUp, CloudRain, Droplets, Thermometer,
  Wind, ShieldCheck, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { getFarmById, getVegetationStats, getWeatherForecast } from "@/services/farmsApi";
import { useToast } from "@/hooks/use-toast";

interface FarmDetailsTabProps {
  farmId: string;
  onBack: () => void;
  onViewPolicy: (policyId: string) => void;
  onFileClaim: (policyId: string) => void;
}

export default function FarmDetailsTab({ farmId, onBack, onViewPolicy, onFileClaim }: FarmDetailsTabProps) {
  const { toast } = useToast();
  const [farm, setFarm] = useState<any>(null);
  const [monitoring, setMonitoring] = useState<any>(null);
  const [weather, setWeather] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFarmData();
  }, [farmId]);

  const loadFarmData = async () => {
    if (!farmId || farmId === "null" || farmId === "undefined") {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // AgroMonitoring API throws an error if endDate is even slightly in the future (timezone issues).
      // We use yesterday as the safe endDate.
      const endDate = format(subDays(new Date(), 1), "yyyy-MM-dd");
      const startDate = format(subDays(new Date(), 31), "yyyy-MM-dd");

      const [farmRes, monitoringRes, weatherRes] = await Promise.all([
        getFarmById(farmId),
        getVegetationStats(farmId, startDate, endDate),
        getWeatherForecast(farmId, startDate, endDate)
      ]);

      setFarm(farmRes?.data || farmRes);
      setMonitoring(monitoringRes?.data || monitoringRes);
      setWeather(weatherRes?.data || weatherRes || []);
    } catch (err: any) {
      console.error('Failed to load farm details:', err);
      toast({
        title: "Error",
        description: "Could not load farm details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
      </div>
    );
  }

  if (!farm) return null;

  const ndviValue = monitoring?.[0]?.ndvi || monitoring?.ndvi;
  const healthPercent = typeof ndviValue === 'number' ? Math.round(ndviValue * 100) : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="group -ml-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to My Farms
          </Button>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 border border-green-100 shadow-sm">
              <Sprout className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">{farm.name || "Unnamed Farm"}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${
                  farm.status === 'INSURED' || farm.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-700 border-green-200' 
                    : 'bg-blue-100 text-blue-700 border-blue-200'
                }`}>
                  {farm.status || 'REGISTERED'}
                </Badge>
                <span className="text-gray-400 text-sm">•</span>
                <span className="text-gray-500 text-sm flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {farm.locationName || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-gray-200">
            <Satellite className="h-4 w-4" />
            Update Map
          </Button>
          {farm.status !== 'INSURED' && (
            <Button className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Get Insured
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Monitoring */}
        <div className="lg:col-span-2 space-y-8">
          {/* Health Summary Card */}
          <Card className="border-gray-200 shadow-xl shadow-gray-100/50 bg-white overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50/50 to-transparent border-b border-gray-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Live Health Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Vegetation Index (NDVI)</span>
                      <span className="text-3xl font-black text-gray-900">{healthPercent !== null ? `${healthPercent}%` : "N/A"}</span>
                    </div>
                    <Progress value={healthPercent || 0} className="h-3 bg-gray-100" />
                    <p className="text-xs text-gray-400 italic">
                      Last updated: {monitoring?.[0]?.monitoredAt ? format(new Date(monitoring[0].monitoredAt), "PPP") : "Just now"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="text-xs text-gray-500 font-medium mb-1">Moisture Level</div>
                      <div className="text-xl font-bold text-gray-900">Optimal</div>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="text-xs text-gray-500 font-medium mb-1">Growth Stage</div>
                      <div className="text-xl font-bold text-gray-900">Vegetative</div>
                    </div>
                  </div>
                </div>

                <div className="relative rounded-2xl bg-gray-100 aspect-video flex items-center justify-center overflow-hidden border border-gray-200 group">
                  <Satellite className="h-12 w-12 text-gray-300 group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-4">
                    <span className="text-white text-xs font-medium">Satellite View Simulation</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weather Panel */}
          <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <CloudRain className="h-5 w-5 text-blue-500" />
                Local Forecast
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-gray-100">
                {[1, 2, 3, 4, 5].map((day) => (
                  <div key={day} className="p-6 text-center space-y-3 hover:bg-gray-50 transition-colors">
                    <span className="text-xs font-bold text-gray-400 uppercase">{format(new Date(Date.now() + day * 86400000), "EEE")}</span>
                    <div className="mx-auto h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                      {day % 2 === 0 ? <Droplets className="h-5 w-5" /> : <CloudRain className="h-5 w-5" />}
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-lg font-black text-gray-900">24°</div>
                      <div className="text-xs text-gray-500">18°C</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Details & Records */}
        <div className="space-y-8">
          <Card className="border-gray-200 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-gray-700" />
                Farm Registry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <DetailItem label="Crop Type" value={farm.cropType || "N/A"} icon={<Sprout className="h-4 w-4" />} />
              <DetailItem label="Area Size" value={`${farm.area || "N/A"} Hectares`} icon={<Activity className="h-4 w-4" />} />
              <DetailItem label="Sowing Date" value={farm.sowingDate ? format(new Date(farm.sowingDate), "PPP") : "N/A"} icon={<Hash className="h-4 w-4" />} />
              <Separator className="my-2" />
              <DetailItem label="Location" value={farm.locationName || "Rwanda"} icon={<MapPin className="h-4 w-4" />} />
              {farm.eosdaFieldId && (
                <DetailItem label="Field ID" value={farm.eosdaFieldId} icon={<Satellite className="h-4 w-4" />} mono />
              )}
            </CardContent>
          </Card>

          {/* Insurance Overview Card */}
          <Card className={`border-none shadow-xl ${farm.status === 'INSURED' ? 'bg-[rgba(20,40,75,1)] text-white' : 'bg-gray-100 text-gray-900'}`}>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">Insurance Status</h3>
                  <p className={`text-sm ${farm.status === 'INSURED' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {farm.status === 'INSURED' ? 'Protected by Starhawk' : 'No active coverage'}
                  </p>
                </div>
                <Shield className={`h-8 w-8 ${farm.status === 'INSURED' ? 'text-blue-400' : 'text-gray-400'}`} />
              </div>

              {farm.status === 'INSURED' ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                    <div className="text-xs opacity-70 mb-1 font-medium">Active Policy</div>
                    <div className="font-bold flex items-center justify-between">
                      SH-88291-RW
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                  <Button variant="secondary" className="w-full bg-white text-[rgba(20,40,75,1)] hover:bg-blue-50 font-bold">
                    File a Claim
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 text-xs font-medium">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Protect your harvest from unexpected climate risks.
                  </div>
                  <Button className="w-full bg-[rgba(20,40,75,1)] text-white hover:bg-[rgba(15,30,56,1)] font-bold">
                    Explore Plans
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, icon, mono }: { label: string; value: string; icon: any; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3 text-gray-500">
        <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-green-50 transition-colors">
          {icon}
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className={`text-sm font-bold text-gray-900 ${mono ? 'font-mono bg-gray-50 px-2 py-0.5 rounded' : ''}`}>{value}</span>
    </div>
  );
}
