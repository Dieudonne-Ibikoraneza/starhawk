import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { 
  ArrowLeft, MapPin, Sprout, Shield, FileWarning, 
  ClipboardList, Activity, Satellite, Hash, Loader2, 
  ChevronRight, TrendingUp, CloudRain, Droplets, Thermometer,
  Wind, ShieldCheck, AlertTriangle, Sparkles, CheckCircle2, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { getFarmById, getVegetationStats, getWeatherForecast } from "@/services/farmsApi";
import { getFarmerSuggestions, getMonitoringCycle, getInsight } from "@/services/aiApi";
import { useToast } from "@/hooks/use-toast";
import { AiChatInterface } from "@/components/common/AiChatInterface";
import { FieldMapWithLayers } from "@/components/assessor/FieldMapWithLayers";
import { renewFarmCycle } from "@/services/farmsApi";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FarmDetailsTabProps {
  farmId: string;
  onBack: () => void;
  onViewPolicy: (policyId: string) => void;
  onFileClaim: (policyId: string) => void;
  activePolicy?: any;
  hideAiCard?: boolean;
}

export default function FarmDetailsTab({ farmId, onBack, onViewPolicy, onFileClaim, activePolicy, hideAiCard = false }: FarmDetailsTabProps) {
  const { toast } = useToast();
  const [farm, setFarm] = useState<any>(null);
  const [monitoring, setMonitoring] = useState<any>(null);
  const [weather, setWeather] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // AI Insights State
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [cycleAnalysis, setCycleAnalysis] = useState<any>(null);
  const [cycleLoading, setCycleLoading] = useState(false);

  // Renew Cycle State
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [renewCropType, setRenewCropType] = useState("");
  const [renewSowingDate, setRenewSowingDate] = useState("");
  const [renewLoading, setRenewLoading] = useState(false);

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
      // AgroMonitoring API is very sensitive to timezone boundaries (throws 'end can not be after now').
      // We use 2 days ago as the safe endDate to guarantee we never hit a timezone mismatch.
      const endDate = format(subDays(new Date(), 2), "yyyy-MM-dd");
      const startDate = format(subDays(new Date(), 32), "yyyy-MM-dd");

      const [farmRes, monitoringRes, weatherRes] = await Promise.all([
        getFarmById(farmId),
        getVegetationStats(farmId, startDate, endDate),
        getWeatherForecast(farmId, startDate, endDate)
      ]);

      setFarm(farmRes?.data || farmRes);
      setMonitoring(monitoringRes?.data || monitoringRes);
      setWeather(weatherRes?.data || weatherRes || []);

      // Auto-fetch existing AI insights
      const [advice, cycle] = await Promise.all([
        getInsight(farmId, 'FARMER_ADVICE'),
        getInsight(farmId, 'MONITORING_CYCLE')
      ]);

      if (advice) setAiInsights(advice);
      if (cycle) setCycleAnalysis(cycle);
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

  const handleAskAI = async () => {
    if (!farm) return;
    setAiLoading(true);
    try {
      const insights = await getFarmerSuggestions(farm, weather, monitoring);
      if (insights) {
        setAiInsights(insights);
      } else {
        toast({ title: "AI Error", description: "Could not generate insights.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({
        title: "AI Error",
        description: error.message || "Failed to connect to AI engine.",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAnalyzeCycle = async () => {
    if (!farm) return;
    
    setCycleLoading(true);
    try {
      // Historical data from monitoring and weather
      const historicalNdvi = monitoring?.ndviData || [];
      const historicalWeather = weather || [];
      
      const analysis = await getMonitoringCycle(farm, historicalNdvi, historicalWeather);
      if (analysis) {
        setCycleAnalysis(analysis);
        toast({
          title: "Cycle Analysis Complete",
          description: "Our AI has generated a detailed monitoring report for your farm.",
        });
      }
    } catch (error: any) {
      toast({
        title: "AI Analysis Error",
        description: error.message || "Failed to analyze monitoring cycle.",
        variant: "destructive",
      });
    } finally {
      setCycleLoading(false);
    }
  };

  const handleRenewSubmit = async () => {
    if (!renewCropType || !renewSowingDate) {
      toast({ title: "Error", description: "Please select crop type and sowing date.", variant: "destructive" });
      return;
    }
    setRenewLoading(true);
    try {
      await renewFarmCycle(farmId, renewCropType, renewSowingDate);
      toast({ title: "Success", description: "New crop cycle started successfully!" });
      setRenewDialogOpen(false);
      onBack();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to start new cycle.", variant: "destructive" });
    } finally {
      setRenewLoading(false);
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
  const cycleData = cycleAnalysis?.data || cycleAnalysis;

  // Extract daily forecasts (one per day) from the 3-hourly forecast array
  const dailyForecasts = Array.isArray(weather) ? weather.reduce((acc: any[], curr: any) => {
    const date = new Date(curr.dt * 1000).toDateString();
    if (!acc.find(item => new Date(item.dt * 1000).toDateString() === date)) {
      acc.push(curr);
    }
    return acc;
  }, []).slice(0, 5) : [];
  
  const currentWeather = dailyForecasts.length > 0 ? dailyForecasts[0] : null;

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
          {farm.status !== 'INSURED' && farm.status !== 'ARCHIVED' && (
            <Button className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Get Insured
            </Button>
          )}
          {farm.status !== 'ARCHIVED' && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
              onClick={() => setRenewDialogOpen(true)}
            >
              <Sprout className="h-4 w-4 mr-2" />
              Start New Season
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
            <CardContent className="p-6 space-y-6">
              {/* Map at the top (increased height and full width) */}
              <div className="relative rounded-2xl bg-gray-100 h-[450px] w-full overflow-hidden border border-gray-200 shadow-inner">
                <FieldMapWithLayers
                  fieldId={farmId}
                  showLayerControls={true}
                  boundary={farm.boundary}
                  center={farm.location?.coordinates && farm.location.coordinates.length >= 2 
                    ? [farm.location.coordinates[1], farm.location.coordinates[0]] 
                    : undefined
                  }
                />
              </div>

              {/* Stats at the bottom */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {/* NDVI Progress */}
                <div className="md:col-span-1 space-y-2 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Vegetation Index (NDVI)</span>
                    <span className="text-2xl font-black text-gray-900">{healthPercent !== null ? `${healthPercent}%` : "N/A"}</span>
                  </div>
                  <Progress value={healthPercent || 0} className="h-2 bg-gray-200" />
                  <p className="text-[10px] text-gray-400 italic">
                    Last updated: {monitoring?.[0]?.monitoredAt ? format(new Date(monitoring[0].monitoredAt), "PPP") : "Just now"}
                  </p>
                </div>

                {/* Moisture Level */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-center">
                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Moisture Level</div>
                  <div className="text-xl font-bold text-gray-900">Optimal</div>
                </div>

                {/* Growth Stage */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-center">
                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Growth Stage</div>
                  <div className="text-xl font-bold text-gray-900">Vegetative</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights Card */}
          {!hideAiCard && (
            <Card className="border-green-200 shadow-md bg-gradient-to-br from-white to-green-50 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles className="h-24 w-24 text-green-600" />
            </div>
            <CardHeader className="border-b border-green-100/50 pb-4">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-green-900">Starhawk AI Insights</span>
                </div>
                {!aiInsights && !aiLoading && (
                  <Button 
                    size="sm" 
                    onClick={handleAskAI}
                    className="bg-green-600 hover:bg-green-700 text-white shadow-sm gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate Advice
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="h-10 w-10 animate-spin text-green-600" />
                  <p className="text-sm text-green-700 animate-pulse font-medium">Starhawk AI is analyzing your field...</p>
                </div>
              ) : aiInsights ? (
                <AiChatInterface 
                  initialInsight={aiInsights}
                  title="Farmer Crop Advisor"
                  role="FARMER"
                  borderless={true}
                  suggestedQuestions={[
                    "How can I improve my yield?",
                    "What pests should I look out for?",
                    "Is my irrigation sufficient?",
                    "When is the best time to apply fertilizer?"
                  ]}
                />
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500 mb-4">
                    Click "Generate Advice" to have our AI analyze your field's satellite indices and weather forecast to give you actionable farming tips.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

          {/* AI Monitoring Cycle & Marketability Card */}
          <Card className="border-blue-200 shadow-md bg-gradient-to-br from-white to-blue-50 overflow-hidden">
            <CardHeader className="border-b border-blue-100/50">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span className="text-blue-900">Monitoring Cycle Analysis</span>
                </div>
                {!cycleAnalysis && !cycleLoading && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleAnalyzeCycle}
                    className="border-blue-200 text-blue-700 hover:bg-blue-100 gap-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Analyze Cycle
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {cycleLoading ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <div className="relative">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                    <Activity className="h-4 w-4 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-sm text-blue-700 animate-pulse font-medium">Crunching historical satellite trends...</p>
                </div>
              ) : cycleAnalysis ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                      <p className="text-[10px] uppercase tracking-wider text-blue-500 font-bold mb-1">Current Stage</p>
                      <p className="text-sm font-black text-gray-900">{cycleData.currentStage || "N/A"}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                      <p className="text-[10px] uppercase tracking-wider text-blue-500 font-bold mb-1">Health Trend</p>
                      <p className={`text-sm font-black ${
                        cycleData.healthTrend === 'Improving' ? 'text-green-600' : 
                        cycleData.healthTrend === 'Declining' ? 'text-red-500' : 'text-blue-600'
                      }`}>
                        {cycleData.healthTrend || "Stable"}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                      <p className="text-[10px] uppercase tracking-wider text-blue-500 font-bold mb-1">Days to Harvest</p>
                      <p className="text-sm font-black text-gray-900">{cycleData.daysToHarvest || "N/A"} Days</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                      <p className="text-[10px] uppercase tracking-wider text-blue-500 font-bold mb-1">Market Score</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-gray-900">{cycleData.marketValueScore || 0}%</p>
                        <Progress value={cycleData.marketValueScore || 0} className="h-1.5 w-12 bg-blue-100" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-widest">Cycle Report</h4>
                    <p className="text-sm text-gray-700 leading-relaxed italic border-l-2 border-blue-200 pl-4 bg-blue-50/30 py-2 rounded-r-lg">
                      {cycleData.cycleAnalysis}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-green-700 uppercase tracking-widest">Growth Recommendations</h4>
                      <ul className="space-y-1.5">
                        {(cycleData.recommendations || []).map((rec: string, i: number) => (
                          <li key={i} className="text-xs text-gray-600 flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-blue-700 uppercase tracking-widest">Market Potential</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {cycleData.investmentPotential}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-500 italic">
                    Run a full cycle analysis to see growth stages and investment potential.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weather Forecast */}
          <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-transparent">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CloudRain className="h-5 w-5 text-blue-500" />
                  Local Weather & Forecast
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {currentWeather && (
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 bg-white">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center">
                       <img src={`http://openweathermap.org/img/wn/${currentWeather.weather[0].icon}@2x.png`} alt="weather" className="h-12 w-12 drop-shadow-sm" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Current Weather</h3>
                      <div className="text-3xl font-black text-gray-900">
                        {Math.round(currentWeather.main.temp - 273.15)}°C
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div className="flex flex-col items-center">
                       <span className="text-gray-500 font-medium">Condition</span>
                       <span className="font-bold text-gray-900 capitalize">{currentWeather.weather[0].description}</span>
                    </div>
                    <div className="flex flex-col items-center">
                       <span className="text-gray-500 font-medium">Humidity</span>
                       <span className="font-bold text-gray-900">{currentWeather.main.humidity}%</span>
                    </div>
                    <div className="flex flex-col items-center">
                       <span className="text-gray-500 font-medium">Wind</span>
                       <span className="font-bold text-gray-900">{currentWeather.wind.speed} m/s</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-gray-100">
                {(dailyForecasts.length > 0 ? dailyForecasts : [1, 2, 3, 4, 5]).map((day: any, idx: number) => {
                  const isDummy = typeof day === 'number';
                  const dateStr = isDummy ? format(new Date(Date.now() + day * 86400000), "EEE") : format(new Date(day.dt * 1000), "EEE");
                  const tempMax = isDummy ? 24 : Math.round(day.main.temp_max - 273.15);
                  const tempMin = isDummy ? 18 : Math.round(day.main.temp_min - 273.15);
                  
                  return (
                    <div key={idx} className="p-4 md:p-6 text-center space-y-3 hover:bg-gray-50 transition-colors">
                      <span className="text-xs font-bold text-gray-400 uppercase">{dateStr}</span>
                      <div className="mx-auto h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                        {isDummy ? (
                          idx % 2 === 0 ? <Droplets className="h-5 w-5 text-blue-500" /> : <CloudRain className="h-5 w-5 text-blue-500" />
                        ) : (
                          <img src={`http://openweathermap.org/img/wn/${day.weather[0].icon}.png`} alt="weather" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-lg font-black text-gray-900">{tempMax}°</div>
                        <div className="text-xs text-gray-500">{tempMin}°C</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Details & Records */}
        <div className="space-y-8">
          <Card className="border-gray-200 shadow-xl shadow-gray-100/40 bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                <ClipboardList className="h-5 w-5 text-green-600" />
                Farm Registry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <DetailItem label="Crop Type" value={farm.cropType || "N/A"} icon={<Sprout className="h-4.5 w-4.5 text-green-600" />} />
              <DetailItem 
                label="Area Size" 
                value={typeof farm.area === 'number' 
                  ? `${farm.area.toFixed(2)} Hectares` 
                  : !isNaN(parseFloat(farm.area)) 
                    ? `${parseFloat(farm.area).toFixed(2)} Hectares` 
                    : `${farm.area || "N/A"} Hectares`
                } 
                icon={<Activity className="h-4.5 w-4.5 text-green-600" />} 
              />
              <DetailItem label="Sowing Date" value={farm.sowingDate ? format(new Date(farm.sowingDate), "PPP") : "N/A"} icon={<Hash className="h-4.5 w-4.5 text-green-600" />} />
              <DetailItem label="Registered At" value={farm.createdAt ? format(new Date(farm.createdAt), "PPP") : "N/A"} icon={<Calendar className="h-4.5 w-4.5 text-green-600" />} />
              <DetailItem label="Location" value={farm.locationName || "Rwanda"} icon={<MapPin className="h-4.5 w-4.5 text-green-600" />} vertical />
            </CardContent>
          </Card>

          {/* Insurance Overview Card */}
          <Card className={`border-none shadow-xl ${farm.status === 'INSURED' || activePolicy ? 'bg-[rgba(20,40,75,1)] text-white' : 'bg-gray-100 text-gray-900'}`}>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">Insurance Status</h3>
                  <p className={`text-sm ${farm.status === 'INSURED' || activePolicy ? 'text-blue-100' : 'text-gray-500'}`}>
                    {farm.status === 'INSURED' || activePolicy ? 'Protected by Starhawk' : 'No active coverage'}
                  </p>
                </div>
                <Shield className={`h-8 w-8 ${farm.status === 'INSURED' || activePolicy ? 'text-blue-400' : 'text-gray-400'}`} />
              </div>

              {farm.status === 'INSURED' || activePolicy ? (
                <div className="space-y-4">
                  <div 
                    className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 cursor-pointer hover:bg-white/15 transition-colors"
                    onClick={() => activePolicy && onViewPolicy(activePolicy._id || activePolicy.id)}
                  >
                    <div className="text-xs opacity-70 mb-1 font-medium">Active Policy</div>
                    <div className="font-bold flex items-center justify-between">
                      {activePolicy?.policyNumber || "SH-88291-RW"}
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                  <Button 
                    variant="secondary" 
                    className="w-full bg-white text-[rgba(20,40,75,1)] hover:bg-blue-50 font-bold transition-transform active:scale-[0.98]"
                    onClick={() => {
                      onFileClaim(activePolicy?._id || activePolicy?.id || "");
                    }}
                  >
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

      {/* Renew Cycle Dialog */}
      <Dialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Start New Season</DialogTitle>
            <DialogDescription>
              Archive the current crop and register a new crop on this exact piece of land. You will not need to re-upload boundaries.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cropType">New Crop Type</Label>
              <Select onValueChange={setRenewCropType} value={renewCropType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select crop" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAIZE">Maize</SelectItem>
                  <SelectItem value="BEANS">Beans</SelectItem>
                  <SelectItem value="WHEAT">Wheat</SelectItem>
                  <SelectItem value="RICE">Rice</SelectItem>
                  <SelectItem value="POTATOES">Potatoes</SelectItem>
                  <SelectItem value="CASSAVA">Cassava</SelectItem>
                  <SelectItem value="SOYBEANS">Soybeans</SelectItem>
                  <SelectItem value="SORGHUM">Sorghum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sowingDate">New Sowing Date</Label>
              <Input
                id="sowingDate"
                type="date"
                value={renewSowingDate}
                onChange={(e) => setRenewSowingDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRenewSubmit} disabled={renewLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {renewLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sprout className="h-4 w-4 mr-2" />}
              Start Season
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailItem({ label, value, icon, vertical }: { label: string; value: string; icon: any; vertical?: boolean }) {
  if (vertical) {
    return (
      <div className="flex flex-col gap-2 p-4 rounded-xl bg-gray-50/70 border border-gray-100 transition-colors hover:bg-gray-50">
        <div className="flex items-center gap-2.5 text-gray-500">
          <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center border shadow-xs">
            {icon}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        </div>
        <span className="text-sm font-bold text-gray-950 pl-9.5 leading-relaxed break-words">{value}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50/70 border border-gray-100 transition-colors hover:bg-gray-50 group">
      <div className="flex items-center gap-3 text-gray-500">
        <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center group-hover:bg-green-50 border shadow-xs transition-colors">
          {icon}
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-sm font-bold text-gray-950 max-w-[55%] text-right truncate">{value}</span>
    </div>
  );
}
