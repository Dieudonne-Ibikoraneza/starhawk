import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardTheme } from "@/utils/dashboardTheme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import DashboardLayout from "../layout/DashboardLayout";
import { getUserId, getPhoneNumber, getEmail } from "@/services/authAPI";
import { getUserProfile, updateUserProfile, getInsurers } from "@/services/usersAPI";
import { getFarms, getAllFarms, createFarm, createInsuranceRequest, getFarmById, getWeatherForecast, getHistoricalWeather, getVegetationStats } from "@/services/farmsApi";
import RwandaLocationSelector from "@/components/common/RwandaLocationSelector";
import { API_BASE_URL, getAuthToken } from "@/config/api";
import { getClaims, createClaim } from "@/services/claimsApi";
import { getPolicies } from "@/services/policiesApi";
import assessmentsApiService from "@/services/assessmentsApi";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  FileText, Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  Settings,
  Camera,
  Crop,
  BarChart3,
  Plus,
  ArrowLeft,
  Save,
  Shield,
  Eye,
  TrendingUp,
  CloudRain,
  Droplets,
  Thermometer,
  Wind,
  X,
  Sun,
  MapPin,
  Leaf,
  Building2,
  List
} from "lucide-react";
import MyFarmsTab from "../farmer/tabs/MyFarmsTab";
import InsurersTab from "../farmer/tabs/InsurersTab";
import InsuranceTab from "../farmer/tabs/InsuranceTab";
import ReportsTab from "../farmer/tabs/ReportsTab";
import MonitoringTab from "../farmer/tabs/MonitoringTab";
import FarmDetailsTab from "../farmer/tabs/FarmDetailsTab";
import PolicyDetailsTab from "../farmer/tabs/PolicyDetailsTab";
import NotificationsTab from "../farmer/tabs/NotificationsTab";
import RegisterFarmTab from "../farmer/tabs/RegisterFarmTab";
import { 
  LineChart, 
  Line,
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ComposedChart
} from "recharts";

export default function FarmerDashboard() {
  const { toast } = useToast();
  const [activePage, setActivePage] = useState("dashboard");
  
  // Get logged-in farmer data from localStorage
  const farmerId = getUserId() || "";
  const farmerPhone = getPhoneNumber() || "";
  const farmerEmail = getEmail() || "";
  const farmerName = farmerEmail || farmerPhone || "Farmer";
  
  // State for My Fields page
  const [farms, setFarms] = useState<any[]>([]);
  const [farmsLoading, setFarmsLoading] = useState(false);
  const [farmsError, setFarmsError] = useState<string | null>(null);
  
  // State for Reports page
  const [claims, setClaims] = useState<any[]>([]);
  const [riskAssessments, setRiskAssessments] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  
  // State for Loss Reports (Assessments)
  const [lossReports, setLossReports] = useState<any[]>([]);
  
  // State for Create Farm Page
  const [isCreating, setIsCreating] = useState(false);
  const [newFieldData, setNewFieldData] = useState({
    cropType: "",
    sowingDate: "",
    insurerId: ""
  });
  
  // State for Insurers
  const [insurers, setInsurers] = useState<any[]>([]);
  const [insurersLoading, setInsurersLoading] = useState(false);
  
  // State for File Claim Page
  const [policies, setPolicies] = useState<any[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [claimFormData, setClaimFormData] = useState({
    policyId: "",
    lossEventType: "",
    lossDescription: "",
    damagePhotos: [] as string[],
    eventDate: "",
    estimatedLoss: ""
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // State for Insurance Request
  const [insuranceRequestDialog, setInsuranceRequestDialog] = useState({
    open: false,
    farmId: "",
    farmName: "",
    insurerId: ""
  });
  const [insuranceRequestNotes, setInsuranceRequestNotes] = useState("");
  const [isRequestingInsurance, setIsRequestingInsurance] = useState(false);

  const [selectedFarm, setSelectedFarm] = useState<any | null>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [selectedInsurerId, setSelectedInsurerId] = useState<string | null>(null);
  const [selectedInsurerName, setSelectedInsurerName] = useState<string | null>(null);
  const [farmDetailsLoading, setFarmDetailsLoading] = useState(false);

  // State for Farm Analytics
  const [farmAnalytics, setFarmAnalytics] = useState<{
    weatherForecast: any;
    historicalWeather: any;
    vegetationStats: any;
    loading: boolean;
  }>({
    weatherForecast: null,
    historicalWeather: null,
    vegetationStats: null,
    loading: false
  });

  // State for Profile
  const [farmerProfile, setFarmerProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // State for Profile Form (from registration page)
  const [profileStep, setProfileStep] = useState(1);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    fullName: "",
    gender: "",
    nationalId: "",
    phoneNumber: "",
    email: "",
    province: "",
    district: "",
    sector: "",
    cell: "",
    village: ""
  });
  const [selectedLocation, setSelectedLocation] = useState<{
    province: any;
    district: any;
    sector: any;
    village: any;
    cell: any;
  }>({
    province: null,
    district: null,
    sector: null,
    village: null,
    cell: null
  });

  const toDisplayText = (value: any, fallback: string = "N/A"): string => {
    if (value === null || value === undefined || value === "") return fallback;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    if (Array.isArray(value)) {
      return value.map((item) => toDisplayText(item, "")).filter(Boolean).join(", ") || fallback;
    }
    if (typeof value === "object") {
      if (typeof value.name === "string" && value.name.trim()) return value.name;
      if (typeof value.label === "string" && value.label.trim()) return value.label;
      if (typeof value.title === "string" && value.title.trim()) return value.title;
      if (typeof value._id === "string" && value._id.trim()) return value._id;
      if (typeof value.id === "string" && value.id.trim()) return value.id;
      return fallback;
    }
    return fallback;
  };

  const formatLocation = (farmOrLocation: any, coordinates?: any): string => {
    if (farmOrLocation && farmOrLocation.locationName) return farmOrLocation.locationName;
    if (farmOrLocation && farmOrLocation.location?.name) return farmOrLocation.location.name;
    
    const locCoords = farmOrLocation?.location?.coordinates || farmOrLocation?.coordinates || farmOrLocation?.locationCoordinates;
    if (Array.isArray(locCoords) && locCoords.length >= 2) {
      return `${locCoords[1]?.toFixed(4)}, ${locCoords[0]?.toFixed(4)}`;
    }
    if (Array.isArray(coordinates) && coordinates.length >= 2) {
      return `${coordinates[1]?.toFixed(4)}, ${coordinates[0]?.toFixed(4)}`;
    }
    return toDisplayText(farmOrLocation, "N/A");
  };

  const toNumber = (value: any, fallback: number = 0): number => {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const formatApiDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  
  // Load data for dashboard and pages
  useEffect(() => {
    loadFarms();
    loadAllReports();
    loadFarmerProfile();
    fetchInsurers();
  }, []);

  const fetchInsurers = async () => {
    setInsurersLoading(true);
    try {
      const response = await getInsurers(0, 100);
      setInsurers(response.items || []);
    } catch (err) {
      console.error('Failed to fetch insurers:', err);
    } finally {
      setInsurersLoading(false);
    }
  };

  useEffect(() => {
    if (farmerId) {
      if (activePage === "dashboard") {
        loadFarms(false);
        loadAllReports();
      } else if (activePage === "my-fields") {
        loadFarms();
      } else if (activePage === "reports") {
        loadAllReports();
      } else if (activePage === "loss-reports") {
        loadAllReports();
      } else if (activePage === "file-claim") {
        loadPolicies();
      } else if (activePage === "profile") {
        loadFarmerProfile();
      }
    }
  }, [activePage, farmerId]);

  const loadFarmerProfile = async () => {
    if (profileLoading) return;
    setProfileLoading(true);
    try {
      const profile = await getUserProfile();
      const profileData = profile.data || profile;
      setFarmerProfile(profileData);
      
      // Pre-populate form data if profile exists
      if (profileData) {
        const firstName = profileData.firstName || "";
        const lastName = profileData.lastName || "";
        const fullName = profileData.name || `${firstName} ${lastName}`.trim() || "";
        
        setProfileFormData({
          fullName: fullName,
          gender: profileData.sex || profileData.gender || "",
          nationalId: profileData.nationalId || "",
          phoneNumber: profileData.phoneNumber || farmerPhone || "",
          email: profileData.email || farmerEmail || "",
          province: profileData.province || profileData.farmerProfile?.farmProvince || "",
          district: profileData.district || profileData.farmerProfile?.farmDistrict || "",
          sector: profileData.sector || profileData.farmerProfile?.farmSector || "",
          cell: profileData.cell || profileData.farmerProfile?.farmCell || "",
          village: profileData.village || profileData.farmerProfile?.farmVillage || ""
        });
      }
    } catch (err: any) {
      console.error('Failed to load farmer profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };
  
  const handleProfileInputChange = (field: keyof typeof profileFormData, value: string) => {
    setProfileFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProfile(true);
    
    try {
      const updateData: any = {
        firstName: profileFormData.fullName.split(' ')[0] || profileFormData.fullName,
        lastName: profileFormData.fullName.split(' ').slice(1).join(' ') || "",
        name: profileFormData.fullName,
        sex: profileFormData.gender,
        nationalId: profileFormData.nationalId,
        phoneNumber: profileFormData.phoneNumber,
        email: profileFormData.email,
        province: profileFormData.province,
        district: profileFormData.district,
        sector: profileFormData.sector,
        cell: profileFormData.cell,
        village: profileFormData.village,
        farmerProfile: {
          farmProvince: profileFormData.province,
          farmDistrict: profileFormData.district,
          farmSector: profileFormData.sector,
          farmCell: profileFormData.cell,
          farmVillage: profileFormData.village
        }
      };
      
      await updateUserProfile(updateData);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      
      // Reload profile to reflect changes
      await loadFarmerProfile();
      setProfileStep(1);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingProfile(false);
    }
  };
  
  const isProfileStep1Valid = profileFormData.fullName && profileFormData.gender && profileFormData.nationalId && profileFormData.phoneNumber;
  const isProfileStep2Valid = selectedLocation.province && selectedLocation.district && selectedLocation.sector && selectedLocation.village && selectedLocation.cell;
  
  const loadFarms = async (showErrorToast: boolean = true) => {
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
          if (showErrorToast) {
            toast({
              title: 'Data Loading Issue',
              description: `The API reports ${response.data.totalItems} farms but none are being returned. This may be a server-side issue.`,
              variant: 'destructive'
            });
          }
        } else {
        console.log('No farms found. This could mean:');
        console.log('1. The farmer has no farms assigned');
        console.log('2. The API is filtering by farmer and this farmer has no farms');
        console.log('3. There might be a pagination issue');
        }
      }
    } catch (err: any) {
      console.error('Failed to load farms:', err);
      setFarmsError(err.message || 'Failed to load farms');
      if (showErrorToast) {
        toast({
          title: 'Error loading farms',
          description: err.message || 'Failed to load farms',
          variant: 'destructive'
        });
      }
    } finally {
      setFarmsLoading(false);
    }
  };
  
  const loadAllReports = async () => {
    setReportsLoading(true);
    setReportsError(null);
    try {
      // Load claims and assessments in parallel
      const [claimsResponse, assessmentsResponse] = await Promise.allSettled([
        getClaims(1, 100),
        assessmentsApiService.getAllAssessments()
      ]);
      
      // Process claims
      let claimsArray: any[] = [];
      if (claimsResponse.status === 'fulfilled') {
        const claimsData = claimsResponse.value.data || claimsResponse.value || [];
        const allClaims = Array.isArray(claimsData) ? claimsData : (claimsData.items || claimsData.results || []);
        
        // Filter claims by the logged-in farmer
        claimsArray = allClaims.filter((claim: any) => {
          const claimFarmerId = claim.farmerId?._id || claim.farmerId || claim.farmer?._id || claim.farmer;
          return claimFarmerId === farmerId || claimFarmerId === farmerId.toString();
        });
      }
      
      // Process assessments
      let assessmentsArray: any[] = [];
      if (assessmentsResponse.status === 'fulfilled') {
        const response = assessmentsResponse.value;
        let assessmentsData: any[] = [];
        
        if (Array.isArray(response)) {
          assessmentsData = response;
        } else if (response && typeof response === 'object') {
          assessmentsData = response.data || response.assessments || [];
        }
        
        // Filter assessments for this farmer (both risk and claim assessments)
        assessmentsArray = assessmentsData.filter((assessment: any) => {
          const assessmentFarmerId = 
            assessment.farmerId?._id || 
            assessment.farmerId || 
            assessment.farm?.farmerId?._id || 
            assessment.farm?.farmerId ||
            assessment.farm?.farmer?._id ||
            assessment.farm?.farmer;
          
          return assessmentFarmerId === farmerId || assessmentFarmerId === farmerId.toString();
        });
      }
      
      setClaims(claimsArray);
      setRiskAssessments(assessmentsArray);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
      setReportsError(err.message || 'Failed to load reports');
      toast({
        title: 'Error loading reports',
        description: err.message || 'Failed to load reports',
        variant: 'destructive'
      });
    } finally {
      setReportsLoading(false);
    }
  };
  
  const loadClaims = async () => {
    try {
      const response: any = await getClaims(1, 100);
      const claimsData = response.data || response || [];
      const claimsArray = Array.isArray(claimsData) ? claimsData : (claimsData.items || claimsData.results || []);
      
      // Filter claims by the logged-in farmer
      const farmerClaims = claimsArray.filter((claim: any) => {
        const claimFarmerId = claim.farmerId?._id || claim.farmerId || claim.farmer?._id || claim.farmer;
        return claimFarmerId === farmerId || claimFarmerId === farmerId.toString();
      });
      
      setClaims(farmerClaims);
    } catch (err: any) {
      console.error('Failed to load claims:', err);
      setClaims([]);
    }
  };

  const loadLossReports = async () => {
    try {
      const response: any = await assessmentsApiService.getAllAssessments();
      let assessmentsData: any[] = [];
      
      if (Array.isArray(response)) {
        assessmentsData = response;
      } else if (response && typeof response === 'object') {
        assessmentsData = response.data || response.assessments || [];
      }
      
      // Filter for claim assessments for this farmer
      const farmerLossReports = assessmentsData.filter((assessment: any) => {
        // Check if it's a claim assessment
        const isClaimAssessment = assessment.type === "Claim Assessment" || assessment.type === "claim-assessment";
        
        // Check if it belongs to this farmer
        const assessmentFarmerId = 
          assessment.farmerId?._id || 
          assessment.farmerId || 
          assessment.farm?.farmerId?._id || 
          assessment.farm?.farmerId ||
          assessment.farm?.farmer?._id ||
          assessment.farm?.farmer;
        
        return isClaimAssessment && (assessmentFarmerId === farmerId || assessmentFarmerId === farmerId.toString());
      });
      
      setLossReports(farmerLossReports);
    } catch (err: any) {
      console.error('Failed to load loss reports:', err);
      setLossReports([]);
    }
  };

  const loadPolicies = async () => {
    setPoliciesLoading(true);
    try {
      const response: any = await getPolicies(1, 100);
      const policiesData = response.data || response || [];
      const policiesArray = Array.isArray(policiesData) ? policiesData : (policiesData.items || policiesData.results || []);
      
      // Filter policies for the logged-in farmer
      const farmerPolicies = policiesArray.filter((policy: any) => {
        const policyFarmerId = policy.farmerId?._id || policy.farmerId || policy.farmer?._id || policy.farmer;
        return policyFarmerId === farmerId || policyFarmerId === farmerId.toString();
      });
      
      setPolicies(farmerPolicies);
    } catch (err: any) {
      console.error('Failed to load policies:', err);
      toast({
        title: 'Error loading policies',
        description: err.message || 'Failed to load policies',
        variant: 'destructive'
      });
    } finally {
      setPoliciesLoading(false);
    }
  };

  // Handle Insurance Request
  const handleRequestInsurance = async () => {
    if (!insuranceRequestDialog.farmId) return;

    setIsRequestingInsurance(true);
    try {
      await createInsuranceRequest(
        insuranceRequestDialog.farmId,
        insuranceRequestNotes || undefined,
        insuranceRequestDialog.insurerId && insuranceRequestDialog.insurerId !== "none" ? insuranceRequestDialog.insurerId : undefined
      );

      toast({
        title: 'Success',
        description: 'Insurance request submitted successfully! An insurer will review your request.',
      });

      // Close dialog and reset
      setInsuranceRequestDialog({ open: false, farmId: null, farmName: "" });
      setInsuranceRequestNotes("");
      
      // Reload farms to update status
      await loadFarms();
    } catch (err: any) {
      console.error('Failed to request insurance:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to submit insurance request',
        variant: 'destructive'
      });
    } finally {
      setIsRequestingInsurance(false);
    }
  };

  // Load Farm Details
  const loadFarmDetails = async (farmId: string) => {
    setFarmDetailsLoading(true);
    try {
      const farm = await getFarmById(farmId);
      setSelectedFarm(farm.data || farm);
      setActivePage("farm-details");
    } catch (err: any) {
      console.error('Failed to load farm details:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to load farm details',
        variant: 'destructive'
      });
    } finally {
      setFarmDetailsLoading(false);
    }
  };

  // Load Farm Analytics
  const loadFarmAnalytics = async (farmId: string) => {
    setFarmAnalytics({ ...farmAnalytics, loading: true });
    try {
      const now = new Date();
      // Set to yesterday to avoid timezone issues with AgroMonitoring API 'end can not be after now'
      const yesterdayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12, 0, 0);
      const endDate = formatApiDate(yesterdayLocal);
      const startDate = formatApiDate(new Date(yesterdayLocal.getTime() - 30 * 24 * 60 * 60 * 1000));
      const historicalStartDate = formatApiDate(new Date(yesterdayLocal.getTime() - 365 * 24 * 60 * 60 * 1000));

      const [forecast, historical, stats] = await Promise.all([
        getWeatherForecast(farmId, startDate, endDate).catch(() => null),
        getHistoricalWeather(farmId, historicalStartDate, endDate).catch(() => null),
        getVegetationStats(farmId, startDate, endDate).catch(() => null)
      ]);

      setFarmAnalytics({
        weatherForecast: forecast,
        historicalWeather: historical,
        vegetationStats: stats,
        loading: false
      });
    } catch (err: any) {
      console.error('Failed to load farm analytics:', err);
      setFarmAnalytics({ ...farmAnalytics, loading: false });
    }
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Validate file types
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid File Type',
          description: `${file.name} is not a valid image. Please upload JPG, PNG, or WEBP files.`,
          variant: 'destructive'
        });
        return false;
      }
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: `${file.name} is too large. Maximum size is 10MB.`,
          variant: 'destructive'
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Check total files limit (max 10 photos)
    if (uploadedFiles.length + validFiles.length > 10) {
      toast({
        title: 'Too Many Files',
        description: 'Maximum 10 photos allowed. Please remove some photos first.',
        variant: 'destructive'
      });
      return;
    }

    setUploadingPhotos(true);
    try {
      // Convert files to base64
      const base64Promises = validFiles.map(file => fileToBase64(file));
      const base64Strings = await Promise.all(base64Promises);
      
      // Add to uploaded files and photo URLs
      setUploadedFiles(prev => [...prev, ...validFiles]);
      setClaimFormData(prev => ({
        ...prev,
        damagePhotos: [...prev.damagePhotos, ...base64Strings]
      }));
      
      toast({
        title: 'Success',
        description: `${validFiles.length} photo(s) uploaded successfully`,
      });
    } catch (err: any) {
      console.error('Failed to process files:', err);
      toast({
        title: 'Error',
        description: 'Failed to process uploaded files',
        variant: 'destructive'
      });
    } finally {
      setUploadingPhotos(false);
      // Reset file input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  // Remove uploaded photo
  const handleRemovePhoto = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setClaimFormData(prev => ({
      ...prev,
      damagePhotos: prev.damagePhotos.filter((_, i) => i !== index)
    }));
  };

  const upsertCreatedFarm = (farmResponse: any) => {
    if (!farmResponse) return;
    const createdFarm = typeof farmResponse === 'object'
      ? (farmResponse.data || farmResponse)
      : null;
    if (!createdFarm || typeof createdFarm !== 'object') return;

    const farmId = createdFarm._id || createdFarm.id || createdFarm.uuid || createdFarm.farmId;
    const normalizedFarm = {
      status: createdFarm.status || 'REGISTERED',
      ...createdFarm,
      _tempId: farmId ? undefined : `temp-${Date.now()}`
    };

    setFarms(prev => {
      if (!prev || prev.length === 0) {
        return [normalizedFarm];
      }

      const identifier = farmId || normalizedFarm._tempId;
      if (!identifier) {
        return [normalizedFarm, ...prev];
      }

      const updated = prev.some(f => {
        const existingId = f._id || f.id || f.uuid || f.farmId || f._tempId;
        return existingId && existingId === identifier;
      })
        ? prev.map(f => {
            const existingId = f._id || f.id || f.uuid || f.farmId || f._tempId;
            return existingId === identifier ? { ...f, ...normalizedFarm } : f;
          })
        : [normalizedFarm, ...prev];

      return updated;
    });
  };

  const normalizeBoundaryCoordinates = (rawInput: string): number[][][] => {
    if (!rawInput?.trim()) {
      throw new Error('Boundary coordinates are required');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawInput);
    } catch {
      throw new Error('Boundary coordinates must be valid JSON.');
    }

    let coordinates = parsed;
    if (parsed?.type === 'Polygon' && Array.isArray(parsed.coordinates)) {
      coordinates = parsed.coordinates;
    }

    if (!Array.isArray(coordinates)) {
      throw new Error('Boundary coordinates must be an array of coordinate rings.');
    }

    if (coordinates.length === 0) {
      throw new Error('At least one ring is required.');
    }

    coordinates.forEach((ring: any, ringIndex: number) => {
      if (!Array.isArray(ring) || ring.length < 4) {
        throw new Error(`Ring ${ringIndex + 1} must contain at least 4 points.`);
      }

      ring.forEach((point: any, pointIndex: number) => {
        if (
          !Array.isArray(point) ||
          point.length < 2 ||
          typeof point[0] !== 'number' ||
          typeof point[1] !== 'number'
        ) {
          throw new Error(`Invalid coordinate at ring ${ringIndex + 1}, point ${pointIndex + 1}.`);
        }
      });
    });

    return coordinates as number[][][];
  };

  const handleBoundaryInputChange = (value: string) => {
    setNewFieldData(prev => ({ ...prev, boundaryCoordinates: value }));

    if (!value.trim()) {
      setBoundaryError(null);
      setBoundaryStats(null);
      return;
    }

    try {
      const coordinates = normalizeBoundaryCoordinates(value);
      setBoundaryError(null);

      let pointCount = 0;
      coordinates.forEach(ring => {
        if (Array.isArray(ring)) {
          ring.forEach(point => {
            if (Array.isArray(point) && point.length >= 2) {
              pointCount += 1;
            }
          });
        }
      });

      setBoundaryStats({
        rings: coordinates.length,
        points: pointCount
      });
    } catch (err: any) {
      setBoundaryError(err.message || 'Invalid boundary coordinates');
      setBoundaryStats(null);
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!claimFormData.policyId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a policy',
        variant: 'destructive'
      });
      return;
    }
    
    if (!claimFormData.lossEventType) {
      toast({
        title: 'Validation Error',
        description: 'Please select a loss event type',
        variant: 'destructive'
      });
      return;
    }
    
    if (!claimFormData.lossDescription) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a loss description',
        variant: 'destructive'
      });
      return;
    }

    if (!claimFormData.eventDate) {
      toast({
        title: 'Validation Error',
        description: 'Event date is required',
        variant: 'destructive'
      });
      return;
    }

    if (!claimFormData.estimatedLoss || isNaN(parseFloat(claimFormData.estimatedLoss))) {
      toast({
        title: 'Validation Error',
        description: 'Estimated loss is required and must be a valid number',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmittingClaim(true);
    try {
      const claimData: any = {
        policyId: claimFormData.policyId,
        eventType: claimFormData.lossEventType.toUpperCase(),
        eventDate: new Date(claimFormData.eventDate).toISOString(),
        description: claimFormData.lossDescription,
        estimatedLoss: parseFloat(claimFormData.estimatedLoss),
        damagePhotos: claimFormData.damagePhotos || []
      };
      
      await createClaim(claimData);
      
      toast({
        title: 'Success',
        description: 'Claim filed successfully!',
      });
      
      // Reset form
      setClaimFormData({
        policyId: "",
        lossEventType: "",
        lossDescription: "",
        damagePhotos: [],
        eventDate: "",
        estimatedLoss: ""
      });
      setUploadedFiles([]);
      
      // Navigate to loss reports to see the new claim
      setActivePage("loss-reports");
      loadAllReports();
    } catch (err: any) {
      console.error('Failed to file claim:', err);
      toast({
        title: 'Error filing claim',
        description: err.message || 'Failed to file claim',
        variant: 'destructive'
      });
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  // Validate sowing date is at least 14 days in the future
  const validateSowingDate = (date: string): { valid: boolean; error?: string } => {
    if (!date) {
      return { valid: true }; // Date is optional
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 14);
    
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < minDate) {
      return {
        valid: false,
        error: `Sowing date must be at least 14 days in the future. Minimum date: ${minDate.toISOString().split('T')[0]}`
      };
    }
    
    return { valid: true };
  };

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newFieldData.cropType) {
      toast({
        title: 'Validation Error',
        description: 'Crop type is required',
        variant: 'destructive'
      });
      return;
    }

    // Validate sowing date if provided
    if (newFieldData.sowingDate) {
      const dateValidation = validateSowingDate(newFieldData.sowingDate);
      if (!dateValidation.valid) {
        toast({
          title: 'Validation Error',
          description: dateValidation.error || 'Invalid sowing date',
          variant: 'destructive'
        });
        return;
      }
    }

    setIsCreating(true);
    try {
      // Only send cropType and sowingDate
      const farmData: any = {
        cropType: newFieldData.cropType.trim().toUpperCase(),
        ...(newFieldData.sowingDate && { sowingDate: newFieldData.sowingDate }),
        ...(newFieldData.insurerId && newFieldData.insurerId !== "none" && { insurerId: newFieldData.insurerId })
      };

      console.log('📤 Preparing to create farm with data:', JSON.stringify(farmData, null, 2));

      // Use the register endpoint
      const token = getAuthToken();
      const registerUrl = `${API_BASE_URL}/farms/register`;
      
      const response = await fetch(registerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(farmData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || errorData.error || `Failed to register farm: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('✅ Farm registration API response:', responseData);
      
      // Handle response - it might be in response.data or directly in response
      const createdFarm = responseData.data || responseData;
      upsertCreatedFarm(createdFarm);
      
      // Stop the creating loading state immediately after successful creation
      setIsCreating(false);
      
      toast({
        title: 'Success',
        description: 'Farm created successfully!',
      });

      setNewFieldData({
        cropType: "",
        sowingDate: ""
      });
      
      // Load farms separately (it has its own loading state)
      await loadFarms();
    } catch (err: any) {
      console.error('Failed to create farm:', err);
      setIsCreating(false);
      toast({
        title: 'Error creating farm',
        description: err.message || 'Failed to create farm',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "in_review": return "bg-blue-100 text-blue-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4" />;
      case "pending": return <Clock className="h-4 w-4" />;
      case "in_review": return <Clock className="h-4 w-4" />;
      case "approved": return <CheckCircle className="h-4 w-4" />;
      case "rejected": return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const renderDashboard = () => {
    // Get display name from profile if available
    const displayName = farmerProfile 
      ? (farmerProfile.firstName && farmerProfile.lastName 
          ? `${farmerProfile.firstName} ${farmerProfile.lastName}`.trim()
          : farmerProfile.name || farmerProfile.firstName || farmerProfile.lastName || farmerName)
      : farmerName;

    return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-6 py-5">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Welcome back, {displayName}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 space-y-8">

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className={`${dashboardTheme.card} hover:border-green-300 transition-all duration-300 rounded-2xl shadow-sm`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">My Farms</p>
                <p className="text-2xl font-bold text-gray-900">{farms.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Crop className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-teal-300 transition-all duration-300 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Claims</p>
                <p className="text-2xl font-bold text-gray-900">{claims.length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-blue-300 transition-all duration-300 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Claims</p>
                <p className="text-2xl font-bold text-gray-900">{claims.filter(c => c.status?.toLowerCase() === 'pending').length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-green-300 transition-all duration-300 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved Claims</p>
                <p className="text-2xl font-bold text-gray-900">{claims.filter(c => c.status?.toLowerCase() === 'approved').length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Farms Table */}
      {farms.length > 0 && (
        <Card className={`${dashboardTheme.card}`}>
          <CardHeader>
            <CardTitle className="text-gray-900">Recent Farms</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Farm Name</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Crop Type</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Area (ha)</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {farms.slice(0, 5).map((farm, index) => {
                    const farmId = farm._id || farm.id;
                    return (
                      <tr
                        key={farmId || index}
                        onClick={() => loadFarmDetails(farmId)}
                        className="hover:bg-gray-50/50 transition-all duration-150 cursor-pointer border-b border-gray-100"
                      >
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{toDisplayText(farm.name, "Unnamed Farm")}</div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Leaf className="h-4 w-4 text-teal-500 flex-shrink-0" />
                            <span>{toDisplayText(farm.cropType || farm.crop, "N/A")}</span>
    </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {farm.area ? `${Math.round(farm.area)} ha` : farm.size ? `${Math.round(farm.size)} ha` : "N/A"}
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                            farm.status === 'INSURED' || farm.status === 'insured'
                              ? "bg-green-500 text-white border-green-600"
                              : farm.status === 'REGISTERED' || farm.status === 'registered'
                              ? "bg-blue-500 text-white border-blue-600"
                              : "bg-gray-500 text-white border-gray-600"
                          }`}>
                            {toDisplayText(farm.status, "REGISTERED")}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Claims Table */}
      {claims.length > 0 && (
        <Card className={`${dashboardTheme.card}`}>
          <CardHeader>
            <CardTitle className="text-gray-900">Recent Claims</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Claim ID</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Loss Type</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {claims.slice(0, 5).map((claim, index) => (
                    <tr
                      key={claim._id || claim.id || index}
                      className="hover:bg-gray-50/50 transition-all duration-150 border-b border-gray-100"
                    >
                      <td className="py-4 px-6 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{toDisplayText(claim.claimNumber || claim._id || claim.id, `CLAIM-${index + 1}`)}</div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {toDisplayText(claim.lossEventType || claim.damageType || claim.lossType, "N/A")}
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                          claim.status === 'APPROVED' || claim.status === 'approved'
                            ? "bg-green-500 text-white border-green-600"
                            : claim.status === 'PENDING' || claim.status === 'pending'
                            ? "bg-yellow-500 text-white border-yellow-600"
                            : claim.status === 'REJECTED' || claim.status === 'rejected'
                            ? "bg-red-500 text-white border-red-600"
                            : "bg-gray-500 text-white border-gray-600"
                        }`}>
                          {toDisplayText(claim.status, "PENDING")}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {claim.createdAt ? new Date(claim.createdAt).toLocaleDateString() : claim.date || "N/A"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loss Reports Table */}
      {lossReports.length > 0 && (
        <Card className={`${dashboardTheme.card}`}>
          <CardHeader>
            <CardTitle className="text-gray-900">Loss Reports</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Location</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lossReports.slice(0, 5).map((report, index) => {
                    // Extract location from report
                    const location = 
                      formatLocation(report.farm) || 
                      "Location not available";
                    
                    // Get status color
                    const getStatusColor = (status: string) => {
                      const statusLower = status.toLowerCase();
                      switch (statusLower) {
                        case "approved":
                        case "completed":
                          return "bg-green-500 text-white border-green-600";
                        case "pending":
                          return "bg-yellow-500 text-white border-yellow-600";
                        case "submitted":
                          return "bg-blue-500 text-white border-blue-600";
                        case "under review":
                        case "processing":
                          return "bg-orange-500 text-white border-orange-600";
                        case "rejected":
                          return "bg-red-500 text-white border-red-600";
                        default:
                          return "bg-gray-500 text-white border-gray-600";
                      }
                    };
                    
                    return (
                      <tr
                        key={report._id || report.id || index}
                        className="hover:bg-gray-50/50 transition-all duration-150 border-b border-gray-100"
                      >
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4 text-teal-500 flex-shrink-0" />
                            <span className="truncate max-w-[200px]">{location}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(report.status || 'Pending')}`}>
                            {report.status || "Pending"}
                          </span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : report.date || "N/A"}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
  };


  const renderMyFields = () => (
    <div className="min-h-screen bg-gray-50 pt-6 pb-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-6 py-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Farms</h1>
          <p className="text-sm text-gray-600 mt-1">Manage and view your registered farms</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={loadFarms}
            disabled={farmsLoading}
            className="border-gray-300 text-gray-700 hover:bg-gray-100 !rounded-none"
          >
            <Crop className={`h-4 w-4 mr-2 ${farmsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => setActivePage("create-farm")}
            className="bg-green-600 hover:bg-green-700 text-gray-900 !rounded-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Farm
          </Button>
        </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6">
      {farmsLoading && (
        <Card className={`${dashboardTheme.card}`}>
          <CardContent className="p-12">
            <div className="flex items-center justify-center">
              <img src="/loading.gif" alt="Loading" className="w-16 h-16" />
            </div>
          </CardContent>
        </Card>
      )}

      {farmsError && !farmsLoading && (
        <Card className={`${dashboardTheme.card}`}>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
              <p>{farmsError}</p>
              <Button 
                onClick={loadFarms} 
                className="mt-4 bg-green-600 hover:bg-green-700 text-gray-900"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!farmsLoading && !farmsError && (
        <Card className={`${dashboardTheme.card}`}>
          <CardHeader>
            <CardTitle className="text-gray-900">Registered Farms</CardTitle>
          </CardHeader>
          <CardContent>
            {farms.length === 0 ? (
              <div className="text-center py-12">
                <Crop className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg mb-2">No farms registered</p>
                <p className="text-gray-500 text-sm">Register your farms to get started with crop insurance</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Farm Name</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Crop Type</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Area (ha)</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Location</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Status</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {farms.map((farm, index) => {
                      const farmId = farm._id || farm.id;
                      const isInsured = farm.status === 'INSURED' || farm.status === 'insured';
                      const isRegistered = farm.status === 'REGISTERED' || farm.status === 'registered' || !farm.status;
                      
                      return (
                        <tr 
                          key={farmId || index} 
                          onClick={() => loadFarmDetails(farmId)}
                          className="hover:bg-gray-50/50 transition-all duration-150 border-b border-gray-100 cursor-pointer"
                        >
                          <td className="py-4 px-6 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{toDisplayText(farm.name, "Unnamed Farm")}</div>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Crop className="h-4 w-4 text-teal-500 flex-shrink-0" />
                              <span>{toDisplayText(farm.cropType || farm.crop, "N/A")}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {farm.area ? `${Math.round(farm.area)} ha` : farm.size ? `${Math.round(farm.size)} ha` : "N/A"}
                            </div>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                            {formatLocation(farm.location, farm.coordinates)}
                            </div>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                              farm.status === 'PENDING' || farm.status === 'pending' 
                                ? "bg-yellow-500 text-white border-yellow-600"
                                : farm.status === 'INSURED' || farm.status === 'insured'
                                ? "bg-green-500 text-white border-green-600"
                                : farm.status === 'REGISTERED' || farm.status === 'registered'
                                ? "bg-blue-500 text-white border-blue-600"
                                : "bg-gray-500 text-white border-gray-600"
                            }`}>
                              {toDisplayText(farm.status, "REGISTERED")}
                            </span>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                              {isRegistered && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setInsuranceRequestDialog({
                                    open: true,
                                    farmId: farmId,
                                    farmName: toDisplayText(farm.name, "Unnamed Farm"),
                                    insurerId: ""
                                  })}
                                  className="border-green-600 text-green-600 hover:bg-green-50 h-8 px-3 text-xs font-medium !rounded-none"
                                >
                                  <Shield className="h-3.5 w-3.5 mr-1.5" />
                                  Insurance
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedFarm(farm);
                                  loadFarmAnalytics(farmId);
                                  setActivePage("farm-analytics");
                                }}
                                className="border-blue-600 text-blue-600 hover:bg-blue-50 h-8 px-3 text-xs font-medium rounded-md"
                              >
                                <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                                Analytics
                              </Button>
                            </div>
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
      )}

      {/* Insurance Request Dialog */}
      <Dialog open={insuranceRequestDialog.open} onOpenChange={(open) => 
        setInsuranceRequestDialog({ ...insuranceRequestDialog, open })
      }>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Request Insurance</DialogTitle>
            <DialogDescription className="text-gray-600">
              Request insurance coverage for: <strong>{insuranceRequestDialog.farmName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-700">Preferred Insurer (Optional)</Label>
              <Select 
                value={insuranceRequestDialog.insurerId || "none"} 
                onValueChange={(value) => setInsuranceRequestDialog({ ...insuranceRequestDialog, insurerId: value })}
              >
                <SelectTrigger className="mt-2 border-gray-300 !rounded-none">
                  <SelectValue placeholder={insurersLoading ? "Loading insurers..." : "Select an insurer"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No preference</SelectItem>
                  {insurers.map((insurer: any) => (
                    <SelectItem key={insurer._id || insurer.id} value={insurer._id || insurer.id}>
                      {insurer.insurerProfile?.companyName || `${insurer.firstName} ${insurer.lastName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-700">Additional Notes (Optional)</Label>
              <Textarea
                value={insuranceRequestNotes}
                onChange={(e) => setInsuranceRequestNotes(e.target.value)}
                placeholder="Please provide any additional information about your farm..."
                className="mt-2 border-gray-300"
                rows={4}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setInsuranceRequestDialog({ open: false, farmId: "", farmName: "", insurerId: "" });
                  setInsuranceRequestNotes("");
                }}
                className="border-gray-300 text-gray-700 hover:bg-gray-100 !rounded-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRequestInsurance}
                disabled={isRequestingInsurance}
                className="bg-green-600 hover:bg-green-700 text-white !rounded-none"
              >
                {isRequestingInsurance ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );

  const renderFileClaim = () => (
    <div className="min-h-screen bg-gray-50 pt-6 pb-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-6 py-5">
        <div>
            <h1 className="text-2xl font-semibold text-gray-900">File a Claim</h1>
            <p className="text-sm text-gray-500 mt-1">Report crop damage and request compensation</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6">
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900">Claim Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitClaim} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="policyId" className="text-gray-900">Policy *</Label>
              {policiesLoading ? (
                <div className="text-gray-500">Loading policies...</div>
              ) : policies.length === 0 ? (
                <div className="text-gray-500">
                  <p>No active policies found. You need an active policy to file a claim.</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActivePage("dashboard")}
                    className="mt-2 border-gray-300 text-gray-900 hover:bg-gray-50 !rounded-none"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              ) : (
                <Select
                  value={claimFormData.policyId}
                  onValueChange={(value) => setClaimFormData({ ...claimFormData, policyId: value })}
                  required
                >
                  <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900 ">
                    <SelectValue placeholder="Select a policy" />
                  </SelectTrigger>
                  <SelectContent>
                    {policies.map((policy) => (
                      <SelectItem key={policy._id || policy.id} value={policy._id || policy.id}>
                        {policy.cropType || 'Policy'} - {policy.coverageAmount ? `RWF ${policy.coverageAmount.toLocaleString()}` : 'Active'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-gray-500">Select the policy for this claim</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lossEventType" className="text-gray-900">Loss Event Type *</Label>
              <Select
                value={claimFormData.lossEventType}
                onValueChange={(value) => setClaimFormData({ ...claimFormData, lossEventType: value })}
                required
              >
                <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900 ">
                  <SelectValue placeholder="Select loss event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DROUGHT">Drought</SelectItem>
                  <SelectItem value="FLOOD">Flood</SelectItem>
                  <SelectItem value="PEST_ATTACK">Pest Attack</SelectItem>
                  <SelectItem value="DISEASE_OUTBREAK">Disease Outbreak</SelectItem>
                  <SelectItem value="HAIL">Hail Damage</SelectItem>
                  <SelectItem value="FIRE">Fire</SelectItem>
                  <SelectItem value="THEFT">Theft</SelectItem>
                  <SelectItem value="STORM">Storm</SelectItem>
                  <SelectItem value="FROST">Frost</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Type of event that caused the loss</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventDate" className="text-gray-900">Event Date *</Label>
              <Input
                id="eventDate"
                type="date"
                value={claimFormData.eventDate}
                onChange={(e) => setClaimFormData({ ...claimFormData, eventDate: e.target.value })}
                required
                className="bg-gray-50 border-gray-300 text-gray-900"
                max={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-gray-500">Date when the loss event occurred</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedLoss" className="text-gray-900">Estimated Loss (RWF) *</Label>
              <Input
                id="estimatedLoss"
                type="number"
                step="0.01"
                min="0"
                value={claimFormData.estimatedLoss}
                onChange={(e) => setClaimFormData({ ...claimFormData, estimatedLoss: e.target.value })}
                placeholder="500000"
                required
                className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500">Estimated financial loss in Rwandan Francs</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lossDescription" className="text-gray-900">Loss Description *</Label>
              <Textarea
                id="lossDescription"
                value={claimFormData.lossDescription}
                onChange={(e) => setClaimFormData({ ...claimFormData, lossDescription: e.target.value })}
                placeholder="Describe the loss event and damage to your crops in detail..."
                rows={6}
                required
                className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 "
              />
              <p className="text-xs text-gray-500">Provide a detailed description of the loss event</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="damagePhotos" className="text-gray-900">Damage Photos (Optional)</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                id="damagePhotos"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    onChange={handleFileSelect}
                    disabled={uploadingPhotos || uploadedFiles.length >= 10}
                    className="hidden"
                  />
                  <label
                    htmlFor="damagePhotos"
                    className={`flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      uploadingPhotos || uploadedFiles.length >= 10
                        ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                        : 'border-green-300 bg-green-50 hover:bg-green-100 hover:border-green-400'
                    }`}
                  >
                    <Camera className={`h-5 w-5 ${uploadingPhotos || uploadedFiles.length >= 10 ? 'text-gray-400' : 'text-green-600'}`} />
                    <span className={`text-sm font-medium ${uploadingPhotos || uploadedFiles.length >= 10 ? 'text-gray-500' : 'text-green-700'}`}>
                      {uploadingPhotos 
                        ? 'Uploading...' 
                        : uploadedFiles.length >= 10
                        ? 'Maximum 10 photos reached'
                        : 'Upload Photos from Device'}
                    </span>
                  </label>
                  {uploadedFiles.length > 0 && (
                    <span className="text-sm text-gray-600">
                      {uploadedFiles.length} / 10 photos
                    </span>
                  )}
                </div>

                
                {uploadedFiles.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    {uploadedFiles.map((file, index) => {
                      // Use base64 from claimFormData for preview (already converted to base64)
                      const previewUrl = claimFormData.damagePhotos[index] || URL.createObjectURL(file);
                      
                      return (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                            <img
                              src={previewUrl}
                              alt={`Damage photo ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index)}
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove photo"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <p className="text-xs text-gray-600 mt-1 truncate" title={file.name}>
                            {file.name}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                <p className="text-xs text-gray-500">
                  Upload photos showing the damage (JPG, PNG, WEBP - Max 10MB per file, up to 10 photos)
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActivePage("loss-reports")}
                className="border-gray-300 text-gray-900 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingClaim || policies.length === 0}
                className="bg-red-600 hover:bg-red-700 text-white !rounded-none"
              >
                {isSubmittingClaim ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Submit Claim
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );

  const renderProfileSettings = () => (
    <div className="min-h-screen bg-gray-50 pt-6 pb-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-6 py-5">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Profile Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your account settings and preferences</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-6">
            <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${profileStep >= 1 ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600'}`}>
              <span className="font-semibold">1</span>
            </div>
            <div className={`w-20 h-1 rounded-full transition-all duration-300 ${profileStep >= 2 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${profileStep >= 2 ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600'}`}>
              <span className="font-semibold">2</span>
            </div>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto bg-white border border-gray-200 shadow-sm">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-2xl font-semibold text-gray-900 mb-2">
              {profileStep === 1 ? "Personal Information" : "Location Details"}
            </CardTitle>
            <p className="text-gray-600">
              {profileStep === 1 ? "Update your personal details" : "Update your location information"}
            </p>
          </CardHeader>
          <CardContent>
            {profileLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading profile...</p>
              </div>
            ) : (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {profileStep === 1 && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          value={profileFormData.fullName}
                          onChange={(e) => handleProfileInputChange('fullName', e.target.value)}
                          placeholder="Enter your full name"
                          required
                          className="!rounded-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender *</Label>
                        <Select value={profileFormData.gender} onValueChange={(value) => handleProfileInputChange('gender', value)}>
                          <SelectTrigger className="!rounded-none">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nationalId">National ID *</Label>
                      <Input
                        id="nationalId"
                        value={profileFormData.nationalId}
                        onChange={(e) => handleProfileInputChange('nationalId', e.target.value)}
                        placeholder="Enter your national ID number"
                        required
                        className="!rounded-none"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number *</Label>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          value={profileFormData.phoneNumber}
                          onChange={(e) => handleProfileInputChange('phoneNumber', e.target.value)}
                          placeholder="+250 7XX XXX XXX"
                          required
                          className="!rounded-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email (Optional)</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileFormData.email}
                          onChange={(e) => handleProfileInputChange('email', e.target.value)}
                          placeholder="your.email@example.com"
                          className="!rounded-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                {profileStep === 2 && (
                  <>
                    <div className="space-y-4">
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Your Location</h3>
                        <p className="text-gray-600">Choose your province, district, sector, village, and cell</p>
                      </div>

                      <RwandaLocationSelector
                        onLocationChange={(location) => {
                          setSelectedLocation(location);
                          // Update form data with selected location
                          setProfileFormData(prev => ({
                            ...prev,
                            province: location.province?.name || '',
                            district: location.district?.name || '',
                            sector: location.sector?.name || '',
                            village: location.village?.name || '',
                            cell: location.cell?.name || ''
                          }));
                        }}
                        levels={['province', 'district', 'sector', 'village', 'cell']}
                        className="space-y-4"
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-between pt-8">
                  {profileStep === 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setProfileStep(1)}
                      className="!rounded-none"
                    >
                      Previous
                    </Button>
                  )}
                  <div className="flex-1"></div>
                  {profileStep === 1 ? (
                    <Button
                      type="button"
                      onClick={() => setProfileStep(2)}
                      disabled={!isProfileStep1Valid}
                      className="bg-green-600 hover:bg-green-700 text-white !rounded-none"
                    >
                      Next Step
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={!isProfileStep2Valid || isSubmittingProfile}
                      className="bg-green-600 hover:bg-green-700 text-white !rounded-none"
                    >
                      {isSubmittingProfile ? "Updating Profile..." : "Update Profile"}
                    </Button>
                  )}
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": 
        return renderDashboard();
      case "my-fields": 
        return (
          <MyFarmsTab 
            onRegisterFarm={() => setActivePage("create-farm")} 
            onViewDetails={(farm) => {
              setSelectedFarmId(farm._id || farm.id);
              setActivePage("farm-details");
            }}
            onViewAnalytics={(farm) => {
              setSelectedFarmId(farm._id || farm.id);
              setActivePage("monitoring");
            }}
            onRequestInsurance={(farm) => {
              setInsuranceRequestDialog({
                open: true,
                farmId: farm._id || farm.id,
                farmName: farm.name || "Unnamed Farm",
                insurerId: ""
              });
            }}
          />
        );
      case "insurers": 
        return (
          <InsurersTab 
            onRegisterFarm={(insurerId, insurerName) => {
              setSelectedInsurerId(insurerId);
              setSelectedInsurerName(insurerName);
              setActivePage("register-farm");
            }}
          />
        );
      case "insurance": 
        return (
          <InsuranceTab 
            onViewDetails={(id) => {
              setSelectedPolicyId(id);
              setActivePage("policy-details");
            }} 
          />
        );
      case "monitoring": return <MonitoringTab />;
      case "create-farm": 
        return (
          <InsurersTab 
            selectionMode={true}
            onRegisterFarm={(insurerId, insurerName) => {
              setSelectedInsurerId(insurerId);
              setSelectedInsurerName(insurerName);
              setActivePage("register-farm");
            }}
          />
        );
      case "register-farm":
        return (
          <RegisterFarmTab 
            onSuccess={() => setActivePage("my-fields")} 
            onCancel={() => setActivePage("create-farm")} 
            insurerId={selectedInsurerId || undefined}
            insurerName={selectedInsurerName || undefined}
          />
        );
      case "notifications": return <NotificationsTab />;
      case "file-claim": return renderFileClaim();
      case "reports": return <ReportsTab />;
      case "farm-details": 
        return (
          <FarmDetailsTab 
            farmId={selectedFarmId!} 
            onBack={() => setActivePage("my-fields")}
            onViewPolicy={(id) => {
              setSelectedPolicyId(id);
              setActivePage("policy-details");
            }}
            onFileClaim={(id) => {
              setSelectedPolicyId(id);
              setActivePage("file-claim");
            }}
          />
        );
      case "policy-details":
        return (
          <PolicyDetailsTab 
            policyId={selectedPolicyId!} 
            onBack={() => setActivePage("insurance")}
            onFileClaim={(id) => {
              setSelectedPolicyId(id);
              setActivePage("file-claim");
            }}
          />
        );
      case "loss-reports": return <ReportsTab />;
      case "profile": return renderProfileSettings();
      default: return renderDashboard();
    }
  };

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "my-fields", label: "My Farms", icon: Crop },
    { id: "monitoring", label: "Monitoring", icon: MapPin },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "insurers", label: "Insurers", icon: Building2 },
    { id: "insurance", label: "Insurance", icon: Shield },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "file-claim", label: "File Claim", icon: AlertTriangle },
    { id: "profile", label: "Profile", icon: User }
  ];

  // Get display name from profile if available
  const displayName = farmerProfile 
    ? (farmerProfile.firstName && farmerProfile.lastName 
        ? `${farmerProfile.firstName} ${farmerProfile.lastName}`.trim()
        : farmerProfile.name || farmerProfile.firstName || farmerProfile.lastName || farmerName)
    : farmerName;

  return (
    <DashboardLayout
      userType="farmer"
      userId={farmerId}
      userName={displayName}
      navigationItems={navigationItems}
      activePage={activePage} 
      onPageChange={setActivePage}
      onLogout={() => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        localStorage.removeItem('phoneNumber');
        localStorage.removeItem('email');
        window.location.href = '/role-selection';
      }}
    >
      <div className="p-6 md:p-8 lg:p-10 w-full">
        <div className="max-w-7xl mx-auto">
          {renderPage()}
        </div>
      </div>
    </DashboardLayout>
  );
}
