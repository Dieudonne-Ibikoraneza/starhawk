import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardTheme } from "@/utils/dashboardTheme";
import { StatsGridSkeleton, TableSkeleton, CardSkeleton, CardListSkeleton } from "@/components/ui/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "../layout/DashboardLayout";
import AssessorNotifications from "../assessor/AssessorNotifications";
import AssessorProfileSettings from "../assessor/AssessorProfileSettings";
import RiskAssessmentSystem from "../assessor/RiskAssessmentSystem";
import LossAssessmentSystem from "../assessor/LossAssessmentSystem";
import LeafletMap from "../common/LeafletMap";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import meteosourceApiService from "@/services/meteosourceApi";
import assessmentsApiService from "@/services/assessmentsApi";
import farmsApiService, { getFarms, getAllFarms, getFarmById, getWeatherForecast, getHistoricalWeather, getVegetationStats, uploadShapefile, uploadKML, createFarm, createInsuranceRequest, updateFarm } from "@/services/farmsApi";
import policiesApiService from "@/services/policiesApi";
import cropMonitoringApiService, { startCropMonitoring, getMonitoringHistory, updateMonitoring, generateMonitoringReport } from "@/services/cropMonitoringApi";
import { getUserId, getPhoneNumber, getEmail } from "@/services/authAPI";
import { getUserProfile, getUserById } from "@/services/usersAPI";
import { API_BASE_URL, getAuthToken } from "@/config/api";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Bell,
  User,
  BarChart3,
  Shield,
  Activity,
  Cloud,
  MapPin,
  Calendar,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  CloudRain,
  Leaf,
  FileSpreadsheet,
  Sun,
  Wind,
  Droplets,
  Thermometer,
  CloudSnow,
  Zap,
  Clock,
  AlertTriangle,
  Satellite,
  CheckCircle,
  AlertCircle,
  Upload,
  Download,
  Star,
  Map,
  ArrowLeft,
  RefreshCw,
  Users,
  Sprout,
  ChevronDown,
  ChevronRight,
  Monitor,
  Settings
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface AssessmentSummary {
  id: string;
  farmerId: string;
  farmerName: string;
  location: string;
  type: string;
  status: string;
  date: string;
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
    cloudCover: number;
  }>;
  daily: Array<{
    date: Date;
    temperature: { max: number; min: number; day: number };
    summary: string;
    weather: string;
    icon: number;
    windSpeed: number;
    windDir: string;
    precipitation: number;
    precipitationType: string;
    cloudCover: number;
    humidity: number;
  }>;
  location: {
    name: string;
    country: string;
    lat: string;
    lon: string;
    timezone: string;
  };
}

export default function AssessorDashboard() {
  const { toast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  // Listen for sidebar collapse state changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sidebarCollapsed') {
        setSidebarCollapsed(e.newValue === 'true');
      }
    };
    
    // Listen for storage events (when sidebar state changes in another component)
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event (for same-tab changes)
    const handleCustomEvent = () => {
      const saved = localStorage.getItem('sidebarCollapsed');
      setSidebarCollapsed(saved === 'true');
    };
    
    window.addEventListener('sidebarToggle', handleCustomEvent);
    
    // Check periodically as fallback (since storage event doesn't fire for same-tab changes)
    const interval = setInterval(() => {
      const saved = localStorage.getItem('sidebarCollapsed');
      const isCollapsed = saved === 'true';
      if (isCollapsed !== sidebarCollapsed) {
        setSidebarCollapsed(isCollapsed);
      }
    }, 200);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebarToggle', handleCustomEvent);
      clearInterval(interval);
    };
  }, [sidebarCollapsed]);
  const [activePage, setActivePage] = useState("dashboard");
  
  // Get logged-in assessor data from localStorage
  const assessorId = getUserId() || "";
  const assessorPhone = getPhoneNumber() || "";
  const assessorEmail = getEmail() || "";
  // Use email or phone number as display name, or fallback to "Assessor"
  const assessorName = assessorEmail || assessorPhone || "Assessor";
  const [activeView, setActiveView] = useState<"farmers" | "fields" | "farmerFields">("farmers");
  const [selectedFarmer, setSelectedFarmer] = useState<{farmerId: string; farmerName: string; location: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentSummary | null>(null);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "fieldSelection" | "fieldDetail">("list");
  const [activeTab, setActiveTab] = useState("basic-info");
  const [selectedFarmerForProcessing, setSelectedFarmerForProcessing] = useState<string | null>(null);
  const [showDrawField, setShowDrawField] = useState(false);
  const [calculatedArea, setCalculatedArea] = useState<string>("");
  const [fieldStatus, setFieldStatus] = useState<string>("Awaiting Geometry");
  const [fieldMethod, setFieldMethod] = useState<"upload" | "draw">("upload");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [selectedFieldForUpload, setSelectedFieldForUpload] = useState<any | null>(null);
  const [selectedFieldsForProcessing, setSelectedFieldsForProcessing] = useState<Set<string>>(new Set());
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [kmlUploadName, setKmlUploadName] = useState<string>('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [processingFields, setProcessingFields] = useState<Set<string>>(new Set());
  const [fieldProcessingStatus, setFieldProcessingStatus] = useState<Record<string, { status: 'processing' | 'success' | 'error'; message?: string }>>({});
  
  // API state
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingAssessment, setUpdatingAssessment] = useState<string | null>(null);
  
  // Farms API state
  const [farms, setFarms] = useState<any[]>([]);
  const [farmsLoading, setFarmsLoading] = useState(false);
  const [farmsError, setFarmsError] = useState<string | null>(null);
  const [selectedFarm, setSelectedFarm] = useState<any | null>(null);
  const [showKMLViewer, setShowKMLViewer] = useState(false);
  const [kmlViewerFarm, setKmlViewerFarm] = useState<any | null>(null);
  
  // Farmers list state
  const [farmers, setFarmers] = useState<any[]>([]);
  const [farmersLoading, setFarmersLoading] = useState(false);
  const [farmersError, setFarmersError] = useState<string | null>(null);
  const [expandedFarmers, setExpandedFarmers] = useState<Set<string>>(new Set());
  const [farmerFields, setFarmerFields] = useState<Record<string, any[]>>({});
  const [loadingFields, setLoadingFields] = useState<Record<string, boolean>>({});
  const [assignedFarmIds, setAssignedFarmIds] = useState<Set<string>>(new Set());
  const [selectedFarmerForFields, setSelectedFarmerForFields] = useState<{id: string; name: string} | null>(null);
  const [showFarmerFieldsView, setShowFarmerFieldsView] = useState(false);
  const [farmerViewMode, setFarmerViewMode] = useState<"list" | "detail">("list");
  const [selectedFarmerDetail, setSelectedFarmerDetail] = useState<any | null>(null);
  const [farmerDetailLoading, setFarmerDetailLoading] = useState(false);
  // State for Farmers Page (similar to crop monitoring)
  const [farmersPageViewMode, setFarmersPageViewMode] = useState<"farmers" | "farmerFields" | "fieldDetail">("farmers");
  const [selectedFarmerForFarmersPage, setSelectedFarmerForFarmersPage] = useState<any | null>(null);
  const [selectedFieldForFarmersPage, setSelectedFieldForFarmersPage] = useState<any | null>(null);
  const [farmersPageSearchQuery, setFarmersPageSearchQuery] = useState("");
  const [weatherForecast, setWeatherForecast] = useState<any | null>(null);
  const [historicalWeather, setHistoricalWeather] = useState<any | null>(null);
  const [vegetationStats, setVegetationStats] = useState<any | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingVegetation, setLoadingVegetation] = useState(false);

  // State for Profile
  const [assessorProfile, setAssessorProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // State for Crop Monitoring (New API Structure)
  const [policies, setPolicies] = useState<any[]>([]);
  const [monitoringHistory, setMonitoringHistory] = useState<any[]>([]);
  const [cropMonitoringLoading, setCropMonitoringLoading] = useState(false);
  const [cropMonitoringViewMode, setCropMonitoringViewMode] = useState<"policies" | "monitoring" | "detail" | "farmers" | "farmerFields" | "fieldDetail">("farmers");
  const [selectedMonitoring, setSelectedMonitoring] = useState<any | null>(null);
  const [selectedFarmerForCropMonitoring, setSelectedFarmerForCropMonitoring] = useState<any | null>(null);
  const [selectedFieldForCropMonitoring, setSelectedFieldForCropMonitoring] = useState<any | null>(null);
  const [cropMonitoringSearchQuery, setCropMonitoringSearchQuery] = useState("");
  
  // Dialog states for crop monitoring
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
  
  // Legacy state (keeping for backward compatibility)
  const [monitoringData, setMonitoringData] = useState<Record<string, any>>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedFarmForMonitoring, setSelectedFarmForMonitoring] = useState<string | null>(null);
  const [selectedFarmerForDetail, setSelectedFarmerForDetail] = useState<any | null>(null);
  const [selectedFarmForDetail, setSelectedFarmForDetail] = useState<any | null>(null);
  const [monitoringLoading, setMonitoringLoading] = useState(false);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [monitoringError, setMonitoringError] = useState<string | null>(null);

  // Computed values for dashboard stats
  const totalAssessments = assessments.length;
  const totalRiskAssessments = assessments.filter(a => a.type === "Risk Assessment").length;
  const totalClaimAssessments = assessments.filter(a => a.type === "Claim Assessment").length;
  const pendingAssessments = assessments.filter(a => a.status === "Pending").length;

  // Compute metrics for Field Management-style dashboard
  // Use actual farmers list if available, otherwise fall back to unique farmer IDs from assessments
  const uniqueFarmerIds = new Set(assessments.map(a => a.farmerId).filter(Boolean));
  const totalFarmers = farmers.length > 0 ? farmers.length : uniqueFarmerIds.size || 0;
  const totalFields = Array.isArray(farms) ? farms.length : 0;
  const totalArea = Array.isArray(farms) 
    ? farms.filter(farm => farm != null).reduce((sum, farm) => sum + (farm?.area || 0), 0) 
    : 0;
  const activeAssessments = assessments.filter(a => 
    a.status === "Pending" || a.status === "Processing" || a.status === "Under Review"
  ).length;
  
  // Get unique farmers with their data for the table
  // Use actual farmers list if available, otherwise use unique farmer IDs from assessments
  const farmerData = farmers.length > 0 
    ? farmers.map(farmer => {
        const farmerId = farmer._id || farmer.id || '';
        const farmerName = 
          farmer.name || 
          (farmer.firstName && farmer.lastName ? `${farmer.firstName} ${farmer.lastName}`.trim() : '') ||
          farmer.firstName || 
          farmer.lastName || 
          "Unknown Farmer";
        const location = 
          farmer.location || 
          (farmer.province && farmer.district ? `${farmer.province}, ${farmer.district}` : '') ||
          farmer.province ||
          farmer.district ||
          "Unknown Location";
        const farmerFarms = Array.isArray(farms) 
          ? farms.filter(farm => {
              const farmFarmerId = farm.farmerId?._id || farm.farmerId || farm.farmer?._id || farm.farmer?.id || farm.farmer;
              return farmFarmerId === farmerId || farmFarmerId?.toString() === farmerId.toString();
            })
          : [];
        const farmerTotalFields = farmerFarms.length;
        const farmerTotalArea = farmerFarms.reduce((sum, farm) => sum + (farm.area || 0), 0);
        
        return {
          farmerId: `F-${String(farmerId).slice(-3).padStart(3, '0')}`,
          farmerName,
          location,
          totalFields: farmerTotalFields,
          totalArea: farmerTotalArea
        };
      })
    : Array.from(uniqueFarmerIds).map(farmerId => {
        const farmerAssessments = assessments.filter(a => a.farmerId === farmerId);
        const farmerName = farmerAssessments[0]?.farmerName || "Unknown Farmer";
        const location = farmerAssessments[0]?.location || "Unknown Location";
        const farmerFarms = Array.isArray(farms) 
          ? farms.filter(farm => 
              farm != null && (
                farm.farmerId === farmerId || 
                farm.farmer?._id === farmerId ||
                farm.farmer?.id === farmerId
              )
            )
          : [];
        const farmerTotalFields = farmerFarms.length;
        const farmerTotalArea = farmerFarms.filter(farm => farm != null).reduce((sum, farm) => sum + (farm?.area || 0), 0);
        
        return {
          farmerId: `F-${String(farmerId).slice(-3).padStart(3, '0')}`,
          farmerName,
          location,
          totalFields: farmerTotalFields,
          totalArea: farmerTotalArea
        };
      });

  // Fetch assessments and farms from API
  useEffect(() => {
    loadAssessments();
    loadFarms();
  }, []);

  // Load profile, farmers, and farms when dashboard is shown
  useEffect(() => {
    if (activePage === "dashboard" && assessorId) {
      loadAssessorProfile();
      loadFarmers();
      loadFarms();
    } else if (activePage === "farmers" && assessorId) {
      loadFarmers();
      loadAssessments(); // Load assessments to mark assigned farms
    } else if (activePage === "crop-monitoring" && assessorId) {
      loadFarmers();
      loadFarms();
      loadAlerts();
    }
  }, [activePage, assessorId]);

  const loadAssessorProfile = async () => {
    if (profileLoading) return;
    setProfileLoading(true);
    try {
      const profile = await getUserProfile();
      setAssessorProfile(profile.data || profile);
    } catch (err: any) {
      console.error('Failed to load assessor profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const loadFarmers = async () => {
    setFarmersLoading(true);
    setFarmersError(null);
    try {
      // IMPORTANT: This API endpoint returns ONLY farmers assigned to the current assessor
      // The backend filters based on the assessor's authentication token
      // Endpoint: GET /assessments/farmers/list
      const responseData = await assessmentsApiService.getAssignedFarmers();
      console.log('Assigned farmers API response:', responseData);
      
      // Handle response - it might be in response.data or directly in response
      let farmersList = responseData.data || responseData.items || responseData || [];
      
      // Ensure it's an array
      if (!Array.isArray(farmersList)) {
        farmersList = [];
      }
      
      let farmersArray = Array.isArray(farmersList) ? farmersList : [];
      console.log(`Loaded ${farmersArray.length} farmers from API`);
      
      // CLIENT-SIDE FILTERING: Ensure we only show farmers assigned to this assessor
      // Get assessments to identify which farmers are assigned to this assessor
      let assignedFarmerIds = new Set<string>();
      
      try {
        // Load assessments for this assessor to get assigned farmers
        // Use getAllAssessments to get all assessments (not paginated)
        const assessmentsResponse = await assessmentsApiService.getAllAssessments();
        const assessmentsData = assessmentsResponse.data || assessmentsResponse.items || assessmentsResponse || [];
        
        if (Array.isArray(assessmentsData)) {
          assessmentsData.forEach((assessment: any) => {
            // Extract farmerId from assessment
            let farmerId = '';
            if (assessment.farmerId) {
              farmerId = typeof assessment.farmerId === 'object' 
                ? (assessment.farmerId._id || assessment.farmerId.id || '')
                : assessment.farmerId;
            } else if (assessment.farm?.farmerId) {
              farmerId = typeof assessment.farm.farmerId === 'object'
                ? (assessment.farm.farmerId._id || assessment.farm.farmerId.id || '')
                : assessment.farm.farmerId;
            } else if (assessment.farmId) {
              // If farmId is an object with farmerId
              if (typeof assessment.farmId === 'object' && assessment.farmId.farmerId) {
                farmerId = typeof assessment.farmId.farmerId === 'object'
                  ? (assessment.farmId.farmerId._id || assessment.farmId.farmerId.id || '')
                  : assessment.farmId.farmerId;
              }
            }
            
            if (farmerId) {
              assignedFarmerIds.add(String(farmerId));
            }
          });
        }
        
        console.log(`Found ${assignedFarmerIds.size} unique assigned farmers from assessments`);
      } catch (assessmentError) {
        console.warn('Could not load assessments for filtering, using API response as-is:', assessmentError);
      }
      
      // Filter farmers to only include those assigned to this assessor
      if (assignedFarmerIds.size > 0) {
        const beforeCount = farmersArray.length;
        farmersArray = farmersArray.filter((farmer: any) => {
          const farmerId = String(farmer._id || farmer.id || '');
          return assignedFarmerIds.has(farmerId);
        });
        console.log(`Filtered farmers: ${beforeCount} -> ${farmersArray.length} (only assigned farmers)`);
      } else {
        console.warn('No assigned farmers found in assessments. Showing all farmers from API (this may be a backend issue).');
      }
      
      console.log(`Final count: ${farmersArray.length} assigned farmers with farms`);
      
      // Extract fields from each farmer if they exist in the response
      const fieldsMap: Record<string, any[]> = {};
      farmersArray.forEach((farmer: any, index: number) => {
        const farmerId = farmer._id || farmer.id;
        if (farmerId) {
          // Log the structure of the first farmer for debugging
          if (index === 0) {
            console.log('🔍 Sample farmer structure:', {
              id: farmer.id,
              _id: farmer._id,
              firstName: farmer.firstName,
              lastName: farmer.lastName,
              hasFarms: !!farmer.farms,
              farmsCount: farmer.farms?.length || 0,
              farmerKeys: Object.keys(farmer)
            });
          }
          
          // New API structure: farms array is directly in farmer.farms
          let farms: any[] = [];
          
          if (farmer.farms && Array.isArray(farmer.farms)) {
            farms = farmer.farms;
          }
          
          if (farms && farms.length > 0) {
            fieldsMap[farmerId] = farms;
            const farmerName = `${farmer.firstName || ''} ${farmer.lastName || ''}`.trim() || 'Unnamed';
            console.log(`  📦 Farmer ${farmerId} (${farmerName}) has ${farms.length} farms from API`);
            if (index === 0) {
              console.log('  📋 Sample farm structure:', {
                id: farms[0].id,
                cropType: farms[0].cropType,
                status: farms[0].status,
                sowingDate: farms[0].sowingDate,
                farmKeys: Object.keys(farms[0] || {})
              });
            }
          } else {
            const farmerName = `${farmer.firstName || ''} ${farmer.lastName || ''}`.trim() || 'Unnamed';
            console.log(`  ⚠️ Farmer ${farmerId} (${farmerName}) has no farms in API response`);
          }
        }
      });
      
      console.log(`📊 Total farmers with fields: ${Object.keys(fieldsMap).length}`);
      
      // Set farmers and their fields
      setFarmers(farmersArray);
      setFarmerFields(fieldsMap);
      
      // Reset expanded state when reloading
      setExpandedFarmers(new Set());
    } catch (err: any) {
      console.error('Failed to load farmers:', err);
      setFarmersError(err.message || 'Failed to load farmers');
      toast({
        title: 'Error loading farmers',
        description: err.message || 'Failed to load farmers',
        variant: 'destructive'
      });
      setFarmers([]);
    } finally {
      setFarmersLoading(false);
    }
  };

  const loadFarmerFields = async (farmerId: string) => {
      // If fields are already loaded from the farmers list API and have data, use them
      if (farmerFields[farmerId] && farmerFields[farmerId].length > 0) {
        console.log(`✅ Using cached fields for farmer ${farmerId}: ${farmerFields[farmerId].length} fields`);
        return;
      }
      
      // Also check if fields are in the farmers array from the API response
      const farmer = farmers.find((f: any) => (f._id || f.id) === farmerId);
      if (farmer) {
        const fieldsFromFarmer = 
          farmer.farms || 
          farmer.fields || 
          farmer.farm || 
          farmer.farmList || 
          farmer.farmDetails ||
          (farmer.profile && (farmer.profile.farms || farmer.profile.fields)) ||
          [];
        
        const fieldsArray = Array.isArray(fieldsFromFarmer) ? fieldsFromFarmer : (fieldsFromFarmer ? [fieldsFromFarmer] : []);
        if (fieldsArray.length > 0) {
          console.log(`✅ Using fields from farmer object for ${farmerId}: ${fieldsArray.length} fields`);
          setFarmerFields(prev => ({ ...prev, [farmerId]: fieldsArray }));
          return;
        }
      }
    
    // Also check if fields might be stored with a different key format
    const farmerIdVariations = [
      farmerId,
      String(farmerId),
      farmerId.toString(),
      farmerId.trim()
    ];
    
    for (const variation of farmerIdVariations) {
      if (farmerFields[variation] && farmerFields[variation].length > 0) {
        console.log(`✅ Using cached fields for farmer ${farmerId} (found with variation: ${variation}): ${farmerFields[variation].length} fields`);
        // Copy to the main key for consistency
        setFarmerFields(prev => ({ ...prev, [farmerId]: farmerFields[variation] }));
        return;
      }
    }
    
    // If cached but empty, log and continue to fetch from API
    if (farmerFields[farmerId] && farmerFields[farmerId].length === 0) {
      console.log(`⚠️ Cached fields for farmer ${farmerId} are empty, fetching from API...`);
    }

    // If not in cache, use the same logic as Farmer Dashboard to fetch farms
    setLoadingFields(prev => ({ ...prev, [farmerId]: true }));
    try {
      // Use the same multi-strategy approach as Farmer Dashboard
      let response: any = null;
      let allFarms: any[] = [];
      
      // Strategy 1: Try page 1 first (API seems to use 1-based indexing based on response)
      console.log(`🔍 Loading fields for farmer ID: ${farmerId} - Trying page 1...`);
      response = await getFarms(1, 100);
      console.log('Farms API Response (page 1):', response);
      
      // Extract farms from response
      if (response?.success && response?.data?.items) {
        allFarms = Array.isArray(response.data.items) ? response.data.items : [];
        console.log('Extracted farms from response.data.items (page 1):', allFarms);
      } else if (Array.isArray(response)) {
        allFarms = response;
      } else if (Array.isArray(response?.data)) {
        allFarms = response.data;
      } else if (Array.isArray(response?.items)) {
        allFarms = response.items;
      } else if (Array.isArray(response?.results)) {
        allFarms = response.results;
      } else if (Array.isArray(response?.farms)) {
        allFarms = response.farms;
      }
      
      // Strategy 2: If page 1 returned empty items but totalItems > 0, try page 0 (0-based indexing)
      if (allFarms.length === 0 && response?.data?.totalItems > 0) {
        console.log('Page 1 returned empty items but totalItems > 0, trying page 0...');
        response = await getFarms(0, 100);
        console.log('Farms API Response (page 0):', response);
        
        if (response?.success && response?.data?.items) {
          allFarms = Array.isArray(response.data.items) ? response.data.items : [];
          console.log('Extracted farms from page 0:', allFarms);
        } else if (Array.isArray(response)) {
          allFarms = response;
        } else if (Array.isArray(response?.data)) {
          allFarms = response.data;
        }
      }
      
      // Strategy 3: Try with larger page size if still empty
      if (allFarms.length === 0 && response?.data?.totalItems > 0) {
        console.log('Trying with larger page size (500)...');
        response = await getFarms(0, 500);
        console.log('Farms API Response (page 0, size 500):', response);
        
        if (response?.success && response?.data?.items) {
          allFarms = Array.isArray(response.data.items) ? response.data.items : [];
          console.log('Extracted farms with larger size:', allFarms);
        }
      }
      
      // Strategy 4: Try without pagination parameters
      if (allFarms.length === 0 && response?.data?.totalItems > 0) {
        console.log('Trying to fetch all farms without pagination...');
        try {
          const noPaginationResponse: any = await getAllFarms();
          console.log('Response without pagination:', noPaginationResponse);
          
          if (noPaginationResponse?.success && noPaginationResponse?.data?.items) {
            allFarms = Array.isArray(noPaginationResponse.data.items) ? noPaginationResponse.data.items : [];
          } else if (Array.isArray(noPaginationResponse)) {
            allFarms = noPaginationResponse;
          } else if (Array.isArray(noPaginationResponse?.data)) {
            allFarms = noPaginationResponse.data;
          } else if (Array.isArray(noPaginationResponse?.items)) {
            allFarms = noPaginationResponse.items;
          }
          
          if (allFarms.length > 0) {
            console.log('Successfully fetched farms without pagination:', allFarms);
          }
        } catch (err) {
          console.warn('Failed to fetch without pagination:', err);
        }
      }
      
      // Strategy 5: Check if data structure has farms at a different location
      if (allFarms.length === 0 && response?.data?.totalItems > 0) {
        console.warn(`⚠️ API reports ${response.data.totalItems} total items but returned empty array.`);
        console.warn('Full response structure:', JSON.stringify(response, null, 2));
        
        // Check if data structure has farms at a different location
        if (response?.data && typeof response.data === 'object') {
          // Check all possible locations for farm data
          const possibleKeys = ['farms', 'results', 'content', 'data'];
          for (const key of possibleKeys) {
            if (Array.isArray(response.data[key])) {
              allFarms = response.data[key];
              console.log(`Found farms array at response.data.${key}:`, allFarms);
              break;
            }
          }
        }
      }
      
      console.log(`📊 Total farms fetched: ${allFarms.length}`);

      console.log(`📊 Total farms fetched: ${allFarms.length}`);
      console.log(`🔑 Looking for farmer ID: ${farmerId}`);

      // Filter farms by farmer ID - try multiple ways to match
      const farmerFarms = allFarms.filter((farm: any) => {
        // Try different ways to get the farmer ID from the farm object
        const farmFarmerId = 
          farm.farmerId?._id || 
          farm.farmerId?.id ||
          farm.farmerId || 
          farm.farmer?._id || 
          farm.farmer?.id ||
          farm.farmer ||
          farm.userId?._id ||
          farm.userId?.id ||
          farm.userId ||
          farm.owner?._id ||
          farm.owner?.id ||
          farm.owner ||
          '';
        
        // Convert both to strings for comparison (normalize)
        const farmFarmerIdStr = String(farmFarmerId || '').trim();
        const targetFarmerIdStr = String(farmerId || '').trim();
        
        // Try exact match first
        let matches = farmFarmerIdStr === targetFarmerIdStr;
        
        // If no match, try comparing last few characters (in case of ID format differences)
        if (!matches && farmFarmerIdStr && targetFarmerIdStr) {
          const farmIdSuffix = farmFarmerIdStr.slice(-6);
          const targetIdSuffix = targetFarmerIdStr.slice(-6);
          matches = farmIdSuffix === targetIdSuffix && farmIdSuffix.length >= 4;
        }
        
        // Log all farms for debugging (not just first 3)
        if (allFarms.length <= 20 || matches) {
          console.log(`  Farm "${farm.name || 'Unnamed'}":`, {
            farmFarmerId: farmFarmerIdStr,
            targetFarmerId: targetFarmerIdStr,
            matches,
            farmStructure: {
              farmerId: farm.farmerId,
              farmer: farm.farmer,
              userId: farm.userId,
              owner: farm.owner
            }
          });
        }
        
        return matches;
      });

      console.log(`✅ Found ${farmerFarms.length} farms for farmer ${farmerId}`);
      if (farmerFarms.length > 0) {
        // Log all farms with their status to help debug (using the helper function)
        console.log('📋 All farms for this farmer:', farmerFarms.map((f: any) => ({
          id: f._id || f.id,
          name: f.name,
          status: f.status || 'NO STATUS',
          hasValidKML: hasValidKML(f),
          boundary: f.boundary,
          kmlUrl: f.kmlUrl,
          kmlFileUrl: f.kmlFileUrl,
          cropType: f.cropType || f.crop
        })));
        console.log('Sample farm (detailed):', {
          name: farmerFarms[0].name,
          cropType: farmerFarms[0].cropType,
          farmerId: farmerFarms[0].farmerId,
          farmer: farmerFarms[0].farmer,
          _id: farmerFarms[0]?._id,
          id: farmerFarms[0].id,
          status: farmerFarms[0].status,
          hasValidKML: hasValidKML(farmerFarms[0]),
          boundary: farmerFarms[0].boundary,
          kmlUrl: farmerFarms[0].kmlUrl,
          kmlFileUrl: farmerFarms[0].kmlFileUrl
        });
      } else {
        console.warn(`⚠️ No farms found for farmer ${farmerId} after filtering ${allFarms.length} total farms`);
        console.warn('Farmer ID being searched:', farmerId);
        console.warn('Sample of all farms (first 3):', allFarms.slice(0, 3).map(f => ({
          name: f.name,
          farmerId: f.farmerId,
          farmer: f.farmer,
          userId: f.userId,
          owner: f.owner
        })));
      }

      // Ensure we're storing ALL farms, not filtering by status
      setFarmerFields(prev => ({ ...prev, [farmerId]: farmerFarms }));
    } catch (err: any) {
      console.error(`❌ Failed to load fields for farmer ${farmerId}:`, err);
      setFarmerFields(prev => ({ ...prev, [farmerId]: [] }));
    } finally {
      setLoadingFields(prev => ({ ...prev, [farmerId]: false }));
    }
  };

  const handleFarmerRowClick = (farmerId: string) => {
    // Always show fields when clicked (no toggle)
    const newExpanded = new Set(expandedFarmers);
    if (!newExpanded.has(farmerId)) {
      newExpanded.add(farmerId);
      // Load fields when clicking
      loadFarmerFields(farmerId);
    }
    setExpandedFarmers(newExpanded);
  };

  const toggleFarmerExpansion = (farmerId: string) => {
    const newExpanded = new Set(expandedFarmers);
    if (newExpanded.has(farmerId)) {
      newExpanded.delete(farmerId);
    } else {
      newExpanded.add(farmerId);
      // Load fields when expanding
      loadFarmerFields(farmerId);
    }
    setExpandedFarmers(newExpanded);
  };

  const handleViewFarmerFields = (farmer: any) => {
    const farmerId = farmer._id || farmer.id;
    if (!farmerId) {
      console.warn('Cannot view fields for farmer without ID');
      return;
    }
    const farmerName = 
      farmer.name || 
      (farmer.firstName && farmer.lastName ? `${farmer.firstName} ${farmer.lastName}`.trim() : '') ||
      farmer.firstName || 
      farmer.lastName || 
      "Unknown";
    
    setSelectedFarmerForFields({ id: farmerId, name: farmerName });
    setShowFarmerFieldsView(true);
    
    // Load fields if not already loaded
    const farmerIdKey = farmerId;
    if (!farmerFields[farmerIdKey] || farmerFields[farmerIdKey].length === 0) {
      loadFarmerFields(farmerId);
    }
  };

  const renderFarmerFieldsView = () => {
    if (!selectedFarmerForFields) return null;

    const farmerIdKey = selectedFarmerForFields.id;
    const farmerFieldsList = farmerFields[farmerIdKey] || [];
    const isLoadingFields = loadingFields[farmerIdKey] || false;
    
    // Debug: Log all fields to ensure we're seeing everything
    console.log(`🔍 Rendering fields for farmer ${farmerIdKey}:`, {
      totalFields: farmerFieldsList.length,
      fields: farmerFieldsList.map((f: any) => ({
        id: f._id || f.id,
        name: f.name,
        status: f.status,
        hasBoundary: !!(f.boundary || f.kmlUrl || f.kmlFileUrl),
        cropType: f.cropType || f.crop
      }))
    });

    return (
      <div className="min-h-screen bg-gray-50 pt-6 pb-8">
        <div className={`${sidebarCollapsed ? 'max-w-full' : 'max-w-7xl'} mx-auto px-6`}>
          {/* Breadcrumb Navigation */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => {
                  setShowFarmerFieldsView(false);
                  setSelectedFarmerForFields(null);
                }}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                All Farmers
              </button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">{selectedFarmerForFields.name}</span>
            </div>
          </div>

          {/* Fields Table */}
          <Card className={`${dashboardTheme.card}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900">Fields</CardTitle>
                {selectedFieldsForProcessing.size > 0 && (
                  <Button
                    onClick={() => {
                      setSelectedFieldForUpload(null);
                      setShowUploadModal(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Process Selected ({selectedFieldsForProcessing.size})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingFields ? (
                <CardContent className="p-0">
                  <TableSkeleton rows={3} columns={7} />
                </CardContent>
              ) : farmerFieldsList.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500">No fields found for this farmer</p>
                  <p className="text-xs text-gray-400 mt-1">Farmer ID: {selectedFarmerForFields.id}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200">
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider w-12">
                          <input
                            type="checkbox"
                            checked={farmerFieldsList.length > 0 && farmerFieldsList.filter((f: any) => {
                              const fStatus = f.status || '';
                              const hasBoundary = f.boundary || f.kmlUrl || f.kmlFileUrl;
                              const isProcessed = hasBoundary || 
                                                fStatus === 'PROCESSED' || 
                                                fStatus === 'Processed' || 
                                                (fStatus && 
                                                 fStatus !== 'PENDING' && 
                                                 fStatus !== 'Processing Needed' && 
                                                 fStatus !== '' &&
                                                 fStatus.toLowerCase() !== 'pending');
                              return !isProcessed;
                            }).every((f: any) => {
                              const fid = (f._id || f.id)?.toString() || '';
                              return selectedFieldsForProcessing.has(fid);
                            })}
                            onChange={(e) => {
                              const unprocessedFields = farmerFieldsList.filter((f: any) => {
                                const fStatus = f.status || '';
                                const hasBoundary = f.boundary || f.kmlUrl || f.kmlFileUrl;
                                const isProcessed = hasBoundary || 
                                                  fStatus === 'PROCESSED' || 
                                                  fStatus === 'Processed' || 
                                                  (fStatus && 
                                                   fStatus !== 'PENDING' && 
                                                   fStatus !== 'Processing Needed' && 
                                                   fStatus !== '' &&
                                                   fStatus.toLowerCase() !== 'pending');
                                return !isProcessed;
                              });
                              if (e.target.checked) {
                                const fieldIds = unprocessedFields.map((f: any) => (f._id || f.id)?.toString() || '').filter(Boolean);
                                setSelectedFieldsForProcessing(new Set(fieldIds));
                              } else {
                                setSelectedFieldsForProcessing(new Set());
                              }
                            }}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Field ID</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Farmer</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Crop</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Area (ha)</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Season</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Status</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* Display ALL fields regardless of processing status */}
                      {farmerFieldsList.map((field, fieldIndex) => {
                        const fieldId = field._id || field.id || '';
                        const displayFieldId = fieldId ? `FLD-${String(fieldId).slice(-3).padStart(3, '0')}` : 'Not processed';
                        // More comprehensive status check - a field is processed if it has a boundary or status is PROCESSED/Processed
                        // Otherwise, it's not processed (PENDING, Processing Needed, empty, or any other status)
                        const fieldStatus = field.status || '';
                        const hasBoundary = field.boundary || field.kmlUrl || field.kmlFileUrl;
                        const isProcessed = hasBoundary || 
                                          fieldStatus === 'PROCESSED' || 
                                          fieldStatus === 'Processed' || 
                                          (fieldStatus && 
                                           fieldStatus !== 'PENDING' && 
                                           fieldStatus !== 'Processing Needed' && 
                                           fieldStatus !== '' &&
                                           fieldStatus.toLowerCase() !== 'pending');
                        const season = field.season || field.seasonType || 'N/A';
                        
                        const fieldIdStr = fieldId.toString();
                        const isSelected = selectedFieldsForProcessing.has(fieldIdStr);
                        const isProcessing = processingFields.has(fieldIdStr);
                        const processingStatus = fieldProcessingStatus[fieldIdStr];
                        
                        return (
                          <tr
                            key={field._id || field.id || fieldIndex}
                            className={`hover:bg-gray-50/50 transition-all duration-150 ${isSelected ? 'bg-green-50' : ''}`}
                          >
                            <td className="py-4 px-6 whitespace-nowrap">
                              {!isProcessed && (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const newSet = new Set(selectedFieldsForProcessing);
                                    if (e.target.checked) {
                                      newSet.add(fieldIdStr);
                                    } else {
                                      newSet.delete(fieldIdStr);
                                    }
                                    setSelectedFieldsForProcessing(newSet);
                                  }}
                                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                  disabled={isProcessing}
                                />
                              )}
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className={`text-sm font-medium ${isProcessed ? 'text-gray-900' : 'text-gray-400'}`}>
                                {displayFieldId}
                              </div>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{selectedFarmerForFields.name}</div>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Leaf className="h-4 w-4 text-green-500 flex-shrink-0" />
                                <span>{field.cropType || field.crop || "N/A"}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                {field.area ? `${field.area} ha` : field.size ? `${field.size} ha` : "N/A"}
                              </div>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{season}</div>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              {isProcessing ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white border border-blue-600">
                                  <img src="/loading.gif" alt="Loading" className="w-3 h-3 mr-1" />
                                  Processing...
                                </span>
                              ) : processingStatus?.status === 'success' ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white border border-green-600">
                                  Processed
                                </span>
                              ) : processingStatus?.status === 'error' ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white border border-red-600">
                                  Error
                                </span>
                              ) : isProcessed ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white border border-green-600">
                                  Processed
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-500 text-white border border-orange-600">
                                  Processing Needed
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              {isProcessed ? (
                                <Button
                                  onClick={() => {
                                    // Handle view data action
                                    const farmId = field._id || field.id;
                                    if (farmId) {
                                      // Navigate to field details or open data view
                                      console.log('View data for field:', farmId);
                                    }
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium border-gray-300 !rounded-none"
                                >
                                  <Eye className="h-3 w-3 mr-1.5" />
                                  View Data
                                </Button>
                              ) : (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFieldForUpload(field);
                                    setShowUploadModal(true);
                                  }}
                                  size="sm"
                                  className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white text-xs font-medium !rounded-none"
                                >
                                  <Settings className="h-3 w-3 mr-1.5" />
                                  Process
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const loadAssessments = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Loading assessments for assessor:', assessorId);
      console.log('📍 API Endpoint: GET /api/v1/assessments');
      console.log('🔑 Auth Token:', localStorage.getItem('token') ? 'Present ✓' : 'Missing ✗');
      
      const response: any = await assessmentsApiService.getAllAssessments();
      console.log('📥 Assessments API raw response:', response);
      
      // Map API response to AssessmentSummary format
      // Adjust mapping based on actual API response structure
      let assessmentsData: any[] = [];
      if (Array.isArray(response)) {
        assessmentsData = response;
      } else if (response && typeof response === 'object') {
        const responseObj = response as { data?: any[]; assessments?: any[]; success?: boolean };
        assessmentsData = responseObj.data || responseObj.assessments || [];
      }
      
      console.log('📊 Extracted assessments data:', assessmentsData);
      console.log('📊 Number of assessments:', assessmentsData.length);
      
      if (assessmentsData.length === 0) {
        console.warn('⚠️ No assessments found. Possible reasons:');
        console.warn('   1. No assessments created yet');
        console.warn('   2. No assessments assigned to this assessor');
        console.warn('   3. Assessor ID mismatch');
        console.warn('   Current Assessor ID:', assessorId);
      }
      
      // Helper function to get farmer name directly from assessment API response
      const getFarmerName = (item: any): string => {
        // Try all possible paths in the assessment response (API should populate farmer data)
        const farmerName = 
          item.farmerName || 
          item.farmer?.name || 
          item.farm?.farmerName ||
          item.farm?.farmer?.name ||
          item.farm?.farmerId?.name ||
          (item.farmer?.firstName && item.farmer?.lastName 
            ? `${item.farmer.firstName} ${item.farmer.lastName}`.trim()
            : '') ||
          (item.farm?.farmerId?.firstName && item.farm?.farmerId?.lastName
            ? `${item.farm.farmerId.firstName} ${item.farm.farmerId.lastName}`.trim()
            : '') ||
          item.farmer?.firstName || 
          item.farmer?.lastName ||
          item.farm?.farmerId?.firstName ||
          item.farm?.farmerId?.lastName ||
          '';
        
        if (!farmerName) {
          console.warn('⚠️ Could not find farmer name in assessment response:', {
            assessmentId: item._id || item.id,
            hasFarmer: !!item.farmer,
            hasFarm: !!item.farm,
            availableFields: Object.keys(item),
            farmFields: item.farm ? Object.keys(item.farm) : 'no farm object',
            farmerFields: item.farmer ? Object.keys(item.farmer) : 'no farmer object'
          });
        }
        
        return farmerName || 'Unknown Farmer';
      };
      
      // Extract assigned farm IDs for marking farms
      const farmIds = new Set<string>();
      assessmentsData.forEach((item: any) => {
        // Extract farmId from assessment
        let farmId = '';
        if (item.farmId) {
          farmId = typeof item.farmId === 'object' 
            ? (item.farmId._id || item.farmId.id || '')
            : item.farmId;
        } else if (item.farm?._id || item.farm?.id) {
          farmId = item.farm._id || item.farm.id;
        }
        if (farmId) {
          farmIds.add(String(farmId));
        }
      });
      setAssignedFarmIds(farmIds);
      console.log(`Marked ${farmIds.size} farms as assigned to this assessor`);
      
      // Map assessments - extract data directly from API response (no async calls needed)
      const mappedAssessments = assessmentsData.map((item: any) => {
        // Extract farmerId - handle case where farmId/farmerId might be an object
        let farmerId = '';
        
        // Priority 1: Direct farmerId field
        if (item.farmerId) {
          if (typeof item.farmerId === 'object' && item.farmerId != null) {
            farmerId = item.farmerId?._id || item.farmerId?.id || '';
          } else {
            farmerId = item.farmerId;
          }
        }
        // Priority 2: From farm object
        else if (item.farm) {
          if (item.farm.farmerId) {
            farmerId = typeof item.farm.farmerId === 'object' && item.farm.farmerId != null
              ? (item.farm.farmerId?._id || item.farm.farmerId?.id || '') 
              : item.farm.farmerId;
          } else if (item.farm.farmer) {
            farmerId = typeof item.farm.farmer === 'object' && item.farm.farmer != null
              ? (item.farm.farmer?._id || item.farm.farmer?.id || '')
              : item.farm.farmer;
          }
        }
        // Priority 3: From farmId field (might be a farm reference)
        else if (item.farmId) {
          if (typeof item.farmId === 'object') {
            // Check if farmId object has farmerId
            if (item.farmId.farmerId) {
              farmerId = typeof item.farmId.farmerId === 'object' 
                ? (item.farmId.farmerId._id || item.farmId.farmerId.id || '') 
                : item.farmId.farmerId;
            } else {
              // farmId might be the farm itself, try to get farmerId from it
              farmerId = item.farmId._id || item.farmId.id || '';
            }
          } else {
            // farmId is a string ID, we'll need to fetch the farm to get farmerId
            // For now, we'll try to use it as farmerId if no other option
            farmerId = item.farmId;
          }
        }
        
        console.log(`🔍 Extracted farmerId for assessment ${item._id || item.id}: ${farmerId || 'NOT FOUND'}`);
        
        // Get farmer name directly from assessment API response
        const farmerName = getFarmerName(item);
        
        // Helper function to extract location directly from assessment API response
        const getLocation = (item: any): string => {
          let location = '';
          
          // Check direct location field
          if (item.location) {
            if (typeof item.location === 'string') {
              location = item.location;
            } else if (item.location.coordinates && Array.isArray(item.location.coordinates)) {
              // Format coordinates as "lat, lng"
              location = `${item.location.coordinates[1]?.toFixed(4)}, ${item.location.coordinates[0]?.toFixed(4)}`;
            } else if (item.location.address) {
              location = item.location.address;
            }
          }
          
          // Check farm location (API should populate farm data)
          if (!location && item.farm) {
            if (item.farm.location) {
              if (typeof item.farm.location === 'string') {
                location = item.farm.location;
              } else if (item.farm.location.coordinates && Array.isArray(item.farm.location.coordinates)) {
                // Format coordinates as "lat, lng" (coordinates are [lng, lat] in GeoJSON)
                location = `${item.farm.location.coordinates[1]?.toFixed(4)}, ${item.farm.location.coordinates[0]?.toFixed(4)}`;
              } else if (item.farm.location.address) {
                location = item.farm.location.address;
              }
            }
            if (!location && item.farm.address) {
              location = item.farm.address;
            }
          }
          
          // Check farmId object location (if farmId is populated)
          if (!location && item.farmId && typeof item.farmId === 'object') {
            if (item.farmId.location) {
              if (typeof item.farmId.location === 'string') {
                location = item.farmId.location;
              } else if (item.farmId.location.coordinates && Array.isArray(item.farmId.location.coordinates)) {
                location = `${item.farmId.location.coordinates[1]?.toFixed(4)}, ${item.farmId.location.coordinates[0]?.toFixed(4)}`;
              } else if (item.farmId.location.address) {
                location = item.farmId.location.address;
              }
            }
            if (!location && item.farmId.address) {
              location = item.farmId.address;
            }
          }
          
          return location || 'Location not available';
        };
        
        const location = getLocation(item);
        
        return {
          id: item._id || item.id || '',
          farmerId,
          farmerName,
          location,
          type: item.type || 'Risk Assessment',
          status: item.status || 'Pending',
          date: item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        };
      });
      
      console.log('✅ Mapped assessments:', mappedAssessments);
      setAssessments(mappedAssessments);
      
      if (mappedAssessments.length > 0) {
        toast({
          title: "Assessments Loaded",
          description: `Successfully loaded ${mappedAssessments.length} assessment(s)`,
        });
      }
    } catch (err: any) {
      console.error('❌ Failed to load assessments:', err);
      // Handle 401 errors more gracefully - check if it's an auth error
      if (err.message && err.message.includes('Authentication required')) {
        setError('Authentication required. Please log in to view assessments.');
        toast({
          title: "Authentication Required",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
      } else {
        setError(err.message || 'Failed to load assessments. Please try again.');
        toast({
          title: "Load Failed",
          description: err.message || "Failed to load assessments. Please try again.",
          variant: "destructive",
        });
      }
      // Keep empty array on error, or show error message
    } finally {
      setLoading(false);
    }
  };

  // Load farms from API
  const loadFarms = async () => {
    setFarmsLoading(true);
    setFarmsError(null);
    try {
      // Try different pagination strategies to handle API inconsistencies
      let response: any = null;
      let farmsArray: any[] = [];
      
      // Strategy 1: Try page 1 first (API seems to use 1-based indexing based on response)
      console.log('Trying page 1...');
      response = await getFarms(1, 100);
      console.log('Farms API Response (page 1):', response);
      
      // Extract farms from response
      if (response?.success && response?.data?.items) {
        farmsArray = Array.isArray(response.data.items) ? response.data.items : [];
        console.log('Extracted farms from response.data.items (page 1):', farmsArray);
        console.log('Pagination info:', {
          currentPage: response.data.currentPage,
          totalItems: response.data.totalItems,
          totalPages: response.data.totalPages
        });
      } else if (Array.isArray(response)) {
        farmsArray = response;
      } else if (Array.isArray(response?.data)) {
        farmsArray = response.data;
      } else if (Array.isArray(response?.items)) {
        farmsArray = response.items;
      } else if (Array.isArray(response?.results)) {
        farmsArray = response.results;
      } else if (Array.isArray(response?.farms)) {
        farmsArray = response.farms;
      }
      
      // Strategy 2: If page 1 returned empty items but totalItems > 0, try page 0 (0-based indexing)
      if (farmsArray.length === 0 && response?.data?.totalItems > 0) {
        console.log('Page 1 returned empty items but totalItems > 0, trying page 0...');
        response = await getFarms(0, 100);
        console.log('Farms API Response (page 0):', response);
        
        if (response?.success && response?.data?.items) {
          farmsArray = Array.isArray(response.data.items) ? response.data.items : [];
          console.log('Extracted farms from page 0:', farmsArray);
        } else if (Array.isArray(response)) {
          farmsArray = response;
        } else if (Array.isArray(response?.data)) {
          farmsArray = response.data;
        }
      }
      
      // Strategy 3: Try with larger page size if still empty
      if (farmsArray.length === 0 && response?.data?.totalItems > 0) {
        console.log('Trying with larger page size (500)...');
        response = await getFarms(0, 500);
        console.log('Farms API Response (page 0, size 500):', response);
        
        if (response?.success && response?.data?.items) {
          farmsArray = Array.isArray(response.data.items) ? response.data.items : [];
          console.log('Extracted farms with larger size:', farmsArray);
        }
      }
      
      // Strategy 4: Try without pagination parameters
      if (farmsArray.length === 0 && response?.data?.totalItems > 0) {
        console.log('Trying to fetch all farms without pagination...');
        try {
          const noPaginationResponse: any = await getAllFarms();
          console.log('Response without pagination:', noPaginationResponse);
          
          if (noPaginationResponse?.success && noPaginationResponse?.data?.items) {
            farmsArray = Array.isArray(noPaginationResponse.data.items) ? noPaginationResponse.data.items : [];
          } else if (Array.isArray(noPaginationResponse)) {
            farmsArray = noPaginationResponse;
          } else if (Array.isArray(noPaginationResponse?.data)) {
            farmsArray = noPaginationResponse.data;
          } else if (Array.isArray(noPaginationResponse?.items)) {
            farmsArray = noPaginationResponse.items;
          }
          
          if (farmsArray.length > 0) {
            console.log('Successfully fetched farms without pagination:', farmsArray);
          }
        } catch (err) {
          console.warn('Failed to fetch without pagination:', err);
        }
      }
      
      // Strategy 5: Check if data structure has farms at a different location
      if (farmsArray.length === 0 && response?.data?.totalItems > 0) {
        console.warn(`⚠️ API reports ${response.data.totalItems} total items but returned empty array.`);
        console.warn('Full response structure:', JSON.stringify(response, null, 2));
        
        // Check if data structure has farms at a different location
        if (response?.data && typeof response.data === 'object') {
          // Check all possible locations for farm data
          const possibleKeys = ['farms', 'results', 'content', 'data'];
          for (const key of possibleKeys) {
            if (Array.isArray(response.data[key])) {
              farmsArray = response.data[key];
              console.log(`Found farms array at response.data.${key}:`, farmsArray);
              break;
            }
          }
        }
      }
      
      console.log('Final extracted farms array:', farmsArray);
      
      setFarms(farmsArray);
      
      if (farmsArray.length === 0) {
        if (response?.data?.totalItems > 0) {
          console.error('❌ API reports farms exist but none were returned. This is likely a backend pagination bug.');
          setFarmsError(`API reports ${response.data.totalItems} farms exist but none were returned. Please contact support.`);
          toast({
            title: 'Data Loading Issue',
            description: `The API reports ${response.data.totalItems} farms but none are being returned. This may be a server-side issue.`,
            variant: 'destructive'
          });
        } else {
          console.log('No farms found. This could mean:');
          console.log('1. No farms exist in the system');
          console.log('2. The API is filtering and no farms match');
          console.log('3. There might be a pagination issue');
        }
      }
    } catch (err: any) {
      console.error('Failed to load farms:', err);
      setFarmsError(err.message || 'Failed to load farms');
      toast({
        title: 'Error loading farms',
        description: err.message || 'Failed to load farms',
        variant: 'destructive'
      });
      setFarms([]);
    } finally {
      setFarmsLoading(false);
    }
  };

  // Load farms when component mounts or when assessment is selected
  useEffect(() => {
    if (selectedAssessment) {
      loadFarms();
    }
  }, [selectedAssessment]);

  // Convert farms to fields format for display
  const getFieldsForAssessment = (assessment: AssessmentSummary): Field[] => {
    // Defensive check: ensure farms is an array
    if (!Array.isArray(farms)) {
      console.warn('farms is not an array:', farms);
      return [];
    }
    
    // Filter farms by farmer name or farmerId
    const relevantFarms = farms.filter(farm => 
      farm.farmerName === assessment.farmerName || 
      farm.farmerId === assessment.farmerId ||
      farm.farmer?.name === assessment.farmerName ||
      farm.farmer?._id === assessment.farmerId
    );
    
    return relevantFarms.filter(farm => farm != null).map((farm: any) => {
      // Determine if processed based on boundary or status
      const hasBoundary = !!(farm.boundary || farm.kmlUrl || farm.kmlFileUrl);
      const farmStatus = farm.status?.toLowerCase() || '';
      const isProcessed = hasBoundary || 
                         farmStatus === 'processed' || 
                         (farmStatus && farmStatus !== 'pending' && farmStatus !== 'processing needed');
      
      return {
        id: farm?._id || farm?.id || '',
        farmerName: farm.farmerName || farm.farmer?.name || assessment.farmerName,
        crop: farm.cropType || 'Unknown',
        area: farm.area || 0,
        season: farm.season || 'N/A',
        status: isProcessed ? 'Processed' : 'Processing Needed',
        fieldName: farm.name || 'Unnamed Field',
        sowingDate: farm.sowingDate || farm.createdAt ? new Date(farm.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        rawFarm: farm // Include rawFarm for boundary checking
      };
    });
  };

  const getFieldDetails = (field: Field): FieldDetail => {
    // Defensive check: ensure farms is an array
    if (!Array.isArray(farms)) {
      console.warn('farms is not an array in getFieldDetails:', farms);
      return {
        fieldId: field.id,
        fieldName: field.fieldName,
        farmer: field.farmerName,
        cropType: field.crop,
        area: field.area,
        season: field.season,
        sowingDate: field.sowingDate,
        location: assessments.find(a => a.farmerName === field.farmerName)?.location || ""
      };
    }
    
    // Find the farm data for this field
    const farmData = farms.find(farm => (farm._id || farm.id) === field.id);
    
    return {
      fieldId: field.id,
      fieldName: field.fieldName,
      farmer: field.farmerName,
      cropType: field.crop,
      area: field.area,
      season: field.season,
      sowingDate: field.sowingDate,
      location: farmData?.location?.coordinates 
        ? `${farmData.location.coordinates[1]}, ${farmData.location.coordinates[0]}`
        : assessments.find(a => a.farmerName === field.farmerName)?.location || ""
    };
  };

  // Load weather data for selected farm/field
  const loadFarmWeatherData = async (farmId: string) => {
    if (!farmId) return;
    
    setLoadingWeather(true);
    try {
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + 7);
      
      const startDateStr = today.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Load forecast
      const forecast = await getWeatherForecast(farmId, startDateStr, endDateStr);
      setWeatherForecast(forecast.data || forecast);
      
      // Load historical (last 30 days)
      const historicalStart = new Date();
      historicalStart.setDate(today.getDate() - 30);
      const historical = await getHistoricalWeather(farmId, historicalStart.toISOString().split('T')[0], startDateStr);
      setHistoricalWeather(historical.data || historical);
      
    } catch (err: any) {
      console.error('Failed to load farm weather data:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to load weather data',
        variant: "destructive",
      });
    } finally {
      setLoadingWeather(false);
    }
  };

  // Load vegetation statistics for selected farm/field
  const loadVegetationStats = async (farmId: string) => {
    if (!farmId) return;
    
    setLoadingVegetation(true);
    try {
      const today = new Date();
      const startDate = new Date();
      startDate.setDate(today.getDate() - 30);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];
      
      const stats = await getVegetationStats(farmId, startDateStr, endDateStr, 'NDVI,MSAVI');
      setVegetationStats(stats.data || stats);
      
    } catch (err: any) {
      console.error('Failed to load vegetation stats:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to load vegetation statistics',
        variant: "destructive",
      });
    } finally {
      setLoadingVegetation(false);
    }
  };

  // Load farm data when field is selected
  useEffect(() => {
    if (selectedField) {
      const farmId = selectedField.id;
      setSelectedFarm(null);
      loadFarmWeatherData(farmId);
      loadVegetationStats(farmId);
      
      // Load full farm details
      getFarmById(farmId).then((farm: any) => {
        setSelectedFarm(farm.data || farm);
      }).catch((err: any) => {
        console.error('Failed to load farm details:', err);
      });
    }
  }, [selectedField]);

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
        return <Sun className="h-8 w-8 text-green-500" />;
      } else if (summaryLower.includes('cloudy') || summaryLower.includes('overcast')) {
        return <Cloud className="h-8 w-8 text-gray-500" />;
      } else if (summaryLower.includes('rain') || summaryLower.includes('drizzle')) {
        return <CloudRain className="h-8 w-8 text-green-500" />;
      } else {
        return <Cloud className="h-8 w-8 text-gray-400" />;
      }
    };

    const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <img src="/loading.gif" alt="Loading" className="w-16 h-16" />
        </div>
      );
    }

    if (error || !weatherData) {
      return (
        <Card className={`${dashboardTheme.card}`}>
          <CardContent className="p-6">
            <div className="text-center text-green-400">
              <Cloud className="h-12 w-12 mx-auto mb-4" />
              <p>{error || 'Failed to load weather data'}</p>
              <Button 
                onClick={loadWeatherData} 
                className="mt-4 bg-green-600 hover:bg-green-700 text-white !rounded-none"
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
                <span className="text-xs text-gray-900/60">Updated: {formatTime(lastUpdated)}</span>
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
                  <div className="text-lg text-gray-600 capitalize">
                    {weatherData.current.summary}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div className="flex items-center text-gray-900/80">
                <Wind className="h-5 w-5 mr-2 text-green-500" />
                <div>
                  <div className="text-xs text-gray-600">Wind</div>
                  <div className="font-medium text-gray-700">{weatherData.current.windSpeed} km/h</div>
                </div>
              </div>
              <div className="flex items-center text-gray-900/80">
                <Droplets className="h-5 w-5 mr-2 text-green-500" />
                <div>
                  <div className="text-xs text-gray-600">Humidity</div>
                  <div className="font-medium text-gray-700">{weatherData.current.humidity}%</div>
                </div>
              </div>
              <div className="flex items-center text-gray-900/80">
                <CloudRain className="h-5 w-5 mr-2 text-cyan-500" />
                <div>
                  <div className="text-xs text-gray-600">Precipitation</div>
                  <div className="font-medium text-gray-700">{weatherData.current.precipitation}mm</div>
                </div>
              </div>
              <div className="flex items-center text-gray-900/80">
                <Thermometer className="h-5 w-5 mr-2 text-green-500" />
                <div>
                  <div className="text-xs text-gray-600">Pressure</div>
                  <div className="font-medium text-gray-700">{weatherData.current.pressure} hPa</div>
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
                    <div className="text-gray-600 text-sm mb-2 font-medium">{formatTime(hour.time)}</div>
                    <div className="flex justify-center mb-2">
                      {getWeatherIcon(hour.summary)}
                    </div>
                    <div className="text-gray-900 font-bold mb-1">{hour.temperature}°</div>
                    <div className="text-gray-600 text-xs capitalize">{hour.summary}</div>
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Temp (°C)</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Rain (mm)</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Humidity</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Clouds</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Wind</th>
                  </tr>
                </thead>
                <tbody>
                  {weatherData.daily.map((day, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 text-gray-700 font-medium">{formatDate(day.date)}</td>
                      <td className="py-4 px-4 text-gray-700">
                        <span className="font-bold">{day.temperature.max}°</span> / <span>{day.temperature.min}°</span>
                      </td>
                      <td className="py-4 px-4 text-gray-700">{day.precipitation}</td>
                      <td className="py-4 px-4 text-gray-700">{day.humidity}%</td>
                      <td className="py-4 px-4 text-gray-600">{day.icon < 2 ? '30%' : day.icon < 3 ? '45%' : day.icon < 4 ? '60%' : '75%'}</td>
                      <td className="py-4 px-4 text-gray-700">{day.windSpeed} m/s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Historical Weather Charts */}
        {(() => {
          // Generate historical data for year 2025
          const generateHistoricalData = () => {
            const data = [];
            const startDate = new Date('2025-01-01');
            const endDate = new Date('2025-12-29');
            
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
              const dateStr = d.toISOString().split('T')[0];
              const month = d.getMonth();
              const dayOfYear = d.getDate() + (d.getMonth() * 30);
              
              // Generate precipitation (lower in summer, higher in rainy seasons)
              let precipitation = 0;
              const rand = Math.random();
              // Simulate rainy seasons
              if (month === 0 || month === 1 || month === 2 || month === 9 || month === 10 || month === 11) {
                precipitation = rand > 0.3 ? Math.random() * 40 : 0;
              } else {
                precipitation = rand > 0.7 ? Math.random() * 25 : 0;
              }
              
              // Generate temperatures with seasonal variation
              const baseTemp = 20 + 10 * Math.sin((dayOfYear - 80) / 365 * 2 * Math.PI);
              const maxTemp = baseTemp + 5 + Math.random() * 5;
              const minTemp = baseTemp - 5 - Math.random() * 5;
              
              data.push({
                date: dateStr,
                dateLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                precipitation: Math.round(precipitation * 10) / 10,
                maxTemp: Math.round(maxTemp * 100) / 100,
                minTemp: Math.round(minTemp * 100) / 100
              });
            }
            
            return data;
          };
          
          const historicalData = generateHistoricalData();
          
          return (
            <>
              <Card className={`${dashboardTheme.card}`}>
                <CardHeader>
                  <CardTitle className="text-gray-900">Daily precipitation, mm</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                      <XAxis 
                        dataKey="dateLabel" 
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        tickCount={12}
                        interval="preserveStartEnd"
                        stroke="#4B5563"
                      />
                      <YAxis 
                        label={{ value: 'Precipitation (mm)', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        domain={[0, 40]}
                        stroke="#4B5563"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151', 
                          borderRadius: '6px',
                          color: '#F3F4F6'
                        }}
                        labelStyle={{ color: '#9CA3AF' }}
                      />
                      <Legend wrapperStyle={{ color: '#F3F4F6' }} />
                      <Bar 
                        dataKey="precipitation" 
                        fill="#06B6D4" 
                        name="2025"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className={`${dashboardTheme.card}`}>
                <CardHeader>
                  <CardTitle className="text-gray-900">Daily temperatures, °C</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                      <XAxis 
                        dataKey="dateLabel" 
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        tickCount={12}
                        interval="preserveStartEnd"
                        stroke="#4B5563"
                      />
                      <YAxis 
                        label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        domain={[0, 40]}
                        stroke="#4B5563"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151', 
                          borderRadius: '6px',
                          color: '#F3F4F6'
                        }}
                        labelStyle={{ color: '#9CA3AF' }}
                      />
                      <Legend wrapperStyle={{ color: '#F3F4F6' }} />
                      <Line 
                        type="monotone" 
                        dataKey="maxTemp" 
                        stroke="#06B6D4" 
                        strokeWidth={2}
                        name="2025 Max t°C"
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="minTemp" 
                        stroke="#0891B2" 
                        strokeWidth={2}
                        name="2025 Min t°C"
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          );
        })()}
      </div>
    );
  };

  // Crop Analysis Component
  const CropAnalysisTab = ({ fieldDetails, farm }: { fieldDetails: FieldDetail; farm?: any }) => {
    // Use selectedFarm and vegetationStats from parent scope
    const [dataSource, setDataSource] = useState<string>("drone");
    const [selectedFile, setSelectedFile] = useState<string>("");
    const [flightDate, setFlightDate] = useState<string>("2025-10-22");
    const [manualDate, setManualDate] = useState<string>("2025-10-28");
    const [assessorNotes, setAssessorNotes] = useState<string>("Weed clusters in north. Pest minimal.");
    const [mapTileLayer, setMapTileLayer] = useState<"osm" | "satellite" | "terrain">("satellite");
    const [selectedIndex, setSelectedIndex] = useState<string>("ndvi");
    
    // Manual input metrics state
    const [stressDetected, setStressDetected] = useState<number[]>([17.6]);
    const [soilMoisture, setSoilMoisture] = useState<number[]>([58]);
    const [weedArea, setWeedArea] = useState<number[]>([7.3]);
    const [pestArea, setPestArea] = useState<number[]>([4.4]);
    
    // Parse location coordinates if available
    const parseCoordinates = (location: string): [number, number] => {
      if (!location || typeof location !== 'string') {
        return [-1.9441, 30.0619]; // Default: Kigali, Rwanda
      }
      
      // Try to parse if it contains numbers (coordinates)
      if (location.includes(',')) {
        const parts = location.split(',');
        const lat = parseFloat(parts[0]?.trim() || "");
        const lng = parseFloat(parts[1]?.trim() || "");
        
        // Validate that we got valid numbers
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return [lat, lng];
      }
      }
      
      // If location is a place name (like "Gatsibo, Eastern Province"), return default
      return [-1.9441, 30.0619]; // Default: Kigali, Rwanda
    };
    
    const mapCenter = parseCoordinates(fieldDetails?.location || "");

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setSelectedFile(file.name);
        
        // Upload file to farms API if it's a shapefile or KML
        try {
          const fileExtension = file.name.split('.').pop()?.toLowerCase();
          if (fileExtension === 'kml' || fileExtension === 'kmz') {
            // Note: uploadKML now requires farmId - this code path needs a farmId
            // For now, show a message that this feature needs to be updated
            toast({
              title: "Info",
              description: "Please use the Process button in the field status column to upload KML files",
            });
          } else if (fileExtension === 'shp' || fileExtension === 'zip') {
            await uploadShapefile(file);
            toast({
              title: "Success",
              description: "Shapefile uploaded successfully",
            });
          }
        } catch (err: any) {
          console.error('File upload failed:', err);
          toast({
            title: "Upload Failed",
            description: err.message || 'Failed to upload file',
            variant: "destructive",
          });
        }
      }
    };

    const handleSave = () => {
      console.log('Saving crop analysis...');
    };

    const handleDownload = () => {
      console.log('Downloading crop analysis...');
    };

    return (
      <div className="space-y-6">
        {/* Field Summary */}
        <Card className={`${dashboardTheme.card}`}>
          <CardHeader>
            <CardTitle className="text-gray-900">Field Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1 font-medium">Farmer</p>
                <p className="text-gray-700 font-medium">{fieldDetails.farmer}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1 font-medium">Crop</p>
                <p className="text-gray-700 font-medium">{fieldDetails.cropType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1 font-medium">Area</p>
                <p className="text-gray-700 font-medium">{fieldDetails.area} ha</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Source */}
        <Card className={`${dashboardTheme.card}`}>
          <CardHeader>
            <CardTitle className="text-gray-900">Data Source</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={dataSource} onValueChange={setDataSource}>
              <TabsList className={`${dashboardTheme.card} border border-gray-200 w-fit`}>
                <TabsTrigger 
                  value="drone" 
                  className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900 text-gray-700"
                >
                  Drone Upload
                </TabsTrigger>
                <TabsTrigger 
                  value="manual" 
                  className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900 text-gray-700"
                >
                  Manual Check
                </TabsTrigger>
              </TabsList>

              <TabsContent value="drone" className="mt-6">
                <div className="space-y-6">
                  {/* Drone Data Upload */}
                  <div>
                    <Label className="text-gray-900 mb-2 block">Drone Data Upload</Label>
                    <p className="text-sm text-gray-900/60 mb-4">Upload JSON or GeoJSON</p>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-gray-900/40" />
                      <p className="text-gray-900 mb-2">Drag file here or click to browse</p>
                      {!selectedFile && (
                        <p className="text-sm text-gray-900/60 mb-4">No file chosen</p>
                      )}
                      <input
                        type="file"
                        id="drone-upload"
                        className="hidden"
                        accept=".json,.geojson"
                        onChange={handleFileChange}
                      />
                      <Button
                        onClick={() => document.getElementById('drone-upload')?.click()}
                        className="bg-green-600 hover:bg-green-700 text-white !rounded-none"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                      {selectedFile && (
                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <p className="text-gray-900/80 text-sm">File selected: {selectedFile}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Flight Date */}
                  <div>
                    <Label htmlFor="flight-date" className="text-gray-900 mb-2 block">Flight Date</Label>
                    <Input
                      id="flight-date"
                      type="date"
                      value={flightDate}
                      onChange={(e) => setFlightDate(e.target.value)}
                      className={`${dashboardTheme.input} border-gray-300`}
                    />
                  </div>

                  {/* Vegetation Metrics - Use real data from vegetationStats if available */}
                  <div>
                    <Label className="text-gray-900 mb-4 block">Vegetation Metrics</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {(() => {
                        // Extract metrics from vegetationStats if available
                        const ndviData = vegetationStats?.NDVI || vegetationStats?.ndvi || vegetationStats?.data?.NDVI;
                        const avgNDVI = ndviData?.average || ndviData?.mean || ndviData?.current;
                        const healthyArea = avgNDVI && fieldDetails.area ? 
                          (avgNDVI > 0.6 ? (fieldDetails.area * 0.9).toFixed(1) : (fieldDetails.area * 0.7).toFixed(1)) : 
                          '2.8';
                        const stressPercent = avgNDVI ? 
                          (avgNDVI < 0.3 ? '35' : avgNDVI < 0.5 ? '17.6' : '5') : 
                          '17.6';
                        
                        return (
                          <>
                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                              <p className="text-xs text-gray-600 mb-1 font-medium">Healthy Area</p>
                              <p className="text-xl font-bold text-gray-700">{healthyArea} ha</p>
                              {avgNDVI && (
                                <p className="text-xs text-gray-500">NDVI: {avgNDVI.toFixed(2)}</p>
                              )}
                            </div>
                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                              <p className="text-xs text-gray-600 mb-1 font-medium">Stress Detected</p>
                              <p className="text-xl font-bold text-gray-700">{stressPercent}%</p>
                            </div>
                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                              <p className="text-xs text-gray-600 mb-1 font-medium">NDVI Average</p>
                              <p className="text-xl font-bold text-gray-700">
                                {avgNDVI ? avgNDVI.toFixed(2) : 'N/A'}
                              </p>
                              {avgNDVI && (
                                <p className="text-xs text-gray-500">
                                  {avgNDVI > 0.6 ? 'Healthy' : avgNDVI > 0.3 ? 'Moderate' : 'Stress'}
                                </p>
                              )}
                            </div>
                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                              <p className="text-xs text-gray-600 mb-1 font-medium">Weed Area</p>
                              <p className="text-xl font-bold text-gray-700">
                                {vegetationStats?.weedArea ? 
                                  `${vegetationStats.weedArea.toFixed(2)} ha` : 
                                  '0.25 ha'
                                }
                              </p>
                              <p className="text-xs text-gray-500">
                                ({vegetationStats?.weedArea ? 
                                  ((vegetationStats.weedArea / fieldDetails.area) * 100).toFixed(1) : 
                                  '7.3'
                                }%)
                              </p>
                            </div>
                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                              <p className="text-xs text-gray-600 mb-1 font-medium">Field Area</p>
                              <p className="text-xl font-bold text-gray-700">{fieldDetails.area} ha</p>
                              <p className="text-xs text-gray-500">Total area</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Field Visualization */}
                  <div>
                    <Label className="text-gray-900 mb-4 block">Field Visualization</Label>
                    <Card className={`${dashboardTheme.card} border border-gray-200`}>
                      <CardHeader>
                          <div>
                            <p className="text-gray-900 font-medium">Map View</p>
                          </div>
                      </CardHeader>
                      <CardContent>
                        <div className="relative">
                          <LeafletMap
                            center={(() => {
                              // Use farm location if available (check both farm prop and selectedFarm)
                              const currentFarm = farm || selectedFarm;
                              if (currentFarm?.location?.coordinates && Array.isArray(currentFarm.location.coordinates)) {
                                const coords = currentFarm.location.coordinates;
                                const lat = coords[1];
                                const lng = coords[0];
                                // Validate coordinates
                                if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                                  return [lat, lng]; // [lat, lng] from [lng, lat]
                                }
                              }
                              // Validate mapCenter before returning
                              const [lat, lng] = mapCenter;
                              if (!isNaN(lat) && !isNaN(lng)) {
                                return mapCenter;
                              }
                              return [-1.9441, 30.0619]; // Default: Kigali, Rwanda
                            })()}
                            zoom={15}
                            height="400px"
                            tileLayer={mapTileLayer}
                            showControls={true}
                            className="w-full rounded-lg"
                            boundary={(farm || selectedFarm)?.boundary || null}
                            kmlUrl={(farm || selectedFarm)?.kmlUrl || (farm || selectedFarm)?.kmlFileUrl || null}
                          />
                          {/* Layer and Index Controls - Overlay on map */}
                          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-3 z-[1000] shadow-lg">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 relative z-[1001]">
                                <Label className="text-sm text-gray-700 font-medium">Layer:</Label>
                              <Select value={mapTileLayer} onValueChange={(value) => setMapTileLayer(value as "osm" | "satellite" | "terrain")}>
                                  <SelectTrigger className={`${dashboardTheme.select} w-32 h-8 text-sm`}>
                                <SelectValue />
                              </SelectTrigger>
                                  <SelectContent className={`${dashboardTheme.card}`} style={{ zIndex: 10001 }}>
                                  <SelectItem value="satellite">Satellite</SelectItem>
                                  <SelectItem value="osm">Street</SelectItem>
                                  <SelectItem value="terrain">Terrain</SelectItem>
                              </SelectContent>
                            </Select>
                            </div>
                              <div className="flex items-center gap-2 relative z-[1001]">
                                <Label className="text-sm text-gray-700 font-medium">Index:</Label>
                              <Select value={selectedIndex} onValueChange={setSelectedIndex}>
                                  <SelectTrigger className={`${dashboardTheme.select} w-40 h-8 text-sm`}>
                                  <SelectValue />
                                </SelectTrigger>
                                  <SelectContent className={`${dashboardTheme.card}`} style={{ zIndex: 10001 }}>
                                  <SelectItem value="ndvi">🌱 NDVI</SelectItem>
                                  <SelectItem value="evi">🌿 EVI</SelectItem>
                                  <SelectItem value="savi">🌾 SAVI</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                          {/* Legend */}
                          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-4 z-[1000] shadow-lg">
                            <p className="text-gray-900 font-medium mb-3">Vegetation Health Index</p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-green-500 rounded"></div>
                                <span className="text-gray-900 text-sm">Healthy</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-green-500 rounded"></div>
                                <span className="text-gray-900 text-sm">Moderate</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-green-500 rounded"></div>
                                <span className="text-gray-900 text-sm">Stress</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Assessor Notes */}
                  <div>
                    <Label htmlFor="notes" className="text-gray-900 mb-2 block">Assessor Notes</Label>
                    <Textarea
                      id="notes"
                      value={assessorNotes}
                      onChange={(e) => setAssessorNotes(e.target.value)}
                      className={`${dashboardTheme.input} border-gray-300 min-h-[100px]`}
                      placeholder="Enter your notes here..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <Button
                      onClick={handleSave}
                      className="bg-green-600 hover:bg-green-700 text-white flex-1 !rounded-none"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Save Analysis
                    </Button>
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      className="border-gray-300 text-gray-900 hover:bg-gray-100 flex-1 !rounded-none"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Summary JSON
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="manual" className="mt-6">
                <div className="space-y-6">
                  {/* Manual Assessment Date */}
                  <div>
                    <Label className="text-gray-900 mb-2 block">Manual Assessment Date</Label>
                    <p className="text-sm text-gray-900/60 mb-2">Physical Check Date:</p>
                    <Input
                      id="manual-date"
                      type="date"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className={`${dashboardTheme.input} border-gray-300`}
                    />
                  </div>

                  {/* Manual Input Metrics */}
                  <div>
                    <Label className="text-gray-900 mb-4 block">Manual Input Metrics</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-3 hover:border-green-500/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-gray-900/80 font-medium">Stress Detected</p>
                          <p className="text-2xl font-bold text-gray-700">{stressDetected[0].toFixed(1)}%</p>
                        </div>
                        <Slider
                          value={stressDetected}
                          onValueChange={setStressDetected}
                          max={100}
                          min={0}
                          step={0.1}
                          className="w-full [&_[role=slider]]:bg-green-500 [&_[role=slider]]:border-green-400 [&_[role=slider]]:shadow-lg [&_[role=slider]]:shadow-green-500/20 [&>span[data-range]]:bg-green-500"
                        />
                        <div className="flex justify-between text-xs text-gray-900/40">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-3 hover:border-green-500/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-gray-900/80 font-medium">Soil Moisture</p>
                          <p className="text-2xl font-bold text-gray-700">{soilMoisture[0].toFixed(1)}%</p>
                        </div>
                        <Slider
                          value={soilMoisture}
                          onValueChange={setSoilMoisture}
                          max={100}
                          min={0}
                          step={0.1}
                          className="w-full [&_[role=slider]]:bg-green-500 [&_[role=slider]]:border-green-400 [&_[role=slider]]:shadow-lg [&_[role=slider]]:shadow-green-500/20 [&>span[data-range]]:bg-green-500"
                        />
                        <div className="flex justify-between text-xs text-gray-900/40">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-3 hover:border-green-500/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-gray-900/80 font-medium">Weed Area (Estimated)</p>
                          <p className="text-2xl font-bold text-gray-700">{weedArea[0].toFixed(1)}%</p>
                        </div>
                        <Slider
                          value={weedArea}
                          onValueChange={setWeedArea}
                          max={100}
                          min={0}
                          step={0.1}
                          className="w-full [&_[role=slider]]:bg-green-500 [&_[role=slider]]:border-green-400 [&_[role=slider]]:shadow-lg [&_[role=slider]]:shadow-green-500/20 [&>span[data-range]]:bg-green-500"
                        />
                        <div className="flex justify-between text-xs text-gray-900/40">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-3 hover:border-green-500/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-gray-900/80 font-medium">Pest Area (Estimated)</p>
                          <p className="text-2xl font-bold text-gray-700">{pestArea[0].toFixed(1)}%</p>
                        </div>
                        <Slider
                          value={pestArea}
                          onValueChange={setPestArea}
                          max={100}
                          min={0}
                          step={0.1}
                          className="w-full [&_[role=slider]]:bg-green-500 [&_[role=slider]]:border-green-400 [&_[role=slider]]:shadow-lg [&_[role=slider]]:shadow-green-500/20 [&>span[data-range]]:bg-green-500"
                        />
                        <div className="flex justify-between text-xs text-gray-900/40">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Field Reference Map */}
                  <div>
                    <Label className="text-gray-900 mb-4 block">Field Reference Map</Label>
                    <Card className={`${dashboardTheme.card} border border-gray-200`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-900 font-medium">Map View</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <LeafletMap
                            center={(() => {
                              // Use farm location if available
                              if (selectedFarm?.location?.coordinates && Array.isArray(selectedFarm.location.coordinates)) {
                                const coords = selectedFarm.location.coordinates;
                                const lat = coords[1];
                                const lng = coords[0];
                                // Validate coordinates
                                if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                                  return [lat, lng]; // [lat, lng] from [lng, lat]
                                }
                              }
                              // Validate mapCenter before returning
                              const [lat, lng] = mapCenter;
                              if (!isNaN(lat) && !isNaN(lng)) {
                              return mapCenter;
                              }
                              return [-1.9441, 30.0619]; // Default: Kigali, Rwanda
                            })()}
                            zoom={15}
                            height="400px"
                            tileLayer="satellite"
                            showControls={true}
                            className="w-full"
                            boundary={selectedFarm?.boundary || null}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Assessor Notes */}
                  <div>
                    <Label htmlFor="manual-notes" className="text-gray-900 mb-2 block">Assessor Notes</Label>
                    <Textarea
                      id="manual-notes"
                      value={assessorNotes}
                      onChange={(e) => setAssessorNotes(e.target.value)}
                      className={`${dashboardTheme.input} border-gray-300 min-h-[100px]`}
                      placeholder="Enter your notes here..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <Button
                      onClick={handleSave}
                      className="bg-green-600 hover:bg-green-700 text-white flex-1 !rounded-none"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Save Analysis
                    </Button>
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      className="border-gray-300 text-gray-900 hover:bg-gray-100 flex-1 !rounded-none"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Summary JSON
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Get status color based on status value
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "approved":
      case "completed":
        return "bg-green-500 text-white border-green-600";
      case "pending":
        return "bg-green-600 text-white border-green-700";
      case "submitted":
        return "bg-green-600 text-white border-green-700";
      case "under review":
      case "processing":
        return "bg-green-600 text-white border-green-700";
      case "rejected":
        return "bg-green-600 text-white border-green-700";
      default:
        return "bg-gray-500 text-white border-gray-600";
    }
  };

  // Filter assessments based on current filters
  const filteredAssessments = assessments.filter(assessment => {
    // Search filter
    const matchesSearch = searchQuery === "" ||
      assessment.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === "all" || assessment.status === statusFilter;
    
    // Type filter
    const matchesType = typeFilter === "all" || assessment.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });
  
  // Filter farmers/fields based on search
  const filteredFarmerData = farmerData.filter(farmer => {
    const matchesSearch = searchQuery === "" ||
      farmer.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farmer.farmerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farmer.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });
  
  // Filter fields based on search
  const filteredFields = Array.isArray(farms) ? farms.filter(farm => {
    const matchesSearch = searchQuery === "" ||
      (farm.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (farm.farmerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (farm.cropType || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }) : [];
  
  console.log('🔍 Filter results:', {
    totalAssessments: assessments.length,
    filteredAssessments: filteredAssessments.length,
    searchQuery,
    statusFilter,
    typeFilter
  });

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setSearchQuery("");
  };

  // Handle status change
  const handleStatusChange = async (assessmentId: string, newStatus: string) => {
    if (newStatus === "Processing") {
      // Find the assessment to get the farmer name
      const assessment = assessments.find(a => a.id === assessmentId);
      if (assessment) {
        setSelectedFarmerForProcessing(assessment.farmerName);
        setShowDrawField(true);
        // Update locally for immediate UI feedback
        setAssessments(assessments.map(assessment => 
          assessment.id === assessmentId 
            ? { ...assessment, status: newStatus }
            : assessment
        ));
      }
    } else {
      // Update via API
      setUpdatingAssessment(assessmentId);
      try {
        await assessmentsApiService.updateAssessment(assessmentId, { status: newStatus });
        // Update local state after successful API call
        setAssessments(assessments.map(assessment => 
          assessment.id === assessmentId 
            ? { ...assessment, status: newStatus }
            : assessment
        ));
      } catch (err: any) {
        console.error('Failed to update assessment:', err);
        toast({
          title: "Update Failed",
          description: err.message || "Failed to update assessment. Please try again.",
          variant: "destructive",
        });
        // Reload assessments to revert to original state
        loadAssessments();
      } finally {
        setUpdatingAssessment(null);
      }
    }
  };

  // Handle calculate risk score
  const handleCalculateRisk = async (assessmentId: string) => {
    setUpdatingAssessment(assessmentId);
    try {
      const response = await assessmentsApiService.calculateRiskScore(assessmentId);
      console.log('Risk calculated:', response);
      // Reload assessments to get updated risk score
      await loadAssessments();
      toast({
        title: "Success",
        description: "Risk score calculated successfully!",
        variant: "default",
      });
    } catch (err: any) {
      console.error('Failed to calculate risk:', err);
      toast({
        title: "Calculation Failed",
        description: err.message || "Failed to calculate risk score. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingAssessment(null);
    }
  };

  // Handle submit assessment
  const handleSubmitAssessment = async (assessmentId: string) => {
    setUpdatingAssessment(assessmentId);
    try {
      const response = await assessmentsApiService.submitAssessment(assessmentId);
      console.log('Assessment submitted:', response);
      // Reload assessments to get updated status
      await loadAssessments();
      toast({
        title: "Success",
        description: "Assessment submitted successfully!",
        variant: "default",
      });
    } catch (err: any) {
      console.error('Failed to submit assessment:', err);
      toast({
        title: "Submission Failed",
        description: err.message || "Failed to submit assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingAssessment(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileNames = Array.from(files).map(file => file.name);
      setUploadedFiles(fileNames);
      
      // Upload files to farms API
      for (const file of Array.from(files)) {
        try {
          const fileExtension = file.name.split('.').pop()?.toLowerCase();
          if (fileExtension === 'kml' || fileExtension === 'kmz') {
            // Note: uploadKML now requires farmId - this code path needs a farmId
            // For now, skip KML uploads from this handler
            console.warn('KML upload requires farmId - use the Process button in field status column');
          } else if (fileExtension === 'shp' || fileExtension === 'zip' || fileExtension === 'dbf' || fileExtension === 'shx') {
            // For shapefiles, upload the zip file
            if (fileExtension === 'zip') {
              await uploadShapefile(file);
            }
          }
        } catch (err: any) {
          console.error(`Failed to upload ${file.name}:`, err);
          toast({
            title: "Upload Failed",
            description: `Failed to upload ${file.name}: ${err.message || 'Unknown error'}`,
            variant: "destructive",
          });
        }
      }
      
      if (files.length > 0) {
        toast({
          title: "Success",
          description: `${files.length} file(s) uploaded successfully`,
        });
        // Reload farms after upload
        await loadFarms();
      }
    }
  };

  const handlePolygonComplete = () => {
    // When polygon is drawn, calculate area and update status
    const mockArea = "2.3 ha"; // This would be calculated from the polygon
    setCalculatedArea(mockArea);
    setFieldStatus("Ready to Sync");
  };

  const handleKMLUpload = async (file: File, farmName?: string, field?: any) => {
    const targetField = field || selectedFieldForUpload;
    if (!targetField) {
      toast({
        title: "Error",
        description: "No field selected for upload",
        variant: "destructive",
      });
      return;
    }

    // Try multiple ways to get the farm ID - rawFarm might have _id or id
    let farmId = targetField._id || targetField.id || targetField.farmId;
    
    // Convert to string and check if it's valid
    if (farmId) {
      farmId = String(farmId);
    }
    
    // Check if farmId is missing or is a temporary ID
    if (!farmId || farmId === 'undefined' || farmId === 'null' || farmId.startsWith('temp-')) {
      console.error('❌ Farm ID extraction failed:', {
        targetField,
        extractedId: farmId,
        has_id: !!targetField._id,
        hasId: !!targetField.id,
        hasFarmId: !!targetField.farmId,
        rawKeys: Object.keys(targetField || {})
      });
      toast({
        title: "Error",
        description: "Farm ID not found. The farm must exist in the system before uploading KML. Please contact support if this issue persists.",
        variant: "destructive",
      });
      return;
    }

    // Validate file
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'kml' && fileExtension !== 'kmz') {
      toast({
        title: "Invalid File",
        description: "Please select a KML or KMZ file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 1MB)
    const maxSize = 1 * 1024 * 1024; // 1MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "KML file size must be less than 1MB",
        variant: "destructive",
      });
      return;
    }

    const fieldId = farmId.toString();
    setProcessingFields(prev => new Set(prev).add(fieldId));
    setFieldProcessingStatus(prev => ({
      ...prev,
      [fieldId]: { status: 'processing', message: 'Uploading KML...' }
    }));

    try {
      console.log('Starting KML upload for farm:', farmId);
      console.log('File details:', { name: file.name, size: file.size, type: file.type });
      console.log('Farm name:', farmName || kmlUploadName);
      
      const uploadResult = await uploadKML(file, farmId, farmName || kmlUploadName);
      
      // Check if there was an EOSDA warning but upload succeeded
      const hasEosdaWarning = uploadResult?.eosdaWarning === true;
      const successMessage = hasEosdaWarning 
        ? 'KML uploaded successfully (external processing disabled)'
        : 'KML uploaded successfully';
      
      console.log('KML upload successful', hasEosdaWarning ? '(EOSDA disabled)' : '');
      console.log('Upload result:', uploadResult);
      console.log('📦 Upload result boundary check:', {
        hasBoundary: !!uploadResult?.boundary,
        boundaryType: typeof uploadResult?.boundary,
        boundaryValue: uploadResult?.boundary,
        boundaryKeys: uploadResult?.boundary ? Object.keys(uploadResult.boundary) : [],
        hasCoordinates: !!(uploadResult?.boundary?.coordinates),
        coordinatesLength: uploadResult?.boundary?.coordinates?.length,
        boundaryTypeValue: uploadResult?.boundary?.type
      });
      
      // Immediately update the field status in farmerFields state (optimistic update)
      setFarmerFields((prev: Record<string, any[]>) => {
        const updated: Record<string, any[]> = { ...prev };
        Object.keys(updated).forEach((farmerIdKey) => {
          const fields = updated[farmerIdKey] || [];
          const fieldIndex = fields.findIndex((f: any) => {
            const fId = f._id || f.id;
            return fId === farmId;
          });
          
          if (fieldIndex !== -1) {
            // Update the field immediately with boundary GeoJSON from upload result
            // The API returns boundary as GeoJSON (not KML URL) - this is the correct data structure
            updated[farmerIdKey] = fields.map((f: any, idx: number) => {
              if (idx === fieldIndex) {
                return {
                  ...f,
                  // Store boundary GeoJSON from upload response (this is what the API returns)
                  boundary: uploadResult?.boundary || f.boundary,
                  // Also store location and area if provided
                  location: uploadResult?.location || f.location,
                  area: uploadResult?.area || f.area,
                  // Status changes to REGISTERED after KML upload (per workflow)
                  status: uploadResult?.status || 'REGISTERED',
                  // Store name if provided
                  name: uploadResult?.name || f.name
                };
              }
              return f;
            });
          }
        });
        return updated;
      });
      
      // Fetch the updated farm data to get the boundary and status
      let updatedFarm = null;
      try {
        const farmResponse = await getFarmById(farmId);
        updatedFarm = farmResponse.data || farmResponse;
        console.log('Fetched updated farm data:', updatedFarm);
        
        // Ensure boundary GeoJSON is preserved from upload result if not in updatedFarm
        // The API processes KML and returns boundary as GeoJSON - this is the correct format
        if (updatedFarm && uploadResult?.boundary) {
          // Prioritize boundary from upload result (most recent)
          updatedFarm.boundary = uploadResult.boundary;
        }
        // Also preserve location and area from upload result
        if (updatedFarm && uploadResult?.location) {
          updatedFarm.location = uploadResult.location;
        }
        if (updatedFarm && uploadResult?.area) {
          updatedFarm.area = uploadResult.area;
        }
        
        // Update the farm in the farms array with the latest data
        if (updatedFarm) {
          setFarms((prevFarms: any[]) => {
            const updated = prevFarms.map((f: any) => {
              const fId = f._id || f.id;
              if (fId === farmId || fId === updatedFarm._id || fId === updatedFarm.id) {
                // Merge the updated farm data, prioritizing boundary from upload result
                return {
                  ...f,
                  ...updatedFarm,
                  // Boundary GeoJSON is the key data - use from upload result if available
                  boundary: uploadResult?.boundary || updatedFarm.boundary || f.boundary,
                  location: uploadResult?.location || updatedFarm.location || f.location,
                  area: uploadResult?.area || updatedFarm.area || f.area,
                  status: uploadResult?.status || updatedFarm.status || 'REGISTERED'
                };
              }
              return f;
            });
            
            // If farm not found in array, add it
            const exists = updated.some((f: any) => {
              const fId = f._id || f.id;
              return fId === farmId || fId === updatedFarm._id || fId === updatedFarm.id;
            });
            
            if (!exists && updatedFarm) {
              updated.push(updatedFarm);
            }
            
            return updated;
          });
        }
      } catch (fetchErr: any) {
        console.warn('⚠️ Failed to fetch updated farm data:', fetchErr);
      }
      
      // Always update farm status to "Processed" after successful KML upload
      try {
        await updateFarm(farmId, { status: 'Processed' });
        console.log('✅ Farm status updated to Processed');
      } catch (updateErr: any) {
        console.warn('⚠️ Failed to update farm status via API:', updateErr);
        // Continue - we'll update locally anyway
      }
      
      // Update the farm in the farms array to ensure status is "Processed"
      setFarms((prevFarms: any[]) => {
        const updated = prevFarms.map((f: any) => {
          const fId = f._id || f.id;
          if (fId === farmId || (updatedFarm && (fId === updatedFarm._id || fId === updatedFarm.id))) {
            // Merge updated farm data and ensure status is "Processed"
            return {
              ...f,
              ...(updatedFarm || {}),
              boundary: updatedFarm?.boundary || f.boundary,
              kmlUrl: updatedFarm?.kmlUrl || f.kmlUrl,
              kmlFileUrl: updatedFarm?.kmlFileUrl || f.kmlFileUrl,
              status: 'Processed' // Always set to Processed after KML upload
            };
          }
          return f;
        });
        
        // If farm not found, add it with Processed status
        const exists = updated.some((f: any) => {
          const fId = f._id || f.id;
          return fId === farmId || (updatedFarm && (fId === updatedFarm._id || fId === updatedFarm.id));
        });
        
        if (!exists && updatedFarm) {
          updated.push({
            ...updatedFarm,
            status: 'Processed'
          });
        }
        
        return updated;
      });
      
      setFieldProcessingStatus(prev => ({
        ...prev,
        [fieldId]: { status: 'success', message: successMessage }
      }));
      
      // Reload farms to get updated boundary data
      await loadFarms();
      // Reload farmers to update farm status
      await loadFarmers();
      // Reload farmer fields for all expanded farmers
      for (const farmerId of expandedFarmers) {
        await loadFarmerFields(farmerId);
      }
      // Reload farmer fields for selected farmer in farmers page if applicable
      if (selectedFarmerForFarmersPage) {
        const selectedFarmerId = selectedFarmerForFarmersPage._id || selectedFarmerForFarmersPage.id;
        if (selectedFarmerId) {
          // Immediately update the field in farmerFields state before reloading
          setFarmerFields((prev: Record<string, any[]>) => {
            const farmerFieldsList = prev[selectedFarmerId] || [];
            const updatedFields = farmerFieldsList.map((f: any) => {
              const fId = f._id || f.id;
              if (fId === farmId || (updatedFarm && (fId === updatedFarm._id || fId === updatedFarm.id))) {
                // Update with the latest farm data including KML
                return {
                  ...f,
                  ...(updatedFarm || {}),
                  boundary: updatedFarm?.boundary || f.boundary,
                  kmlUrl: updatedFarm?.kmlUrl || f.kmlUrl,
                  kmlFileUrl: updatedFarm?.kmlFileUrl || f.kmlFileUrl,
                  status: 'Processed'
                };
              }
              return f;
            });
            return { ...prev, [selectedFarmerId]: updatedFields };
          });
          // Then reload to get any additional updates
          await loadFarmerFields(selectedFarmerId);
        }
      }
      
      // Also update farmerFields for all farmers that might have this field
      setFarmerFields((prev: Record<string, any[]>) => {
        const updated: Record<string, any[]> = { ...prev };
        Object.keys(updated).forEach((farmerIdKey) => {
          const fields = updated[farmerIdKey] || [];
          const fieldIndex = fields.findIndex((f: any) => {
            const fId = f._id || f.id;
            return fId === farmId || (updatedFarm && (fId === updatedFarm._id || fId === updatedFarm.id));
          });
          
          if (fieldIndex !== -1) {
            // Update the field immediately
            updated[farmerIdKey] = fields.map((f: any, idx: number) => {
              if (idx === fieldIndex) {
                return {
                  ...f,
                  ...(updatedFarm || {}),
                  boundary: updatedFarm?.boundary || f.boundary,
                  kmlUrl: updatedFarm?.kmlUrl || f.kmlUrl,
                  kmlFileUrl: updatedFarm?.kmlFileUrl || f.kmlFileUrl,
                  status: 'Processed'
                };
              }
              return f;
            });
          }
        });
        return updated;
      });
      
      // Update selectedFieldForFarmersPage if it's the same field that was uploaded
      if (selectedFieldForFarmersPage) {
        const selectedFieldId = selectedFieldForFarmersPage._id || selectedFieldForFarmersPage.id;
        if (selectedFieldId === farmId || (updatedFarm && (selectedFieldId === updatedFarm._id || selectedFieldId === updatedFarm.id))) {
          // Update the selected field with the latest data including boundary GeoJSON
          // According to workflow: API processes KML and returns boundary as GeoJSON (not KML URL)
          setSelectedFieldForFarmersPage({
            ...selectedFieldForFarmersPage,
            ...(updatedFarm || {}),
            // Prioritize boundary GeoJSON from upload result (most recent and accurate)
            boundary: uploadResult?.boundary || updatedFarm?.boundary || selectedFieldForFarmersPage.boundary,
            location: uploadResult?.location || updatedFarm?.location || selectedFieldForFarmersPage.location,
            area: uploadResult?.area || updatedFarm?.area || selectedFieldForFarmersPage.area,
            status: uploadResult?.status || updatedFarm?.status || 'REGISTERED'
          });
        }
      }
      
      if (!field) {
        // Single field processing - close modal
        setShowUploadModal(false);
        setSelectedFieldForUpload(null);
        setKmlUploadName('');
        const toastMessage = uploadResult?.eosdaWarning 
          ? "KML uploaded successfully. Field boundary processed. (External processing currently disabled)"
          : "KML uploaded successfully. Field boundary processed.";
        toast({
          title: "Success",
          description: toastMessage,
        });
      }
    } catch (err: any) {
      console.error('❌ Failed to upload KML:', err);
      console.error('❌ Error details:', {
        message: err.message,
        stack: err.stack,
        farmId: farmId,
        fileName: file.name
      });
      
      // Handle EOSDA-related errors gracefully (EOSDA is currently disabled)
      const errorMessage = err.message || 'Upload failed';
      let userFriendlyMessage = errorMessage;
      let userFriendlyTitle = "Upload Failed";
      
      if (errorMessage.includes('requests limit exceeded') || errorMessage.includes('EOSDA API error') || errorMessage.includes('EOSDA')) {
        // EOSDA is currently disabled, but KML upload should still work
        // If we get an EOSDA error, the backend might be trying to use it
        userFriendlyTitle = "Processing Error";
        userFriendlyMessage = "The KML file was uploaded but there was an issue with external processing. The boundary should still be saved. Please refresh and check if the field was processed correctly.";
      }
      
      setFieldProcessingStatus(prev => ({
        ...prev,
        [fieldId]: { status: 'error', message: userFriendlyMessage }
      }));
      if (!field) {
        toast({
          title: userFriendlyTitle,
          description: userFriendlyMessage,
          variant: "destructive",
        });
      }
    } finally {
      setProcessingFields(prev => {
        const next = new Set(prev);
        next.delete(fieldId);
        return next;
      });
    }
  };

  // Process multiple fields simultaneously
  const handleProcessMultipleFields = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one file",
        variant: "destructive",
      });
      return;
    }

    if (selectedFieldsForProcessing.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one field to process",
        variant: "destructive",
      });
      return;
    }

    const selectedFieldsArray = Array.from(selectedFieldsForProcessing);
    const filesArray = Array.from(files);
    const farmerIdKey = selectedFarmerForFields?.id || '';
    const fieldsList = farmerFields[farmerIdKey] || [];

    // Match files to fields (one file per field, or use first file for all if only one file)
    const processingPromises = selectedFieldsArray.map(async (fieldId) => {
      const field = fieldsList.find(
        (f: any) => (f._id || f.id)?.toString() === fieldId
      );
      
      if (!field) return;

      // Find corresponding file or use first file
      const fileIndex = selectedFieldsArray.indexOf(fieldId);
      const file = filesArray[fileIndex] || filesArray[0];
      const farmName = field.name || field.cropType || `Field ${fieldId}`;
      
      return handleKMLUpload(file, farmName, field);
    });

    try {
      await Promise.all(processingPromises);
      toast({
        title: "Success",
        description: `Processing ${selectedFieldsArray.length} field(s) simultaneously...`,
      });
      
      // Clear selection after processing
      setSelectedFieldsForProcessing(new Set());
      setShowUploadModal(false);
    } catch (err: any) {
      console.error('Failed to process fields:', err);
      toast({
        title: "Processing Error",
        description: "Some fields failed to process. Check individual status.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // If multiple fields are selected, process them simultaneously
    if (selectedFieldsForProcessing.size > 0) {
      await handleProcessMultipleFields(files);
    } else if (selectedFieldForUpload) {
      // Single field processing
      await handleKMLUpload(files[0], kmlUploadName);
    }
    // Reset input
    e.target.value = '';
  };

  const handleSyncField = async () => {
    if (!selectedFarmerForProcessing) {
      toast({
        title: "Error",
        description: "Please select a farmer first",
        variant: "destructive",
      });
      return;
    }

    try {
      if (fieldMethod === "draw") {
        // When drawing, create farm with boundary coordinates
        // Note: This is a placeholder - you'll need to get actual coordinates from the map drawing
        const farmData = {
          name: `Farm for ${selectedFarmerForProcessing}`,
          location: {
            type: "Point",
            coordinates: [30.0619, -1.9441] // Default coordinates - should come from map
          },
          boundary: {
            type: "Polygon",
            coordinates: [[[30.0619, -1.9441], [30.0625, -1.9435], [30.0612, -1.9438], [30.0619, -1.9441]]] // Default boundary - should come from map
          },
          cropType: "MAIZE"
        };

        await createFarm(farmData);
        toast({
          title: "Success",
          description: "Farm created successfully",
        });
      } else if (fieldMethod === "upload") {
        // Files are already uploaded via handleFileUpload
        // After upload, we might need to create a farm record
        if (uploadedFiles.length > 0) {
          toast({
            title: "Success",
            description: "Farm boundaries uploaded successfully. Farm record will be created from uploaded files.",
          });
        }
      }

      // Reload farms after creation
      await loadFarms();
      setShowDrawField(false);
      setCalculatedArea("");
      setFieldStatus("Awaiting Geometry");
      setUploadedFiles([]);
    } catch (err: any) {
      console.error('Failed to sync field:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to create farm',
        variant: "destructive",
      });
    }
  };

  const handleAssessmentClick = async (assessment: AssessmentSummary) => {
    setSelectedAssessment(assessment);
    setViewMode("fieldSelection");
    
    // Load full assessment details from API
    try {
      const fullAssessment: any = await assessmentsApiService.getAssessmentById(assessment.id);
      console.log('Full assessment details:', fullAssessment);
      // Update selected assessment with full details if needed
      if (fullAssessment && typeof fullAssessment === 'object' && !Array.isArray(fullAssessment)) {
        setSelectedAssessment(Object.assign({}, assessment, fullAssessment) as AssessmentSummary);
      }
    } catch (err: any) {
      console.error('Failed to load assessment details:', err);
      toast({
        title: "Warning",
        description: err.message || "Could not load full assessment details. Showing summary only.",
        variant: "default",
      });
      // Continue with summary data even if full details fail
    }
  };

  // Helper function to get field status color based on API status
  const getFieldStatusColor = (status: string) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case "processed":
        return "bg-green-100 text-green-800";
      case "pending":
      case "awaiting processing":
        return "bg-orange-100 text-orange-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "error":
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to check if a field is processed based on API status
  const isFieldProcessedByStatus = (field: any): boolean => {
    const status = (field?.status || '').toLowerCase();
    return status === 'processed';
  };

  // Helper function to check if a farm/field has valid KML file (processed)
  const hasValidKML = (farm: any): boolean => {
    if (!farm) return false;
    
    // Check for boundary - must have valid coordinates
    if (farm.boundary) {
      // If boundary is an object with coordinates array
      if (farm.boundary.coordinates && Array.isArray(farm.boundary.coordinates) && farm.boundary.coordinates.length > 0) {
        return true;
      }
      // If boundary is a GeoJSON Feature or FeatureCollection
      if (farm.boundary.type === 'Feature' || farm.boundary.type === 'FeatureCollection') {
        return true;
      }
      // If boundary is a Polygon with coordinates
      if (farm.boundary.type === 'Polygon' && farm.boundary.coordinates && Array.isArray(farm.boundary.coordinates) && farm.boundary.coordinates.length > 0) {
        return true;
      }
      // If boundary is an array of coordinates (direct polygon)
      if (Array.isArray(farm.boundary) && farm.boundary.length > 0) {
        return true;
      }
    }
    
    // Check for kmlUrl - must be a non-empty string
    if (farm.kmlUrl && typeof farm.kmlUrl === 'string' && farm.kmlUrl.trim().length > 0) {
      return true;
    }
    
    // Check for kmlFileUrl - must be a non-empty string
    if (farm.kmlFileUrl && typeof farm.kmlFileUrl === 'string' && farm.kmlFileUrl.trim().length > 0) {
      return true;
    }
    
    return false;
  };

  // Helper function to check if a field is processed
  const isFieldProcessed = (field: Field & { rawFarm?: any }): boolean => {
    // Check rawFarm for KML first (most reliable indicator)
    if (field.rawFarm) {
      if (hasValidKML(field.rawFarm)) {
        return true;
      }
    }
    
    // Check status
    const status = field.status?.toLowerCase();
    if (status === 'processed') {
      return true;
    }
    
    // If status indicates it needs processing, it's not processed
    if (status === 'processing needed' || status === 'pending') {
      return false;
    }
    
    // If no status or unclear status, default to not processed (conservative approach)
    // This ensures fields without clear processing status require KML upload
    return false;
  };

  const handleFieldClick = async (field: Field & { rawFarm?: any }) => {
    // Check if field is processed before allowing access to field detail
    // First check the field object, then try to get fresh data from farms array
    let isProcessed = isFieldProcessed(field);
    
    // If field appears unprocessed, double-check by fetching the farm data from farms array
    if (!isProcessed && farms && farms.length > 0) {
      try {
        const farm = farms.find((f: any) => (f._id || f.id) === field.id);
        if (farm) {
          // Re-check with fresh farm data
          const hasBoundary = farm.boundary || farm.kmlUrl || farm.kmlFileUrl;
          const farmStatus = farm.status?.toLowerCase();
          isProcessed = hasBoundary || farmStatus === 'processed';
          
          // Update field with latest farm data if found
          if (farm && !field.rawFarm) {
            field.rawFarm = farm;
          }
        }
      } catch (err) {
        console.warn('Could not check farm status:', err);
      }
    }
    
    if (!isProcessed) {
      // Field is not processed - open upload modal instead
      toast({
        title: "Field Not Processed",
        description: "Please upload a KML file to process this field before viewing details.",
        variant: "default",
      });
      
      // Set the field for upload and open modal
      // Try to get rawFarm from field, or create a minimal farm object
      const farmData = field.rawFarm || {
        _id: field.id,
        id: field.id,
        name: field.fieldName || 'Field'
      };
      
      setSelectedFieldForUpload(farmData);
      setKmlUploadName(field.fieldName || farmData.name || '');
      setShowUploadModal(true);
      return;
    }
    
    // Field is processed - allow access to field detail
    setSelectedField(field);
    setViewMode("fieldDetail");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedAssessment(null);
    setSelectedField(null);
  };

  const handleFarmerClick = (farmer: {farmerId: string; farmerName: string; location: string}) => {
    setSelectedFarmer(farmer);
    setActiveView("farmerFields");
  };

  const handleBackToFarmers = () => {
    setActiveView("farmers");
    setSelectedFarmer(null);
  };

  const handleViewFarmerDetails = async (farmer: any) => {
    const farmerId = farmer._id || farmer.id;
    if (!farmerId) {
      toast({
        title: "Error",
        description: "Farmer ID not found",
        variant: "destructive",
      });
      return;
    }

    setFarmerDetailLoading(true);
    setSelectedFarmerDetail(null);
    
    try {
      // Use the farmer data that's already available (from getAssignedFarmers API)
      // This avoids calling the admin-only getUserById endpoint
      // The farmer object already contains all necessary information
      const farmerData = farmer;
      setSelectedFarmerDetail(farmerData);
      setFarmerViewMode("detail");
      
      // Also load farmer's fields
      await loadFarmerFields(farmerId);
    } catch (err: any) {
      console.error('Failed to load farmer details:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to load farmer details",
        variant: "destructive",
      });
    } finally {
      setFarmerDetailLoading(false);
    }
  };

  const handleBackToFarmersList = () => {
    setFarmerViewMode("list");
    setSelectedFarmerDetail(null);
  };

  const handleBackToFields = () => {
    setViewMode("fieldSelection");
    setSelectedField(null);
  };

  // Get fields for selected farmer
  const getFarmerFields = () => {
    if (!selectedFarmer) return [];
    
    // Find the original farmer ID from assessments
    const assessmentForFarmer = assessments.find(a => a.farmerName === selectedFarmer.farmerName);
    const originalFarmerId = assessmentForFarmer?.farmerId || selectedFarmer.farmerId.replace('F-', '');
    
    const farmerFarms = Array.isArray(farms) 
      ? farms.filter(farm => {
          const farmFarmerId = farm.farmerId || farm.farmer?._id || farm.farmer?.id || '';
          return farmFarmerId === originalFarmerId ||
                 farmFarmerId === selectedFarmer.farmerId ||
                 farm.farmerName === selectedFarmer.farmerName;
        })
      : [];
    
    return farmerFarms.map((farm: any, index: number) => {
      const fieldId = farm._id || farm.id;
      const isProcessed = farm.status === 'Processed' || farm.status === 'processed' || (farm.boundary && farm.boundary.coordinates);
      
      return {
        id: fieldId || `temp-${index}`,
        fieldId: fieldId ? `FLD-${String(fieldId).slice(-3).padStart(3, '0')}` : "Not processed",
        farmerName: farm.farmerName || selectedFarmer.farmerName,
        crop: farm.cropType || farm.crop || "Unknown",
        area: farm.area || 0,
        season: farm.season || (index % 2 === 0 ? "A" : "B"),
        status: isProcessed ? "Processed" : "Processing Needed",
        rawFarm: farm
      };
    });
  };

  // Render Farmer Fields View
  const renderFarmerFields = () => {
    if (!selectedFarmer) return null;
    const fields = getFarmerFields();
    
    return (
      <div className="min-h-screen bg-gray-50 pt-6 pb-8">
        <div className={`${sidebarCollapsed ? 'max-w-full' : 'max-w-7xl'} mx-auto px-6 space-y-4`}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <button 
              onClick={handleBackToFarmers}
              className="text-gray-600 hover:text-gray-700"
            >
              All Farmers
            </button>
            <span className="text-gray-900/60">/</span>
            <span className="text-gray-900">{selectedFarmer.farmerName}</span>
          </div>

          {/* Table */}
          <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="text-left py-2.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Field ID</th>
                    <th className="text-left py-2.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Farmer</th>
                    <th className="text-left py-2.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Crop</th>
                    <th className="text-left py-2.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Area (ha)</th>
                    <th className="text-left py-2.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Season</th>
                    <th className="text-left py-2.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Status</th>
                    <th className="text-left py-2.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fields.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm text-gray-600">
                        No fields found for this farmer
                      </td>
                    </tr>
                  ) : (
                    fields.map((field, index) => (
                      <tr
                        key={field.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${
                            field.fieldId === "Not processed" 
                              ? "text-gray-400" 
                              : "text-gray-900"
                          }`}>
                            {field.fieldId}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{field.farmerName}</div>
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Sprout className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                            <span>{field.crop}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{field.area.toFixed(1)} ha</div>
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{field.season}</div>
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            field.status === "Processed"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-green-50 text-green-700 border-green-200"
                          }`}>
                            {field.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {field.status === "Processed" ? (
                            <div className="flex gap-2">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const farmField: Field = {
                                    id: field.rawFarm._id || field.rawFarm.id,
                                    farmerName: field.farmerName,
                                    crop: field.crop,
                                    area: field.area,
                                    season: field.season,
                                    status: field.status,
                                    fieldName: field.rawFarm.name || "Field",
                                    sowingDate: field.rawFarm.sowingDate || ""
                                  };
                                  handleFieldClick(farmField);
                                }}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white h-8 !rounded-none"
                              >
                                <Eye className="h-3.5 w-3.5 mr-1.5" />
                                View Data
                              </Button>
                              <Button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const farmId = field.rawFarm._id || field.rawFarm.id;
                                  try {
                                    const farmData = await getFarmById(farmId);
                                    setKmlViewerFarm(farmData.data || farmData);
                                    setShowKMLViewer(true);
                                  } catch (err: any) {
                                    console.error('Failed to load farm for KML view:', err);
                                    toast({
                                      title: "Error",
                                      description: "Failed to load farm data for KML view",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                size="sm"
                                variant="outline"
                                className="border-gray-300 text-gray-700 hover:bg-gray-100 h-8 !rounded-none"
                              >
                                <Map className="h-3.5 w-3.5 mr-1.5" />
                                View KML
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFieldForUpload(field.rawFarm);
                                setKmlUploadName(field.rawFarm?.name || '');
                                setShowUploadModal(true);
                              }}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white h-8 !rounded-none"
                            >
                              <Upload className="h-3.5 w-3.5 mr-1.5" />
                              Upload KML
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  };

  // Field Selection View
  const renderFieldSelection = () => {
    if (!selectedAssessment) return null;
    const fields = getFieldsForAssessment(selectedAssessment);
    
    return (
      <div className="min-h-screen bg-gray-50 pt-6 pb-8">
        <div className={`${sidebarCollapsed ? 'max-w-full' : 'max-w-7xl'} mx-auto px-6 space-y-6`}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button 
            onClick={handleBackToList}
            className="text-gray-600 hover:text-gray-700"
          >
            All Assessments
          </button>
          <span className="text-gray-900/60">/</span>
          <span className="text-gray-900">{selectedAssessment.farmerName}</span>
        </div>

        {/* Table */}
        <Card className={`${dashboardTheme.card}`}>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-medium text-gray-900/80">Farmer</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-900/80">Crop</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-900/80">Area (ha)</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-900/80">Season</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-900/80">Status</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-900/80">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr
                      key={field.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? "bg-gray-50/30" : ""
                      }`}
                    >
                      <td className="py-4 px-6 text-gray-900">{field.farmerName}</td>
                      <td className="py-4 px-6 text-gray-900">
                        <div className="flex items-center gap-2">
                          <Leaf className="h-4 w-4 text-green-500" />
                          {field.crop}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-900">{Math.round(field.area)} ha</td>
                      <td className="py-4 px-6 text-gray-900">{field.season}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          field.status === "Processed"
                            ? "bg-green-500/20 text-green-600 border border-green-500/30"
                            : "bg-green-500/20 text-green-400 border border-green-500/30"
                        }`}>
                          {field.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {field.status === "Processed" ? (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleFieldClick(field)}
                              className="bg-gray-200 hover:bg-gray-300 text-gray-900 border border-gray-300 !rounded-none"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Data
                            </Button>
                            <Button
                              onClick={async () => {
                                try {
                                  const farmData = await getFarmById(field.id);
                                  setKmlViewerFarm(farmData.data || farmData);
                                  setShowKMLViewer(true);
                                } catch (err: any) {
                                  console.error('Failed to load farm for KML view:', err);
                                  toast({
                                    title: "Error",
                                    description: "Failed to load farm data for KML view",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              variant="outline"
                              className="border-gray-300 text-gray-700 hover:bg-gray-100 !rounded-none"
                            >
                              <Map className="h-4 w-4 mr-2" />
                              View KML
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleFieldClick(field)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-900 border border-gray-300 !rounded-none"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Process
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  };

  // Field Detail View
  const renderFieldDetail = () => {
    if (!selectedField) return null;
    const fieldDetails = getFieldDetails(selectedField);

    return (
      <div className="min-h-screen bg-gray-50 pt-6 pb-8">
        <div className={`${sidebarCollapsed ? 'max-w-full' : 'max-w-7xl'} mx-auto px-6 space-y-6`}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button 
            onClick={handleBackToList}
            className="text-gray-600 hover:text-gray-700"
          >
            All Assessments
          </button>
          <span className="text-gray-900/60">/</span>
          <button 
            onClick={handleBackToFields}
            className="text-gray-600 hover:text-gray-700"
          >
            {selectedAssessment?.farmerName}
          </button>
        </div>
        
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            Field Detail View
          </h1>
          <p className="text-gray-900/70 mt-2">
            <span className="text-gray-700">{fieldDetails.farmer}</span> - <span className="text-gray-700">{fieldDetails.cropType}</span>
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`${dashboardTheme.card} border border-gray-200`}>
            <TabsTrigger 
              value="basic-info" 
              className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900 text-gray-700"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger 
              value="weather" 
              className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900 text-gray-700"
            >
              <CloudRain className="h-4 w-4 mr-2" />
              Weather Analysis
            </TabsTrigger>
            <TabsTrigger 
              value="crop" 
              className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900 text-gray-700"
            >
              <Leaf className="h-4 w-4 mr-2" />
              Crop Analysis
            </TabsTrigger>
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900 text-gray-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="basic-info" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Field Information */}
              <Card className={`${dashboardTheme.card}`}>
                <CardHeader>
                  <CardTitle className="text-gray-900">Field Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                    <span className="text-gray-600">Field Name</span>
                    <span className="text-gray-700 font-medium">{fieldDetails.fieldName}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                    <span className="text-gray-600">Farmer</span>
                    <span className="text-gray-700 font-medium">{fieldDetails.farmer}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                    <span className="text-gray-600">Crop Type</span>
                    <div className="flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-700 font-medium">{fieldDetails.cropType}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                    <span className="text-gray-600">Area</span>
                    <span className="text-gray-700 font-medium">{fieldDetails.area} hectares</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                    <span className="text-gray-600">Season</span>
                    <span className="text-gray-700 font-medium">Season {fieldDetails.season}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                    <span className="text-gray-600">Sowing Date</span>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-700 font-medium">{fieldDetails.sowingDate}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pb-3">
                    <span className="text-gray-600">Location</span>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-700 font-medium">{fieldDetails.location}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Field Map */}
              <Card className={`${dashboardTheme.card}`}>
                <CardHeader>
                  <CardTitle className="text-gray-900">Field Map</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="w-full h-[500px] border border-gray-200 rounded-lg overflow-hidden">
                    <LeafletMap
                      center={(() => {
                        // Use farm location if available, otherwise parse from fieldDetails
                        if (selectedFarm?.location?.coordinates && Array.isArray(selectedFarm.location.coordinates)) {
                          const coords = selectedFarm.location.coordinates;
                          const lat = coords[1];
                          const lng = coords[0];
                          // Validate coordinates
                          if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                            return [lat, lng]; // [lat, lng] from [lng, lat]
                          }
                        }
                        if (fieldDetails.location && fieldDetails.location.includes(',')) {
                          const parts = fieldDetails.location.split(',');
                          const lat = parseFloat(parts[0]?.trim() || "");
                          const lng = parseFloat(parts[1]?.trim() || "");
                          if (!isNaN(lat) && !isNaN(lng)) {
                          return [lat, lng];
                          }
                        }
                        return [-1.9441, 30.0619]; // Default: Kigali, Rwanda
                      })()}
                      zoom={15}
                      height="100%"
                      tileLayer="satellite"
                      showControls={true}
                      className="w-full h-full"
                            boundary={(farm || selectedFarm)?.boundary || null}
                            kmlUrl={(farm || selectedFarm)?.kmlUrl || (farm || selectedFarm)?.kmlFileUrl || null}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="weather" className="mt-6">
            <WeatherAnalysisTab location={fieldDetails.location} />
          </TabsContent>

          <TabsContent value="crop" className="mt-6">
            <CropAnalysisTab fieldDetails={fieldDetails} farm={selectedFarm} />
          </TabsContent>

          <TabsContent value="overview" className="mt-6">
            <Card className={`${dashboardTheme.card}`}>
              <CardHeader>
                <CardTitle className="text-gray-900">Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-900/60">Field overview and summary will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    );
  };

  // Export functions
  const exportToCSV = () => {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    let csvContent = '';
    let filename = '';
    
    if (activeView === 'farmers') {
      // CSV Header with Starhawk branding
      csvContent = `STARHAWK - Agricultural Insurance Platform\n`;
      csvContent += `Farmers Management Report\n`;
      csvContent += `Generated: ${currentDate}\n`;
      csvContent += `\n`;
      csvContent += `Name,Email,Phone,National ID,Location\n`;
      
      // CSV Data
      farmers.forEach(farmer => {
        const farmerName = 
          farmer.name || 
          (farmer.firstName && farmer.lastName ? `${farmer.firstName} ${farmer.lastName}`.trim() : '') ||
          farmer.firstName || 
          farmer.lastName || 
          "Unknown";
        const location = 
          farmer.location || 
          (farmer.province && farmer.district ? `${farmer.province}, ${farmer.district}` : '') ||
          farmer.province ||
          farmer.district ||
          "N/A";
        const email = (farmer.email || "N/A").replace(/,/g, ';');
        const phone = farmer.phoneNumber || farmer.phone || "N/A";
        const nationalId = farmer.nationalId || farmer.nationalID || "N/A";
        
        csvContent += `${farmerName},${email},${phone},${nationalId},${location}\n`;
      });
      
      csvContent += `\n`;
      csvContent += `Powered by Starhawk\n`;
      csvContent += `Agricultural Insurance Solutions\n`;
      
      filename = `starhawk-farmers-report-${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      // Fields export
      csvContent = `STARHAWK - Agricultural Insurance Platform\n`;
      csvContent += `Fields Management Report\n`;
      csvContent += `Generated: ${currentDate}\n`;
      csvContent += `\n`;
      csvContent += `Field ID,Farmer Name,Crop Type,Area (ha),Status\n`;
      
      filteredFields.forEach(field => {
        const fieldId = field._id || field.id || '';
        const displayFieldId = fieldId ? `FLD-${String(fieldId).slice(-3).padStart(3, '0')}` : 'FLD-000';
        const farmerName = field.farmerName || field.rawFarm?.name || "Unknown";
        const cropType = field.crop || field.cropType || "N/A";
        const area = field.area || 0;
        const status = field.status || "N/A";
        
        csvContent += `${displayFieldId},${farmerName},${cropType},${area},${status}\n`;
      });
      
      csvContent += `\n`;
      csvContent += `Powered by Starhawk\n`;
      csvContent += `Agricultural Insurance Solutions\n`;
      
      filename = `starhawk-fields-report-${new Date().toISOString().split('T')[0]}.csv`;
    }
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export successful",
      description: `Report exported as CSV successfully.`,
    });
  };

  const exportToPDF = async () => {
    // Dynamic import to avoid bundling issues
    const { default: jsPDF } = await import('jspdf');
    
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const doc = new jsPDF('l', 'mm', 'a4'); // landscape orientation
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;
    
    // Header with Starhawk branding
    doc.setFillColor(5, 150, 105); // Green color #059669
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('STARHAWK', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Agricultural Insurance Platform', pageWidth / 2, 30, { align: 'center' });
    
    yPosition = 50;
    
    // Report info
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Type:', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(activeView === 'farmers' ? 'Farmers Management' : 'Fields Management', 60, yPosition);
    
    yPosition += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Generated:', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(currentDate, 60, yPosition);
    
    yPosition += 15;
    
    // Table header
    doc.setFillColor(243, 244, 246);
    doc.rect(20, yPosition - 8, pageWidth - 40, 10, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    
    if (activeView === 'farmers') {
      doc.text('Name', 25, yPosition);
      doc.text('Email', 70, yPosition);
      doc.text('Phone', 120, yPosition);
      doc.text('National ID', 155, yPosition);
      doc.text('Location', 210, yPosition);
    } else {
      doc.text('Field ID', 25, yPosition);
      doc.text('Farmer Name', 60, yPosition);
      doc.text('Crop Type', 120, yPosition);
      doc.text('Area (ha)', 165, yPosition);
      doc.text('Status', 200, yPosition);
    }
    
    yPosition += 10;
    
    // Table data
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    
    const data = activeView === 'farmers' ? farmers : filteredFields;
    
    data.forEach((item: any, index: number) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
        
        // Repeat header on new page
        doc.setFillColor(243, 244, 246);
        doc.rect(20, yPosition - 8, pageWidth - 40, 10, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        if (activeView === 'farmers') {
          doc.text('Name', 25, yPosition);
          doc.text('Email', 70, yPosition);
          doc.text('Phone', 120, yPosition);
          doc.text('National ID', 155, yPosition);
          doc.text('Location', 210, yPosition);
        } else {
          doc.text('Field ID', 25, yPosition);
          doc.text('Farmer Name', 60, yPosition);
          doc.text('Crop Type', 120, yPosition);
          doc.text('Area (ha)', 165, yPosition);
          doc.text('Status', 200, yPosition);
        }
        yPosition += 10;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
      }
      
      if (activeView === 'farmers') {
        const farmerName = 
          item.name || 
          (item.firstName && item.lastName ? `${item.firstName} ${item.lastName}`.trim() : '') ||
          item.firstName || 
          item.lastName || 
          "Unknown";
        const location = 
          item.location || 
          (item.province && item.district ? `${item.province}, ${item.district}` : '') ||
          item.province ||
          item.district ||
          "N/A";
        const email = (item.email || "N/A").substring(0, 25);
        const phone = (item.phoneNumber || item.phone || "N/A").substring(0, 15);
        const nationalId = (item.nationalId || item.nationalID || "N/A").substring(0, 15);
        
        doc.text(farmerName.substring(0, 30), 25, yPosition);
        doc.text(email, 70, yPosition);
        doc.text(phone, 120, yPosition);
        doc.text(nationalId, 155, yPosition);
        doc.text(location.substring(0, 35), 210, yPosition);
      } else {
        const fieldId = item._id || item.id || '';
        const displayFieldId = fieldId ? `FLD-${String(fieldId).slice(-3).padStart(3, '0')}` : 'FLD-000';
        const farmerName = (item.farmerName || item.rawFarm?.name || "Unknown").substring(0, 25);
        const cropType = (item.crop || item.cropType || "N/A").substring(0, 25);
        const area = String(item.area || 0);
        const status = (item.status || "N/A").substring(0, 20);
        
        doc.text(displayFieldId, 25, yPosition);
        doc.text(farmerName, 60, yPosition);
        doc.text(cropType, 120, yPosition);
        doc.text(area, 165, yPosition);
        doc.text(status, 200, yPosition);
      }
      
      yPosition += 8;
    });
    
    // Footer
    const footerY = pageHeight - 20;
    doc.setDrawColor(229, 231, 235);
    doc.line(20, footerY - 10, pageWidth - 20, footerY - 10);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text('Powered by Starhawk', pageWidth / 2, footerY, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Agricultural Insurance Solutions', pageWidth / 2, footerY + 5, { align: 'center' });
    
    // Save the PDF
    const filename = `starhawk-${activeView === 'farmers' ? 'farmers' : 'fields'}-report-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    
    toast({
      title: "Export successful",
      description: `PDF report downloaded successfully.`,
    });
  };

  const renderDashboard = () => (
    <div className="min-h-screen bg-gray-50 pt-6 pb-8">
      {/* Main Content */}
      <div className={`${sidebarCollapsed ? 'max-w-full' : 'max-w-7xl'} mx-auto px-6`}>
        {/* Summary Cards - Clean Modern Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-green-500 border-0 shadow-sm hover:shadow transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-green-50 mb-1">Total Farmers</p>
                  <p className="text-xl font-semibold text-white">{totalFarmers}</p>
                  <p className="text-xs text-green-100 mt-1">All registered</p>
                </div>
                <div className="flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-100" />
                </div>
              </div>
          </CardContent>
        </Card>

          <Card className="bg-emerald-500 border-0 shadow-sm hover:shadow transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-emerald-50 mb-1">Total Fields</p>
                  <p className="text-xl font-semibold text-white">{totalFields}</p>
                  <p className="text-xs text-emerald-100 mt-1">Across all farmers</p>
                </div>
                <div className="flex items-center justify-center">
                  <Sprout className="h-6 w-6 text-emerald-100" />
                </div>
              </div>
          </CardContent>
        </Card>

          <Card className="bg-teal-500 border-0 shadow-sm hover:shadow transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-teal-50 mb-1">Total Area</p>
                  <p className="text-xl font-semibold text-white">{totalArea.toFixed(1)} ha</p>
                  <p className="text-xs text-teal-100 mt-1">Cultivated area</p>
                </div>
                <div className="flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-teal-100" />
                </div>
              </div>
          </CardContent>
        </Card>

          <Card className="bg-lime-500 border-0 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-lime-50 mb-1">Active Assessments</p>
                  <p className="text-xl font-semibold text-white">{activeAssessments}</p>
                  <p className="text-xs text-lime-100 mt-1">In progress</p>
              </div>
                <div className="flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-lime-100" />
                </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <div className="flex items-center gap-2">
              <Button
              onClick={() => setActiveView("farmers")}
                size="sm"
              className={activeView === "farmers"
                ? "bg-green-600 hover:bg-green-700 text-white h-9 !rounded-none"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700 h-9 !rounded-none"}
              >
              View Farmers
              </Button>
        <Button
              onClick={() => setActiveView("fields")}
              size="sm"
              className={activeView === "fields"
                ? "bg-green-600 hover:bg-green-700 text-white h-9 !rounded-none"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700 h-9 !rounded-none"}
            >
              View All Fields
        </Button>
          </div>
          
          <div className="flex items-center gap-2">
          <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 w-56 text-sm bg-white border-gray-300"
            />
          </div>
                  <Button 
                    variant="outline" 
              size="sm"
              onClick={() => setFilterDialogOpen(true)}
              className="bg-white border-gray-300 h-9 !rounded-none"
                  >
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              Filter
                  </Button>
                  <Button 
              onClick={() => setShowDrawField(true)}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white h-9 !rounded-none"
                  >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Field
                  </Button>
                </div>
          </div>

      {/* Error Message */}
      {(error || farmsError) && (
        <Card className="bg-white border-l-4 border-l-red-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-green-500" />
                <p className="text-sm text-green-500">{error || farmsError}</p>
        </div>
              <Button
                onClick={() => { loadAssessments(); loadFarms(); }}
                variant="outline"
                size="sm"
                className="border-gray-300 h-8 !rounded-none"
              >
                <RefreshCw className="h-3 w-3 mr-1.5" />
                Retry
              </Button>
      </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900">
                {activeView === "farmers" ? "Farmers Management" : "Fields Management"}
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white border-green-600 h-8 px-3 text-xs !rounded-none"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Export
                    <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="!rounded-none">
                  <DropdownMenuItem onClick={exportToCSV} className="!rounded-none">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToPDF} className="!rounded-none">
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
        <CardContent className="p-0">
            {loading || farmsLoading ? (
              <div className="p-6">
                <TableSkeleton rows={5} columns={6} />
            </div>
            ) : activeView === "farmerFields" ? (
              renderFarmerFields()
            ) : activeView === "farmers" ? (
              farmers.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm font-medium text-gray-900 mb-1">No farmers found</p>
                  <p className="text-xs text-gray-500">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Name</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Email</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Phone</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">National ID</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Location</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {farmers
                    .filter(farmer => {
                      if (!searchQuery) return true;
                      const farmerName = 
                        farmer.name || 
                        (farmer.firstName && farmer.lastName ? `${farmer.firstName} ${farmer.lastName}`.trim() : '') ||
                        farmer.firstName || 
                        farmer.lastName || 
                        "";
                      const location = 
                        farmer.location || 
                        (farmer.province && farmer.district ? `${farmer.province}, ${farmer.district}` : '') ||
                        farmer.province ||
                        farmer.district ||
                        "";
                      const searchLower = searchQuery.toLowerCase();
                      return (
                        farmerName.toLowerCase().includes(searchLower) ||
                        (farmer.email || "").toLowerCase().includes(searchLower) ||
                        (farmer.phoneNumber || farmer.phone || "").includes(searchQuery) ||
                        (farmer.nationalId || farmer.nationalID || "").includes(searchQuery) ||
                        location.toLowerCase().includes(searchLower)
                      );
                    })
                    .map((farmer, index) => {
                      // Get the actual farmer ID - don't use index as fallback for loading fields
                      const farmerId = farmer._id || farmer.id;
                      if (!farmerId) {
                        console.warn(`Farmer at index ${index} has no ID:`, farmer);
                      }
                      const farmerIdKey = farmerId || `temp-${index}`; // Use temp key only for UI, not for API calls
                      const isExpanded = expandedFarmers.has(farmerIdKey);
                      const farmerFieldsList = farmerFields[farmerIdKey] || [];
                      const isLoadingFields = loadingFields[farmerIdKey] || false;
                      
                      const farmerName = 
                        farmer.name || 
                        (farmer.firstName && farmer.lastName ? `${farmer.firstName} ${farmer.lastName}`.trim() : '') ||
                        farmer.firstName || 
                        farmer.lastName || 
                        "Unknown";
                      
                      const location = 
                        farmer.location || 
                        (farmer.province && farmer.district ? `${farmer.province}, ${farmer.district}` : '') ||
                        farmer.province ||
                        farmer.district ||
                        "N/A";

                      return (
                        <>
                          <tr
                            key={farmerIdKey}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Navigate to farmers page first, then show details
                              setActivePage("farmers");
                              handleViewFarmerDetails(farmer);
                            }}
                            className="hover:bg-gray-50/50 transition-all duration-150 border-b border-gray-100 cursor-pointer"
                          >
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{farmerName}</div>
                              {farmerFieldsList.length > 0 && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {farmerFieldsList.length} field{farmerFieldsList.length !== 1 ? 's' : ''}
                        </div>
                              )}
                      </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{farmer.email || "N/A"}</div>
                      </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{farmer.phoneNumber || farmer.phone || "N/A"}</div>
                      </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{farmer.nationalId || farmer.nationalID || "N/A"}</div>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{location}</div>
                            </td>
                          </tr>
                        </>
                      );
                    })}
                </tbody>
              </table>
                        </div>
              )
            ) : (
              filteredFields.length === 0 ? (
                <div className="p-12 text-center">
                  <Sprout className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm font-medium text-gray-900 mb-1">No fields found</p>
                  <p className="text-xs text-gray-500">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left py-3 px-6 font-medium text-gray-700 text-xs">Field ID</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-700 text-xs">Farmer Name</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-700 text-xs">Crop Type</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-700 text-xs">Area (ha)</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-700 text-xs">Status</th>
                  </tr>
                </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredFields.map((field, index) => {
                        const fieldId = field._id || field.id || '';
                        const displayFieldId = fieldId ? `FLD-${String(fieldId).slice(-3).padStart(3, '0')}` : 'FLD-000';
                        return (
                          <tr
                            key={field._id || field.id || index}
                            onClick={() => {
                              // Convert farm to Field format and navigate to field detail
                              const fieldData: Field = {
                                id: fieldId,
                                farmerName: field.farmerName || field.rawFarm?.name || "Unknown",
                                crop: field.cropType || field.crop || "N/A",
                                area: field.area || 0,
                                season: field.season || "A",
                                status: field.status || "Active",
                                fieldName: field.name || "Unnamed Field",
                                sowingDate: field.sowingDate || field.plantingDate || new Date().toISOString().split('T')[0]
                              };
                              handleFieldClick(fieldData);
                            }}
                            className="hover:bg-green-50/30 transition-colors cursor-pointer"
                          >
                            <td className="py-3.5 px-6 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{displayFieldId}</div>
                      </td>
                            <td className="py-3.5 px-6 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{field.farmerName || "Unknown"}</div>
                      </td>
                            <td className="py-3.5 px-6 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Sprout className="h-4 w-4 text-gray-400" />
                                <span>{field.cropType || "N/A"}</span>
                        </div>
                      </td>
                            <td className="py-3.5 px-6 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{(field.area || 0).toFixed(1)}</div>
                            </td>
                            <td className="py-3.5 px-6 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                {field.status || "Active"}
                              </span>
                      </td>
                    </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
              )
          )}
        </CardContent>
      </Card>
      </div>

      {/* Draw Field Dialog */}
      <Dialog open={showDrawField} onOpenChange={setShowDrawField}>
        <DialogContent className={`${dashboardTheme.card} border-gray-200 max-w-6xl max-h-[90vh]`}>
          <DialogHeader>
            <DialogTitle className="text-gray-900">Process Field: {selectedFarmerForProcessing}</DialogTitle>
            <p className="text-sm text-gray-900/70 mt-2">Select the field adding option</p>
          </DialogHeader>
          
          <Tabs value={fieldMethod} onValueChange={(value) => setFieldMethod(value as "upload" | "draw")} className="mt-4">
            <TabsList className={`${dashboardTheme.card} border border-gray-200 w-fit mb-4`}>
              <TabsTrigger 
                value="upload" 
                className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900 text-gray-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload fields
              </TabsTrigger>
              <TabsTrigger 
                value="draw" 
                className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900 text-gray-700"
              >
                <Map className="h-4 w-4 mr-2" />
                Draw Field on Map
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-0">
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-900/40" />
                <p className="text-gray-900 mb-2">Drag-and-drop here or select files with the field contours for the upload to start</p>
                {uploadedFiles.length === 0 && (
                  <p className="text-sm text-gray-900/60 mb-4">No file chosen</p>
                )}
                <input
                  type="file"
                  id="field-upload"
                  className="hidden"
                  accept=".kml,.kmz,.geojson,.shp,.zip"
                  multiple
                  onChange={handleFileUpload}
                />
                <Button
                  onClick={() => document.getElementById('field-upload')?.click()}
                  className="bg-green-600 hover:bg-green-700 text-white !rounded-none"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  SELECT FILES
                </Button>
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadedFiles.map((fileName, idx) => (
                      <div key={idx} className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-gray-900/80 text-sm">{fileName}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4">
                  <p className="text-xs text-gray-900/60 mb-2">Supported formats are:</p>
                  <p className="text-xs text-gray-900/50">.kml, .kmz, .geojson, .shp or zip</p>
                  <p className="text-xs text-gray-900/50 mt-1">(containing .shp, .shx, .dbf files)</p>
                  <div className="mt-3">
                    <a href="#" className="text-green-400 hover:text-green-300 text-sm">
                      Download sample ▼
                    </a>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="draw" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Map Section */}
                <div className="md:col-span-2">
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <LeafletMap
                      center={[-1.9441, 30.0619]}
                      zoom={13}
                      height="500px"
                      tileLayer="satellite"
                      showControls={true}
                      className="w-full"
                      onMapClick={(lat, lng) => {
                        // Handle map click for drawing polygon
                        console.log('Map clicked:', lat, lng);
                      }}
                    />
                  </div>
                      {!calculatedArea && (
                    <div className="mt-4 text-center">
                        <Button
                          onClick={handlePolygonComplete}
                        className="bg-green-600 hover:bg-green-700 text-white !rounded-none"
                        >
                          Complete Polygon
                        </Button>
                    </div>
                      )}
                </div>

                {/* Field Metadata */}
                <div className="space-y-4">
                  <Card className={`${dashboardTheme.card}`}>
                    <CardHeader>
                      <CardTitle className="text-sm text-gray-900">Field Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-xs text-gray-900/70 mb-1 block">Farmer</Label>
                        <p className="text-sm font-medium text-gray-900">{selectedFarmerForProcessing}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-900/70 mb-1 block">Calculated Area</Label>
                        <p className="text-sm font-medium text-gray-900">{calculatedArea || "Draw polygon to calculate"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-900/70 mb-1 block">Season (Auto-filled)</Label>
                        <p className="text-sm font-medium text-gray-700">Season B</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-900/70 mb-1 block">Status</Label>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          fieldStatus === "Awaiting Geometry" 
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-green-500/20 text-green-600 border border-green-500/30"
                        }`}>
                          {fieldStatus}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <Button
              onClick={() => setShowDrawField(false)}
              variant="outline"
              className="border-gray-300 text-gray-900 hover:bg-gray-800 !rounded-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSyncField}
              className="bg-green-600 hover:bg-green-700 text-white !rounded-none"
              disabled={fieldMethod === "draw" ? !calculatedArea : uploadedFiles.length === 0}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync & Process Field
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

// Complex assessment forms removed - using simplified dashboard

  const handlePageChange = (page: string) => {
    setActivePage(page);
    // Reset view mode when navigating away from dashboard
    if (page !== "dashboard") {
      setViewMode("list");
      setSelectedAssessment(null);
      setSelectedField(null);
    }
  };

  const renderPage = () => {
    // Handle view modes within dashboard
    if (activePage === "dashboard") {
      switch (viewMode) {
        case "fieldDetail":
          return renderFieldDetail();
        case "fieldSelection":
          return renderFieldSelection();
        default:
          return renderDashboard();
      }
    }

    // Handle other pages
    switch (activePage) {
      case "risk-assessments": return <RiskAssessmentSystem />;
      case "loss-assessments": return <LossAssessmentSystem />;
      case "farmers": 
        // Check for farmer detail view on farmers page
        if (farmerViewMode === "detail") {
          return renderFarmerDetail();
        }
        return renderFarmersPage();
      case "crop-monitoring": return renderCropMonitoring();
      case "notifications": return <AssessorNotifications />;
      case "profile-settings": return <AssessorProfileSettings />;
      default: 
        if (showFarmerFieldsView) {
          return renderFarmerFieldsView();
        }
        return renderDashboard();
    }
  };

  const renderFarmerDetail = () => {
    if (farmerDetailLoading) {
      return (
        <div className="min-h-screen bg-gray-50 pt-6 pb-8">
          <div className={`${sidebarCollapsed ? 'max-w-full' : 'max-w-7xl'} mx-auto px-6`}>
            <Card className={`${dashboardTheme.card}`}>
              <CardContent className="p-12">
                <div className="flex items-center justify-center">
                  <img src="/loading.gif" alt="Loading" className="w-16 h-16" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    if (!selectedFarmerDetail) {
      return (
        <div className="min-h-screen bg-gray-50 pt-6 pb-8">
          <div className={`${sidebarCollapsed ? 'max-w-full' : 'max-w-7xl'} mx-auto px-6`}>
            <Card className={`${dashboardTheme.card}`}>
              <CardContent className="p-6">
                <div className="text-center text-gray-600">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                  <p>Farmer details not found</p>
                  <Button
                    onClick={handleBackToFarmersList}
                    className="mt-4 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Farmers
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    const farmer = selectedFarmerDetail;
    const farmerName = 
      farmer.name || 
      (farmer.firstName && farmer.lastName ? `${farmer.firstName} ${farmer.lastName}`.trim() : '') ||
      farmer.firstName || 
      farmer.lastName || 
      "Unknown";
    
    const location = 
      farmer.location || 
      (farmer.province && farmer.district ? `${farmer.province}, ${farmer.district}` : '') ||
      farmer.province ||
      farmer.district ||
      "N/A";

    const farmerFieldsList = farmerFields[farmer._id || farmer.id] || [];

    return (
      <div className="min-h-screen bg-gray-50 pt-6 pb-8">
        <div className={`${sidebarCollapsed ? 'max-w-full' : 'max-w-7xl'} mx-auto px-6`}>
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <Button
                onClick={handleBackToFarmersList}
                variant="ghost"
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Farmers
              </Button>
              <Button
                onClick={async () => {
                  const farmerId = farmer._id || farmer.id;
                  if (farmerId) {
                    setLoadingFields(prev => ({ ...prev, [farmerId]: true }));
                    try {
                      await loadFarmerFields(farmerId);
                      toast({
                        title: "Success",
                        description: "Farmer data refreshed",
                        variant: "default",
                      });
                    } catch (err: any) {
                      toast({
                        title: "Error",
                        description: "Failed to refresh farmer data",
                        variant: "destructive",
                      });
                    } finally {
                      setLoadingFields(prev => ({ ...prev, [farmerId]: false }));
                    }
                  }
                }}
                variant="outline"
                size="sm"
                className="border-gray-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{farmerName}</h1>
            <p className="text-gray-600 mt-1">Farmer ID: {farmer._id || farmer.id}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card className={`${dashboardTheme.card}`}>
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <User className="h-5 w-5 text-green-600" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600 text-sm">Full Name</Label>
                      <p className="text-gray-900 font-medium mt-1">{farmerName}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-sm">Email</Label>
                      <p className="text-gray-900 font-medium mt-1">{farmer.email || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-sm">Phone Number</Label>
                      <p className="text-gray-900 font-medium mt-1">{farmer.phoneNumber || farmer.phone || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-sm">National ID</Label>
                      <p className="text-gray-900 font-medium mt-1">{farmer.nationalId || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-sm">Gender</Label>
                      <p className="text-gray-900 font-medium mt-1">{farmer.sex || farmer.gender || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-sm">Status</Label>
                      <div className="mt-1">
                        <Badge 
                          variant={farmer.active === false ? "destructive" : "default"}
                          className={farmer.active === false ? "bg-red-500" : "bg-green-500"}
                        >
                          {farmer.active === false ? "Inactive" : "Active"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location Information */}
              <Card className={`${dashboardTheme.card}`}>
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-600" />
                    Location Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600 text-sm">Province</Label>
                      <p className="text-gray-900 font-medium mt-1">{farmer.province || farmer.farmerProfile?.farmProvince || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-sm">District</Label>
                      <p className="text-gray-900 font-medium mt-1">{farmer.district || farmer.farmerProfile?.farmDistrict || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-sm">Sector</Label>
                      <p className="text-gray-900 font-medium mt-1">{farmer.sector || farmer.farmerProfile?.farmSector || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-sm">Cell</Label>
                      <p className="text-gray-900 font-medium mt-1">{farmer.cell || farmer.farmerProfile?.farmCell || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-sm">Village</Label>
                      <p className="text-gray-900 font-medium mt-1">{farmer.village || farmer.farmerProfile?.farmVillage || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-sm">Full Location</Label>
                      <p className="text-gray-900 font-medium mt-1">{location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Farms */}
              <Card className={`${dashboardTheme.card}`}>
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <Sprout className="h-5 w-5 text-green-600" />
                    Farms ({farmerFieldsList.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const farmerId = farmer._id || farmer.id;
                    const isLoading = loadingFields[farmerId] || false;
                    
                    if (isLoading) {
                      return (
                        <div className="space-y-3">
                          {[1, 2].map((i) => (
                            <div key={i} className="p-4 bg-gray-50 border border-gray-200 rounded-lg animate-pulse">
                              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    
                    if (farmerFieldsList.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-500">
                          <Sprout className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No farms registered for this farmer</p>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="space-y-3">
                        {/* Display ALL fields regardless of processing status */}
                        {farmerFieldsList.filter((farm: any) => farm != null).map((farm: any, farmIndex: number) => {
                          const farmId = farm.id || farm._id;
                          const farmStatus = farm.status || 'PENDING';
                          const isPending = farmStatus === 'PENDING';
                          const isProcessed = farmStatus === 'PROCESSED' || farmStatus === 'Processed' || farm.boundary;
                          const cropType = farm.cropType || farm.crop || 'N/A';
                          const sowingDate = farm.sowingDate ? new Date(farm.sowingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
                          
                          return (
                            <div 
                              key={farmId || farmIndex} 
                              className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-sm transition-all"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-sm font-medium text-gray-900">{farm.name || `Farm ${farmIndex + 1}`}</span>
                                  <Badge 
                                    variant={isPending ? "destructive" : "default"}
                                    className={isPending ? "bg-yellow-500" : isProcessed ? "bg-green-500" : "bg-gray-500"}
                                  >
                                    {farmStatus}
                                  </Badge>
                                </div>
                                <div className="text-xs text-gray-600 space-y-1">
                                  <div><span className="font-medium">Crop:</span> {cropType}</div>
                                  {sowingDate !== 'N/A' && <div><span className="font-medium">Sowing Date:</span> {sowingDate}</div>}
                                  {farm.area && <div><span className="font-medium">Area:</span> {farm.area.toFixed(2)} hectares</div>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                {isProcessed && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      try {
                                        const farmData = await getFarmById(farmId);
                                        setKmlViewerFarm(farmData.data || farmData);
                                        setShowKMLViewer(true);
                                      } catch (err: any) {
                                        console.error('Failed to load farm for KML view:', err);
                                        toast({
                                          title: "Error",
                                          description: "Failed to load farm data for KML view",
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                                  >
                                    <Map className="h-4 w-4 mr-1" />
                                    KML
                                  </Button>
                                )}
                                {isPending && (
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedFieldForUpload(farm);
                                      setKmlUploadName(farm.name || '');
                                      setShowUploadModal(true);
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <Upload className="h-4 w-4 mr-1" />
                                    Upload KML
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const fieldData: Field = {
                                      id: farmId,
                                      farmerName: farmerName,
                                      crop: cropType,
                                      area: farm.area || 0,
                                      season: farm.season || "A",
                                      status: farmStatus,
                                      fieldName: farm.name || `Farm ${farmIndex + 1}`,
                                      sowingDate: farm.sowingDate || ""
                                    };
                                    // Navigate to risk assessment page
                                    setActivePage("risk-assessments");
                                  }}
                                  className="border-green-600 text-green-600 hover:bg-green-50"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Data
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card className={`${dashboardTheme.card}`}>
                <CardHeader>
                  <CardTitle className="text-gray-900 text-sm">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-600 text-xs">Total Farms</Label>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{farmerFieldsList.length}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600 text-xs">Total Area</Label>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {farmerFieldsList.reduce((sum: number, farm: any) => sum + (farm.area || 0), 0).toFixed(2)} ha
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600 text-xs">Processed Farms</Label>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {farmerFieldsList.filter((farm: any) => 
                        farm.status === 'PROCESSED' || 
                        farm.status === 'Processed' || 
                        farm.boundary
                      ).length}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600 text-xs">Registration Date</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {farmer.createdAt 
                        ? new Date(farmer.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                        : "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card className={`${dashboardTheme.card}`}>
                <CardHeader>
                  <CardTitle className="text-gray-900 text-sm">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={() => {
                      const farmerId = farmer._id || farmer.id;
                      if (farmerId) {
                        setSelectedFarmerForFields({ id: farmerId, name: farmerName });
                        setShowFarmerFieldsView(true);
                        setActiveView("farmers");
                      }
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    variant="default"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Farms
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Farmers Page - Clean Rebuild
  const renderFarmersPage = () => {
    // Field Detail View
    if (farmersPageViewMode === "fieldDetail" && selectedFieldForFarmersPage) {
      return renderFarmersPageFieldDetail();
    }

    // Farmer Fields View
    if (farmersPageViewMode === "farmerFields" && selectedFarmerForFarmersPage) {
      const farmerId = selectedFarmerForFarmersPage._id || selectedFarmerForFarmersPage.id;
      const farmerIdKey = farmerId || '';
      const fieldsList = farmerFields[farmerIdKey] || [];
      const isLoading = loadingFields[farmerIdKey] || false;
      const farmerName = 
        selectedFarmerForFarmersPage.name || 
        (selectedFarmerForFarmersPage.firstName && selectedFarmerForFarmersPage.lastName 
          ? `${selectedFarmerForFarmersPage.firstName} ${selectedFarmerForFarmersPage.lastName}`.trim() 
          : '') ||
        selectedFarmerForFarmersPage.firstName || 
        selectedFarmerForFarmersPage.lastName || 
        "Unknown";

      // Filter fields by search query
      const filteredFields = fieldsList.filter((field: any) => {
        if (!farmersPageSearchQuery) return true;
        const searchLower = farmersPageSearchQuery.toLowerCase();
        const cropType = (field.cropType || '').toLowerCase();
        const fieldId = (field._id || field.id || '').toString().toLowerCase();
        return cropType.includes(searchLower) || fieldId.includes(searchLower);
      });

      return (
        <div className="min-h-screen bg-gray-50 pt-6 pb-8">
          <div className={`${sidebarCollapsed ? 'max-w-full' : 'max-w-7xl'} mx-auto px-6`}>
            <div className="mb-6">
              <Button
                onClick={() => {
                  setFarmersPageViewMode("farmers");
                  setSelectedFarmerForFarmersPage(null);
                  setFarmersPageSearchQuery("");
                }}
                variant="ghost"
                className="mb-4 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Farmers
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">{farmerName} - Fields</h1>
              <p className="text-gray-600 mt-1">View and manage farmer's fields</p>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search fields..."
                  value={farmersPageSearchQuery}
                  onChange={(e) => setFarmersPageSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-gray-300"
                />
              </div>
            </div>

            <Card className={`${dashboardTheme.card}`}>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6">
                    <TableSkeleton rows={5} columns={6} />
                  </div>
                ) : filteredFields.length === 0 ? (
                  <div className="p-12 text-center">
                    <Sprout className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm font-medium text-gray-900 mb-1">No fields found</p>
                    <p className="text-xs text-gray-500">This farmer has no fields yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                          <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase">Field ID</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase">Crop Type</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase">Sowing Date</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase">Status</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredFields.map((field: any, index: number) => {
                          const fieldId = field._id || field.id;
                          const fieldIdString = String(fieldId || '');
                          const isAssigned = assignedFarmIds.has(fieldIdString);
                          const displayFieldId = fieldId ? `FLD-${String(fieldId).slice(-6).padStart(6, '0')}` : `FLD-${String(index + 1).padStart(3, '0')}`;
                          const cropType = field.cropType || 'N/A';
                          const sowingDate = field.sowingDate ? new Date(field.sowingDate).toLocaleDateString() : 'N/A';
                          
                          // Use API status field
                          const fieldStatus = field.status || 'Pending';
                          const isProcessed = isFieldProcessedByStatus(field);
                          const statusBadge = fieldStatus;
                          const statusClass = getFieldStatusColor(fieldStatus);

                          return (
                            <tr 
                              key={fieldId || index} 
                              className={`hover:bg-gray-50 transition-colors ${isProcessed ? 'cursor-pointer' : ''} ${isAssigned ? 'bg-green-50/30' : ''}`}
                              onClick={isProcessed ? async () => {
                                // First, check if cached field has KML URL - if so, use it directly
                                const cachedKmlUrl = field?.kmlFileUrl || field?.kmlUrl;
                                const cachedBoundary = field?.boundary;
                                const cachedSowingDate = field?.sowingDate || field?.plantingDate;
                                    
                                // If cached field has KML URL or boundary, use it directly (API doesn't return KML URL)
                                // Also preserve sowing date from cached field
                                if (cachedKmlUrl || (cachedBoundary && Object.keys(cachedBoundary).length > 0)) {
                                  console.log('✅ Using cached field data with KML URL/boundary:', {
                                    hasKmlUrl: !!cachedKmlUrl,
                                    hasBoundary: !!(cachedBoundary && Object.keys(cachedBoundary).length > 0),
                                    hasSowingDate: !!cachedSowingDate,
                                    sowingDate: cachedSowingDate
                                  });
                                  setSelectedFieldForFarmersPage(field);
                                  setFarmersPageViewMode("fieldDetail");
                                  return;
                                }
                                
                                // If cached field has sowing date but we're fetching fresh data, preserve it
                                const fieldWithSowingDate = cachedSowingDate ? { ...field, sowingDate: cachedSowingDate } : field;
                                
                                // Otherwise, try to fetch fresh field data
                                try {
                                  const fieldId = field._id || field.id;
                                  if (fieldId) {
                                    // Preserve sowing date from cached field before fetching
                                    const cachedSowingDate = field?.sowingDate || field?.plantingDate;
                                    
                                    const freshFieldResponse = await getFarmById(fieldId);
                                    console.log('📥 Raw API response from getFarmById:', freshFieldResponse);
                                    
                                    // Handle different API response structures
                                    // API typically returns { success, message, data } or just the data
                                    let freshField = null;
                                    if (freshFieldResponse) {
                                      // Check if response is wrapped in data property (most common)
                                      if (freshFieldResponse.data) {
                                        freshField = freshFieldResponse.data;
                                        console.log('✅ Using freshFieldResponse.data');
                                      } else if (freshFieldResponse.farm) {
                                        freshField = freshFieldResponse.farm;
                                        console.log('✅ Using freshFieldResponse.farm');
                                      } else if (freshFieldResponse.success !== undefined || freshFieldResponse.message) {
                                        // It's a wrapped response but data might be missing, use the whole response
                                        freshField = freshFieldResponse;
                                        console.log('✅ Using freshFieldResponse (wrapped structure)');
                                      } else {
                                        // Direct response
                                        freshField = freshFieldResponse;
                                        console.log('✅ Using freshFieldResponse directly');
                                      }
                                    }
                                    
                                    if (freshField) {
                                      // Preserve KML URL and boundary from cached field if API doesn't return them
                                      if (cachedKmlUrl && !freshField.kmlFileUrl && !freshField.kmlUrl) {
                                        freshField.kmlFileUrl = cachedKmlUrl;
                                        freshField.kmlUrl = cachedKmlUrl;
                                        console.log('✅ Preserved KML URL from cached field:', cachedKmlUrl);
                                      }
                                      if (cachedBoundary && !freshField.boundary) {
                                        freshField.boundary = cachedBoundary;
                                        console.log('✅ Preserved boundary from cached field');
                                      }
                                      
                                      // Preserve sowing date from cached field if API doesn't return it
                                      if (cachedSowingDate && !freshField.sowingDate && !freshField.plantingDate) {
                                        freshField.sowingDate = cachedSowingDate;
                                        console.log('✅ Preserved sowing date from cached field:', cachedSowingDate);
                                      }
                                      
                                      // Log the full response structure
                                      console.log('✅ Fetched fresh field data (full JSON):', JSON.stringify(freshField, null, 2));
                                      console.log('✅ Fetched fresh field data (summary):', {
                                        hasKmlFileUrl: !!freshField.kmlFileUrl,
                                        hasKmlUrl: !!freshField.kmlUrl,
                                        kmlFileUrl: freshField.kmlFileUrl,
                                        kmlUrl: freshField.kmlUrl,
                                        status: freshField.status,
                                        sowingDate: freshField.sowingDate || freshField.plantingDate,
                                        allKeys: Object.keys(freshField || {})
                                      });
                                      // Store the full response (including wrapper) so we can extract data later
                                      setSelectedFieldForFarmersPage(freshField);
                                    } else {
                                      setSelectedFieldForFarmersPage(field);
                                    }
                                  } else {
                                    setSelectedFieldForFarmersPage(field);
                                  }
                                } catch (err) {
                                  console.warn('Failed to fetch fresh field data, using cached:', err);
                                  setSelectedFieldForFarmersPage(field);
                                }
                                setFarmersPageViewMode("fieldDetail");
                              } : undefined}
                            >
                              <td className="py-4 px-6 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  {isAssigned && (
                                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" title="Assigned to you" />
                                  )}
                                  <div className={`text-sm font-medium ${isAssigned ? 'text-green-900 font-semibold' : 'text-gray-900'}`}>
                                    {displayFieldId}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6 whitespace-nowrap">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Sprout className="h-4 w-4 text-green-500" />
                                  <span>{cropType}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{sowingDate}</div>
                              </td>
                              <td className="py-4 px-6 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClass}`}>
                                    {statusBadge}
                                  </span>
                                  {isAssigned && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                                      Assigned
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-6 whitespace-nowrap">
                                {isProcessed ? (
                                  <Button
                                    size="sm"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      try {
                                        const id = field._id || field.id;
                                        if (id) {
                                          const freshField = await getFarmById(id);
                                          setSelectedFieldForFarmersPage(freshField || field);
                                        } else {
                                          setSelectedFieldForFarmersPage(field);
                                        }
                                      } catch (err) {
                                        setSelectedFieldForFarmersPage(field);
                                      }
                                      setFarmersPageViewMode("fieldDetail");
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedFieldForUpload(field);
                                      setKmlUploadName(field.name || `Field ${displayFieldId}`);
                                      setShowUploadModal(true);
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <Upload className="h-4 w-4 mr-1" />
                                    Process
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    // Farmers List (Default View)
    // Note: The 'farmers' array already contains only assigned farmers from getAssignedFarmers() API
    const filteredFarmers = farmers.filter((farmer: any) => {
      if (!farmersPageSearchQuery) return true;
      const searchLower = farmersPageSearchQuery.toLowerCase();
      const farmerName = 
        (farmer.name || 
        (farmer.firstName && farmer.lastName ? `${farmer.firstName} ${farmer.lastName}`.trim() : '') ||
        farmer.firstName || 
        farmer.lastName || 
        "").toLowerCase();
      const location = 
        (farmer.location || 
        (farmer.province && farmer.district ? `${farmer.province}, ${farmer.district}` : '') ||
        farmer.province ||
        farmer.district ||
        "").toLowerCase();
      return farmerName.includes(searchLower) || location.includes(searchLower);
    });

    return (
      <div className="min-h-screen bg-gray-50 pt-6 pb-8">
        <div className={`${sidebarCollapsed ? 'max-w-full' : 'max-w-7xl'} mx-auto px-6`}>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Farmers Management</h1>
            <p className="text-gray-600 mt-1">View and manage farmers and their fields</p>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search farmers..."
                value={farmersPageSearchQuery}
                onChange={(e) => setFarmersPageSearchQuery(e.target.value)}
                className="pl-10 bg-white border-gray-300"
              />
            </div>
          </div>

          <Card className={`${dashboardTheme.card}`}>
            <CardContent className="p-0">
              {farmersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <img src="/loading.gif" alt="Loading" className="w-16 h-16" />
                </div>
              ) : filteredFarmers.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm font-medium text-gray-900 mb-1">No farmers found</p>
                  <p className="text-xs text-gray-500">Try adjusting your search criteria</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200">
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase">Farmer ID</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase">Farmer Name</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase">Location</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase">Total Fields</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredFarmers.map((farmer: any, index: number) => {
                        const farmerId = farmer._id || farmer.id;
                        const farmerIdKey = farmerId || `temp-${index}`;
                        const fieldsList = farmerFields[farmerIdKey] || [];
                        const farmerName = 
                          farmer.name || 
                          (farmer.firstName && farmer.lastName ? `${farmer.firstName} ${farmer.lastName}`.trim() : '') ||
                          farmer.firstName || 
                          farmer.lastName || 
                          "Unknown";
                        const location = 
                          farmer.location || 
                          (farmer.province && farmer.district ? `${farmer.province}, ${farmer.district}` : '') ||
                          farmer.province ||
                          farmer.district ||
                          "N/A";
                        const displayFarmerId = farmerId ? `F-${String(farmerId).slice(-6).padStart(6, '0')}` : `F-${String(index + 1).padStart(3, '0')}`;

                        return (
                          <tr 
                            key={farmerIdKey}
                            onClick={() => {
                              setSelectedFarmerForFarmersPage(farmer);
                              setFarmersPageViewMode("farmerFields");
                              if (farmerId && !farmerFields[farmerIdKey]?.length) {
                                loadFarmerFields(farmerId);
                              }
                            }}
                            className="hover:bg-gray-50/50 transition-all duration-150 border-b border-gray-100 cursor-pointer"
                          >
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{displayFarmerId}</div>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{farmerName}</div>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="h-4 w-4 text-green-500" />
                                <span>{location}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{fieldsList.length} Fields</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Render field detail for farmers page - Clean Rebuild
  const renderFarmersPageFieldDetail = () => {
    const field = selectedFieldForFarmersPage;
    if (!field) return null;
    
    // The API response is wrapped in { success, message, data } structure
    // Extract the actual field data from the wrapper
    const actualField = field?.data || field?.farm || field;
    
    const fieldId = actualField._id || actualField.id || field._id || field.id;
    const displayFieldId = fieldId ? `FLD-${String(fieldId).slice(-6).padStart(6, '0')}` : 'FLD-000';
    const cropType = actualField.cropType || field.cropType || 'N/A';
    
    // Extract sowing date - try multiple property names and formats
    // Check in order: actualField (unwrapped), field (original), and nested structures
    const sowingDateRaw = 
      actualField?.sowingDate || 
      actualField?.plantingDate || 
      field?.sowingDate || 
      field?.plantingDate ||
      actualField?.data?.sowingDate ||
      actualField?.data?.plantingDate ||
      field?.data?.sowingDate ||
      field?.data?.plantingDate ||
      null;
    
    let sowingDate = 'N/A';
    if (sowingDateRaw) {
      try {
        if (sowingDateRaw instanceof Date) {
          sowingDate = sowingDateRaw.toLocaleDateString();
        } else if (typeof sowingDateRaw === 'string') {
          // Try parsing the date string
          const dateObj = new Date(sowingDateRaw);
          if (!isNaN(dateObj.getTime())) {
            sowingDate = dateObj.toLocaleDateString();
          } else {
            // If parsing fails, try ISO format or other formats
            console.warn('⚠️ Could not parse sowing date string:', sowingDateRaw);
            sowingDate = sowingDateRaw; // Use raw string as fallback
          }
        } else {
          sowingDate = String(sowingDateRaw);
        }
      } catch (error) {
        console.error('❌ Error formatting sowing date:', error, sowingDateRaw);
        sowingDate = String(sowingDateRaw); // Use raw value as fallback
      }
    }
    
    // Log sowing date extraction for debugging
    console.log('📅 Sowing date extraction:', {
      actualFieldSowingDate: actualField?.sowingDate,
      actualFieldPlantingDate: actualField?.plantingDate,
      fieldSowingDate: field?.sowingDate,
      fieldPlantingDate: field?.plantingDate,
      sowingDateRaw,
      sowingDateFormatted: sowingDate,
      actualFieldKeys: Object.keys(actualField || {}),
      fieldKeys: Object.keys(field || {})
    });
    
    const status = actualField.status || field.status || 'Pending';
    
    // Get farmer info
    const farmerId = actualField.farmerId?._id || actualField.farmerId || field.farmerId?._id || field.farmerId || '';
    const farmer = farmers.find((f: any) => (f._id || f.id) === farmerId) || selectedFarmerForFarmersPage;
    const farmerName = 
      farmer?.name || 
      (farmer?.firstName && farmer?.lastName ? `${farmer.firstName} ${farmer.lastName}`.trim() : '') ||
      farmer?.firstName || 
      farmer?.lastName || 
      "Unknown Farmer";
    
    // Get KML URL and boundary
    // actualField is already declared above, use it here
    console.log('🔍 Field structure in detail view (full object):', JSON.stringify(field, null, 2));
    console.log('🔍 Actual field data extracted:', JSON.stringify(actualField, null, 2));
    console.log('🔍 Boundary property:', JSON.stringify(actualField?.boundary, null, 2));
    console.log('🔍 Field structure summary:', {
      fieldId,
      hasDataWrapper: !!field?.data,
      hasKmlFileUrl: !!actualField?.kmlFileUrl,
      hasKmlUrl: !!actualField?.kmlUrl,
      kmlFileUrl: actualField?.kmlFileUrl,
      kmlUrl: actualField?.kmlUrl,
      allFieldKeys: Object.keys(actualField || {}),
      fieldStatus: actualField?.status,
      hasBoundary: !!actualField?.boundary,
      boundaryType: typeof actualField?.boundary,
      boundaryValue: actualField?.boundary,
      boundaryKeys: actualField?.boundary ? Object.keys(actualField.boundary) : [],
      boundaryCoordinates: actualField?.boundary?.coordinates,
      boundaryTypeValue: actualField?.boundary?.type
    });
    
    // Check if boundary exists in farmerFields cache (might have been stored after upload)
    if (farmerId) {
      const cachedFields = farmerFields[farmerId] || [];
      const cachedField = cachedFields.find((f: any) => {
        const fId = f._id || f.id;
        return fId === fieldId;
      });
      if (cachedField?.boundary) {
        console.log('✅ Found boundary in cached field data:', {
          hasBoundary: !!cachedField.boundary,
          boundaryType: typeof cachedField.boundary,
          boundaryTypeValue: cachedField.boundary?.type,
          boundaryKeys: cachedField.boundary ? Object.keys(cachedField.boundary) : [],
          boundaryCoordinates: cachedField.boundary?.coordinates
        });
        // Use cached boundary if actualField doesn't have it
        if (!actualField.boundary) {
          actualField.boundary = cachedField.boundary;
          console.log('✅ Using cached boundary data');
        }
      } else {
        console.log('⚠️ No boundary found in cached field data for field:', fieldId);
      }
    }
    
    // Try multiple possible property names for KML URL
    // Check direct properties first (on the actual field data, not the wrapper)
    let kmlUrlToUse = actualField?.kmlFileUrl || actualField?.kmlUrl || null;
    
    // If not found, check other possible nested structures
    if (!kmlUrlToUse) {
      kmlUrlToUse = 
        actualField?.kmlFile?.url ||
        actualField?.kml?.url ||
        actualField?.kmlFile?.fileUrl ||
        actualField?.fileUrl ||
        actualField?.shapefileUrl ||
        actualField?.boundaryFileUrl ||
        null;
    }
    
    // Check if boundary contains a URL (some APIs store KML URL in boundary object)
    if (!kmlUrlToUse && actualField?.boundary) {
      if (typeof actualField.boundary === 'string') {
        // Boundary might be a URL string
        kmlUrlToUse = actualField.boundary;
      } else if (actualField.boundary.url) {
        kmlUrlToUse = actualField.boundary.url;
      } else if (actualField.boundary.kmlUrl) {
        kmlUrlToUse = actualField.boundary.kmlUrl;
      } else if (actualField.boundary.kmlFileUrl) {
        kmlUrlToUse = actualField.boundary.kmlFileUrl;
      } else if (actualField.boundary.fileUrl) {
        kmlUrlToUse = actualField.boundary.fileUrl;
      }
    }
    
    // Check if boundary GeoJSON is available
    // According to the workflow documentation:
    // The API processes KML files and returns boundary as GeoJSON (not a KML URL)
    // The boundary GeoJSON is the correct data structure to use for displaying on the map
    const hasBoundary = (actualField?.boundary || field?.boundary) && (
      ((actualField?.boundary || field?.boundary).coordinates && Array.isArray((actualField?.boundary || field?.boundary).coordinates) && (actualField?.boundary || field?.boundary).coordinates.length > 0) ||
      (actualField?.boundary || field?.boundary).type === 'Feature' ||
      (actualField?.boundary || field?.boundary).type === 'FeatureCollection' ||
      (actualField?.boundary || field?.boundary).type === 'Polygon'
    );
    
    // Log boundary availability
    console.log('📍 Boundary GeoJSON available:', !!hasBoundary);
    console.log('📍 Boundary structure:', actualField?.boundary);
    if (!hasBoundary) {
      console.warn('⚠️ No boundary GeoJSON found in field object. Available properties:', Object.keys(actualField || {}));
      console.warn('⚠️ This field may not have had KML uploaded yet, or the boundary was not processed.');
      console.warn('⚠️ According to workflow: API processes KML and returns boundary as GeoJSON - no KML URL is returned.');
    } else {
      console.log('✅ Boundary GeoJSON found - will display on map');
    }
    
    // Get field details using helper function (use actualField)
    const fieldDetails = getFieldDetailsFromFarm(actualField || field, farmer || { name: farmerName });

    return (
      <div className="min-h-screen bg-gray-50 pt-6 pb-8">
        <div className={`${sidebarCollapsed ? 'max-w-full' : 'max-w-7xl'} mx-auto px-6 space-y-6`}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <button 
              onClick={() => {
                if (selectedFieldForFarmersPage) {
                  setFarmersPageViewMode("farmerFields");
                  setSelectedFieldForFarmersPage(null);
                } else {
                  setFarmersPageViewMode("farmers");
                  setSelectedFarmerForFarmersPage(null);
                }
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Fields
            </button>
          </div>
          
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              FIELD DETAIL VIEW: {displayFieldId}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {fieldDetails.farmer} - {fieldDetails.cropType}
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className={`${dashboardTheme.card} border border-gray-200`}>
              <TabsTrigger 
                value="basic-info" 
                className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900 text-gray-700"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Basic Info
              </TabsTrigger>
            </TabsList>

            {/* Tab Contents */}
            <TabsContent value="basic-info" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Field Information */}
                <Card className={`${dashboardTheme.card}`}>
                  <CardHeader>
                    <CardTitle className="text-gray-900">Field Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                      <span className="text-gray-600">Field ID</span>
                      <span className="text-gray-700 font-medium">{displayFieldId}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                      <span className="text-gray-600">Farmer</span>
                      <span className="text-gray-700 font-medium">{farmerName}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                      <span className="text-gray-600">Crop Type</span>
                      <div className="flex items-center gap-2">
                        <Leaf className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-700 font-medium">{cropType}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                      <span className="text-gray-600">Sowing Date</span>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-700 font-medium">{sowingDate}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                      <span className="text-gray-600">Status</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getFieldStatusColor(status)}`}>
                        {status}
                      </span>
                    </div>
                    {field.area && (
                      <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                        <span className="text-gray-600">Area</span>
                        <span className="text-gray-700 font-medium">{field.area} hectares</span>
                      </div>
                    )}
                    {fieldDetails.location && (
                      <div className="flex justify-between items-center pb-3">
                        <span className="text-gray-600">Location</span>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-medium">{fieldDetails.location}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Map View */}
                <Card className={`${dashboardTheme.card}`}>
                  <CardHeader>
                    <CardTitle className="text-gray-900">Map View</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {!hasBoundary ? (
                        <div className="border border-gray-200 rounded-lg p-8 bg-gray-50">
                          <div className="text-center">
                            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Boundary Data Not Available</h3>
                            <p className="text-sm text-gray-600 mb-4">
                              The boundary geometry (GeoJSON) is not available for this field. According to the platform workflow:
                            </p>
                            <ul className="text-sm text-gray-600 text-left max-w-md mx-auto mb-4 space-y-1">
                              <li>• The API processes KML files and returns boundary as GeoJSON</li>
                              <li>• No KML file URL is returned - only the processed boundary geometry</li>
                              <li>• This field may not have had KML uploaded yet, or processing failed</li>
                            </ul>
                            <p className="text-xs text-gray-500">
                              Please upload a KML file for this field. The API will process it and return the boundary geometry.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <LeafletMap
                          center={(() => {
                            // Use field location if available
                            if (field?.location?.coordinates && Array.isArray(field.location.coordinates)) {
                              const coords = field.location.coordinates;
                              const lat = coords[1];
                              const lng = coords[0];
                              if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                                return [lat, lng];
                              }
                            }
                            // Try to parse from fieldDetails location
                            if (fieldDetails.location && fieldDetails.location.includes(',')) {
                              const parts = fieldDetails.location.split(',');
                              const lat = parseFloat(parts[0]?.trim() || "");
                              const lng = parseFloat(parts[1]?.trim() || "");
                            if (!isNaN(lat) && !isNaN(lng)) {
                              return [lat, lng];
                            }
                          }
                          return [-1.9441, 30.0619]; // Default: Kigali, Rwanda
                        })()}
                        zoom={15}
                        height="500px"
                        tileLayer="satellite"
                        showControls={true}
                        className="w-full"
                        boundary={hasBoundary ? (actualField?.boundary || field?.boundary) : null}
                        kmlUrl={kmlUrlToUse}
                        key={`farmers-page-map-${fieldId}-${kmlUrlToUse || 'no-kml'}-${hasBoundary ? 'boundary' : 'no-boundary'}`}
                      />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  };

  const renderFarmersList = () => {
    return (
      <div className="min-h-screen bg-gray-50 pt-6 pb-8">

        {/* Main Content */}
        <div className={`${sidebarCollapsed ? 'max-w-full' : 'max-w-7xl'} mx-auto px-6`}>
          {farmersLoading && (
            <Card className={`${dashboardTheme.card}`}>
              <CardContent className="p-12">
                <div className="flex items-center justify-center">
                  <img src="/loading.gif" alt="Loading" className="w-16 h-16" />
                </div>
              </CardContent>
            </Card>
          )}

          {farmersError && !farmersLoading && (
            <Card className={`${dashboardTheme.card}`}>
              <CardContent className="p-6">
                <div className="text-center text-green-600">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                  <p>{farmersError}</p>
                  <Button
                    onClick={loadFarmers}
                    className="mt-4 bg-green-600 hover:bg-green-700 text-white !rounded-none"
                  >
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!farmersLoading && !farmersError && (
            <Card className={`${dashboardTheme.card}`}>
              <CardHeader>
                <CardTitle className="text-gray-900">Farmers</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {farmers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 text-lg mb-2">No farmers found</p>
                    <p className="text-gray-500 text-sm">There are no farmers available at the moment</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                          <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Name</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Email</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Phone</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">National ID</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Location</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {farmers.filter(farmer => farmer != null).map((farmer, index) => {
                          // Get the actual farmer ID - don't use index as fallback for loading fields
                          const farmerId = farmer?._id || farmer?.id;
                          if (!farmerId) {
                            console.warn(`Farmer at index ${index} has no ID:`, farmer);
                          }
                          const farmerIdKey = farmerId || `temp-${index}`; // Use temp key only for UI, not for API calls
                          const isExpanded = expandedFarmers.has(farmerIdKey);
                          const farmerFieldsList = farmerFields[farmerIdKey] || [];
                          const isLoadingFields = loadingFields[farmerIdKey] || false;
                          
                          const farmerName = 
                            farmer.name || 
                            (farmer.firstName && farmer.lastName ? `${farmer.firstName} ${farmer.lastName}`.trim() : '') ||
                            farmer.firstName || 
                            farmer.lastName || 
                            "Unknown";
                          
                          const location = 
                            farmer.location || 
                            (farmer.province && farmer.district ? `${farmer.province}, ${farmer.district}` : '') ||
                            farmer.province ||
                            farmer.district ||
                            "N/A";

                          return (
                            <>
                              <tr
                                key={farmerIdKey}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewFarmerDetails(farmer);
                                }}
                                className="hover:bg-gray-50/50 transition-all duration-150 border-b border-gray-100 cursor-pointer"
                              >
                                <td className="py-4 px-6 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{farmerName}</div>
                                  {farmerFieldsList.length > 0 && (
                                    <div className="text-xs text-gray-500 mt-0.5">
                                      {farmerFieldsList.length} farm{farmerFieldsList.length !== 1 ? 's' : ''}
                                    </div>
                                  )}
                                </td>
                                <td className="py-4 px-6 whitespace-nowrap">
                                  <div className="text-sm text-gray-600">{farmer.email || "N/A"}</div>
                                </td>
                                <td className="py-4 px-6 whitespace-nowrap">
                                  <div className="text-sm text-gray-600">{farmer.phoneNumber || farmer.phone || "N/A"}</div>
                                </td>
                                <td className="py-4 px-6 whitespace-nowrap">
                                  <div className="text-sm text-gray-600">{farmer.nationalId || "N/A"}</div>
                                </td>
                                <td className="py-4 px-6 whitespace-nowrap">
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MapPin className="h-4 w-4 text-green-500 flex-shrink-0" />
                                    <span className="truncate max-w-[200px]">{location}</span>
                                  </div>
                                </td>
                              </tr>
                              {/* Expandable farms row */}
                              {isExpanded && farmerFieldsList.length > 0 && (
                                <tr>
                                  <td colSpan={5} className="px-6 py-4 bg-gray-50">
                                    <div className="space-y-3">
                                      <p className="text-sm font-semibold text-gray-700 mb-2">Farms:</p>
                                      <div className="space-y-2">
                                        {farmerFieldsList.filter((farm: any) => farm != null).map((farm: any, farmIndex: number) => {
                                          const farmId = farm.id || farm._id;
                                          const farmIdString = String(farmId || '');
                                          const isAssigned = assignedFarmIds.has(farmIdString);
                                          const farmStatus = farm.status || 'PENDING';
                                          const isPending = farmStatus === 'PENDING';
                                          const cropType = farm.cropType || 'N/A';
                                          const sowingDate = farm.sowingDate ? new Date(farm.sowingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
                                          
                                          return (
                                            <div key={farmId || farmIndex} className={`flex items-center justify-between p-3 bg-white border rounded-lg ${isAssigned ? 'border-green-500 border-2' : 'border-gray-200'}`}>
                                              <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                  {isAssigned && (
                                                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" title="Assigned to you" />
                                                  )}
                                                  <span className={`text-sm font-medium ${isAssigned ? 'text-green-900' : 'text-gray-900'}`}>
                                                    {farm.name || `Farm ${farmIndex + 1}`}
                                                  </span>
                                                  {isAssigned && (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                                                      Assigned
                                                    </Badge>
                                                  )}
                                                  <Badge 
                                                    variant={isPending ? "destructive" : "default"}
                                                    className={isPending ? "bg-yellow-500" : "bg-green-500"}
                                                  >
                                                    {farmStatus}
                                                  </Badge>
                                                </div>
                                                <div className="mt-1 text-xs text-gray-600">
                                                  <span>Crop: {cropType}</span>
                                                  {sowingDate !== 'N/A' && <span className="ml-3">Sowing: {sowingDate}</span>}
                                                </div>
                                              </div>
                                              {isPending && (
                                                <Button
                                                  size="sm"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedFieldForUpload(farm);
                                                    setKmlUploadName(farm.name || '');
                                                    setShowUploadModal(true);
                                                  }}
                                                  className="bg-green-600 hover:bg-green-700 text-white ml-4"
                                                >
                                                  <Upload className="h-4 w-4 mr-2" />
                                                  Upload KML
                                                </Button>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  };

  // Load monitoring data for a specific farm
  const loadFarmMonitoring = async (farmId: string) => {
    setMonitoringLoading(true);
    setMonitoringError(null);
    try {
      const token = getAuthToken();
      const url = `${API_BASE_URL}/monitoring/farms/${farmId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load monitoring data: ${response.status}`);
      }

      const data = await response.json();
      setMonitoringData(prev => ({ ...prev, [farmId]: data.data || data }));
    } catch (err: any) {
      console.error('Failed to load farm monitoring:', err);
      setMonitoringError(err.message || 'Failed to load monitoring data');
      toast({
        title: 'Error loading monitoring data',
        description: err.message || 'Failed to load monitoring data',
        variant: 'destructive'
      });
    } finally {
      setMonitoringLoading(false);
    }
  };

  // Load all alerts
  const loadAlerts = async (farmId?: string) => {
    setAlertsLoading(true);
    try {
      const token = getAuthToken();
      const url = farmId 
        ? `${API_BASE_URL}/monitoring/alerts/${farmId}`
        : `${API_BASE_URL}/monitoring/alerts`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load alerts: ${response.status}`);
      }

      const data = await response.json();
      const alertsList = data.data || data.items || data || [];
      setAlerts(Array.isArray(alertsList) ? alertsList : []);
    } catch (err: any) {
      console.error('Failed to load alerts:', err);
      toast({
        title: 'Error loading alerts',
        description: err.message || 'Failed to load alerts',
        variant: 'destructive'
      });
    } finally {
      setAlertsLoading(false);
    }
  };

  // Mark alert as read
  const markAlertAsRead = async (alertId: string) => {
    try {
      const token = getAuthToken();
      const url = `${API_BASE_URL}/monitoring/alerts/${alertId}/read`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to mark alert as read: ${response.status}`);
      }

      // Update the alert in the local state
      setAlerts(prev => prev.map(alert => 
        alert._id === alertId || alert.id === alertId
          ? { ...alert, read: true, readAt: new Date().toISOString() }
          : alert
      ));

      toast({
        title: 'Success',
        description: 'Alert marked as read',
      });
    } catch (err: any) {
      console.error('Failed to mark alert as read:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to mark alert as read',
        variant: 'destructive'
      });
    }
  };

  // Load policies and monitoring history for crop monitoring
  const loadCropMonitoringPolicies = async () => {
    try {
      setCropMonitoringLoading(true);
      const response: any = await policiesApiService.getPolicies(1, 100);
      const policiesData = response.data || response || [];
      const policiesArray = Array.isArray(policiesData) ? policiesData : (policiesData.items || policiesData.results || []);
      
      // Filter for active policies
      const activePolicies = policiesArray.filter((policy: any) => 
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
      setCropMonitoringLoading(false);
    }
  };

  const loadCropMonitoringHistory = async () => {
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
    return monitoringHistory.filter(m => m.policyId === policyId).length;
  };

  // Check if monitoring can be started (max 2 cycles)
  const canStartMonitoring = (policyId: string): boolean => {
    return getMonitoringCount(policyId) < 2;
  };

  // Handle start monitoring
  const handleStartMonitoring = async () => {
    if (!selectedPolicyId) return;
    
    if (!canStartMonitoring(selectedPolicyId)) {
      toast({
        title: 'Maximum monitoring cycles reached',
        description: 'You can only start monitoring 2 times per policy.',
        variant: 'destructive'
      });
      return;
    }

    setStartingMonitoring(true);
    try {
      await startCropMonitoring(selectedPolicyId);
      toast({
        title: 'Success',
        description: 'Crop monitoring started successfully.',
      });
      setStartMonitoringDialogOpen(false);
      setSelectedPolicyId(null);
      await loadCropMonitoringHistory();
      setCropMonitoringViewMode('monitoring');
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
      await loadCropMonitoringHistory();
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
      await loadCropMonitoringHistory();
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

  // Load alerts and farms when crop monitoring page is shown
  useEffect(() => {
    if (activePage === "crop-monitoring") {
      if (assessorId) {
        loadCropMonitoringPolicies();
        loadCropMonitoringHistory();
      }
      // Keep legacy loading for backward compatibility
      loadFarmers();
      loadAlerts();
      loadFarms();
    }
  }, [activePage, assessorId]);


  // Convert farm to Field format for detail view
  const getFarmAsField = (farm: any, farmer: any): Field => {
    const farmerName = 
      farmer?.name || 
      (farmer?.firstName && farmer?.lastName ? `${farmer.firstName} ${farmer.lastName}`.trim() : '') ||
      farmer?.firstName || 
      farmer?.lastName || 
      "Unknown Farmer";
    
    return {
      id: farm._id || farm.id || '',
      farmerName,
      crop: farm.cropType || farm.crop || "Unknown",
      area: farm.area || farm.size || 0,
      season: farm.season || "A",
      status: farm.status || "Active",
      fieldName: farm.name || "Unnamed Farm",
      sowingDate: farm.sowingDate || farm.plantingDate || new Date().toISOString().split('T')[0]
    };
  };

  // Get field details from farm
  const getFieldDetailsFromFarm = (farm: any, farmer: any): FieldDetail => {
    const field = getFarmAsField(farm, farmer);
    const farmerName = 
      farmer?.name || 
      (farmer?.firstName && farmer?.lastName ? `${farmer.firstName} ${farmer.lastName}`.trim() : '') ||
      farmer?.firstName || 
      farmer?.lastName || 
      "Unknown Farmer";
    
    return {
      fieldId: farm._id || farm.id || '',
      fieldName: farm.name || "Unnamed Farm",
      farmer: farmerName,
      cropType: farm.cropType || farm.crop || "Unknown",
      area: farm.area || farm.size || 0,
      season: farm.season || "A",
      sowingDate: farm.sowingDate || farm.plantingDate || new Date().toISOString().split('T')[0],
      location: farmer?.location || 
        (farmer?.province && farmer?.district ? `${farmer.province}, ${farmer.district}` : '') ||
        farmer?.province ||
        farmer?.district ||
        "Unknown Location"
    };
  };

  // Render field detail view for crop monitoring
  const renderCropMonitoringFieldDetail = () => {
    const farmToUse = selectedFieldForCropMonitoring || selectedFarmForDetail;
    const farmerToUse = selectedFarmerForCropMonitoring || selectedFarmerForDetail;
    
    if (!farmToUse) return null;
    
    // If we have selectedFieldForCropMonitoring, find the farmer
    let actualFarmer = farmerToUse;
    if (selectedFieldForCropMonitoring && !farmerToUse) {
      const fieldFarmerId = selectedFieldForCropMonitoring.farmerId?._id || selectedFieldForCropMonitoring.farmerId || selectedFieldForCropMonitoring.farmer?._id || selectedFieldForCropMonitoring.farmer;
      actualFarmer = farmers.find((f: any) => (f._id || f.id) === fieldFarmerId) || null;
    }
    
    if (!actualFarmer) {
      // Try to get farmer name from the field data
      const farmerName = selectedFieldForCropMonitoring?.farmerName || "Unknown Farmer";
      actualFarmer = { name: farmerName, firstName: farmerName.split(' ')[0], lastName: farmerName.split(' ').slice(1).join(' ') };
    }
    
    const fieldDetails = getFieldDetailsFromFarm(farmToUse, actualFarmer);
    const fieldId = farmToUse._id || farmToUse.id || '';
    const displayFieldId = fieldId ? `FLD-${String(fieldId).slice(-3).padStart(3, '0')}` : 'FLD-000';

    return (
      <div className="min-h-screen bg-gray-50 pt-6 pb-8">
        <div className={`${sidebarCollapsed ? 'max-w-full' : 'max-w-7xl'} mx-auto px-6 space-y-6`}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <button 
              onClick={() => {
                if (selectedFieldForCropMonitoring) {
                  setCropMonitoringViewMode("farmerFields");
                  setSelectedFieldForCropMonitoring(null);
                } else {
                setCropMonitoringViewMode("list");
                setSelectedFarmerForDetail(null);
                setSelectedFarmForDetail(null);
                }
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Crop Monitoring
            </button>
          </div>
          
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              FIELD DETAIL VIEW: {displayFieldId}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {fieldDetails.farmer} - {fieldDetails.cropType}
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className={`${dashboardTheme.card} border border-gray-200`}>
              <TabsTrigger 
                value="basic-info" 
                className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900 text-gray-700"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger 
                value="weather" 
                className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900 text-gray-700"
              >
                <CloudRain className="h-4 w-4 mr-2" />
                Weather Analysis
              </TabsTrigger>
              <TabsTrigger 
                value="crop" 
                className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900 text-gray-700"
              >
                <Leaf className="h-4 w-4 mr-2" />
                Crop Analysis (Satellite)
              </TabsTrigger>
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900 text-gray-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
            </TabsList>

            {/* Tab Contents */}
            <TabsContent value="basic-info" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Field Information */}
                <Card className={`${dashboardTheme.card}`}>
                  <CardHeader>
                    <CardTitle className="text-gray-900">Field Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                      <span className="text-gray-600">Field ID</span>
                      <span className="text-gray-700 font-medium">{displayFieldId}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                      <span className="text-gray-600">Field Name</span>
                      <span className="text-gray-700 font-medium">{fieldDetails.fieldName}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                      <span className="text-gray-600">Farmer</span>
                      <span className="text-gray-700 font-medium">{fieldDetails.farmer}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                      <span className="text-gray-600">Crop Type</span>
                      <div className="flex items-center gap-2">
                        <Leaf className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-700 font-medium">{fieldDetails.cropType}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                      <span className="text-gray-600">Area</span>
                      <span className="text-gray-700 font-medium">{fieldDetails.area} hectares</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                      <span className="text-gray-600">Season</span>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-700 font-medium">Season {fieldDetails.season}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pb-3">
                      <span className="text-gray-600">Location</span>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-700 font-medium">{fieldDetails.location}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-gray-200 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 !rounded-none"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                        Edit Info
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 !rounded-none"
                      >
                        <FileText className="h-3.5 w-3.5 mr-1.5" />
                        View History
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Map View */}
                <Card className={`${dashboardTheme.card}`}>
                  <CardHeader>
                    <CardTitle className="text-gray-900">Map View</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <LeafletMap
                        center={(() => {
                          // Use farm location if available
                          if (farmToUse?.location?.coordinates && Array.isArray(farmToUse.location.coordinates)) {
                            const coords = farmToUse.location.coordinates;
                            const lat = coords[1];
                            const lng = coords[0];
                            // Validate coordinates
                            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                              return [lat, lng]; // [lat, lng] from [lng, lat]
                            }
                          }
                          // Try to parse from fieldDetails location
                          if (fieldDetails.location && fieldDetails.location.includes(',')) {
                            const parts = fieldDetails.location.split(',');
                            const lat = parseFloat(parts[0]?.trim() || "");
                            const lng = parseFloat(parts[1]?.trim() || "");
                            if (!isNaN(lat) && !isNaN(lng)) {
                              return [lat, lng];
                            }
                          }
                          return [-1.9441, 30.0619]; // Default: Kigali, Rwanda
                        })()}
                        zoom={15}
                        height="500px"
                        tileLayer="satellite"
                        showControls={true}
                        className="w-full"
                        boundary={farmToUse?.boundary || null}
                        kmlUrl={farmToUse?.kmlUrl || farmToUse?.kmlFileUrl || null}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="weather" className="mt-6">
              <WeatherAnalysisTab location={fieldDetails.location} />
            </TabsContent>

            <TabsContent value="crop" className="mt-6">
              <CropAnalysisTab 
                fieldDetails={fieldDetails} 
                farm={farmToUse}
              />
            </TabsContent>

            <TabsContent value="overview" className="mt-6">
              <Card className={`${dashboardTheme.card}`}>
                <CardHeader>
                  <CardTitle className="text-gray-900">Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-900/60">Field overview and summary will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  };

  const renderCropMonitoring = () => {
    // Show field detail view
    if (cropMonitoringViewMode === "fieldDetail" && selectedFieldForCropMonitoring) {
      return renderCropMonitoringFieldDetail();
    }

    // Show farmer fields view
    if (cropMonitoringViewMode === "farmerFields" && selectedFarmerForCropMonitoring) {
      const farmerId = selectedFarmerForCropMonitoring._id || selectedFarmerForCropMonitoring.id;
      const farmerFieldsList = farmerFields[farmerId] || [];
      const isLoadingFields = loadingFields[farmerId] || false;
      const farmerName = 
        selectedFarmerForCropMonitoring.name || 
        (selectedFarmerForCropMonitoring.firstName && selectedFarmerForCropMonitoring.lastName 
          ? `${selectedFarmerForCropMonitoring.firstName} ${selectedFarmerForCropMonitoring.lastName}`.trim() 
          : '') ||
        selectedFarmerForCropMonitoring.firstName || 
        selectedFarmerForCropMonitoring.lastName || 
        "Unknown";

      // Filter fields based on search
      // Filter fields based on search ONLY - show ALL fields regardless of processing status
      const filteredFields = farmerFieldsList.filter((farm: any) => {
        // Only filter by search query, NOT by status - show all fields (processed and unprocessed)
        if (!cropMonitoringSearchQuery) return true;
        const searchLower = cropMonitoringSearchQuery.toLowerCase();
        const farmName = (farm.name || '').toLowerCase();
        const cropType = (farm.cropType || farm.crop || '').toLowerCase();
        return farmName.includes(searchLower) || cropType.includes(searchLower);
      });
      
      // Debug: Log all fields to ensure we're showing everything
      console.log(`🔍 renderCropMonitoring - Fields for farmer ${farmerIdKey}:`, {
        totalFields: farmerFieldsList.length,
        filteredFields: filteredFields.length,
        fields: farmerFieldsList.map((f: any) => ({
          id: f._id || f.id,
          name: f.name,
          status: f.status || 'NO STATUS',
          hasBoundary: !!(f.boundary || f.kmlUrl || f.kmlFileUrl),
          cropType: f.cropType || f.crop
        }))
      });
    
    return (
      <div className="min-h-screen bg-gray-50 pt-6 pb-8">
          <div className={`${sidebarCollapsed ? 'max-w-full' : 'max-w-7xl'} mx-auto px-6`}>
            {/* Header */}
            <div className="mb-6">
              <Button
                onClick={() => {
                  setCropMonitoringViewMode("farmers");
                  setSelectedFarmerForCropMonitoring(null);
                  setCropMonitoringSearchQuery("");
                }}
                variant="ghost"
                className="mb-4 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Farmers
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">{farmerName} - Fields</h1>
              <p className="text-gray-600 mt-1">Select a field for crop monitoring</p>
            </div>

            {/* Search and Filter */}
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search fields..."
                  value={cropMonitoringSearchQuery}
                  onChange={(e) => setCropMonitoringSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-gray-300"
                />
              </div>
              <Button 
                variant="outline" 
                className="bg-white border-gray-300"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            {/* Fields Table */}
            <Card className={`${dashboardTheme.card}`}>
              <CardContent className="p-0">
                {isLoadingFields ? (
                  <div className="p-6">
                    <TableSkeleton rows={5} columns={7} />
                  </div>
                ) : filteredFields.length === 0 ? (
                  <div className="p-12 text-center">
                    <Sprout className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm font-medium text-gray-900 mb-1">No fields found</p>
                    <p className="text-xs text-gray-500">Try adjusting your search criteria</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                          <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Field ID</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Farmer</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Crop</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Area (ha)</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Season</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Status</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredFields.map((farm: any, index: number) => {
                          const farmId = farm.id || farm._id;
                          const farmStatus = farm.status || 'PENDING';
                          const isProcessed = farmStatus === 'PROCESSED' || farmStatus === 'Processed' || farm.boundary;
                          const cropType = farm.cropType || farm.crop || 'N/A';
                          const area = farm.area || 0;
                          const season = farm.season || 'A';
                          const displayFieldId = farmId ? `FLD-${String(farmId).slice(-3).padStart(3, '0')}` : `FLD-${String(index + 1).padStart(3, '0')}`;
                          
                          let statusBadge = "Active";
                          let statusClass = "bg-blue-100 text-blue-800";
                          if (isProcessed) {
                            statusBadge = "Healthy";
                            statusClass = "bg-green-100 text-green-800";
                          } else if (farmStatus === 'PENDING') {
                            statusBadge = "Pending";
                            statusClass = "bg-yellow-100 text-yellow-800";
                          }

                          return (
                            <tr key={farmId || index} className="hover:bg-gray-50 transition-colors">
                              <td className="py-4 px-6 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{displayFieldId}</div>
                              </td>
                              <td className="py-4 px-6 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{farmerName}</div>
                              </td>
                              <td className="py-4 px-6 whitespace-nowrap">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Sprout className="h-4 w-4 text-green-500 flex-shrink-0" />
                                  <span>{cropType}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{area.toFixed(1)} ha</div>
                              </td>
                              <td className="py-4 px-6 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{season}</div>
                              </td>
                              <td className="py-4 px-6 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClass}`}>
                                  {statusBadge}
                                </span>
                              </td>
                              <td className="py-4 px-6 whitespace-nowrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedFieldForCropMonitoring(farm);
                                    setCropMonitoringViewMode("fieldDetail");
                                  }}
                                  className="border-green-600 text-green-600 hover:bg-green-50"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    // Show farmers list (default view)
    // Note: The 'farmers' array already contains only assigned farmers from getAssignedFarmers() API
    const filteredFarmers = farmers.filter((farmer: any) => {
      if (!cropMonitoringSearchQuery) return true;
      const searchLower = cropMonitoringSearchQuery.toLowerCase();
      const farmerName = 
        (farmer.name || 
        (farmer.firstName && farmer.lastName ? `${farmer.firstName} ${farmer.lastName}`.trim() : '') ||
        farmer.firstName || 
        farmer.lastName || 
        "").toLowerCase();
      const location = 
        (farmer.location || 
        (farmer.province && farmer.district ? `${farmer.province}, ${farmer.district}` : '') ||
        farmer.province ||
        farmer.district ||
        "").toLowerCase();
      return farmerName.includes(searchLower) || location.includes(searchLower);
    });

    return (
      <div className="min-h-screen bg-gray-50 pt-6 pb-8">
        <div className={`${sidebarCollapsed ? 'max-w-full' : 'max-w-7xl'} mx-auto px-6`}>
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Crop Monitoring</h1>
            <p className="text-gray-600 mt-1">Satellite-based crop health and NDVI analysis</p>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search farmers..."
                value={cropMonitoringSearchQuery}
                onChange={(e) => setCropMonitoringSearchQuery(e.target.value)}
                className="pl-10 bg-white border-gray-300"
              />
            </div>
            <Button 
              variant="outline" 
              className="bg-white border-gray-300"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Farmers Table */}
            <Card className={`${dashboardTheme.card}`}>
            <CardContent className="p-0">
              {farmersLoading ? (
                <div className="p-6">
                  <TableSkeleton rows={5} columns={4} />
                  </div>
              ) : filteredFarmers.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm font-medium text-gray-900 mb-1">No farmers found</p>
                  <p className="text-xs text-gray-500">Try adjusting your search criteria</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200">
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Farmer ID</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Farmer Name</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Location</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Total Fields</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredFarmers.map((farmer: any, index: number) => {
                        const farmerId = farmer._id || farmer.id;
                        const farmerIdKey = farmerId || `temp-${index}`;
                        const farmerFieldsList = farmerFields[farmerIdKey] || [];
                        const farmerName = 
                          farmer.name || 
                          (farmer.firstName && farmer.lastName ? `${farmer.firstName} ${farmer.lastName}`.trim() : '') ||
                          farmer.firstName || 
                          farmer.lastName || 
                          "Unknown";
                        const location = 
                          farmer.location || 
                          (farmer.province && farmer.district ? `${farmer.province}, ${farmer.district}` : '') ||
                          farmer.province ||
                          farmer.district ||
                          "N/A";
                        const displayFarmerId = farmerId ? `F-${String(farmerId).slice(-3).padStart(3, '0')}` : `F-${String(index + 1).padStart(3, '0')}`;

                        return (
                          <tr 
                            key={farmerIdKey}
                            onClick={() => {
                              setSelectedFarmerForCropMonitoring(farmer);
                              setCropMonitoringViewMode("farmerFields");
                              // Load farmer fields if not already loaded
                              if (farmerId && !farmerFields[farmerIdKey]?.length) {
                                loadFarmerFields(farmerId);
                              }
                            }}
                            className="hover:bg-gray-50/50 transition-all duration-150 border-b border-gray-100 cursor-pointer"
                          >
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{displayFarmerId}</div>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{farmerName}</div>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="h-4 w-4 text-green-500 flex-shrink-0" />
                                <span>{location}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{farmerFieldsList.length} Total Fields</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              </CardContent>
            </Card>
        </div>
      </div>
    );
  };

  const renderCropMonitoringOld = () => {
    // Show detail view if monitoring is selected
    if (cropMonitoringViewMode === "detail" && selectedMonitoring) {
      return (
        <div className="min-h-screen bg-gray-50 pt-6 pb-8">
          <div className={`${sidebarCollapsed ? 'max-w-full' : 'max-w-7xl'} mx-auto px-6`}>
            <div className="flex items-center gap-4 mb-6">
              <Button
                onClick={() => {
                  setCropMonitoringViewMode('monitoring');
                  setSelectedMonitoring(null);
                }}
                variant="outline"
                className="border-gray-300"
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
                    <span className="text-gray-600">Monitoring ID:</span>
                    <span className="text-gray-900 font-medium">{selectedMonitoring._id.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Policy ID:</span>
                    <span className="text-gray-900 font-medium">{selectedMonitoring.policyId.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Farm ID:</span>
                    <span className="text-gray-900 font-medium">{selectedMonitoring.farmId.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="text-gray-900 font-medium">
                      {new Date(selectedMonitoring.monitoringDate).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedMonitoring.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
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
                      <p className="text-gray-600 mb-2 font-medium">Observations:</p>
                      <ul className="list-disc list-inside text-gray-700 space-y-1">
                        {selectedMonitoring.observations.map((obs: string, idx: number) => (
                          <li key={idx} className="text-sm">{obs}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedMonitoring.notes && (
                    <div>
                      <p className="text-gray-600 mb-2 font-medium">Notes:</p>
                      <p className="text-gray-700 text-sm">{selectedMonitoring.notes}</p>
                    </div>
                  )}
                  {selectedMonitoring.photoUrls && selectedMonitoring.photoUrls.length > 0 && (
                    <div>
                      <p className="text-gray-600 mb-2 font-medium">Photos:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedMonitoring.photoUrls.map((url: string, idx: number) => (
                          <img key={idx} src={url} alt={`Photo ${idx + 1}`} className="rounded border" />
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedMonitoring.reportGenerated && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-green-800 text-sm">
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
        </div>
      );
    }

    // Show monitoring history view
    if (cropMonitoringViewMode === "monitoring") {
      return (
        <div className="min-h-screen bg-gray-50 pt-6 pb-8">
          <div className={`${sidebarCollapsed ? 'max-w-full' : 'max-w-7xl'} mx-auto px-6`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Monitoring History</h2>
              <Button 
                onClick={() => setCropMonitoringViewMode('policies')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                View Policies
              </Button>
                  </div>

            <Card className={`${dashboardTheme.card}`}>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200">
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase">Monitoring #</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase">Policy ID</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase">Date</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase">Status</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {monitoringHistory.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-gray-600">
                            No monitoring records found.
                          </td>
                        </tr>
                      ) : (
                        monitoringHistory.map((monitoring, index) => (
                          <tr
                            key={monitoring._id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="py-4 px-6 text-gray-900">{monitoring.monitoringNumber}</td>
                            <td className="py-4 px-6 text-gray-900">{monitoring.policyId.slice(-8)}</td>
                            <td className="py-4 px-6 text-gray-600">
                              {new Date(monitoring.monitoringDate).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                monitoring.status === 'COMPLETED'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {monitoring.status}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex gap-2">
                                {monitoring.status === 'IN_PROGRESS' && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setSelectedMonitoring(monitoring);
                                        setUpdateData({
                                          observations: monitoring.observations || [],
                                          photoUrls: monitoring.photoUrls || [],
                                          notes: monitoring.notes || ''
                                        });
                                        setUpdateDialogOpen(true);
                                      }}
                                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                    >
                                      Update
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleGenerateReport(monitoring._id)}
                                      disabled={generateReportLoading}
                                      className="bg-green-600 hover:bg-green-700 text-white text-xs"
                                    >
                                      {generateReportLoading ? 'Generating...' : 'Generate Report'}
                                    </Button>
                                  </>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMonitoring(monitoring);
                                    setCropMonitoringViewMode('detail');
                                  }}
                                  className="bg-gray-600 hover:bg-gray-700 text-white text-xs"
                                >
                                  View
                                </Button>
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
          </div>
        </div>
      );
    }

    // Show policies view (default)
    return (
      <div className="min-h-screen bg-gray-50 pt-6 pb-8">

        <div className={`${sidebarCollapsed ? 'max-w-full' : 'max-w-7xl'} mx-auto px-6`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Active Policies</h2>
            <Button 
              onClick={() => setCropMonitoringViewMode('monitoring')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              View Monitoring History
            </Button>
          </div>

          {cropMonitoringLoading ? (
            <Card className={`${dashboardTheme.card}`}>
              <CardContent className="p-12">
                <div className="flex items-center justify-center">
                  <img src="/loading.gif" alt="Loading" className="w-16 h-16" />
                  </div>
              </CardContent>
            </Card>
          ) : policies.length === 0 ? (
            <Card className={`${dashboardTheme.card}`}>
              <CardContent className="p-12">
                <div className="text-center text-gray-600">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
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
                          <span className="text-gray-600">Farmer:</span>
                          <span className="text-gray-900 font-medium">{farmerName}</span>
                  </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Crop Type:</span>
                          <span className="text-gray-900 font-medium">{policy.cropType || 'N/A'}</span>
                </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Monitoring Cycles:</span>
                          <span className="text-gray-900 font-medium">{monitoringCount}/2</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            policy.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
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
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-gray-400 text-white cursor-not-allowed'
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
                        <p className="text-xs text-yellow-600 text-center mt-2">
                          Maximum 2 monitoring cycles completed
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
            <DialogContent className={`${dashboardTheme.card}`}>
              <DialogHeader>
                <DialogTitle className="text-gray-900">Start Crop Monitoring</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <p className="text-gray-600">
                  Are you sure you want to start a new monitoring cycle for this policy?
                </p>
                {selectedPolicyId && (
                  <div className="text-sm text-gray-500">
                    Current cycles: {getMonitoringCount(selectedPolicyId)}/2
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
                  className="border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStartMonitoring}
                  disabled={startingMonitoring}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {startingMonitoring ? 'Starting...' : 'Start Monitoring'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Update Monitoring Dialog */}
          <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
            <DialogContent className={`${dashboardTheme.card} max-w-2xl`}>
              <DialogHeader>
                <DialogTitle className="text-gray-900">Update Monitoring Data</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="observations" className="text-gray-900">Observations</Label>
                  <Textarea
                    id="observations"
                    value={updateData.observations.join('\n')}
                    onChange={(e) => setUpdateData({
                      ...updateData,
                      observations: e.target.value.split('\n').filter(o => o.trim())
                    })}
                    placeholder="Enter observations (one per line)"
                    className="mt-1"
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="photoUrls" className="text-gray-900">Photo URLs</Label>
                  <Textarea
                    id="photoUrls"
                    value={updateData.photoUrls.join('\n')}
                    onChange={(e) => setUpdateData({
                      ...updateData,
                      photoUrls: e.target.value.split('\n').filter(u => u.trim())
                    })}
                    placeholder="Enter photo URLs (one per line)"
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="notes" className="text-gray-900">Notes</Label>
                  <Textarea
                    id="notes"
                    value={updateData.notes}
                    onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                    placeholder="Enter additional notes"
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setUpdateDialogOpen(false)}
                  className="border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateMonitoring}
                  disabled={updatingMonitoring}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {updatingMonitoring ? 'Updating...' : 'Update'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  };

  // Legacy render function (keeping for backward compatibility)
  const renderCropMonitoringLegacy = () => {
    if (cropMonitoringViewMode === "fieldDetail") {
      return renderCropMonitoringFieldDetail();
    }

    const unreadAlerts = alerts.filter(a => !a.read && !a.readAt);
    const highSeverityAlerts = alerts.filter(a => a.severity === 'high' || a.severity === 'critical');
    const farmsWithMonitoring = Object.keys(monitoringData).length;
    
    return (
      <div className="min-h-screen bg-gray-50 pt-6 pb-8">
        <div className={`${sidebarCollapsed ? 'max-w-full' : 'max-w-7xl'} mx-auto px-6`}>
          {/* Loading State */}
          {(alertsLoading || farmsLoading) && (
            <Card className={`${dashboardTheme.card}`}>
              <CardHeader>
                <CardTitle className="text-gray-900">Farmers and Farms Monitoring</CardTitle>
              </CardHeader>
              <CardContent className="p-12">
                <div className="flex items-center justify-center">
                  <img src="/loading.gif" alt="Loading" className="w-16 h-16" />
                </div>
              </CardContent>
            </Card>
          )}

          {!(alertsLoading || farmsLoading) && (
            <Card className={`${dashboardTheme.card}`}>
              <CardHeader>
                <CardTitle className="text-gray-900">Farmers and Farms Monitoring</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {farmers.length === 0 && farms.length === 0 ? (
                  <div className="p-12 text-center">
                    <Sprout className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 text-lg mb-2">No farmers or farms found</p>
                    <p className="text-gray-500 text-sm">There are no farmers or farms available for monitoring</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                          <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider w-10"></th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Farmer Name</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Location</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Total Farms</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Monitored Farms</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {farmers.map((farmer, index) => {
                          const farmerId = farmer._id || farmer.id;
                          if (!farmerId) return null;
                          
                          const farmerIdKey = farmerId.toString();
                          const isExpanded = expandedFarmers.has(farmerIdKey);
                          
                          // Get farms for this farmer
                          const farmerFarms = farms.filter(farm => {
                            const farmFarmerId = farm.farmerId?._id || farm.farmerId || farm.farmer?._id || farm.farmer?.id || farm.farmer || '';
                            return farmFarmerId.toString() === farmerIdKey;
                          });
                          
                          // Count monitored farms
                          const monitoredFarmsCount = farmerFarms.filter(farm => {
                            const farmId = farm._id || farm.id;
                            return monitoringData[farmId];
                          }).length;
                          
                          const farmerName = 
                            farmer.name || 
                            (farmer.firstName && farmer.lastName ? `${farmer.firstName} ${farmer.lastName}`.trim() : '') ||
                            farmer.firstName || 
                            farmer.lastName || 
                            "Unknown Farmer";
                          
                          const location = 
                            farmer.location || 
                            (farmer.province && farmer.district ? `${farmer.province}, ${farmer.district}` : '') ||
                            farmer.province ||
                            farmer.district ||
                            "N/A";

                          return (
                            <>
                              <tr
                                key={farmerIdKey}
                                className="hover:bg-gray-50/50 transition-all duration-150 border-b border-gray-100 cursor-pointer"
                                onClick={(e) => {
                                  // Only navigate if clicking on the row, not on the expand button
                                  if ((e.target as HTMLElement).closest('button')) {
                                    return; // Let the expand button handle its own click
                                  }
                                  // If farmer has farms, show the first farm's detail view
                                  if (farmerFarms.length > 0) {
                                    setSelectedFarmerForDetail(farmer);
                                    setSelectedFarmForDetail(farmerFarms[0]);
                                    setCropMonitoringViewMode("fieldDetail");
                                    setActiveTab("basic-info");
                                  }
                                }}
                              >
                                <td className="py-4 px-6 whitespace-nowrap">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (farmerId) {
                                        toggleFarmerExpansion(farmerId.toString());
                                        if (!isExpanded && farmerFarms.length > 0) {
                                          // Load fields if not already loaded
                                          if (!farmerFields[farmerIdKey] || farmerFields[farmerIdKey].length === 0) {
                                            loadFarmerFields(farmerId.toString());
                                          }
                                        }
                                      }
                                    }}
                                    className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-200 transition-colors"
                                    disabled={!farmerId || farmerFarms.length === 0}
                                  >
                                    {farmerFarms.length > 0 ? (
                                      isExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-gray-600" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-gray-600" />
                                      )
                                    ) : (
                                      <span className="w-4 h-4"></span>
                                    )}
                                  </button>
                                </td>
                                <td className="py-4 px-6 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{farmerName}</div>
                                </td>
                                <td className="py-4 px-6 whitespace-nowrap">
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MapPin className="h-4 w-4 text-green-500 flex-shrink-0" />
                                    <span className="truncate max-w-[200px]">{location}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-6 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 font-medium">{farmerFarms.length}</div>
                                </td>
                                <td className="py-4 px-6 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                      <Monitor className="h-3 w-3 mr-1" />
                                      {monitoredFarmsCount}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                              {isExpanded && farmerFarms.length > 0 && (
                                <tr key={`${farmerIdKey}-farms`}>
                                  <td colSpan={5} className="px-0 py-0 bg-gray-50">
                                    <div className="px-6 py-4">
                                      <div className="overflow-x-auto">
                                        <table className="w-full">
                                          <thead>
                                            <tr className="bg-white border-b border-gray-200">
                                              <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs uppercase">Farm Name</th>
                                              <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs uppercase">Crop Type</th>
                                              <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs uppercase">Area (ha)</th>
                                              <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs uppercase">Status</th>
                                              <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs uppercase">Actions</th>
                                            </tr>
                                          </thead>
                                          <tbody className="bg-white divide-y divide-gray-100">
                                            {farmerFarms.map((farm, farmIndex) => {
                                              const farmId = farm._id || farm.id || farmIndex;
                                              const hasMonitoring = monitoringData[farmId];
                                              const farmAlerts = alerts.filter(a => {
                                                const alertFarmId = a.farmId?._id || a.farmId || a.farmId;
                                                return alertFarmId?.toString() === farmId.toString();
                                              });
                                              const unreadFarmAlerts = farmAlerts.filter(a => !a.read && !a.readAt);
                                              
                                              return (
                                                <tr
                                                  key={farmId}
                                                  className="hover:bg-gray-50/50 transition-all duration-150"
                                                >
                                                  <td className="py-3 px-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{farm.name || "Unnamed Farm"}</div>
                                                  </td>
                                                  <td className="py-3 px-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                      <Leaf className="h-4 w-4 text-teal-500 flex-shrink-0" />
                                                      <span>{farm.cropType || farm.crop || "N/A"}</span>
                                                    </div>
                                                  </td>
                                                  <td className="py-3 px-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-600">
                                                      {farm.area ? `${Math.round(farm.area)} ha` : farm.size ? `${Math.round(farm.size)} ha` : "N/A"}
                                                    </div>
                                                  </td>
                                                  <td className="py-3 px-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                      {hasMonitoring ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                                          <Monitor className="h-3 w-3 mr-1" />
                                                          Monitored
                                                        </span>
                                                      ) : (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                                                          Not Monitored
                                                        </span>
                                                      )}
                                                      {unreadFarmAlerts.length > 0 && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                                          {unreadFarmAlerts.length} Alert{unreadFarmAlerts.length > 1 ? 's' : ''}
                                                        </span>
                                                      )}
                                                    </div>
                                                  </td>
                                                  <td className="py-3 px-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                      <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                          setSelectedFarmForMonitoring(farmId.toString());
                                                          loadFarmMonitoring(farmId.toString());
                                                          if (farmAlerts.length > 0) {
                                                            loadAlerts(farmId.toString());
                                                          }
                                                        }}
                                                        className="border-green-600 text-green-600 hover:bg-green-50 !rounded-none"
                                                      >
                                                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                                                        View
                                                      </Button>
                                                    </div>
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Alerts Section */}
          {!alertsLoading && alerts.length > 0 && (
            <Card className={`${dashboardTheme.card} mt-6`}>
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Recent Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert, index) => {
                    const alertId = alert._id || alert.id || index;
                    const isRead = alert.read || alert.readAt;
                    const severity = alert.severity || alert.level || 'medium';
                    
                    return (
                      <div
                        key={alertId}
                        className={`p-4 rounded-lg border ${
                          isRead 
                            ? 'bg-gray-50 border-gray-200' 
                            : severity === 'high' || severity === 'critical'
                            ? 'bg-red-50 border-red-200'
                            : severity === 'medium'
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">{alert.title || alert.message || 'Alert'}</h4>
                              {!isRead && (
                                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">New</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{alert.message || alert.description || 'No description'}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {alert.farmId && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  Farm: {alert.farmId}
                                </span>
                              )}
                              {alert.createdAt && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(alert.createdAt).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          {!isRead && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAlertAsRead(alertId.toString())}
                              className="ml-4"
                            >
                              Mark as Read
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Farm Monitoring Detail - Show when farm is selected */}
          {selectedFarmForMonitoring && monitoringData[selectedFarmForMonitoring] && (
            <Card className={`${dashboardTheme.card} mt-6`}>
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-green-500" />
                  Monitoring Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monitoringLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <img src="/loading.gif" alt="Loading" className="w-16 h-16" />
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-auto max-h-96">
                      {JSON.stringify(monitoringData[selectedFarmForMonitoring], null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  };

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "risk-assessments", label: "Risk Assessment", icon: Shield },
    { id: "loss-assessments", label: "Loss Assessment", icon: AlertCircle },
    { id: "farmers", label: "Farmers", icon: Users },
    { id: "crop-monitoring", label: "Crop Monitoring", icon: Monitor },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "profile-settings", label: "Profile Settings", icon: User }
  ];

  // Get display name from profile if available
  const displayName = assessorProfile 
    ? (assessorProfile.firstName && assessorProfile.lastName 
        ? `${assessorProfile.firstName} ${assessorProfile.lastName}`.trim()
        : assessorProfile.name || assessorProfile.firstName || assessorProfile.lastName || assessorName)
    : assessorName;

  return (
    <DashboardLayout
      userType="assessor"
      userId={assessorId}
      userName={displayName}
      navigationItems={navigationItems}
      activePage={activePage} 
      onPageChange={handlePageChange}
      onLogout={() => {
        // Clear localStorage and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        localStorage.removeItem('phoneNumber');
        localStorage.removeItem('email');
        window.location.href = '/role-selection';
      }}
    >
      {renderPage()}

      {/* Upload KML Modal */}
      {showUploadModal && selectedFieldForUpload && (
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedFieldsForProcessing.size > 0 
                  ? `Upload Field Contours (${selectedFieldsForProcessing.size} field${selectedFieldsForProcessing.size > 1 ? 's' : ''})`
                  : "Upload Field Contours"}
              </DialogTitle>
              <DialogDescription>
                {selectedFieldsForProcessing.size > 0
                  ? `Upload KML or KMZ files for ${selectedFieldsForProcessing.size} selected field${selectedFieldsForProcessing.size > 1 ? 's' : ''}. Files will be processed simultaneously.`
                  : `Upload KML or KMZ file with field boundaries for ${selectedFieldForUpload?.cropType || "this field"}`}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="farmName" className="text-gray-900">Farm Name *</Label>
                <Input
                  id="farmName"
                  type="text"
                  value={kmlUploadName}
                  onChange={(e) => setKmlUploadName(e.target.value)}
                  placeholder="Enter farm name"
                  className="mt-1 bg-gray-50 border-gray-300 text-gray-900"
                  disabled={uploadingFile}
                />
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-700 mb-2 font-medium">
                  {selectedFieldsForProcessing.size > 0 
                    ? `Drag-and-drop here or select ${selectedFieldsForProcessing.size} file${selectedFieldsForProcessing.size > 1 ? 's' : ''}`
                    : "Drag-and-drop here or select files"}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  {selectedFieldsForProcessing.size > 0
                    ? `with field contours for ${selectedFieldsForProcessing.size} selected field${selectedFieldsForProcessing.size > 1 ? 's' : ''}. Files will be processed simultaneously.`
                    : "with the field contours for the upload to start"}
                </p>
                <input
                  type="file"
                  id="kml-upload"
                  className="hidden"
                  accept=".kml,.kmz"
                  multiple={selectedFieldsForProcessing.size > 0}
                  onChange={handleFileSelect}
                  disabled={uploadingFile || processingFields.size > 0}
                />
                <Button
                  onClick={() => document.getElementById('kml-upload')?.click()}
                  disabled={uploadingFile || processingFields.size > 0}
                  className="bg-green-600 hover:bg-green-700 text-white !rounded-none"
                >
                  {uploadingFile || processingFields.size > 0 ? (
                    <img src="/loading.gif" alt="Loading" className="w-4 h-4" />
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {selectedFieldsForProcessing.size > 0 ? `SELECT FILES (${selectedFieldsForProcessing.size} field${selectedFieldsForProcessing.size > 1 ? 's' : ''})` : 'SELECT FILES'}
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-4">
                  Supported formats: .kml, .kmz (Max size: 1MB)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFieldForUpload(null);
                }}
                disabled={uploadingFile}
                className="!rounded-none"
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* KML Viewer Dialog */}
      {showKMLViewer && kmlViewerFarm && (
        <Dialog open={showKMLViewer} onOpenChange={setShowKMLViewer}>
          <DialogContent className="max-w-6xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Field Boundary Map (KML)</DialogTitle>
              <DialogDescription>
                Viewing field boundary for {kmlViewerFarm.name || "Field"}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <LeafletMap
                center={(() => {
                  if (kmlViewerFarm?.location?.coordinates) {
                    const coords = kmlViewerFarm.location.coordinates;
                    return [coords[1], coords[0]]; // [lat, lng] from [lng, lat]
                  }
                  return [-1.9441, 30.0619];
                })()}
                zoom={15}
                height="600px"
                tileLayer="satellite"
                showControls={true}
                className="w-full"
                boundary={kmlViewerFarm?.boundary || null}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

    </DashboardLayout>
  );
}

