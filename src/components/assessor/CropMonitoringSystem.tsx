import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardTheme } from "@/utils/dashboardTheme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import cropMonitoringApiService, { startCropMonitoring, getMonitoringHistory, updateMonitoring, generateMonitoringReport, getMonitoringById } from "@/services/cropMonitoringApi";
import policiesApiService from "@/services/policiesApi";
import { getUserId } from "@/services/authAPI";
import { useToast } from "@/hooks/use-toast";
import { getRequiredMonitoringCycles } from "@/lib/crops";
import { MonitoringOverviewTab } from "./tabs/MonitoringOverviewTab";
import { FieldMapWithLayers } from "./FieldMapWithLayers";
import meteosourceApiService from "@/services/meteosourceApi";
import { 
  MapPin,
  Search,
  Filter,
  Plus,
  FileText,
  Activity,
  CloudRain,
  Leaf,
  FileSpreadsheet,
  Sun,
  Wind,
  Droplets,
  Thermometer,
  Clock,
  AlertTriangle,
  Calendar,
  Cloud
} from "lucide-react";

interface MonitoringData {
  _id: string;
  policyId: string;
  farmId: string;
  assessorId: string;
  monitoringNumber: number;
  monitoringDate: string;
  weatherData?: any;
  ndviData?: any;
  status: 'IN_PROGRESS' | 'COMPLETED';
  observations?: string[];
  photoUrls?: string[];
  notes?: string;
  reportGenerated?: boolean;
  reportGeneratedAt?: string;
}

interface Policy {
  _id: string;
  policyNumber?: string;
  farmerId?: any;
  farmId?: any;
  status?: string;
  startDate?: string;
  endDate?: string;
  cropType?: string;
  coverageAmount?: number;
  premium?: number;
}

interface Field {
  id: string;
  farmerName: string;
  crop: string;
  area: number;
  season: string;
  status: string;
  fieldName: string;
  sowingDate: string;
}

interface FieldDetail {
  fieldId: string;
  fieldName: string;
  farmer: string;
  cropType: string;
  area: number;
  season: string;
  sowingDate: string;
  location: string;
}

interface WeatherData {
  current: {
    temperature: number;
    summary: string;
    humidity: number;
    windSpeed: number;
    windDir: string;
    pressure: number;
    cloudCover: number;
    precipitation: number;
    precipitationType: string;
    icon: string;
    iconNum: number;
  };
  hourly: Array<{
    time: Date;
    temperature: number;
    summary: string;
    weather: string;
    icon: number;
    windSpeed: number;
    windDir: string;
    precipitation: number;
    humidity: number;
  }>;
  daily: Array<{
    date: Date;
    summary: string;
    weather: string;
    icon: number;
    maxTemp: number;
    minTemp: number;
    precipitation: number;
    humidity: number;
    windSpeed: number;
    windDir: string;
    sunrise: string;
    sunset: string;
  }>;
}

export default function CropMonitoringSystem() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assessorId, setAssessorId] = useState<string | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [monitoringHistory, setMonitoringHistory] = useState<MonitoringData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMonitoring, setSelectedMonitoring] = useState<any | null>(null);
  const [fullMonitoringDetails, setFullMonitoringDetails] = useState<any | null>(null);
  const [selectedField, setSelectedField] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("basic-info");
  const [viewMode, setViewMode] = useState<any>("monitoring");
  
  // Dialog states
  const [startMonitoringDialogOpen, setStartMonitoringDialogOpen] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [startingMonitoring, setStartingMonitoring] = useState(false);
  
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updatingMonitoring, setUpdatingMonitoring] = useState(false);
  const [updateData, setUpdateData] = useState({
    observations: [] as string[],
    photoUrls: [] as string[],
    notes: ''
  });
  
  const [generateReportLoading, setGenerateReportLoading] = useState(false);

  // Load assessor ID and data
  useEffect(() => {
    const loadAssessorId = async () => {
      try {
        const id = await getUserId();
        setAssessorId(id);
      } catch (err) {
        console.error('Failed to load assessor ID:', err);
      }
    };
    loadAssessorId();
  }, []);

  // Load policies and monitoring history
  useEffect(() => {
    if (assessorId) {
      loadPolicies();
      loadMonitoringHistory();
    }
  }, [assessorId]);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const response: any = await policiesApiService.getPolicies(1, 100);
      const policiesData = response.data || response || [];
      const policiesArray = Array.isArray(policiesData) ? policiesData : (policiesData.items || policiesData.results || []);
      
      // Filter for active policies (you may need to adjust this based on your API)
      const activePolicies = policiesArray.filter((policy: Policy) => 
        policy.status === 'ACTIVE' || policy.status === 'active'
      );
      
      setPolicies(activePolicies);
    } catch (err: any) {
      console.error('Failed to load policies:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to load policies',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMonitoringHistory = async () => {
    try {
      const history = await getMonitoringHistory();
      setMonitoringHistory(Array.isArray(history) ? history : []);
    } catch (err: any) {
      console.error('Failed to load monitoring history:', err);
      setMonitoringHistory([]);
    }
  };

  // Get monitoring count for a policy
  const getMonitoringCount = (policyId: string): number => {
    const field = monitoringHistory.find((m: any) => m.policyId === policyId);
    return field ? field.cyclesCount || 0 : 0;
  };

  // Check if monitoring can be started (dynamic cycles count based on crop type)
  const canStartMonitoring = (policyId: string): boolean => {
    const policy = policies.find(p => p._id === policyId);
    const requiredCycles = getRequiredMonitoringCycles(policy?.cropType);
    return getMonitoringCount(policyId) < requiredCycles;
  };

  // Handle start monitoring
  const handleStartMonitoring = async () => {
    if (!selectedPolicyId) return;
    
    const policy = policies.find(p => p._id === selectedPolicyId);
    const requiredCycles = getRequiredMonitoringCycles(policy?.cropType);
    
    if (!canStartMonitoring(selectedPolicyId)) {
      toast({
        title: 'Maximum monitoring cycles reached',
        description: `You can only start monitoring ${requiredCycles} times per policy.`,
        variant: 'destructive'
      });
      return;
    }

    setStartingMonitoring(true);
    try {
      const result = await startCropMonitoring(selectedPolicyId);
      toast({
        title: 'Success',
        description: 'Crop monitoring started successfully.',
      });
      setStartMonitoringDialogOpen(false);
      setSelectedPolicyId(null);
      
      // Reload history and wait for it to complete
      const history = await getMonitoringHistory();
      const historyArray = Array.isArray(history) ? history : [];
      setMonitoringHistory(historyArray);
      
      const updatedField = historyArray.find((m: any) => m.policyId === selectedPolicyId) || result;
      if (updatedField) {
        handleViewFieldDetails(updatedField);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to start monitoring',
        variant: 'destructive'
      });
    } finally {
      setStartingMonitoring(false);
    }
  };

  // Handle update monitoring
  const handleUpdateMonitoring = async () => {
    if (!selectedMonitoring) return;

    setUpdatingMonitoring(true);
    try {
      await updateMonitoring(selectedMonitoring._id, {
        observations: updateData.observations,
        photoUrls: updateData.photoUrls,
        notes: updateData.notes
      });
      toast({
        title: 'Success',
        description: 'Monitoring data updated successfully.',
      });
      setUpdateDialogOpen(false);
      await loadMonitoringHistory();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update monitoring',
        variant: 'destructive'
      });
    } finally {
      setUpdatingMonitoring(false);
    }
  };

  // Handle generate report
  const handleGenerateReport = async (monitoringId: string) => {
    setGenerateReportLoading(true);
    try {
      await generateMonitoringReport(monitoringId);
      toast({
        title: 'Success',
        description: 'Monitoring report generated. Dispatched to insurer.',
      });
      await loadMonitoringHistory();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to generate report',
        variant: 'destructive'
      });
    } finally {
      setGenerateReportLoading(false);
    }
  };

  // Filter monitoring history
  const filteredMonitoring = monitoringHistory.filter((monitoring: any) => {
    const policyStr = typeof monitoring.policyId === "object"
      ? (monitoring.policyId.policyNumber || monitoring.policyId._id || "")
      : (monitoring.policyId || "");

    const matchesSearch = searchQuery === "" || 
      (monitoring.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      policyStr.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === 'IN_PROGRESS' && monitoring.hasMonitoring) ||
      (statusFilter === 'COMPLETED' && monitoring.cyclesCount > 0);
    return matchesSearch && matchesStatus;
  });

  // Legacy mock data (kept for backward compatibility with old components)
  const monitorings: any[] = [
    {
      id: "MON-001",
      farmerName: "Jean Baptiste",
      location: "Nyagatare, Eastern Province",
      type: "Crop Monitoring",
      status: "Active",
      date: "2024-10-03"
    },
    {
      id: "MON-002",
      farmerName: "Kamali Peace",
      location: "Gatsibo, Eastern Province",
      type: "Crop Monitoring",
      status: "Active",
      date: "2024-10-02"
    },
    {
      id: "MON-003",
      farmerName: "Mugabo John",
      location: "Gatsibo, Eastern Province",
      type: "Crop Monitoring",
      status: "Active",
      date: "2024-09-30"
    },
    {
      id: "MON-004",
      farmerName: "Nkurunziza Richard",
      location: "Nyagatare, Eastern Province",
      type: "Crop Monitoring",
      status: "Active",
      date: "2024-09-25"
    }
  ];

  // Mock field data for farmers
  const fieldsByFarmer: Record<string, Field[]> = {
    "Jean Baptiste": [
      {
        id: "FLD-002",
        farmerName: "Jean Baptiste",
        crop: "Maize",
        area: 2.8,
        season: "A",
        status: "Processed",
        fieldName: "Main Maize Field",
        sowingDate: "2025-03-05"
      }
    ],
    "Kamali Peace": [
      {
        id: "FLD-003",
        farmerName: "Kamali Peace",
        crop: "Rice",
        area: 1.5,
        season: "B",
        status: "Processed",
        fieldName: "Central Rice Field",
        sowingDate: "2025-09-20"
      }
    ],
    "Mugabo John": [
      {
        id: "FLD-001",
        farmerName: "Mugabo John",
        crop: "Maize",
        area: 3.4,
        season: "B",
        status: "Processed",
        fieldName: "North Maize Plot",
        sowingDate: "2025-09-15"
      },
      {
        id: "FLD-004",
        farmerName: "Mugabo John",
        crop: "Rice",
        area: 2.5,
        season: "A",
        status: "Processed",
        fieldName: "South Rice Field",
        sowingDate: "2025-03-01"
      },
      {
        id: "FLD-007",
        farmerName: "Mugabo John",
        crop: "Beans",
        area: 1.4,
        season: "B",
        status: "Processing Needed",
        fieldName: "East Beans Plot",
        sowingDate: "2025-09-10"
      }
    ],
    "Nkurunziza Richard": [
      {
        id: "FLD-005",
        farmerName: "Nkurunziza Richard",
        crop: "Potatoes",
        area: 2.0,
        season: "A",
        status: "Processed",
        fieldName: "West Potato Field",
        sowingDate: "2025-03-10"
      }
    ]
  };

  const getFieldsForMonitoring = (monitoring: MonitoringSummary): Field[] => {
    return fieldsByFarmer[monitoring.farmerName] || [];
  };

  // Filter monitorings
  const filteredMonitorings = monitorings.filter(monitoring => {
    const matchesSearch = searchQuery === "" ||
      monitoring.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      monitoring.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      monitoring.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || monitoring.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter("all");
    setSearchQuery("");
  };

  const handleViewFieldDetails = (field: any) => {
    if (!field.cropMonitoringId) {
       toast({ title: 'No Monitoring', description: 'This field has no active monitoring cycle.', variant: 'destructive' });
       return;
    }
    navigate(`/assessor/crop-monitoring/${field.cropMonitoringId}`);
  };

  const handleMonitoringClick = (monitoring: MonitoringSummary) => {
    setSelectedMonitoring(monitoring);
    setViewMode("fieldSelection");
  };

  const handleFieldClick = (field: Field) => {
    setSelectedField(field);
    setViewMode("fieldDetail");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedMonitoring(null);
    setSelectedField(null);
  };

  const handleBackToFields = () => {
    setViewMode("fieldSelection");
    setSelectedField(null);
  };

  const getSeasonFromSowingDate = (sowingDate?: string): string => {
    if (!sowingDate) return "B";
    const date = new Date(sowingDate);
    if (isNaN(date.getTime())) return "B";
    const month = date.getMonth(); // 0-11
    if (month >= 8 || month <= 0) {
      return "A";
    } else if (month >= 1 && month <= 5) {
      return "B";
    }
    return "B";
  };

  const getFieldDetails = (field: any): FieldDetail => {
    if (!field) {
      return {
        fieldId: "N/A",
        fieldName: "N/A",
        farmer: "N/A",
        cropType: "N/A",
        area: 0,
        season: "N/A",
        sowingDate: "N/A",
        location: "N/A"
      };
    }

    // If it's a real backend farm/field object
    const fieldId = field._id || field.id || "";
    const displayFieldId = fieldId ? `FLD-${String(fieldId).slice(-6).toUpperCase()}` : 'FLD-000';
    
    // Resolve farmer name from policy
    const activePolicy = policies.find(p => {
      const pId = p._id || p.id;
      const mPolicyId = typeof selectedMonitoring?.policyId === 'object' ? selectedMonitoring?.policyId?._id : selectedMonitoring?.policyId;
      return pId === mPolicyId;
    });
    
    const farmer = activePolicy?.farmerId;
    const farmerName = farmer 
      ? (farmer.name || `${farmer.firstName || ''} ${farmer.lastName || ''}`.trim() || 'Unknown Farmer')
      : (field.farmerName || 'Unknown Farmer');

    return {
      fieldId: displayFieldId,
      fieldName: field.name || field.fieldName || `Field ${displayFieldId}`,
      farmer: farmerName,
      cropType: field.cropType || field.crop || activePolicy?.cropType || 'Beans',
      area: field.area || 2.78,
      season: field.season || (field.sowingDate ? getSeasonFromSowingDate(field.sowingDate) : "B"),
      sowingDate: field.sowingDate ? new Date(field.sowingDate).toLocaleDateString() : "N/A",
      location: field.locationName || (field.location?.coordinates ? `${field.location.coordinates[1].toFixed(4)}, ${field.location.coordinates[0].toFixed(4)}` : "Nyagatare District, Eastern Province, Rwanda")
    };
  };

  const renderFieldSelection = () => {
    if (!selectedMonitoring) return null;
    const fields = getFieldsForMonitoring(selectedMonitoring);
    
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button 
            onClick={handleBackToList}
            className="text-teal-400 hover:text-teal-300"
          >
            Crop Monitoring
          </button>
          <span className="text-gray-500">/</span>
          <span className="text-gray-900">{selectedMonitoring.farmerName}</span>
        </div>

        {/* Table */}
        <Card className={`${dashboardTheme.card}`}>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Field ID</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Farmer</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Crop</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Area (ha)</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Season</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr
                      key={field.id}
                      onClick={() => handleFieldClick(field)}
                      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer ${
                        index % 2 === 0 ? "bg-gray-50/50" : ""
                      }`}
                    >
                      <td className="py-4 px-6 text-gray-900">{field.id}</td>
                      <td className="py-4 px-6 text-gray-900">{field.farmerName}</td>
                      <td className="py-4 px-6 text-gray-900">{field.crop}</td>
                      <td className="py-4 px-6 text-gray-900">{field.area} ha</td>
                      <td className="py-4 px-6 text-gray-900">{field.season}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          field.status === "Processed"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        }`}>
                          {field.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Weather Analysis Component
  const WeatherAnalysisTab = ({ location }: { location: string }) => {
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    useEffect(() => {
      loadWeatherData();
    }, []);

    const loadWeatherData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await meteosourceApiService.getCompleteWeatherData('kigali');
        setWeatherData(data);
        setLastUpdated(new Date());
      } catch (err: any) {
        console.error('Failed to load weather data:', err);
        setError(`Failed to load weather forecast: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    const getWeatherIcon = (summary: string) => {
      const summaryLower = summary.toLowerCase();
      if (summaryLower.includes('clear') || summaryLower.includes('sunny')) {
        return <Sun className="h-8 w-8 text-yellow-500" />;
      } else if (summaryLower.includes('cloudy') || summaryLower.includes('overcast')) {
        return <Cloud className="h-8 w-8 text-gray-500" />;
      } else if (summaryLower.includes('rain') || summaryLower.includes('drizzle')) {
        return <CloudRain className="h-8 w-8 text-blue-500" />;
      } else {
        return <Cloud className="h-8 w-8 text-gray-400" />;
      }
    };

    const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading weather data...</p>
          </div>
        </div>
      );
    }

    if (error || !weatherData) {
      return (
        <Card className={`${dashboardTheme.card}`}>
          <CardContent className="p-6">
            <div className="text-center text-red-400">
              <Cloud className="h-12 w-12 mx-auto mb-4" />
              <p>{error || 'Failed to load weather data'}</p>
              <Button 
                onClick={loadWeatherData} 
                className="mt-4 bg-teal-600 hover:bg-teal-700 text-white"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <Card className={`${dashboardTheme.card}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-gray-900">
              <div className="flex items-center">
                <CloudRain className="h-5 w-5 mr-2" />
                Current Weather
              </div>
              {lastUpdated && (
                <span className="text-xs text-gray-500">Updated: {formatTime(lastUpdated)}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getWeatherIcon(weatherData.current.summary)}
                <div>
                  <div className="text-4xl font-bold text-gray-900">
                    {weatherData.current.temperature}°C
                  </div>
                  <div className="text-lg text-gray-500 capitalize">
                    {weatherData.current.summary}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div className="flex items-center text-gray-600">
                <Wind className="h-5 w-5 mr-2 text-teal-500" />
                <div>
                  <div className="text-xs text-gray-500">Wind</div>
                  <div className="font-medium">{weatherData.current.windSpeed} km/h</div>
                </div>
              </div>
              <div className="flex items-center text-gray-600">
                <Droplets className="h-5 w-5 mr-2 text-blue-500" />
                <div>
                  <div className="text-xs text-gray-500">Humidity</div>
                  <div className="font-medium">{weatherData.current.humidity}%</div>
                </div>
              </div>
              <div className="flex items-center text-gray-600">
                <CloudRain className="h-5 w-5 mr-2 text-cyan-500" />
                <div>
                  <div className="text-xs text-gray-500">Precipitation</div>
                  <div className="font-medium">{weatherData.current.precipitation}mm</div>
                </div>
              </div>
              <div className="flex items-center text-gray-600">
                <Thermometer className="h-5 w-5 mr-2 text-orange-500" />
                <div>
                  <div className="text-xs text-gray-500">Pressure</div>
                  <div className="font-medium">{weatherData.current.pressure} hPa</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${dashboardTheme.card}`}>
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <Clock className="h-5 w-5 mr-2" />
              8-Hour Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="flex gap-4">
                {weatherData.hourly.map((hour, idx) => (
                  <div key={idx} className="min-w-[100px] text-center">
                    <div className="text-gray-500 text-sm mb-2">{formatTime(hour.time)}</div>
                    <div className="flex justify-center mb-2">
                      {getWeatherIcon(hour.summary)}
                    </div>
                    <div className="text-gray-900 font-bold mb-1">{hour.temperature}°</div>
                    <div className="text-gray-500 text-xs capitalize">{hour.summary}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${dashboardTheme.card}`}>
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <Calendar className="h-5 w-5 mr-2" />
              7-Day Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weatherData.daily.map((day, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="text-gray-500 w-20">{formatDate(day.date)}</div>
                    <div className="flex justify-center w-12">
                      {getWeatherIcon(day.summary)}
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-900 capitalize">{day.summary}</div>
                      <div className="text-gray-500 text-xs">
                        <Wind className="h-3 w-3 inline mr-1" />
                        {day.windSpeed}km/h {day.windDir} • {day.precipitation}mm
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-900 font-bold">{day.temperature.max}°</div>
                    <div className="text-gray-500 text-sm">{day.temperature.min}°</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Crop Analysis Component
  const CropAnalysisTab = ({ fieldDetails }: { fieldDetails: FieldDetail }) => {
    const [cropData, setCropData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      loadCropData();
    }, []);

    const loadCropData = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockData = {
          currentStage: fieldDetails.cropType === "Maize" ? "flowering" : "vegetation",
          growthProgress: fieldDetails.cropType === "Maize" ? 65 : 45,
          overallHealth: 78,
          ndvi: 0.72,
          colorIndex: 0.68,
          moistureLevel: 72,
          growthRate: 2.3,
          threats: {
            weedInfestation: { detected: true, species: ["Amaranthus", "Bidens"], density: 25, coverage: 12 },
            diseaseOutbreak: { detected: false, diseaseType: [], severity: 0, affectedArea: 0 },
            pestActivity: { detected: true, pestType: ["Aphids"], population: 15, damage: 8 },
            nutrientDeficiency: { detected: true, deficientNutrients: ["Nitrogen"], severity: 20 },
            irrigationIssues: { detected: false, issueType: "", severity: 0 }
          },
          growthStages: [
            { stage: "planting", date: new Date("2025-09-15"), completed: true },
            { stage: "germination", date: new Date("2025-09-22"), completed: true },
            { stage: "vegetation", date: new Date("2025-10-10"), completed: true },
            { stage: "flowering", date: new Date("2025-10-28"), completed: false }
          ],
          recommendations: [
            "Apply nitrogen fertilizer to address deficiency",
            "Continue monitoring for aphid population growth",
            "Mechanical weeding recommended in next 7 days",
            "Increase irrigation frequency during flowering stage"
          ],
          lastUpdated: new Date()
        };
        
        setCropData(mockData);
      } catch (err: any) {
        console.error('Failed to load crop data:', err);
      } finally {
        setLoading(false);
      }
    };

    const getHealthColor = (health: number) => {
      if (health >= 80) return "text-green-500";
      if (health >= 60) return "text-yellow-500";
      if (health >= 40) return "text-orange-500";
      return "text-red-500";
    };

    const getThreatColor = (detected: boolean, severity: number) => {
      if (!detected) return "text-green-500";
      if (severity >= 50) return "text-red-500";
      if (severity >= 25) return "text-yellow-500";
      return "text-orange-500";
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading crop analysis data...</p>
          </div>
        </div>
      );
    }

    if (!cropData) {
      return (
        <Card className={`${dashboardTheme.card}`}>
          <CardContent className="p-6">
            <div className="text-center text-red-400">
              <Leaf className="h-12 w-12 mx-auto mb-4" />
              <p>Failed to load crop analysis data</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className={`${dashboardTheme.card} border-l-4 border-l-green-500`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Overall Health</p>
                  <p className={`text-3xl font-bold ${getHealthColor(cropData.overallHealth)}`}>
                    {cropData.overallHealth}%
                  </p>
                </div>
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Leaf className="h-8 w-8 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${dashboardTheme.card} border-l-4 border-l-blue-500`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Growth Progress</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {cropData.growthProgress}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Stage: {cropData.currentStage}</p>
                </div>
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${dashboardTheme.card} border-l-4 border-l-teal-500`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">NDVI Index</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {cropData.ndvi.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Healthy vegetation</p>
                </div>
                <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center">
                  <Leaf className="h-8 w-8 text-teal-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className={`${dashboardTheme.card}`}>
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Threats Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className={`p-4 rounded-lg border ${cropData.threats.weedInfestation.detected ? 'border-yellow-500/30 bg-yellow-500/10' : 'border-gray-200 bg-gray-100/30'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900 font-medium">Weed Infestation</span>
                  <span className={`text-sm ${getThreatColor(cropData.threats.weedInfestation.detected, cropData.threats.weedInfestation.density)}`}>
                    {cropData.threats.weedInfestation.detected ? 'Detected' : 'None'}
                  </span>
                </div>
                {cropData.threats.weedInfestation.detected && (
                  <div className="text-sm text-gray-500">
                    <p>Species: {cropData.threats.weedInfestation.species.join(', ')}</p>
                    <p>Density: {cropData.threats.weedInfestation.density} plants/m²</p>
                  </div>
                )}
              </div>

              <div className={`p-4 rounded-lg border ${cropData.threats.pestActivity.detected ? 'border-orange-500/30 bg-orange-500/10' : 'border-gray-200 bg-gray-100/30'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900 font-medium">Pest Activity</span>
                  <span className={`text-sm ${getThreatColor(cropData.threats.pestActivity.detected, cropData.threats.pestActivity.damage)}`}>
                    {cropData.threats.pestActivity.detected ? 'Detected' : 'None'}
                  </span>
                </div>
                {cropData.threats.pestActivity.detected && (
                  <div className="text-sm text-gray-500">
                    <p>Type: {cropData.threats.pestActivity.pestType.join(', ')}</p>
                    <p>Population: {cropData.threats.pestActivity.population}</p>
                  </div>
                )}
              </div>

              <div className={`p-4 rounded-lg border ${cropData.threats.nutrientDeficiency.detected ? 'border-red-500/30 bg-red-500/10' : 'border-gray-200 bg-gray-100/30'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900 font-medium">Nutrient Deficiency</span>
                  <span className={`text-sm ${getThreatColor(cropData.threats.nutrientDeficiency.detected, cropData.threats.nutrientDeficiency.severity)}`}>
                    {cropData.threats.nutrientDeficiency.detected ? 'Detected' : 'None'}
                  </span>
                </div>
                {cropData.threats.nutrientDeficiency.detected && (
                  <div className="text-sm text-gray-500">
                    <p>Nutrients: {cropData.threats.nutrientDeficiency.deficientNutrients.join(', ')}</p>
                    <p>Severity: {cropData.threats.nutrientDeficiency.severity}%</p>
                  </div>
                )}
              </div>

              <div className={`p-4 rounded-lg border ${cropData.threats.diseaseOutbreak.detected ? 'border-purple-500/30 bg-purple-500/10' : 'border-gray-200 bg-gray-100/30'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900 font-medium">Disease Outbreak</span>
                  <span className={`text-sm ${getThreatColor(cropData.threats.diseaseOutbreak.detected, cropData.threats.diseaseOutbreak.severity)}`}>
                    {cropData.threats.diseaseOutbreak.detected ? 'Detected' : 'None'}
                  </span>
                </div>
                {cropData.threats.diseaseOutbreak.detected && (
                  <div className="text-sm text-gray-500">
                    <p>Type: {cropData.threats.diseaseOutbreak.diseaseType.join(', ')}</p>
                    <p>Severity: {cropData.threats.diseaseOutbreak.severity}%</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${dashboardTheme.card}`}>
          <CardHeader>
            <CardTitle className="text-gray-900">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {cropData.recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="flex items-start text-gray-600">
                  <span className="mr-2 text-teal-500">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderFieldDetail = () => {
    // Resolve active policy from selectedMonitoring
    const activePolicy = policies.find(p => {
      const pId = p._id || p.id;
      const mPolicyId = typeof selectedMonitoring?.policyId === 'object' ? selectedMonitoring?.policyId?._id : selectedMonitoring?.policyId;
      return pId === mPolicyId;
    }) || {
      _id: typeof selectedMonitoring?.policyId === 'object' ? selectedMonitoring?.policyId?._id : selectedMonitoring?.policyId,
      policyNumber: typeof selectedMonitoring?.policyId === 'object' ? selectedMonitoring?.policyId?.policyNumber : selectedMonitoring?.policyId,
      farmId: selectedMonitoring?.farmId,
      farmerId: selectedMonitoring?.policyId?.farmerId || selectedMonitoring?.farmerId
    };

    const activeMonitoring = selectedMonitoring;
    const field = selectedField || activePolicy?.farmId;
    if (!field) {
      return (
        <div className="p-6 text-center text-gray-500">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No field data available for this monitoring cycle.</p>
          <Button onClick={handleBackToList} className="mt-4 bg-teal-600 hover:bg-teal-700 text-white">
            Back to History
          </Button>
        </div>
      );
    }

    const fieldDetails = getFieldDetails(field);

    const locationCoords = field?.location?.coordinates;
    const center =
      locationCoords && locationCoords.length >= 2
        ? ([locationCoords[1], locationCoords[0]] as [number, number])
        : undefined;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm">
          <button 
            onClick={handleBackToList}
            className="text-teal-400 hover:text-teal-300"
          >
            Crop Monitoring
          </button>
          <span className="text-gray-500">/</span>
          <button 
            onClick={handleBackToFields}
            className="text-teal-400 hover:text-teal-300"
          >
            {fieldDetails.farmer}
          </button>
        </div>
        
        <div>
          <h1 className="text-sm font-normal text-gray-900">
            Field Detail View: {fieldDetails.fieldId}
          </h1>
          <p className="text-gray-500 mt-2">
            {fieldDetails.farmer} - {fieldDetails.cropType}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`${dashboardTheme.card} border border-gray-200`}>
            <TabsTrigger 
              value="basic-info" 
              className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 text-gray-500"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger 
              value="weather" 
              className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 text-gray-500"
            >
              <CloudRain className="h-4 w-4 mr-2" />
              Weather Analysis
            </TabsTrigger>
            <TabsTrigger 
              value="crop" 
              className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 text-gray-500"
            >
              <Leaf className="h-4 w-4 mr-2" />
              Crop Analysis
            </TabsTrigger>
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 text-gray-500"
            >
              <FileText className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic-info" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className={`${dashboardTheme.card}`}>
                <CardHeader>
                  <CardTitle className="text-gray-900">Field Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                    <span className="text-gray-500">Field ID</span>
                    <span className="text-gray-900 font-medium">{fieldDetails.fieldId}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                    <span className="text-gray-500">Field Name</span>
                    <span className="text-gray-900 font-medium">{fieldDetails.fieldName}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                    <span className="text-gray-500">Farmer</span>
                    <span className="text-gray-900 font-medium">{fieldDetails.farmer}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                    <span className="text-gray-500">Crop Type</span>
                    <div className="flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-green-500" />
                      <span className="text-gray-900 font-medium">{fieldDetails.cropType}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                    <span className="text-gray-500">Area</span>
                    <span className="text-gray-900 font-medium">{fieldDetails.area} hectares</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                    <span className="text-gray-500">Season</span>
                    <span className="text-gray-900 font-medium">Season {fieldDetails.season}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                    <span className="text-gray-500">Sowing Date</span>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-teal-500" />
                      <span className="text-gray-900 font-medium">{fieldDetails.sowingDate}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pb-3">
                    <span className="text-gray-500">Location</span>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-teal-500" />
                      <span className="text-gray-900 font-medium">{fieldDetails.location}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={`${dashboardTheme.card}`}>
                <CardHeader>
                  <CardTitle className="text-gray-900">Field Map</CardTitle>
                </CardHeader>
                <CardContent className="h-[500px] p-0 overflow-hidden rounded-lg border border-gray-200">
                  <FieldMapWithLayers
                    fieldId={field?._id || field?.id}
                    showLayerControls={true}
                    boundary={field?.boundary}
                    center={center}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="weather" className="mt-6">
            <WeatherAnalysisTab location={fieldDetails.location} />
          </TabsContent>

          <TabsContent value="crop" className="mt-6">
            <CropAnalysisTab fieldDetails={fieldDetails} />
          </TabsContent>

          <TabsContent value="overview" className="mt-6">
            <MonitoringOverviewTab
              monitoringId={activePolicy._id || activePolicy.id}
              policyId={activePolicy.policyNumber}
              fieldName={fieldDetails.fieldName}
              farmerName={`${fieldDetails.farmer}`}
              cropType={fieldDetails.cropType}
              area={fieldDetails.area}
              location={fieldDetails.location}
              cycles={fullMonitoringDetails?.monitoringCycles || []}
              activeCycle={activeMonitoring}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  const renderPoliciesView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Active Policies</h2>
        <Button 
          onClick={() => setViewMode('monitoring')}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          View Monitoring History
        </Button>
          </div>

      {loading ? (
        <Card className={`${dashboardTheme.card}`}>
          <CardContent className="p-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mr-3"></div>
              <span className="text-gray-500">Loading policies...</span>
            </div>
          </CardContent>
        </Card>
      ) : policies.length === 0 ? (
        <Card className={`${dashboardTheme.card}`}>
          <CardContent className="p-12">
            <div className="text-center text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No active policies assigned to you.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {policies.map((policy) => {
            const monitoringCount = getMonitoringCount(policy._id);
            const canStart = canStartMonitoring(policy._id);
            const farmerName = policy.farmerId?.name || policy.farmerId?.firstName || 'Unknown Farmer';
            
            return (
              <Card key={policy._id} className={`${dashboardTheme.card}`}>
                <CardHeader>
                  <CardTitle className="text-gray-900 text-lg">
                    Policy {policy.policyNumber || policy._id.slice(-8)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Farmer:</span>
                      <span className="text-gray-900">{farmerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Crop Type:</span>
                      <span className="text-gray-900">{policy.cropType || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Monitoring Cycles:</span>
                      <span className="text-gray-900">{monitoringCount}/{getRequiredMonitoringCycles(policy.cropType)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        policy.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {policy.status || 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => {
                      setSelectedPolicyId(policy._id);
                      setStartMonitoringDialogOpen(true);
                    }}
                    disabled={!canStart}
                    className={`w-full ${
                      canStart 
                        ? 'bg-teal-600 hover:bg-teal-700 text-white' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {canStart ? (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Start Monitoring
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Max Cycles Reached
                      </>
                    )}
              </Button>
                  
                  {!canStart && (
                    <p className="text-xs text-yellow-400 text-center mt-2">
                      Maximum {getRequiredMonitoringCycles(policy.cropType)} monitoring cycles completed
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Start Monitoring Dialog */}
      <Dialog open={startMonitoringDialogOpen} onOpenChange={setStartMonitoringDialogOpen}>
            <DialogContent className={`${dashboardTheme.card} border-gray-200`}>
              <DialogHeader>
            <DialogTitle className="text-gray-900">Start Crop Monitoring</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
            <p className="text-gray-500">
              Are you sure you want to start a new monitoring cycle for this policy?
            </p>
            {selectedPolicyId && (
              <div className="text-sm text-gray-500">
                Current cycles: {getMonitoringCount(selectedPolicyId)}/{getRequiredMonitoringCycles(policies.find(p => p._id === selectedPolicyId)?.cropType)}
                </div>
            )}
          </div>
          <DialogFooter>
                  <Button 
                    variant="outline" 
              onClick={() => {
                setStartMonitoringDialogOpen(false);
                setSelectedPolicyId(null);
              }}
                    className="border-gray-300 text-gray-900 hover:bg-gray-100"
                  >
              Cancel
                  </Button>
                  <Button 
              onClick={handleStartMonitoring}
              disabled={startingMonitoring}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                  >
              {startingMonitoring ? 'Starting...' : 'Start Monitoring'}
                  </Button>
          </DialogFooter>
            </DialogContent>
          </Dialog>
    </div>
  );

  const renderMonitoringHistory = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Monitoring History</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${dashboardTheme.input} pl-10 w-64 border-gray-300`}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={`${dashboardTheme.select} w-40`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={dashboardTheme.card}>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
          </div>
      </div>

      <Card className={`${dashboardTheme.card}`}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Farm Name</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Crop Type</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Cycles Count</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Status</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 3 }).map((_, idx) => (
                        <tr key={`skeleton-${idx}`} className="border-b border-gray-200">
                          <td className="py-4 px-6"><div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div></td>
                          <td className="py-4 px-6"><div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div></td>
                          <td className="py-4 px-6"><div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div></td>
                          <td className="py-4 px-6"><div className="h-6 w-24 bg-gray-200 animate-pulse rounded-full"></div></td>
                          <td className="py-4 px-6"><div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div></td>
                        </tr>
                      ))
                    ) : filteredMonitoring.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-500">
                        No monitored fields found.
                      </td>
                    </tr>
                  ) : (
                    filteredMonitoring.map((field: any, index: number) => (
                      <tr
                        key={field.farmId || index}
                        className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                          index % 2 === 0 ? "bg-gray-50/50" : ""
                        }`}
                      >
                        <td className="py-4 px-6 text-gray-900">{field.name}</td>
                        <td className="py-4 px-6 text-gray-900">{field.cropType}</td>
                        <td className="py-4 px-6 text-gray-600">{field.cyclesCount} cycles</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            field.hasMonitoring
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}>
                            {field.hasMonitoring ? 'Active Monitoring' : 'No Monitoring'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-2">
                            {field.hasMonitoring && (
                              <Button
                                size="sm"
                                onClick={() => handleViewFieldDetails(field)}
                                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs"
                              >
                                View Details
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
          </div>
        </CardContent>
      </Card>

      {/* Update Monitoring Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className={`${dashboardTheme.card} border-gray-200 max-w-2xl`}>
          <DialogHeader>
            <DialogTitle className="text-gray-900">Update Monitoring Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="observations" className="text-gray-600">Observations</Label>
              <Textarea
                id="observations"
                value={updateData.observations.join('\n')}
                onChange={(e) => setUpdateData({
                  ...updateData,
                  observations: e.target.value.split('\n').filter(o => o.trim())
                })}
                placeholder="Enter observations (one per line)"
                className={`${dashboardTheme.input} mt-1`}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="photoUrls" className="text-gray-600">Photo URLs</Label>
              <Textarea
                id="photoUrls"
                value={updateData.photoUrls.join('\n')}
                onChange={(e) => setUpdateData({
                  ...updateData,
                  photoUrls: e.target.value.split('\n').filter(u => u.trim())
                })}
                placeholder="Enter photo URLs (one per line)"
                className={`${dashboardTheme.input} mt-1`}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="notes" className="text-gray-600">Notes</Label>
              <Textarea
                id="notes"
                value={updateData.notes}
                onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                placeholder="Enter additional notes"
                className={`${dashboardTheme.input} mt-1`}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpdateDialogOpen(false)}
              className="border-gray-300 text-gray-900 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateMonitoring}
              disabled={updatingMonitoring}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {updatingMonitoring ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Render detail view
  const renderDetailView = () => {
    if (!selectedMonitoring) return null;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setViewMode('monitoring')}
            variant="outline"
            className="border-gray-300 text-gray-900 hover:bg-gray-100"
          >
            ← Back
          </Button>
          <h2 className="text-2xl font-bold text-gray-900">
            Monitoring Details #{selectedMonitoring.monitoringNumber}
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className={`${dashboardTheme.card}`}>
            <CardHeader>
              <CardTitle className="text-gray-900">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Monitoring ID:</span>
                <span className="text-gray-900">
                  {selectedMonitoring._id ? `MON-${selectedMonitoring._id.slice(-6).toUpperCase()}` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Policy ID:</span>
                <span className="text-gray-900">
                  {typeof selectedMonitoring.policyId === "object"
                    ? (selectedMonitoring.policyId.policyNumber || (selectedMonitoring.policyId._id ? `POL-${selectedMonitoring.policyId._id.slice(-6).toUpperCase()}` : "N/A"))
                    : (selectedMonitoring.policyId?.startsWith("POL-") ? selectedMonitoring.policyId : `POL-${selectedMonitoring.policyId?.slice(-6).toUpperCase()}`)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Farm ID:</span>
                <span className="text-gray-900">
                  {typeof selectedMonitoring.farmId === "object"
                    ? (selectedMonitoring.farmId.name || (selectedMonitoring.farmId._id ? `FLD-${selectedMonitoring.farmId._id.slice(-6).toUpperCase()}` : "N/A"))
                    : (selectedMonitoring.farmId?.startsWith("FLD-") ? selectedMonitoring.farmId : `FLD-${selectedMonitoring.farmId?.slice(-6).toUpperCase()}`)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date:</span>
                <span className="text-gray-900">
                  {new Date(selectedMonitoring.monitoringDate).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedMonitoring.status === 'COMPLETED'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                }`}>
                  {selectedMonitoring.status}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className={`${dashboardTheme.card}`}>
            <CardHeader>
              <CardTitle className="text-gray-900">Monitoring Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedMonitoring.observations && selectedMonitoring.observations.length > 0 && (
                <div>
                  <p className="text-gray-500 mb-2">Observations:</p>
                  <ul className="list-disc list-inside text-gray-900 space-y-1">
                    {selectedMonitoring.observations.map((obs, idx) => (
                      <li key={idx} className="text-sm">{obs}</li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedMonitoring.notes && (
                <div>
                  <p className="text-gray-500 mb-2">Notes:</p>
                  <p className="text-gray-900 text-sm">{selectedMonitoring.notes}</p>
                </div>
              )}
              {selectedMonitoring.photoUrls && selectedMonitoring.photoUrls.length > 0 && (
                <div>
                  <p className="text-gray-500 mb-2">Photos:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedMonitoring.photoUrls.map((url, idx) => (
                      <img key={idx} src={url} alt={`Photo ${idx + 1}`} className="rounded" />
                    ))}
                  </div>
                </div>
              )}
              {selectedMonitoring.reportGenerated && (
                <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded">
                  <p className="text-green-400 text-sm">
                    Report generated on {selectedMonitoring.reportGeneratedAt 
                      ? new Date(selectedMonitoring.reportGeneratedAt).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Render view based on mode
  if (viewMode === "detail" || viewMode === "fieldDetail") {
    return renderFieldDetail();
  }

  if (viewMode === "fieldSelection") {
    return renderFieldSelection();
  }

  if (viewMode === "monitoring") {
    return renderMonitoringHistory();
  }

  return renderPoliciesView();
}

