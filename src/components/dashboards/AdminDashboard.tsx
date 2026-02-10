import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import { isAdmin, logout as authLogout, getUserId, getPhoneNumber, getEmail } from "@/services/authAPI";
import { getAllUsers, deactivateUser, updateUser, getUserById, createUser, getUserProfile, updateUserProfile, getInsurers } from "@/services/usersAPI";
import { getSystemStatistics, getPolicyOverview, getClaimStatistics, getHealthStatus } from "@/services/adminApi";
import { createPolicy, createPolicyFromAssessment, getPolicies, getPolicyById, updatePolicy, deletePolicy } from "@/services/policiesApi";
import { createClaim, getClaims, getClaimById, updateClaim, deleteClaim } from "@/services/claimsApi";
import assessmentsApiService from "@/services/assessmentsApi";
import { getFarms } from "@/services/farmsApi";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dashboardTheme } from "@/utils/dashboardTheme";
import { StatsGridSkeleton, TableSkeleton, CardSkeleton, ChartSkeleton } from "@/components/ui/skeletons";
import { ModernTable, StatusBadge } from "@/components/ui/ModernTable";
import { 
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Legend
} from "recharts";
import { 
  Users,
  Settings,
  Shield,
  Activity,
  Database,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Lock,
  Eye,
  FileText,
  Server,
  Zap,
  BarChart3,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Search,
  Filter,
  MoreVertical,
  Key,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Percent,
  CreditCard,
  Building2,
  Globe,
  HardDrive,
  Cpu,
  WifiOff,
  Bell,
  Plus,
  X,
  Save,
  Loader2,
  FileCheck,
  AlertCircle
} from "lucide-react";

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("dashboard");
  const [adminId] = useState(getUserId() || "ADMIN-001");
  const [adminName] = useState(getEmail() || getPhoneNumber() || "System Administrator");

  // Route protection - check if user is admin
  useEffect(() => {
    if (!isAdmin()) {
      // Redirect to login if not admin
      navigate("/role-selection");
    }
  }, [navigate]);

  // Load admin statistics
  const loadAdminStatistics = async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const [stats, policies, claims] = await Promise.all([
        getSystemStatistics(),
        getPolicyOverview(),
        getClaimStatistics(),
      ]);

      // Handle different response structures
      setSystemStats(stats.data || stats);
      setPolicyOverview(policies.data || policies);
      setClaimStats(claims.data || claims);
    } catch (err: any) {
      console.error('Failed to load admin statistics:', err);
      setStatsError(err.message || 'Failed to load statistics');
      toast({
        title: "Error",
        description: err.message || 'Failed to load admin statistics',
        variant: "destructive",
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Load health status
  const loadHealthStatus = async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const response = await getHealthStatus();
      setHealthStatus(response.data || response);
    } catch (err: any) {
      console.error('Failed to load health status:', err);
      setHealthError(err.message || 'Failed to load health status');
    } finally {
      setHealthLoading(false);
    }
  };

  // Load statistics when dashboard or analytics is active
  useEffect(() => {
    if (activePage === "dashboard" || activePage === "analytics") {
      loadAdminStatistics();
      loadAdminProfile();
      loadHealthStatus();
    }
    if (activePage === "analytics") {
      loadAnalyticsData();
    }
    if (activePage === "settings") {
      loadAdminProfile();
    }
  }, [activePage]);

  // Load admin profile from API
  const loadAdminProfile = async () => {
    setAdminProfileLoading(true);
    setAdminProfileError(null);
    try {
      const response: any = await getUserProfile();
      const profileData = response.data || response;
      setAdminProfile(profileData);
    } catch (err: any) {
      console.error('Failed to load admin profile:', err);
      setAdminProfileError(err.message || 'Failed to load profile');
      // Fallback to basic info from localStorage
      setAdminProfile({
        _id: adminId,
        userId: adminId,
        email: getEmail() || "",
        phoneNumber: getPhoneNumber() || "",
        firstName: adminName.split(' ')[0] || "",
        lastName: adminName.split(' ').slice(1).join(' ') || "",
        role: "ADMIN",
        active: true
      });
    } finally {
      setAdminProfileLoading(false);
    }
  };

  // Load login history
  const loadLoginHistory = async () => {
    setLoginHistoryLoading(true);
    try {
      // TODO: Replace with actual API endpoint when available
      // const response = await getLoginHistory();
      // setLoginHistory(response.data || response);
      
      // Placeholder: Mock data structure - replace with actual API call
      setLoginHistory([
        { id: 1, timestamp: new Date().toISOString(), ipAddress: "192.168.1.1", location: "Kigali, Rwanda", success: true },
        { id: 2, timestamp: new Date(Date.now() - 86400000).toISOString(), ipAddress: "192.168.1.2", location: "Kigali, Rwanda", success: true }
      ]);
    } catch (err: any) {
      console.error('Failed to load login history:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to load login history",
        variant: "destructive",
      });
    } finally {
      setLoginHistoryLoading(false);
    }
  };

  // Handle change password
  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "New password and confirm password do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      // TODO: Replace with actual API endpoint when available
      // await changePassword({
      //   currentPassword: passwordData.currentPassword,
      //   newPassword: passwordData.newPassword
      // });
      
      // Placeholder: Simulate API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      
      setShowChangePasswordDialog(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (err: any) {
      console.error('Failed to change password:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle 2FA toggle
  const handleToggle2FA = async (enable: boolean) => {
    try {
      // TODO: Replace with actual API endpoint when available
      // await update2FAStatus({ enabled: enable });
      
      // Placeholder: Simulate API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state
      setAdminProfile((prev: any) => ({
        ...prev,
        twoFactorEnabled: enable
      }));
      
      toast({
        title: "Success",
        description: `2FA ${enable ? 'enabled' : 'disabled'} successfully`,
      });
      
      setShow2FADialog(false);
    } catch (err: any) {
      console.error('Failed to update 2FA status:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to update 2FA status",
        variant: "destructive",
      });
    }
  };

  // Helper function to calculate time ago
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Load analytics data (users, policies, claims, farms)
  const loadAnalyticsData = async () => {
    setAnalyticsLoading(true);
    try {
      const [usersRes, policiesRes, claimsRes, farmsRes] = await Promise.all([
        getAllUsers().catch(() => []),
        getPolicies(1, 1000).catch(() => []),
        getClaims(1, 1000).catch(() => []),
        getFarms(1, 1000).catch(() => [])
      ]);

      // Extract arrays from responses
      const users = Array.isArray(usersRes) ? usersRes : (usersRes?.data || usersRes?.users || usersRes?.results || usersRes?.items || []);
      const policies = Array.isArray(policiesRes) ? policiesRes : (policiesRes?.data || policiesRes?.policies || policiesRes?.results || policiesRes?.items || []);
      const claims = Array.isArray(claimsRes) ? claimsRes : (claimsRes?.data || claimsRes?.claims || claimsRes?.results || claimsRes?.items || []);
      const farms = Array.isArray(farmsRes) ? farmsRes : (farmsRes?.data || farmsRes?.farms || farmsRes?.results || farmsRes?.items || []);

      setAnalyticsUsers(Array.isArray(users) ? users : []);
      setAnalyticsPolicies(Array.isArray(policies) ? policies : []);
      setAnalyticsClaims(Array.isArray(claims) ? claims : []);
      setAnalyticsFarms(Array.isArray(farms) ? farms : []);
    } catch (err: any) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Load assessments when assessments page is active
  useEffect(() => {
    if (activePage === "assessments") {
      loadAssessments();
      loadFarmsForAssessment();
      loadAssessors();
      loadInsurers();
      loadPendingFarms();
    }
  }, [activePage]);

  // Handle logout
  const handleLogout = () => {
    authLogout();
    navigate("/role-selection");
  };

  // User Management State
  const { toast } = useToast();
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  // Admin API State
  const [systemStats, setSystemStats] = useState<any | null>(null);
  const [policyOverview, setPolicyOverview] = useState<any | null>(null);
  const [claimStats, setClaimStats] = useState<any | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<any | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  
  // Analytics data state
  const [analyticsUsers, setAnalyticsUsers] = useState<any[]>([]);
  const [analyticsPolicies, setAnalyticsPolicies] = useState<any[]>([]);
  const [analyticsClaims, setAnalyticsClaims] = useState<any[]>([]);
  const [analyticsFarms, setAnalyticsFarms] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Policies Management State
  const [policies, setPolicies] = useState<any[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [policiesError, setPoliciesError] = useState<string | null>(null);
  const [policySearchQuery, setPolicySearchQuery] = useState("");
  const [policyStatusFilter, setPolicyStatusFilter] = useState<string>("all");
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any | null>(null);
  const [deletingPolicyId, setDeletingPolicyId] = useState<string | null>(null);
  const [policyFormData, setPolicyFormData] = useState({
    farmerId: "",
    cropType: "",
    coverageAmount: "",
    premium: "",
    startDate: "",
    endDate: "",
    status: "active",
    notes: "",
  });

  // Claims Management State
  const [claims, setClaims] = useState<any[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimsError, setClaimsError] = useState<string | null>(null);
  const [claimSearchQuery, setClaimSearchQuery] = useState("");
  const [claimStatusFilter, setClaimStatusFilter] = useState<string>("all");
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [editingClaim, setEditingClaim] = useState<any | null>(null);
  const [deletingClaimId, setDeletingClaimId] = useState<string | null>(null);
  const [claimFormData, setClaimFormData] = useState({
    policyId: "", // Required - API field
    lossEventType: "", // Required - API field (e.g., "DROUGHT", "FLOOD", "PEST_ATTACK")
    lossDescription: "", // Required - API field
    damagePhotos: [] as string[], // Optional - API field (array of photo URLs)
    // Legacy fields for backward compatibility (not sent to API)
    farmerId: "",
    cropType: "",
    damageType: "",
    amount: "",
    description: "",
    fieldId: "",
    status: "pending",
  });

  // Assessments Management State
  const [assessments, setAssessments] = useState<any[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [assessmentsError, setAssessmentsError] = useState<string | null>(null);
  const [assessmentSearchQuery, setAssessmentSearchQuery] = useState("");
  const [assessmentStatusFilter, setAssessmentStatusFilter] = useState<string>("all");
  const [pendingFarms, setPendingFarms] = useState<any[]>([]);
  const [pendingFarmsLoading, setPendingFarmsLoading] = useState(false);
  const [pendingFarmsError, setPendingFarmsError] = useState<string | null>(null);
  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false);
  const [creatingAssessment, setCreatingAssessment] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assigningAssessor, setAssigningAssessor] = useState(false);
  const [selectedFarmForAssignment, setSelectedFarmForAssignment] = useState<any | null>(null);
  const [farms, setFarms] = useState<any[]>([]);
  const [farmsLoading, setFarmsLoading] = useState(false);
  const [assessors, setAssessors] = useState<any[]>([]);
  const [insurers, setInsurers] = useState<any[]>([]);
  const [assessmentFormData, setAssessmentFormData] = useState({
    farmId: "",
    assessorId: "",
  });
  const [assignFormData, setAssignFormData] = useState({
    assessorId: "",
    insurerId: "",
  });
  
  // Policy Issuance from Assessment
  const [policyIssuanceDialog, setPolicyIssuanceDialog] = useState<{
    open: boolean;
    assessmentId: string | null;
    assessment: any | null;
  }>({ open: false, assessmentId: null, assessment: null });
  const [policyIssuanceData, setPolicyIssuanceData] = useState({
    coverageLevel: 'STANDARD' as 'BASIC' | 'STANDARD' | 'PREMIUM',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const [issuingPolicy, setIssuingPolicy] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  // Admin Profile State
  const [adminProfile, setAdminProfile] = useState<any | null>(null);
  const [adminProfileLoading, setAdminProfileLoading] = useState(false);
  const [adminProfileError, setAdminProfileError] = useState<string | null>(null);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [showLoginHistoryDialog, setShowLoginHistoryDialog] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(false);
  const [editUserData, setEditUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    province: "",
    district: "",
    sector: "",
    cell: "",
    village: "",
    sex: "",
    active: true,
    farmerProfile: {
      farmProvince: "",
      farmDistrict: "",
      farmSector: "",
      farmCell: "",
      farmVillage: ""
    },
    assessorProfile: {
      specialization: "",
      experienceYears: 0,
      profilePhotoUrl: "",
      bio: "",
      address: ""
    },
    insurerProfile: {
      companyName: "",
      contactPerson: "",
      website: "",
      address: "",
      companyDescription: "",
      licenseNumber: "",
      registrationDate: "",
      companyLogoUrl: ""
    }
  });
  const [newUserData, setNewUserData] = useState({
    nationalId: "",
    email: "",
    phoneNumber: "",
    role: "FARMER"
  });

  // Computed User Statistics from real data
  const userStats = {
    total: systemUsers.length,
    active: systemUsers.filter(u => u.active !== false).length,
    inactive: systemUsers.filter(u => u.active === false).length,
    newThisMonth: systemUsers.filter(u => {
      if (!u.createdAt) return false;
      const createdDate = new Date(u.createdAt);
      const now = new Date();
      return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
    }).length,
    farmers: systemUsers.filter(u => u.role === 'FARMER' || u.role === 'Farmer').length,
    assessors: systemUsers.filter(u => u.role === 'ASSESSOR' || u.role === 'Assessor').length,
    insurers: systemUsers.filter(u => u.role === 'INSURER' || u.role === 'Insurer').length,
    government: systemUsers.filter(u => u.role === 'GOVERNMENT' || u.role === 'Government').length,
    admins: systemUsers.filter(u => u.role === 'ADMIN' || u.role === 'Admin').length
  };

  // Load users from API
  const loadUsers = async (forceLoad = false) => {
    if (!forceLoad && activePage !== "users") return; // Only load when on users page, unless forced
    
    setUsersLoading(true);
    setUsersError(null);
    try {
      const response: any = await getAllUsers();
      console.log('Users API response:', response); // Debug log
      console.log('Response type:', typeof response);
      console.log('Is array:', Array.isArray(response));
      if (response && typeof response === 'object') {
        console.log('Response keys:', Object.keys(response));
      }
      
      // Handle different response structures
      let usersData: any[] = [];
      
      // Check if response is directly an array
      if (Array.isArray(response)) {
        usersData = response;
      } else if (response && typeof response === 'object') {
        // Try multiple possible response structures
        // Common patterns: { data: [...] }, { users: [...] }, { data: { users: [...] } }, etc.
        
        // First check if it's a direct property
        if (Array.isArray(response.users)) {
          usersData = response.users;
        } else if (Array.isArray(response.data)) {
          usersData = response.data;
        } else if (Array.isArray(response.results)) {
          usersData = response.results;
        } else if (Array.isArray(response.items)) {
          usersData = response.items;
        } else if (Array.isArray(response.list)) {
          usersData = response.list;
        }
        // Then check nested structures
        else if (response.data) {
          if (Array.isArray(response.data)) {
            usersData = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            usersData = response.data.data;
          } else if (response.data.users && Array.isArray(response.data.users)) {
            usersData = response.data.users;
          } else if (response.data.results && Array.isArray(response.data.results)) {
            usersData = response.data.results;
          } else if (response.data.items && Array.isArray(response.data.items)) {
            usersData = response.data.items;
          } else if (response.data.list && Array.isArray(response.data.list)) {
            usersData = response.data.list;
          }
        }
        // Try to find any array property
        else {
          const keys = Object.keys(response);
          for (const key of keys) {
            if (Array.isArray(response[key])) {
              console.log(`Found array in property: ${key}`, response[key]);
              usersData = response[key];
              break;
            }
          }
        }
      }
      
      // Ensure usersData is an array before mapping
      if (!Array.isArray(usersData)) {
        console.warn('Users data is not an array. Response structure:', JSON.stringify(response, null, 2));
        console.warn('Response keys:', response ? Object.keys(response) : 'No response');
        usersData = [];
      }
      
      console.log('Extracted usersData:', usersData.length, 'users');
      
      // Helper function to safely extract string values
      const safeString = (value: any, defaultValue: string = ''): string => {
        if (typeof value === 'string') return value;
        if (value == null) return defaultValue;
        return String(value);
      };

      // Map API response to expected format - ensure all values are primitives
      const mappedUsers = usersData.map((user: any) => {
        // Safely extract all string values to prevent object rendering
        const firstName = safeString(user.firstName, '');
        const lastName = safeString(user.lastName, '');
        const fullName = `${firstName} ${lastName}`.trim();
        const name = fullName || safeString(user.name, 'Unknown');
        
        return {
          id: safeString(user._id || user.id, ''),
          userId: safeString(user._id || user.id, ''),
          name: name,
          firstName: firstName,
          lastName: lastName,
          email: safeString(user.email, ''),
          phoneNumber: safeString(user.phoneNumber, ''),
          role: safeString(user.role, 'Farmer'),
          status: user.active !== false ? 'active' : 'inactive',
          active: user.active !== false,
          region: (() => {
            if (typeof user.region === 'string') return user.region;
            if (typeof user.location === 'string') return user.location;
            if (typeof user.province === 'string') return user.province;
            if (typeof user.district === 'string') return user.district;
            return 'Unknown';
          })(),
          joinDate: user.createdAt 
            ? (typeof user.createdAt === 'string'
                ? new Date(user.createdAt).toISOString().split('T')[0]
                : new Date(String(user.createdAt)).toISOString().split('T')[0])
            : '',
          createdAt: safeString(user.createdAt, '')
        };
      });
      
      setSystemUsers(mappedUsers);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setUsersError(err.message || 'Failed to load users. Please try again.');
    } finally {
      setUsersLoading(false);
    }
  };

  // Load users when switching to users page
  useEffect(() => {
    if (activePage === "users") {
      loadUsers();
    }
  }, [activePage]);

  // Financial Data
  const financialData = {
    totalRevenue: 15650000,
    monthlyRevenue: 2450000,
    commissionEarned: 726000,
    pendingPayments: 156000,
    growthRate: 18.5
  };

  // Commission Settings
  // DESIGN LOGIC: Commission Breakdown Component
  // This component displays commission rates for different revenue streams in the platform.
  // Currently uses hardcoded data as a placeholder/demo. In production, this should:
  // 1. Fetch commission rates from an admin settings API or database
  // 2. Allow admins to configure commission rates per revenue type
  // 3. Calculate commission amounts dynamically based on actual revenue data
  // 4. Show historical commission trends and allow rate adjustments
  // The structure includes:
  // - type: Revenue stream category (Policy Premium, Claim Processing, etc.)
  // - rate: Commission percentage for that revenue type
  // - revenue: Total revenue generated in that category (for calculation)
  // - commission: Calculated commission amount (revenue * rate / 100)
  // - status: Whether the commission rate is currently active
  const commissionRates = [
    { type: "Policy Premium", rate: 3.5, revenue: 169400000, commission: 5929000, status: "active" },
    { type: "Claim Processing", rate: 2.0, revenue: 1278000000, commission: 25560000, status: "active" },
    { type: "Assessment Fee", rate: 5.0, revenue: 45000000, commission: 2250000, status: "active" },
    { type: "Data Analytics", rate: 10.0, revenue: 12000000, commission: 1200000, status: "active" }
  ];

  // System Metrics
  // DESIGN LOGIC: System Performance Component
  // This component displays key system health and performance metrics.
  // Currently uses hardcoded data as a placeholder/demo. In production, this should:
  // 1. Connect to system monitoring tools (e.g., Prometheus, Grafana, CloudWatch)
  // 2. Fetch real-time metrics from the backend infrastructure
  // 3. Display live updates via WebSocket or polling
  // 4. Set up alerts for critical thresholds (e.g., uptime < 99%, error rate > 1%)
  // The metrics tracked include:
  // - uptime: System availability percentage (target: 99.9%+)
  // - apiCalls: Total API requests processed (for traffic analysis)
  // - avgResponseTime: Average API response time in milliseconds (target: <200ms)
  // - errorRate: Percentage of failed requests (target: <0.1%)
  // - activeConnections: Current number of active user sessions
  // - dbSize: Database size in GB (for capacity planning)
  // - cpuUsage: Server CPU utilization percentage (target: <80%)
  // - memoryUsage: Server memory utilization percentage (target: <80%)
  // - diskUsage: Disk space utilization percentage (target: <80%)
  const systemMetrics = {
    uptime: 99.97,
    apiCalls: 1234567,
    avgResponseTime: 127,
    errorRate: 0.03,
    activeConnections: 234,
    dbSize: 15.6,
    cpuUsage: 42.5,
    memoryUsage: 68.3,
    diskUsage: 45.8
  };

  // Activity Logs
  const recentActivities = [
    { id: 1, user: "David Ndizeye", action: "Created new policy", details: "POL-2845 for farmer FMR-0567", timestamp: "2 min ago", type: "policy", severity: "info" },
    { id: 2, user: "Alice Mukamana", action: "Completed assessment", details: "Risk assessment for farm in Nyagatare", timestamp: "15 min ago", type: "assessment", severity: "info" },
    { id: 3, user: "System", action: "Database backup", details: "Automated backup completed successfully", timestamp: "1 hour ago", type: "system", severity: "success" },
    { id: 4, user: "Admin", action: "Security alert", details: "Failed login attempt from unknown IP", timestamp: "2 hours ago", type: "security", severity: "warning" },
    { id: 5, user: "Emmanuel Hakizimana", action: "Generated report", details: "Monthly insurance coverage report", timestamp: "3 hours ago", type: "report", severity: "info" },
    { id: 6, user: "System", action: "Payment processed", details: "Premium payment of RWF 850,000", timestamp: "4 hours ago", type: "payment", severity: "success" }
  ];

  // Calculate real user growth data from API
  const calculateUserGrowthData = () => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const last6Months: { month: string; farmers: number; assessors: number; insurers: number; total: number }[] = [];
    
    // Get last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = monthNames[date.getMonth()];
      
      // Count users created up to this month
      const usersUpToMonth = analyticsUsers.filter((user: any) => {
        if (!user.createdAt && !user.created_at && !user.dateCreated) return false;
        const userDate = new Date(user.createdAt || user.created_at || user.dateCreated);
        const userMonthKey = `${userDate.getFullYear()}-${String(userDate.getMonth() + 1).padStart(2, '0')}`;
        return userMonthKey <= monthKey;
      });
      
      const farmers = usersUpToMonth.filter((u: any) => (u.role || '').toUpperCase() === 'FARMER').length;
      const assessors = usersUpToMonth.filter((u: any) => (u.role || '').toUpperCase() === 'ASSESSOR').length;
      const insurers = usersUpToMonth.filter((u: any) => (u.role || '').toUpperCase() === 'INSURER').length;
      
      last6Months.push({
        month: monthName,
        farmers,
        assessors,
        insurers,
        total: farmers + assessors + insurers
      });
    }
    
    return last6Months.length > 0 ? last6Months : [
      { month: "Jan", farmers: 0, assessors: 0, insurers: 0, total: 0 },
      { month: "Feb", farmers: 0, assessors: 0, insurers: 0, total: 0 },
      { month: "Mar", farmers: 0, assessors: 0, insurers: 0, total: 0 },
      { month: "Apr", farmers: 0, assessors: 0, insurers: 0, total: 0 },
      { month: "May", farmers: 0, assessors: 0, insurers: 0, total: 0 },
      { month: "Jun", farmers: 0, assessors: 0, insurers: 0, total: 0 }
    ];
  };

  // Calculate real revenue trends from policies
  const calculateRevenueTrends = () => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const last6Months: { month: string; revenue: number; commission: number; expenses: number }[] = [];
    
    // Get last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = monthNames[date.getMonth()];
      
      // Calculate revenue and commission from policies created in this month
      const policiesInMonth = analyticsPolicies.filter((policy: any) => {
        if (!policy.createdAt && !policy.created_at && !policy.startDate && !policy.issueDate) return false;
        const policyDate = new Date(policy.createdAt || policy.created_at || policy.startDate || policy.issueDate);
        const policyMonthKey = `${policyDate.getFullYear()}-${String(policyDate.getMonth() + 1).padStart(2, '0')}`;
        return policyMonthKey === monthKey;
      });
      
      const revenue = policiesInMonth.reduce((sum: number, p: any) => {
        const premium = p.premium || p.monthlyPremium || p.annualPremium || 0;
        return sum + (typeof premium === 'number' ? premium : 0);
      }, 0);
      
      // Commission is typically 3.5% of revenue
      const commission = revenue * 0.035;
      // Expenses estimate (can be calculated from claims if available)
      const expenses = revenue * 0.15; // 15% estimate
      
      last6Months.push({
        month: monthName,
        revenue: Math.round(revenue),
        commission: Math.round(commission),
        expenses: Math.round(expenses)
      });
    }
    
    return last6Months.length > 0 ? last6Months : [
      { month: "Jan", revenue: 0, commission: 0, expenses: 0 },
      { month: "Feb", revenue: 0, commission: 0, expenses: 0 },
      { month: "Mar", revenue: 0, commission: 0, expenses: 0 },
      { month: "Apr", revenue: 0, commission: 0, expenses: 0 },
      { month: "May", revenue: 0, commission: 0, expenses: 0 },
      { month: "Jun", revenue: 0, commission: 0, expenses: 0 }
    ];
  };

  // Get real user growth data
  const userGrowthData = calculateUserGrowthData();
  
  // Get real revenue trends
  const revenueTrends = calculateRevenueTrends();

  // Dashboard Overview
  const renderDashboard = () => (
    <div className="space-y-4 pt-6 pr-6">
      {/* Error State */}
      {statsError && !statsLoading && (
        <Card className={`${dashboardTheme.card} border-l-4 border-l-red-500`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <p className="text-red-400">{statsError}</p>
              </div>
              <Button
                onClick={loadAdminStatistics}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-900 hover:bg-gray-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header Stats - Compact Design */}
      {statsLoading ? (
        <StatsGridSkeleton count={4} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className={`${dashboardTheme.card} p-4 hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Users</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {(systemStats?.totalUsers || userStats.total || 0).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  <span className="font-medium text-gray-600">{userStats.newThisMonth || 0}</span> new this month
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className={`${dashboardTheme.card} p-4 hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Policies</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {(policyOverview?.total || 0).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  <span className="font-medium text-gray-600">{policyOverview?.active || 0}</span> active
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className={`${dashboardTheme.card} p-4 hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Claims</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {(claimStats?.total || 0).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  <span className="font-medium text-gray-600">{claimStats?.pending || 0}</span> pending
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className={`${dashboardTheme.card} p-4 hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Farmers</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {(systemStats?.totalFarmers || userStats.farmers || 0).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">Registered</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Quick Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2">
      <Card className={dashboardTheme.card}>
        <CardHeader>
          <CardTitle className="text-gray-700 flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Farmers</span>
                <span className="text-lg font-semibold text-gray-900">{userStats.farmers || 0}</span>
                  </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Assessors</span>
                <span className="text-lg font-semibold text-gray-900">{userStats.assessors || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Insurers</span>
                <span className="text-lg font-semibold text-gray-900">{userStats.insurers || 0}</span>
                  </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Active Users</span>
                <span className="text-lg font-semibold text-green-600">{userStats.active || 0}</span>
              </div>
                    </div>
                  </CardContent>
                </Card>

        <Card className={dashboardTheme.card}>
                  <CardHeader>
            <CardTitle className="text-gray-700 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Policy & Claims Overview
            </CardTitle>
                  </CardHeader>
                  <CardContent>
              <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Active Policies</span>
                <span className="text-lg font-semibold text-green-600">{policyOverview?.active || 0}</span>
                      </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Pending Claims</span>
                <span className="text-lg font-semibold text-yellow-600">{claimStats?.pending || 0}</span>
                    </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Approved Claims</span>
                <span className="text-lg font-semibold text-green-600">{claimStats?.approved || 0}</span>
                  </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Rejected Claims</span>
                <span className="text-lg font-semibold text-red-600">{claimStats?.rejected || 0}</span>
              </div>
            </div>
        </CardContent>
      </Card>
      </div>

      {/* System Health Status */}
      <Card className={`${dashboardTheme.card} border-gray-200 shadow-sm`}>
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
            System Health Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {healthLoading ? (
            <CardSkeleton lines={4} />
          ) : healthError ? (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{healthError}</p>
              </div>
          ) : healthStatus ? (
            <div className="space-y-4">
              {/* Overall Status - Compact */}
              <div className={`flex items-center justify-between p-4 rounded-lg border ${
                healthStatus.status === 'ok' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    healthStatus.status === 'ok' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {healthStatus.status === 'ok' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-0.5">Overall Status</p>
                    <p className={`text-lg font-bold ${
                      healthStatus.status === 'ok' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {healthStatus.status === 'ok' ? 'All Systems Operational' : 'System Issues Detected'}
                    </p>
                  </div>
                </div>
                <Badge className={`text-xs font-semibold px-3 py-1 ${
                  healthStatus.status === 'ok' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-red-600 text-white'
                }`}>
                  {healthStatus.status?.toUpperCase() || 'UNKNOWN'}
                </Badge>
              </div>

              {/* Health Details Grid - Compact Cards */}
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {healthStatus.details && Object.entries(healthStatus.details).map(([key, value]: [string, any]) => {
                  const isUp = value.status === 'up';
                  const iconMap: { [key: string]: any } = {
                    mongodb: Database,
                    memory_heap: Cpu,
                    memory_rss: HardDrive,
                    storage: HardDrive,
                  };
                  const IconComponent = iconMap[key.toLowerCase()] || Activity;
                  const displayName = key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
                  
                  return (
                    <div 
                      key={key} 
                      className={`p-4 rounded-lg border transition-all hover:shadow-sm ${
                        isUp 
                          ? 'bg-white border-green-200' 
                          : 'bg-white border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isUp ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                          <IconComponent className={`h-4 w-4 ${
                            isUp ? 'text-green-600' : 'text-red-600'
                          }`} />
                        </div>
                        <div className={`w-2 h-2 rounded-full ${
                          isUp ? 'bg-green-500' : 'bg-red-500'
                        } ${isUp ? 'animate-pulse' : ''}`}></div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{displayName}</p>
                        {value.state && (
                          <p className="text-xs text-gray-600 mb-1.5 capitalize">{value.state}</p>
                        )}
                        <Badge className={`text-xs font-medium px-2 py-0.5 ${
                          isUp 
                            ? 'bg-green-100 text-green-700 border-green-300' 
                            : 'bg-red-100 text-red-700 border-red-300'
                        } border`}>
                          {value.status?.toUpperCase() || 'UNKNOWN'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Server className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-600 mb-1">No health data available</p>
              <p className="text-xs text-gray-500">Click refresh to load health status</p>
            </div>
          )}
          </CardContent>
        </Card>
    </div>
  );

  // Handle deactivate user
  const handleDeactivateUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to deactivate this user?")) {
      return;
    }

    setUpdatingUserId(userId);
    try {
      await deactivateUser(userId);
      toast({
        title: "Success",
        description: "User deactivated successfully",
      });
      // Reload users
      await loadUsers();
    } catch (err: any) {
      console.error('Failed to deactivate user:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to deactivate user",
        variant: "destructive",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Handle view user details - navigate to user details page
  const handleViewUser = (userId: string) => {
    navigate(`/admin-dashboard/users/${userId}`);
  };

  // Handle edit user button click
  const handleEditUser = async (userId: string) => {
    try {
      // Load user data
      const response: any = await getUserById(userId);
      const userData = response.data || response;
      
      // Set selected user
      setSelectedUser(userData);
      
      // Populate edit form with user data
      setEditUserData({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        phoneNumber: userData.phoneNumber || "",
        province: userData.province || "",
        district: userData.district || "",
        sector: userData.sector || "",
        cell: userData.cell || "",
        village: userData.village || "",
        sex: userData.sex || "",
        active: userData.active !== false,
        farmerProfile: {
          farmProvince: userData.farmerProfile?.farmProvince || "",
          farmDistrict: userData.farmerProfile?.farmDistrict || "",
          farmSector: userData.farmerProfile?.farmSector || "",
          farmCell: userData.farmerProfile?.farmCell || "",
          farmVillage: userData.farmerProfile?.farmVillage || ""
        },
        assessorProfile: {
          specialization: userData.assessorProfile?.specialization || "",
          experienceYears: userData.assessorProfile?.experienceYears || 0,
          profilePhotoUrl: userData.assessorProfile?.profilePhotoUrl || "",
          bio: userData.assessorProfile?.bio || "",
          address: userData.assessorProfile?.address || ""
        },
        insurerProfile: {
          companyName: userData.insurerProfile?.companyName || "",
          contactPerson: userData.insurerProfile?.contactPerson || "",
          website: userData.insurerProfile?.website || "",
          address: userData.insurerProfile?.address || "",
          companyDescription: userData.insurerProfile?.companyDescription || "",
          licenseNumber: userData.insurerProfile?.licenseNumber || "",
          registrationDate: userData.insurerProfile?.registrationDate || "",
          companyLogoUrl: userData.insurerProfile?.companyLogoUrl || ""
        }
      });
      
      // Open edit dialog
      setShowEditUserDialog(true);
    } catch (err: any) {
      console.error('Failed to load user for editing:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to load user details",
        variant: "destructive",
      });
    }
  };

  // Handle update user
  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    const userId = selectedUser._id || selectedUser.id || selectedUser.userId;
    if (!userId) {
      toast({
        title: "Error",
        description: "User ID not found",
        variant: "destructive",
      });
      return;
    }

    setEditingUser(true);
    try {
      const updateData: any = {};

      // Add basic fields if they exist
      if (editUserData.firstName) updateData.firstName = editUserData.firstName;
      if (editUserData.lastName) updateData.lastName = editUserData.lastName;
      if (editUserData.email) updateData.email = editUserData.email;
      if (editUserData.phoneNumber) updateData.phoneNumber = editUserData.phoneNumber;
      if (editUserData.province) updateData.province = editUserData.province;
      if (editUserData.district) updateData.district = editUserData.district;
      if (editUserData.sector) updateData.sector = editUserData.sector;
      if (editUserData.cell) updateData.cell = editUserData.cell;
      if (editUserData.village) updateData.village = editUserData.village;
      if (editUserData.sex) updateData.sex = editUserData.sex;
      updateData.active = editUserData.active;

      // Add profile data based on role
      const userRole = selectedUser.role;
      if (userRole === 'FARMER' && editUserData.farmerProfile) {
        updateData.farmerProfile = editUserData.farmerProfile;
      } else if (userRole === 'ASSESSOR' && editUserData.assessorProfile) {
        updateData.assessorProfile = editUserData.assessorProfile;
      } else if (userRole === 'INSURER' && editUserData.insurerProfile) {
        updateData.insurerProfile = editUserData.insurerProfile;
      }

      console.log('Updating user with data:', JSON.stringify(updateData, null, 2));
      await updateUser(userId, updateData);

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      setShowEditUserDialog(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (err: any) {
      console.error('Failed to update user:', err);
      toast({
        title: "Error Updating User",
        description: err.message || "Failed to update user. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setEditingUser(false);
    }
  };

  // Handle create new user
  const handleCreateUser = async () => {
    // Validate required fields
    if (!newUserData.nationalId || !newUserData.email || !newUserData.phoneNumber || !newUserData.role) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (National ID, Email, Phone Number, Role)",
        variant: "destructive",
      });
      return;
    }

    setCreatingUser(true);
    let userDataToSend: any = null;
    
    try {
      // API only accepts these 4 required fields for user creation
      // Other fields (firstName, lastName, profiles, etc.) should be added via update endpoint after creation
      userDataToSend = {
        nationalId: newUserData.nationalId,
        email: newUserData.email,
        phoneNumber: newUserData.phoneNumber,
        role: newUserData.role
      };

      console.log('Creating user with data:', JSON.stringify(userDataToSend, null, 2)); // Debug log
      
      const response = await createUser(userDataToSend);
      
      // Note: The API's update endpoint also rejects these fields, so we skip the update step
      // Additional fields would need to be added through separate profile-specific endpoints if available
      // For now, user is created with just the required fields
      console.log('User created successfully. Additional fields should be added via profile update endpoints if available.');
      
      toast({
        title: "Success",
        description: "User created successfully",
      });
      // Reset form
      setNewUserData({
        nationalId: "",
        email: "",
        phoneNumber: "",
        role: "FARMER"
      });
      setShowAddUserDialog(false);
      // Reload users
      await loadUsers();
    } catch (err: any) {
      console.error('Failed to create user:', err);
      console.error('Error details:', err.message);
      if (userDataToSend) {
        console.error('User data that failed:', JSON.stringify(userDataToSend, null, 2));
      }
      
      // Show more detailed error message
      const errorMessage = err.message || "Failed to create user. Please check the console for details.";
      
      toast({
        title: "Error Creating User",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCreatingUser(false);
    }
  };

  // Filter users based on search query
  const filteredUsers = systemUsers.filter(user => {
    const query = searchQuery.toLowerCase();
    const userName = typeof user.name === 'string' ? user.name : '';
    const userEmail = typeof user.email === 'string' ? user.email : '';
    const userPhone = typeof user.phoneNumber === 'string' ? user.phoneNumber : '';
    const userRole = typeof user.role === 'string' ? user.role : '';
    const userRegion = typeof user.region === 'string' ? user.region : '';
    
    return (
      userName.toLowerCase().includes(query) ||
      userEmail.toLowerCase().includes(query) ||
      userPhone.toLowerCase().includes(query) ||
      userRole.toLowerCase().includes(query) ||
      userRegion.toLowerCase().includes(query)
    );
  });

  // User Management Page
  const renderUserManagement = () => (
    <div className="space-y-4 pt-6 pr-6">
      {/* Add User Dialog */}
          <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
            <DialogContent className={`${dashboardTheme.card} border-gray-800 max-w-2xl max-h-[90vh] overflow-y-auto`}>
              <DialogHeader>
                <DialogTitle className="text-gray-900 text-2xl">Add New User</DialogTitle>
                <DialogDescription className="text-gray-900/60 text-sm mt-2">
                  Create a new user account. Required fields are marked with *
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* Required Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nationalId" className="text-gray-900">National ID *</Label>
                    <Input
                      id="nationalId"
                      value={newUserData.nationalId}
                      onChange={(e) => setNewUserData({ ...newUserData, nationalId: e.target.value })}
                      className={`${dashboardTheme.input} border-gray-300`}
                      placeholder="1199012345678901"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-gray-900">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                      className={`${dashboardTheme.input} border-gray-300`}
                      placeholder="user@example.com"
                      required
                    />
        </div>
      </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phoneNumber" className="text-gray-900">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      value={newUserData.phoneNumber}
                      onChange={(e) => setNewUserData({ ...newUserData, phoneNumber: e.target.value })}
                      className={`${dashboardTheme.input} border-gray-300`}
                      placeholder="0721234567"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="role" className="text-gray-900">Role *</Label>
                    <Select
                      value={newUserData.role}
                      onValueChange={(value) => setNewUserData({ ...newUserData, role: value })}
                    >
                      <SelectTrigger className={dashboardTheme.select}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={dashboardTheme.card}>
                        <SelectItem value="FARMER">FARMER</SelectItem>
                        <SelectItem value="ASSESSOR">ASSESSOR</SelectItem>
                        <SelectItem value="INSURER">INSURER</SelectItem>
                        <SelectItem value="GOVERNMENT">GOVERNMENT</SelectItem>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddUserDialog(false)}
                    className="border-gray-300 text-gray-900 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateUser}
                    disabled={creatingUser}
                    className="bg-red-600 hover:bg-red-700 text-gray-900"
                  >
                    {creatingUser ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create User
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit User Dialog */}
          <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
            <DialogContent className={`${dashboardTheme.card} border-gray-800 max-w-2xl max-h-[90vh] overflow-y-auto`}>
              <DialogHeader>
                <DialogTitle className="text-gray-900 text-2xl">Edit User</DialogTitle>
                <DialogDescription className="text-gray-900/60 text-sm mt-2">
                  Update user information. Fields marked with * are required.
                </DialogDescription>
              </DialogHeader>
              {selectedUser && (
                <div className="space-y-4 mt-4">
                  {/* User Info (Read-only) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-900/60">National ID</Label>
                      <Input
                        value={selectedUser.nationalId || ""}
                        disabled
                        className={`${dashboardTheme.input} border-gray-300 opacity-50`}
                      />
                    </div>
                    <div>
                      <Label className="text-gray-900/60">Role</Label>
                      <Input
                        value={selectedUser.role || ""}
                        disabled
                        className={`${dashboardTheme.input} border-gray-300 opacity-50`}
                      />
                    </div>
                  </div>

                  {/* Basic Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editFirstName" className="text-gray-900">First Name</Label>
                      <Input
                        id="editFirstName"
                        value={editUserData.firstName}
                        onChange={(e) => setEditUserData({ ...editUserData, firstName: e.target.value })}
                        className={`${dashboardTheme.input} border-gray-300`}
                        placeholder="First Name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="editLastName" className="text-gray-900">Last Name</Label>
                      <Input
                        id="editLastName"
                        value={editUserData.lastName}
                        onChange={(e) => setEditUserData({ ...editUserData, lastName: e.target.value })}
                        className={`${dashboardTheme.input} border-gray-300`}
                        placeholder="Last Name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editEmail" className="text-gray-900">Email *</Label>
                      <Input
                        id="editEmail"
                        type="email"
                        value={editUserData.email}
                        onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                        className={`${dashboardTheme.input} border-gray-300`}
                        placeholder="user@example.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="editPhoneNumber" className="text-gray-900">Phone Number *</Label>
                      <Input
                        id="editPhoneNumber"
                        value={editUserData.phoneNumber}
                        onChange={(e) => setEditUserData({ ...editUserData, phoneNumber: e.target.value })}
                        className={`${dashboardTheme.input} border-gray-300`}
                        placeholder="0721234567"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editProvince" className="text-gray-900">Province</Label>
                      <Input
                        id="editProvince"
                        value={editUserData.province}
                        onChange={(e) => setEditUserData({ ...editUserData, province: e.target.value })}
                        className={`${dashboardTheme.input} border-gray-300`}
                        placeholder="Province"
                      />
                    </div>
                    <div>
                      <Label htmlFor="editDistrict" className="text-gray-900">District</Label>
                      <Input
                        id="editDistrict"
                        value={editUserData.district}
                        onChange={(e) => setEditUserData({ ...editUserData, district: e.target.value })}
                        className={`${dashboardTheme.input} border-gray-300`}
                        placeholder="District"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editSector" className="text-gray-900">Sector</Label>
                      <Input
                        id="editSector"
                        value={editUserData.sector}
                        onChange={(e) => setEditUserData({ ...editUserData, sector: e.target.value })}
                        className={`${dashboardTheme.input} border-gray-300`}
                        placeholder="Sector"
                      />
                    </div>
                    <div>
                      <Label htmlFor="editCell" className="text-gray-900">Cell</Label>
                      <Input
                        id="editCell"
                        value={editUserData.cell}
                        onChange={(e) => setEditUserData({ ...editUserData, cell: e.target.value })}
                        className={`${dashboardTheme.input} border-gray-300`}
                        placeholder="Cell"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editVillage" className="text-gray-900">Village</Label>
                      <Input
                        id="editVillage"
                        value={editUserData.village}
                        onChange={(e) => setEditUserData({ ...editUserData, village: e.target.value })}
                        className={`${dashboardTheme.input} border-gray-300`}
                        placeholder="Village"
                      />
                    </div>
                    <div>
                      <Label htmlFor="editSex" className="text-gray-900">Sex</Label>
                      <Select
                        value={editUserData.sex}
                        onValueChange={(value) => setEditUserData({ ...editUserData, sex: value })}
                      >
                        <SelectTrigger className={dashboardTheme.select}>
                          <SelectValue placeholder="Select sex" />
                        </SelectTrigger>
                        <SelectContent className={dashboardTheme.card}>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="editActive" className="text-gray-900 flex items-center gap-2">
                      <input
                        id="editActive"
                        type="checkbox"
                        checked={editUserData.active}
                        onChange={(e) => setEditUserData({ ...editUserData, active: e.target.checked })}
                        className="w-4 h-4"
                      />
                      Active
                    </Label>
                  </div>

                  {/* Role-specific Profile Fields */}

                  {selectedUser.role === 'ASSESSOR' && (
                    <div className="space-y-4 mt-4 pt-4 border-t border-gray-300">
                      <h3 className="text-gray-900 font-semibold">Assessor Profile</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="editSpecialization" className="text-gray-900">Specialization</Label>
                          <Input
                            id="editSpecialization"
                            value={editUserData.assessorProfile.specialization}
                            onChange={(e) => setEditUserData({
                              ...editUserData,
                              assessorProfile: { ...editUserData.assessorProfile, specialization: e.target.value }
                            })}
                            className={`${dashboardTheme.input} border-gray-300`}
                            placeholder="Specialization"
                          />
                        </div>
                        <div>
                          <Label htmlFor="editExperienceYears" className="text-gray-900">Experience Years</Label>
                          <Input
                            id="editExperienceYears"
                            type="number"
                            value={editUserData.assessorProfile.experienceYears}
                            onChange={(e) => setEditUserData({
                              ...editUserData,
                              assessorProfile: { ...editUserData.assessorProfile, experienceYears: parseInt(e.target.value) || 0 }
                            })}
                            className={`${dashboardTheme.input} border-gray-300`}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="editProfilePhotoUrl" className="text-gray-900">Profile Photo URL</Label>
                        <Input
                          id="editProfilePhotoUrl"
                          value={editUserData.assessorProfile.profilePhotoUrl}
                          onChange={(e) => setEditUserData({
                            ...editUserData,
                            assessorProfile: { ...editUserData.assessorProfile, profilePhotoUrl: e.target.value }
                          })}
                          className={`${dashboardTheme.input} border-gray-300`}
                          placeholder="https://example.com/photo.jpg"
                        />
                      </div>
                      <div>
                        <Label htmlFor="editAddress" className="text-gray-900">Address</Label>
                        <Input
                          id="editAddress"
                          value={editUserData.assessorProfile.address}
                          onChange={(e) => setEditUserData({
                            ...editUserData,
                            assessorProfile: { ...editUserData.assessorProfile, address: e.target.value }
                          })}
                          className={`${dashboardTheme.input} border-gray-300`}
                          placeholder="Address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="editBio" className="text-gray-900">Bio</Label>
                        <Textarea
                          id="editBio"
                          value={editUserData.assessorProfile.bio}
                          onChange={(e) => setEditUserData({
                            ...editUserData,
                            assessorProfile: { ...editUserData.assessorProfile, bio: e.target.value }
                          })}
                          className={`${dashboardTheme.input} border-gray-300 min-h-[100px]`}
                          placeholder="Bio"
                        />
                      </div>
                    </div>
                  )}

                  {selectedUser.role === 'INSURER' && (
                    <div className="space-y-4 mt-4 pt-4 border-t border-gray-300">
                      <h3 className="text-gray-900 font-semibold">Insurer Profile</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="editCompanyName" className="text-gray-900">Company Name</Label>
                          <Input
                            id="editCompanyName"
                            value={editUserData.insurerProfile.companyName}
                            onChange={(e) => setEditUserData({
                              ...editUserData,
                              insurerProfile: { ...editUserData.insurerProfile, companyName: e.target.value }
                            })}
                            className={`${dashboardTheme.input} border-gray-300`}
                            placeholder="Company Name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="editContactPerson" className="text-gray-900">Contact Person</Label>
                          <Input
                            id="editContactPerson"
                            value={editUserData.insurerProfile.contactPerson}
                            onChange={(e) => setEditUserData({
                              ...editUserData,
                              insurerProfile: { ...editUserData.insurerProfile, contactPerson: e.target.value }
                            })}
                            className={`${dashboardTheme.input} border-gray-300`}
                            placeholder="Contact Person"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="editWebsite" className="text-gray-900">Website</Label>
                          <Input
                            id="editWebsite"
                            value={editUserData.insurerProfile.website}
                            onChange={(e) => setEditUserData({
                              ...editUserData,
                              insurerProfile: { ...editUserData.insurerProfile, website: e.target.value }
                            })}
                            className={`${dashboardTheme.input} border-gray-300`}
                            placeholder="https://example.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="editInsurerAddress" className="text-gray-900">Address</Label>
                          <Input
                            id="editInsurerAddress"
                            value={editUserData.insurerProfile.address}
                            onChange={(e) => setEditUserData({
                              ...editUserData,
                              insurerProfile: { ...editUserData.insurerProfile, address: e.target.value }
                            })}
                            className={`${dashboardTheme.input} border-gray-300`}
                            placeholder="Company Address"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="editLicenseNumber" className="text-gray-900">License Number</Label>
                          <Input
                            id="editLicenseNumber"
                            value={editUserData.insurerProfile.licenseNumber}
                            onChange={(e) => setEditUserData({
                              ...editUserData,
                              insurerProfile: { ...editUserData.insurerProfile, licenseNumber: e.target.value }
                            })}
                            className={`${dashboardTheme.input} border-gray-300`}
                            placeholder="License Number"
                          />
                        </div>
                        <div>
                          <Label htmlFor="editRegistrationDate" className="text-gray-900">Registration Date</Label>
                          <Input
                            id="editRegistrationDate"
                            type="date"
                            value={editUserData.insurerProfile.registrationDate}
                            onChange={(e) => setEditUserData({
                              ...editUserData,
                              insurerProfile: { ...editUserData.insurerProfile, registrationDate: e.target.value }
                            })}
                            className={`${dashboardTheme.input} border-gray-300`}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="editCompanyLogoUrl" className="text-gray-900">Company Logo URL</Label>
                        <Input
                          id="editCompanyLogoUrl"
                          value={editUserData.insurerProfile.companyLogoUrl}
                          onChange={(e) => setEditUserData({
                            ...editUserData,
                            insurerProfile: { ...editUserData.insurerProfile, companyLogoUrl: e.target.value }
                          })}
                          className={`${dashboardTheme.input} border-gray-300`}
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                      <div>
                        <Label htmlFor="editCompanyDescription" className="text-gray-900">Company Description</Label>
                        <Textarea
                          id="editCompanyDescription"
                          value={editUserData.insurerProfile.companyDescription}
                          onChange={(e) => setEditUserData({
                            ...editUserData,
                            insurerProfile: { ...editUserData.insurerProfile, companyDescription: e.target.value }
                          })}
                          className={`${dashboardTheme.input} border-gray-300 min-h-[100px]`}
                          placeholder="Company description and overview"
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowEditUserDialog(false);
                        setSelectedUser(null);
                      }}
                      className="border-gray-300 text-gray-900 hover:bg-gray-100"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateUser}
                      disabled={editingUser}
                      className="bg-red-600 hover:bg-red-700 text-gray-900"
                    >
                      {editingUser ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Update User
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

      {/* Error Message */}
      {usersError && (
        <Card className={`${dashboardTheme.card} border-l-4 border-l-red-500`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <p className="text-red-400">{usersError}</p>
              </div>
              <Button
                onClick={loadUsers}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-900 hover:bg-gray-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Stats - Compact Design */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className={`${dashboardTheme.card} p-4 hover:shadow-md transition-shadow`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Users</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{userStats.total.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">All roles</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className={`${dashboardTheme.card} p-4 hover:shadow-md transition-shadow`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Active</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{userStats.active.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                <span className="font-medium text-green-600">
                  {userStats.total > 0 ? ((userStats.active / userStats.total) * 100).toFixed(1) : 0}%
                </span> active rate
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className={`${dashboardTheme.card} p-4 hover:shadow-md transition-shadow`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Inactive</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{userStats.inactive.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">Need attention</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className={`${dashboardTheme.card} p-4 hover:shadow-md transition-shadow`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">New This Month</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{userStats.newThisMonth}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">This month</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900">All Users</CardTitle>
            <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
              </div>
              <Button 
                className="bg-red-600 hover:bg-red-700"
                onClick={() => setShowAddUserDialog(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          {usersLoading ? (
            <Card className={dashboardTheme.card}>
              <CardContent className="p-0">
                <TableSkeleton rows={5} columns={5} />
              </CardContent>
            </Card>
          ) : filteredUsers.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 font-medium mb-1">No users found</p>
                <p className="text-sm text-gray-500 mb-4">
                  {searchQuery ? "Try adjusting your search criteria" : "No users available"}
                </p>
                {searchQuery && (
                  <Button
                    onClick={() => setSearchQuery("")}
                    variant="outline"
                    size="sm"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-4 px-6 text-gray-700 font-semibold text-xs uppercase tracking-wider">User</th>
                  <th className="text-left py-4 px-6 text-gray-700 font-semibold text-xs uppercase tracking-wider">Contact</th>
                  <th className="text-left py-4 px-6 text-gray-700 font-semibold text-xs uppercase tracking-wider">Role</th>
                  <th className="text-left py-4 px-6 text-gray-700 font-semibold text-xs uppercase tracking-wider">Location</th>
                  <th className="text-left py-4 px-6 text-gray-700 font-semibold text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.filter(user => user != null).map((user, index) => (
                  <tr 
                    key={user?.id || user?._id || index} 
                    className={`hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                  >
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                            {(() => {
                              const nameStr = typeof user.name === 'string' ? user.name : 
                                            typeof user.firstName === 'string' ? user.firstName :
                                            typeof user.lastName === 'string' ? user.lastName :
                                            'U';
                              return nameStr.charAt(0).toUpperCase();
                            })()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {(() => {
                              if (typeof user.name === 'string') return user.name;
                              const firstName = typeof user.firstName === 'string' ? user.firstName : '';
                              const lastName = typeof user.lastName === 'string' ? user.lastName : '';
                              const fullName = `${firstName} ${lastName}`.trim();
                              return fullName || 'Unknown User';
                            })()}
                          </div>
                            <div className="text-xs text-gray-500 mt-0.5">{user.userId || user.id || user._id || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900 flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          {typeof user.email === 'string' ? user.email : 'N/A'}
                        </div>
                        {user.phoneNumber && typeof user.phoneNumber === 'string' && (
                          <div className="text-xs text-gray-600 flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {user.phoneNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <Badge className={`text-xs font-medium px-2.5 py-1 ${
                          user.role === 'FARMER' || user.role === 'Farmer' ? 'bg-green-100 text-green-700 border-green-300' :
                          user.role === 'ASSESSOR' || user.role === 'Assessor' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                          user.role === 'INSURER' || user.role === 'Insurer' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                          user.role === 'GOVERNMENT' || user.role === 'Government' ? 'bg-purple-100 text-purple-700 border-purple-300' :
                          user.role === 'ADMIN' || user.role === 'Admin' ? 'bg-red-100 text-red-700 border-red-300' :
                          'bg-gray-100 text-gray-700 border-gray-300'
                      } border`}>
                        {typeof user.role === 'string' ? user.role : 'N/A'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {(() => {
                          // Safely extract location string from various possible structures
                          if (typeof user.region === 'string' && user.region) return user.region;
                          if (typeof user.province === 'string' && user.province) return user.province;
                          if (typeof user.district === 'string' && user.district) return user.district;
                          if (typeof user.sector === 'string' && user.sector) return user.sector;
                          if (typeof user.location === 'string' && user.location) return user.location;
                          return 'N/A';
                        })()}
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                        <Badge className={`text-xs font-medium px-2.5 py-1 border ${
                          user.active !== false 
                            ? 'bg-green-100 text-green-700 border-green-300' 
                            : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${
                            user.active !== false ? 'bg-green-500' : 'bg-gray-400'
                          }`}></span>
                          {user.active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Financial Management Page
  const renderFinancialManagement = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Management</h1>
          <p className="text-sm text-gray-600 mt-1">Track platform revenue and commission earnings</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={loadAdminStatistics}
            variant="outline"
            className="border-gray-300 text-gray-900 hover:bg-gray-100"
            disabled={statsLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-red-600 hover:bg-red-700">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {statsLoading && (
        <Card className={dashboardTheme.card}>
          <CardContent className="p-8 text-center">
            <img src="/loading.gif" alt="Loading" className="w-16 h-16 mx-auto" />
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {statsError && !statsLoading && (
        <Card className={`${dashboardTheme.card} border-l-4 border-l-red-500`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <p className="text-red-400">{statsError}</p>
              </div>
              <Button
                onClick={loadAdminStatistics}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-900 hover:bg-gray-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Policy Overview Section */}
      {policyOverview && !statsLoading && (
        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Policy Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-900/60 mb-1">Total Policies</p>
                <p className="text-2xl font-bold text-gray-900">
                  {policyOverview.totalPolicies || policyOverview.policies?.total || 0}
                </p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-900/60 mb-1">Active Policies</p>
                <p className="text-2xl font-bold text-gray-900">
                  {policyOverview.activePolicies || policyOverview.policies?.active || 0}
                </p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-900/60 mb-1">Total Premium</p>
                <p className="text-2xl font-bold text-gray-900">
                  RWF {policyOverview.totalPremium 
                    ? (policyOverview.totalPremium / 1000000).toFixed(1) 
                    : policyOverview.policies?.totalPremium 
                    ? (policyOverview.policies.totalPremium / 1000000).toFixed(1)
                    : 0}M
                </p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-900/60 mb-1">Pending Claims</p>
                <p className="text-2xl font-bold text-gray-900">
                  {policyOverview.pendingClaims || policyOverview.policies?.pendingClaims || 0}
                </p>
              </div>
            </div>
            {policyOverview.policies && (
              <div className="mt-4 text-sm text-gray-900/60">
                <pre className="bg-gray-50 border border-gray-200 p-4 rounded-lg overflow-auto text-gray-700">
                  {JSON.stringify(policyOverview.policies, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Claim Statistics Section */}
      {claimStats && !statsLoading && (
        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Claim Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-900/60 mb-1">Total Claims</p>
                <p className="text-2xl font-bold text-gray-900">
                  {claimStats.totalClaims || claimStats.claims?.total || 0}
                </p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-900/60 mb-1">Pending Claims</p>
                <p className="text-2xl font-bold text-gray-900">
                  {claimStats.pendingClaims || claimStats.claims?.pending || 0}
                </p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-900/60 mb-1">Approved Claims</p>
                <p className="text-2xl font-bold text-gray-900">
                  {claimStats.approvedClaims || claimStats.claims?.approved || 0}
                </p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-900/60 mb-1">Total Paid</p>
                <p className="text-2xl font-bold text-gray-900">
                  RWF {claimStats.totalPaid 
                    ? (claimStats.totalPaid / 1000000).toFixed(1) 
                    : claimStats.claims?.totalPaid 
                    ? (claimStats.claims.totalPaid / 1000000).toFixed(1)
                    : 0}M
                </p>
              </div>
            </div>
            {claimStats.claims && (
              <div className="mt-4 text-sm text-gray-900/60">
                <pre className="bg-gray-50 border border-gray-200 p-4 rounded-lg overflow-auto text-gray-700">
                  {JSON.stringify(claimStats.claims, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-4">
        <Card className={`${dashboardTheme.card} border-l-4 border-l-green-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              RWF {systemStats?.totalRevenue 
                ? (systemStats.totalRevenue / 1000000).toFixed(1) 
                : (financialData.totalRevenue / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-green-400 mt-1">All-time earnings</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-blue-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              RWF {systemStats?.monthlyRevenue 
                ? (systemStats.monthlyRevenue / 1000000).toFixed(1) 
                : (financialData.monthlyRevenue / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-green-400 mt-1">
              +{systemStats?.revenueGrowth || financialData.growthRate}% growth
            </p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-purple-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              RWF {systemStats?.commissionEarned 
                ? (systemStats.commissionEarned / 1000).toFixed(0) 
                : (financialData.commissionEarned / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-gray-900/60 mt-1">This month</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-yellow-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              RWF {systemStats?.pendingPayments 
                ? (systemStats.pendingPayments / 1000).toFixed(0) 
                : (financialData.pendingPayments / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-gray-900/60 mt-1">To be collected</p>
          </CardContent>
        </Card>
      </div>

      <Card className={dashboardTheme.card}>
        <CardHeader>
          <CardTitle className="text-gray-900">Revenue Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrends}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F9FAFB' }}
                  formatter={(value: number) => `RWF ${(value / 1000000).toFixed(1)}M`}
                />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                <Area type="monotone" dataKey="commission" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorCommission)" name="Commission" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className={dashboardTheme.card}>
        <CardHeader>
          <CardTitle className="text-gray-900">Commission Rate Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Rate</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Total Revenue</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Commission Earned</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {commissionRates.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-800 hover:bg-gray-100/50">
                    <td className="py-3 px-4 text-gray-900 font-medium">{item.type}</td>
                    <td className="py-3 px-4">
                      <Badge className="bg-purple-600">{item.rate}%</Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-900">RWF {(item.revenue / 1000000).toFixed(1)}M</td>
                    <td className="py-3 px-4 text-green-400 font-medium">
                      RWF {(item.commission / 1000000).toFixed(1)}M
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-green-600">{item.status}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm" className="text-gray-900/60 hover:text-gray-900">
                        <Edit className="h-4 w-4" />
                      </Button>
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

  // System Configuration Page
  const renderSystemConfig = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
        <p className="text-sm text-gray-600 mt-1">Configure platform settings and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Server className="h-5 w-5" />
              Server Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Server Status', value: 'Online', status: 'success' },
              { label: 'Database Size', value: `${systemMetrics.dbSize} GB`, status: 'info' },
              { label: 'API Version', value: 'v2.4.1', status: 'info' },
              { label: 'Backup Status', value: 'Last: 2 hours ago', status: 'success' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-sm text-gray-900/80">{item.label}</span>
                <Badge className={`${
                  item.status === 'success' ? 'bg-green-600' :
                  item.status === 'warning' ? 'bg-yellow-600' :
                  'bg-blue-600'
                }`}>
                  {item.value}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Backup Database
            </Button>
            <Button className="w-full bg-green-600 hover:bg-green-700">
              <Upload className="h-4 w-4 mr-2" />
              Restore from Backup
            </Button>
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" className="w-full border-gray-300 text-gray-900 hover:bg-gray-100">
              <Settings className="h-4 w-4 mr-2" />
              Database Settings
            </Button>
          </CardContent>
        </Card>

        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Two-Factor Authentication', enabled: true },
              { label: 'IP Whitelisting', enabled: true },
              { label: 'SSL/TLS Encryption', enabled: true },
              { label: 'Session Timeout', enabled: true }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-sm text-gray-900/80">{item.label}</span>
                <div className={`w-12 h-6 rounded-full ${item.enabled ? 'bg-green-600' : 'bg-gray-600'} relative cursor-pointer`}>
                  <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all ${item.enabled ? 'right-0.5' : 'left-0.5'}`} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'System Alerts', enabled: true },
              { label: 'Security Alerts', enabled: true },
              { label: 'Performance Alerts', enabled: true },
              { label: 'User Activity Alerts', enabled: false }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-sm text-gray-900/80">{item.label}</span>
                <div className={`w-12 h-6 rounded-full ${item.enabled ? 'bg-red-600' : 'bg-gray-600'} relative cursor-pointer`}>
                  <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all ${item.enabled ? 'right-0.5' : 'left-0.5'}`} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Activity Logs Page
  const renderActivityLogs = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-sm text-gray-600 mt-1">Monitor all system activities and user actions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-100">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button className="bg-red-600 hover:bg-red-700">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className={`${dashboardTheme.card} border-l-4 border-l-blue-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">15,247</div>
            <p className="text-xs text-gray-900/60 mt-1">Last 30 days</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-green-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Success</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">14,892</div>
            <p className="text-xs text-green-400 mt-1">97.7% success rate</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-yellow-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">298</div>
            <p className="text-xs text-gray-900/60 mt-1">Need review</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-red-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">57</div>
            <p className="text-xs text-red-400 mt-1">0.4% error rate</p>
          </CardContent>
        </Card>
      </div>

      <Card className={dashboardTheme.card}>
        <CardHeader>
          <CardTitle className="text-gray-900">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div 
                key={activity.id} 
                className={`p-4 rounded-lg border-l-4 ${
                  activity.severity === 'success' ? 'bg-green-500/10 border-l-green-500' :
                  activity.severity === 'warning' ? 'bg-yellow-500/10 border-l-yellow-500' :
                  activity.severity === 'error' ? 'bg-red-500/10 border-l-red-500' :
                  'bg-blue-500/10 border-l-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${
                        activity.severity === 'success' ? 'bg-green-600' :
                        activity.severity === 'warning' ? 'bg-yellow-600' :
                        activity.severity === 'error' ? 'bg-red-600' :
                        'bg-blue-600'
                      }`}>
                        {activity.type.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-gray-900/60">{activity.timestamp}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">{activity.action}</h4>
                    <p className="text-xs text-gray-900/70">User: {activity.user} • {activity.details}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-gray-900/60 hover:text-gray-900">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Analytics Page
  const renderAnalytics = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-sm text-gray-600 mt-1">Deep insights into platform performance and usage</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-100">
            <Calendar className="h-4 w-4 mr-2" />
            Last 30 Days
          </Button>
          <Button className="bg-red-600 hover:bg-red-700">
            <Download className="h-4 w-4 mr-2" />
            Export Analytics
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {statsLoading && (
        <Card className={dashboardTheme.card}>
          <CardContent className="p-8 text-center">
            <img src="/loading.gif" alt="Loading" className="w-16 h-16 mx-auto" />
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {statsError && !statsLoading && (
        <Card className={`${dashboardTheme.card} border-l-4 border-l-red-500`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <p className="text-red-400">{statsError}</p>
              </div>
              <Button
                onClick={loadAdminStatistics}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-900 hover:bg-gray-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Statistics Section */}
      {!statsLoading && (
        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemStats?.totalUsers || systemStats?.users?.total || analyticsUsers.length || 0}
                </p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Policies</p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemStats?.totalPolicies || systemStats?.policies?.total || analyticsPolicies.length || 0}
                </p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Claims</p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemStats?.totalClaims || systemStats?.claims?.total || analyticsClaims.length || 0}
                </p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Farms</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsFarms.length || systemStats?.totalFarms || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className={`${dashboardTheme.card} border-l-4 border-l-blue-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">Active Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {analyticsPolicies.filter((p: any) => (p.status || '').toLowerCase() === 'active').length || 
               policyOverview?.activePolicies || 
               systemStats?.activePolicies || 
               0}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {analyticsPolicies.length > 0 
                ? `${((analyticsPolicies.filter((p: any) => (p.status || '').toLowerCase() === 'active').length / analyticsPolicies.length) * 100).toFixed(1)}% of total`
                : 'No data'}
            </p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-green-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">Pending Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {analyticsClaims.filter((c: any) => (c.status || '').toLowerCase() === 'pending').length || 
               claimStats?.pendingClaims || 
               systemStats?.pendingClaims || 
               0}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {analyticsClaims.length > 0 
                ? `${((analyticsClaims.filter((c: any) => (c.status || '').toLowerCase() === 'pending').length / analyticsClaims.length) * 100).toFixed(1)}% of total`
                : 'No data'}
            </p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-purple-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">Approved Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {analyticsClaims.filter((c: any) => (c.status || '').toLowerCase() === 'approved').length || 
               claimStats?.approvedClaims || 
               systemStats?.approvedClaims || 
               0}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {analyticsClaims.length > 0 
                ? `${((analyticsClaims.filter((c: any) => (c.status || '').toLowerCase() === 'approved').length / analyticsClaims.length) * 100).toFixed(1)}% of total`
                : 'No data'}
            </p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-orange-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">Policy Coverage Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {analyticsUsers.length > 0 && analyticsPolicies.length > 0
                ? `${((analyticsPolicies.length / analyticsUsers.filter((u: any) => u.role === 'FARMER').length) * 100).toFixed(1)}%`
                : systemStats?.conversionRate || '0'}%
            </div>
            <p className="text-xs text-gray-600 mt-1">Farmers with policies</p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Analytics */}
      <Card className={dashboardTheme.card}>
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            User Distribution by Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {analyticsLoading ? (
              <div className="flex items-center justify-center h-full">
                <img src="/loading.gif" alt="Loading" className="w-16 h-16" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={(() => {
                  const farmers = analyticsUsers.filter((u: any) => (u.role || '').toUpperCase() === 'FARMER').length;
                  const assessors = analyticsUsers.filter((u: any) => (u.role || '').toUpperCase() === 'ASSESSOR').length;
                  const insurers = analyticsUsers.filter((u: any) => (u.role || '').toUpperCase() === 'INSURER').length;
                  const admins = analyticsUsers.filter((u: any) => (u.role || '').toUpperCase() === 'ADMIN').length;
                  const government = analyticsUsers.filter((u: any) => (u.role || '').toUpperCase() === 'GOVERNMENT').length;
                  return [
                    { role: 'Farmers', count: farmers, total: analyticsUsers.length },
                    { role: 'Assessors', count: assessors, total: analyticsUsers.length },
                    { role: 'Insurers', count: insurers, total: analyticsUsers.length },
                    { role: 'Admins', count: admins, total: analyticsUsers.length },
                    { role: 'Government', count: government, total: analyticsUsers.length }
                  ];
                })()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="role" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', color: '#111827' }}
                    labelStyle={{ color: '#111827' }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#10B981" name="User Count" />
                  <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} name="Total Users" />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Policy Statistics */}
        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Policy Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(() => {
                const total = analyticsPolicies.length;
                const active = analyticsPolicies.filter((p: any) => (p.status || '').toLowerCase() === 'active').length;
                const pending = analyticsPolicies.filter((p: any) => (p.status || '').toLowerCase() === 'pending').length;
                const expired = analyticsPolicies.filter((p: any) => (p.status || '').toLowerCase() === 'expired').length;
                const cancelled = analyticsPolicies.filter((p: any) => (p.status || '').toLowerCase() === 'cancelled').length;
                
                return [
                  { feature: "Active Policies", count: active, percentage: total > 0 ? (active / total * 100) : 0 },
                  { feature: "Pending Policies", count: pending, percentage: total > 0 ? (pending / total * 100) : 0 },
                  { feature: "Expired Policies", count: expired, percentage: total > 0 ? (expired / total * 100) : 0 },
                  { feature: "Cancelled Policies", count: cancelled, percentage: total > 0 ? (cancelled / total * 100) : 0 },
                  { feature: "Total Policies", count: total, percentage: 100 }
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">{item.feature}</span>
                      <span className="font-medium text-gray-900">{item.count} ({item.percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Claim Statistics */}
        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Claim Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(() => {
                const total = analyticsClaims.length;
                const pending = analyticsClaims.filter((c: any) => (c.status || '').toLowerCase() === 'pending').length;
                const approved = analyticsClaims.filter((c: any) => (c.status || '').toLowerCase() === 'approved').length;
                const rejected = analyticsClaims.filter((c: any) => (c.status || '').toLowerCase() === 'rejected').length;
                const inReview = analyticsClaims.filter((c: any) => (c.status || '').toLowerCase() === 'in_review' || (c.status || '').toLowerCase() === 'in review').length;
                
                return [
                  { status: "Pending", count: pending, percentage: total > 0 ? (pending / total * 100) : 0 },
                  { status: "Approved", count: approved, percentage: total > 0 ? (approved / total * 100) : 0 },
                  { status: "In Review", count: inReview, percentage: total > 0 ? (inReview / total * 100) : 0 },
                  { status: "Rejected", count: rejected, percentage: total > 0 ? (rejected / total * 100) : 0 },
                  { status: "Total Claims", count: total, percentage: 100 }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs text-gray-700 w-24">{item.status}</span>
                    <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                      <div 
                        className={`h-full flex items-center px-2 ${
                          item.status === 'Approved' ? 'bg-green-100' :
                          item.status === 'Pending' ? 'bg-yellow-100' :
                          item.status === 'Rejected' ? 'bg-red-100' :
                          'bg-blue-100'
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      >
                        <span className="text-xs font-medium text-gray-900">{item.count} ({item.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Distribution by Role */}
      <Card className={dashboardTheme.card}>
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            User Distribution by Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {(() => {
              const total = analyticsUsers.length;
              const farmers = analyticsUsers.filter((u: any) => (u.role || '').toUpperCase() === 'FARMER').length;
              const assessors = analyticsUsers.filter((u: any) => (u.role || '').toUpperCase() === 'ASSESSOR').length;
              const insurers = analyticsUsers.filter((u: any) => (u.role || '').toUpperCase() === 'INSURER').length;
              const admins = analyticsUsers.filter((u: any) => (u.role || '').toUpperCase() === 'ADMIN').length;
              const government = analyticsUsers.filter((u: any) => (u.role || '').toUpperCase() === 'GOVERNMENT').length;
              
              return [
                { role: "Farmers", count: farmers, percentage: total > 0 ? (farmers / total * 100) : 0, color: "bg-green-500" },
                { role: "Assessors", count: assessors, percentage: total > 0 ? (assessors / total * 100) : 0, color: "bg-orange-500" },
                { role: "Insurers", count: insurers, percentage: total > 0 ? (insurers / total * 100) : 0, color: "bg-blue-500" },
                { role: "Admins", count: admins, percentage: total > 0 ? (admins / total * 100) : 0, color: "bg-purple-500" },
                { role: "Government", count: government, percentage: total > 0 ? (government / total * 100) : 0, color: "bg-indigo-500" }
              ].map((item, idx) => (
                <Card key={idx} className="bg-gray-50 border border-gray-200">
                  <CardContent className="p-4">
                    <div className={`w-full h-2 ${item.color} rounded-full mb-3`} />
                    <div className="text-sm font-medium text-gray-700">{item.role}</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">{item.count.toLocaleString()}</div>
                    <div className="text-xs text-gray-600 mt-1">{item.percentage.toFixed(1)}% of total</div>
                  </CardContent>
                </Card>
              ));
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Policy Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(() => {
                const total = analyticsPolicies.length;
                const active = analyticsPolicies.filter((p: any) => (p.status || '').toLowerCase() === 'active').length;
                const pending = analyticsPolicies.filter((p: any) => (p.status || '').toLowerCase() === 'pending').length;
                const expired = analyticsPolicies.filter((p: any) => (p.status || '').toLowerCase() === 'expired').length;
                
                return [
                  { label: "Active Policies", value: active, percentage: total > 0 ? (active / total * 100) : 0, color: "bg-green-500" },
                  { label: "Pending Policies", value: pending, percentage: total > 0 ? (pending / total * 100) : 0, color: "bg-yellow-500" },
                  { label: "Expired Policies", value: expired, percentage: total > 0 ? (expired / total * 100) : 0, color: "bg-gray-500" },
                  { label: "Total Policies", value: total, percentage: 100, color: "bg-blue-500" }
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">{item.label}</span>
                      <span className="font-medium text-gray-900">{item.value}</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>

        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(() => {
                const total = analyticsUsers.length;
                const active = analyticsUsers.filter((u: any) => u.active !== false).length;
                const inactive = analyticsUsers.filter((u: any) => u.active === false).length;
                const farmers = analyticsUsers.filter((u: any) => (u.role || '').toUpperCase() === 'FARMER').length;
                
                return [
                  { label: "Active Users", value: active, percentage: total > 0 ? (active / total * 100) : 0, color: "bg-green-500" },
                  { label: "Inactive Users", value: inactive, percentage: total > 0 ? (inactive / total * 100) : 0, color: "bg-gray-500" },
                  { label: "Farmers", value: farmers, percentage: total > 0 ? (farmers / total * 100) : 0, color: "bg-blue-500" },
                  { label: "Total Users", value: total, percentage: 100, color: "bg-purple-500" }
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">{item.label}</span>
                      <span className="font-medium text-gray-900">{item.value} ({item.percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>

        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Platform Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { metric: "Total Users", value: analyticsUsers.length.toLocaleString(), color: "text-gray-700" },
                { metric: "Total Policies", value: analyticsPolicies.length.toLocaleString(), color: "text-gray-700" },
                { metric: "Total Claims", value: analyticsClaims.length.toLocaleString(), color: "text-gray-700" },
                { metric: "Total Farms", value: analyticsFarms.length.toLocaleString(), color: "text-gray-700" },
                { metric: "Avg Response Time", value: systemStats?.avgResponseTime ? `${systemStats.avgResponseTime}ms` : 'N/A', color: "text-gray-700" }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-sm text-gray-700">{item.metric}</span>
                  <span className={`text-sm font-medium ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Database Management Page
  const renderDatabase = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Database Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage database operations and backups</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-100">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
          <Button className="bg-red-600 hover:bg-red-700">
            <Settings className="h-4 w-4 mr-2" />
            DB Settings
          </Button>
        </div>
      </div>

      {/* Database Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className={`${dashboardTheme.card} border-l-4 border-l-blue-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Database Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{systemMetrics.dbSize} GB</div>
            <p className="text-xs text-gray-900/60 mt-1">+2.3 GB this month</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-green-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">1.2M</div>
            <p className="text-xs text-green-400 mt-1">+45K this week</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-purple-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Active Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">234</div>
            <p className="text-xs text-gray-900/60 mt-1">Real-time</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-orange-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Query Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">45ms</div>
            <p className="text-xs text-green-400 mt-1">Avg query time</p>
          </CardContent>
        </Card>
      </div>

      {/* Database Tables */}
      <Card className={dashboardTheme.card}>
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Tables Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Table Name</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Records</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Size</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Growth</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Last Updated</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { table: "users", records: 8450, size: "245 MB", growth: "+2.3%", updated: "2 min ago" },
                  { table: "policies", records: 5900, size: "892 MB", growth: "+5.1%", updated: "5 min ago" },
                  { table: "claims", records: 305, size: "128 MB", growth: "+1.8%", updated: "10 min ago" },
                  { table: "assessments", records: 2847, size: "456 MB", growth: "+3.2%", updated: "15 min ago" },
                  { table: "farmers", records: 7950, size: "512 MB", growth: "+4.5%", updated: "20 min ago" },
                  { table: "insurers", records: 4, size: "2 MB", growth: "0%", updated: "1 day ago" },
                  { table: "transactions", records: 15678, size: "1.2 GB", growth: "+8.7%", updated: "1 min ago" },
                  { table: "activity_logs", records: 234567, size: "3.8 GB", growth: "+12.5%", updated: "30 sec ago" }
                ].map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-800 hover:bg-gray-100/50">
                    <td className="py-3 px-4 font-medium text-gray-900">{item.table}</td>
                    <td className="py-3 px-4 text-gray-900">{item.records.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-900">{item.size}</td>
                    <td className="py-3 px-4">
                      <Badge className={
                        parseFloat(item.growth) > 5 ? 'bg-green-600' :
                        parseFloat(item.growth) > 0 ? 'bg-blue-600' :
                        'bg-gray-600'
                      }>
                        {item.growth}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-900/60 text-sm">{item.updated}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-gray-900/60 hover:text-gray-900">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-900/60 hover:text-gray-900">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Backup Management */}
        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Backup Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-400">Last Backup</span>
                <Badge className="bg-green-600">Success</Badge>
              </div>
              <p className="text-xs text-gray-900/60">March 15, 2024 at 02:00 AM</p>
              <p className="text-xs text-gray-900/60 mt-1">Size: 15.2 GB • Duration: 12 minutes</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900/80">Backup Schedule</h4>
              {[
                { type: "Full Backup", schedule: "Daily at 02:00 AM", status: "active" },
                { type: "Incremental", schedule: "Every 6 hours", status: "active" },
                { type: "Transaction Log", schedule: "Every hour", status: "active" }
              ].map((backup, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{backup.type}</div>
                    <div className="text-xs text-gray-900/60">{backup.schedule}</div>
                  </div>
                  <Badge className="bg-green-600">{backup.status}</Badge>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-4">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Upload className="h-4 w-4 mr-2" />
                Backup Now
              </Button>
              <Button variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-100">
                <Download className="h-4 w-4 mr-2" />
                Restore
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Database Performance */}
        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Database Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-900/80">Query Cache Hit Ratio</span>
                <span className="font-medium text-green-400">96.8%</span>
              </div>
              <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '96.8%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-900/80">Connection Pool Usage</span>
                <span className="font-medium text-blue-400">68.5%</span>
              </div>
              <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '68.5%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-900/80">Index Efficiency</span>
                <span className="font-medium text-purple-400">94.2%</span>
              </div>
              <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: '94.2%' }} />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-300 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-900/70">Avg Query Time</span>
                <span className="font-medium text-gray-900">45ms</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-900/70">Slow Queries (&gt;1s)</span>
                <span className="font-medium text-yellow-400">3</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-900/70">Deadlocks</span>
                <span className="font-medium text-green-400">0</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-900/70">Replication Lag</span>
                <span className="font-medium text-green-400">0ms</span>
              </div>
            </div>

            <Button variant="outline" className="w-full border-gray-300 text-gray-900 hover:bg-gray-100 mt-4">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Detailed Metrics
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Database Operations */}
      <Card className={dashboardTheme.card}>
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Database Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button className="bg-green-600 hover:bg-green-700 h-auto py-4 flex-col">
              <Database className="h-6 w-6 mb-2" />
              <span>Optimize Tables</span>
              <span className="text-xs mt-1 opacity-80">Improve performance</span>
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 h-auto py-4 flex-col">
              <RefreshCw className="h-6 w-6 mb-2" />
              <span>Rebuild Indexes</span>
              <span className="text-xs mt-1 opacity-80">Update all indexes</span>
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700 h-auto py-4 flex-col">
              <Trash2 className="h-6 w-6 mb-2" />
              <span>Clear Cache</span>
              <span className="text-xs mt-1 opacity-80">Reset query cache</span>
            </Button>
            <Button variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-100 h-auto py-4 flex-col">
              <Download className="h-6 w-6 mb-2" />
              <span>Export Schema</span>
              <span className="text-xs mt-1 opacity-80">Database structure</span>
            </Button>
            <Button variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-100 h-auto py-4 flex-col">
              <Upload className="h-6 w-6 mb-2" />
              <span>Import Data</span>
              <span className="text-xs mt-1 opacity-80">Bulk import</span>
            </Button>
            <Button variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-100 h-auto py-4 flex-col">
              <Eye className="h-6 w-6 mb-2" />
              <span>View Queries</span>
              <span className="text-xs mt-1 opacity-80">Active queries</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Security Management Page
  const renderSecurity = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security & Access Control</h1>
          <p className="text-sm text-gray-600 mt-1">Manage platform security and user permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-100">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
          <Button className="bg-red-600 hover:bg-red-700">
            <Download className="h-4 w-4 mr-2" />
            Security Report
          </Button>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className={`${dashboardTheme.card} border-l-4 border-l-green-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Security Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">98.5%</div>
            <p className="text-xs text-green-400 mt-1">Excellent</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-blue-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Active 2FA Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">7,890</div>
            <p className="text-xs text-gray-900/60 mt-1">93.4% enabled</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-yellow-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Failed Logins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">23</div>
            <p className="text-xs text-gray-900/60 mt-1">Last 24 hours</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-red-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Blocked IPs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">12</div>
            <p className="text-xs text-red-400 mt-1">Auto-blocked</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Features */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Features Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { feature: "SSL/TLS Encryption", status: "enabled", strength: "Strong" },
              { feature: "Two-Factor Authentication", status: "enabled", strength: "Strong" },
              { feature: "Password Encryption", status: "enabled", strength: "Strong" },
              { feature: "Session Management", status: "enabled", strength: "Good" },
              { feature: "IP Whitelisting", status: "enabled", strength: "Good" },
              { feature: "Rate Limiting", status: "enabled", strength: "Strong" },
              { feature: "CORS Protection", status: "enabled", strength: "Strong" },
              { feature: "SQL Injection Prevention", status: "enabled", strength: "Strong" }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-900">{item.feature}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={
                    item.strength === 'Strong' ? 'bg-green-600' :
                    item.strength === 'Good' ? 'bg-blue-600' :
                    'bg-yellow-600'
                  }>
                    {item.strength}
                  </Badge>
                  <Badge className="bg-green-600">{item.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Security Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { type: "warning", title: "Multiple failed login attempts", ip: "192.168.1.45", time: "5 min ago" },
                { type: "info", title: "New device login detected", user: "john.uwase@example.com", time: "15 min ago" },
                { type: "success", title: "Security scan completed", details: "No vulnerabilities found", time: "1 hour ago" },
                { type: "warning", title: "Unusual API activity", details: "High request rate from IP", time: "2 hours ago" }
              ].map((alert, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-lg border-l-4 ${
                    alert.type === 'warning' ? 'bg-yellow-500/10 border-l-yellow-500' :
                    alert.type === 'info' ? 'bg-blue-500/10 border-l-blue-500' :
                    'bg-green-500/10 border-l-green-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${
                          alert.type === 'warning' ? 'bg-yellow-600' :
                          alert.type === 'info' ? 'bg-blue-600' :
                          'bg-green-600'
                        }`}>
                          {alert.type.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-900/60">{alert.time}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">{alert.title}</h4>
                      {alert.ip && <p className="text-xs text-gray-900/70 mt-1">IP: {alert.ip}</p>}
                      {alert.user && <p className="text-xs text-gray-900/70 mt-1">User: {alert.user}</p>}
                      {alert.details && <p className="text-xs text-gray-900/70 mt-1">{alert.details}</p>}
                    </div>
                    <Button variant="ghost" size="sm" className="text-gray-900/60 hover:text-gray-900">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Access Control */}
      <Card className={dashboardTheme.card}>
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Role-Based Access Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Role</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Users</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Permissions</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Last Modified</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { role: "Super Admin", users: 3, permissions: ["All"], modified: "2024-01-15" },
                  { role: "Farmer", users: 7950, permissions: ["View Policies", "File Claims", "Update Profile"], modified: "2024-03-10" },
                  { role: "Assessor", users: 24, permissions: ["View Assessments", "Submit Reports", "Update Status"], modified: "2024-03-12" },
                  { role: "Insurer", users: 4, permissions: ["Manage Policies", "Process Claims", "View Analytics"], modified: "2024-03-14" },
                  { role: "Government", users: 2, permissions: ["View All Data", "Generate Reports", "Export Data"], modified: "2024-03-01" }
                ].map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-800 hover:bg-gray-100/50">
                    <td className="py-3 px-4 font-medium text-gray-900">{item.role}</td>
                    <td className="py-3 px-4 text-gray-900">{item.users.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {item.permissions.slice(0, 2).map((perm, pIdx) => (
                          <Badge key={pIdx} variant="outline" className="text-xs border-gray-600">
                            {perm}
                          </Badge>
                        ))}
                        {item.permissions.length > 2 && (
                          <Badge variant="outline" className="text-xs border-gray-600">
                            +{item.permissions.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900/60 text-sm">{item.modified}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-gray-900/60 hover:text-gray-900">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-900/60 hover:text-gray-900">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Security Actions */}
      <Card className={dashboardTheme.card}>
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Security Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button className="bg-red-600 hover:bg-red-700 h-auto py-4 flex-col">
              <Lock className="h-6 w-6 mb-2" />
              <span>Force Password Reset</span>
              <span className="text-xs mt-1 opacity-80">All users</span>
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700 h-auto py-4 flex-col">
              <Shield className="h-6 w-6 mb-2" />
              <span>Run Security Scan</span>
              <span className="text-xs mt-1 opacity-80">Full system audit</span>
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700 h-auto py-4 flex-col">
              <WifiOff className="h-6 w-6 mb-2" />
              <span>Revoke Sessions</span>
              <span className="text-xs mt-1 opacity-80">End all sessions</span>
            </Button>
            <Button variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-100 h-auto py-4 flex-col">
              <FileText className="h-6 w-6 mb-2" />
              <span>View Audit Logs</span>
              <span className="text-xs mt-1 opacity-80">Security events</span>
            </Button>
            <Button variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-100 h-auto py-4 flex-col">
              <Key className="h-6 w-6 mb-2" />
              <span>Manage API Keys</span>
              <span className="text-xs mt-1 opacity-80">Access tokens</span>
            </Button>
            <Button variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-100 h-auto py-4 flex-col">
              <Globe className="h-6 w-6 mb-2" />
              <span>IP Whitelist</span>
              <span className="text-xs mt-1 opacity-80">Manage IPs</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Login History */}
      <Card className={dashboardTheme.card}>
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Login Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { user: "admin@nexus.com", ip: "192.168.1.100", location: "Kigali, Rwanda", time: "2 min ago", status: "success" },
              { user: "john.uwase@example.com", ip: "192.168.1.101", location: "Musanze, Rwanda", time: "15 min ago", status: "success" },
              { user: "unknown", ip: "45.123.45.67", location: "Unknown", time: "30 min ago", status: "failed" },
              { user: "alice.m@example.com", ip: "192.168.1.102", location: "Kigali, Rwanda", time: "1 hour ago", status: "success" },
              { user: "david.n@insurance.rw", ip: "192.168.1.103", location: "Huye, Rwanda", time: "2 hours ago", status: "success" }
            ].map((login, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    login.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{login.user}</div>
                    <div className="text-xs text-gray-900/60">
                      {login.ip} • {login.location}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={login.status === 'success' ? 'bg-green-600' : 'bg-red-600'}>
                    {login.status}
                  </Badge>
                  <div className="text-xs text-gray-900/60 mt-1">{login.time}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Settings Page
  const renderSettings = () => {
    const profile = adminProfile || {
      _id: adminId,
      userId: adminId,
      email: getEmail() || "",
      phoneNumber: getPhoneNumber() || "",
      firstName: adminName ? adminName.split(' ')[0] || "" : "",
      lastName: adminName ? adminName.split(' ').slice(1).join(' ') || "" : "",
      role: "ADMIN",
      active: true
    };

    return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-600 mt-1">Configure your admin preferences</p>
        </div>
      </div>

        {/* Error State */}
        {adminProfileError && (
          <Card className={`${dashboardTheme.card} border-l-4 border-l-red-500`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <p className="text-red-400">{adminProfileError}</p>
                </div>
                <Button
                  onClick={loadAdminProfile}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {adminProfileLoading && !adminProfile && (
          <Card className={dashboardTheme.card}>
            <CardContent className="p-8 text-center">
              <img src="/loading.gif" alt="Loading" className="w-16 h-16 mx-auto" />
            </CardContent>
          </Card>
        )}

        {!adminProfileLoading && (
      <div className="grid gap-6 md:grid-cols-2">
        <Card className={dashboardTheme.card}>
          <CardHeader>
                <CardTitle className="text-gray-700 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
                  <label className="text-sm text-gray-600 block mb-2">Admin ID</label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                    {profile.userId || profile._id || adminId}
                  </div>
            </div>
            <div>
                  <label className="text-sm text-gray-600 block mb-2">Name</label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                    {profile.firstName && profile.lastName 
                      ? `${profile.firstName} ${profile.lastName}` 
                      : (typeof profile.name === 'string' ? profile.name : '') || adminName}
                  </div>
            </div>
            <div>
                  <label className="text-sm text-gray-600 block mb-2">Email</label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                    {profile.email || getEmail() || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-2">Phone Number</label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                    {profile.phoneNumber || getPhoneNumber() || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-2">Role</label>
              <Badge className="bg-red-600">Super Administrator</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className={dashboardTheme.card}>
          <CardHeader>
                <CardTitle className="text-gray-700 flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700"
                  onClick={() => setShowChangePasswordDialog(true)}
                >
              <Key className="h-4 w-4 mr-2" />
              Change Password
            </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-100"
                  onClick={() => setShow2FADialog(true)}
                >
              <Shield className="h-4 w-4 mr-2" />
                  {profile.twoFactorEnabled ? 'Disable' : 'Enable'} 2FA
            </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    setShowLoginHistoryDialog(true);
                    loadLoginHistory();
                  }}
                >
              <Eye className="h-4 w-4 mr-2" />
              View Login History
            </Button>
          </CardContent>
        </Card>
      </div>
        )}

        {/* Change Password Dialog */}
        <Dialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
          <DialogContent className={`${dashboardTheme.card} border-gray-800 max-w-md`}>
            <DialogHeader>
              <DialogTitle className="text-gray-900 text-2xl">Change Password</DialogTitle>
              <DialogDescription className="text-gray-900/60 text-sm mt-2">
                Enter your current password and choose a new one
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="currentPassword" className="text-gray-900">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className={`${dashboardTheme.input} border-gray-300`}
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <Label htmlFor="newPassword" className="text-gray-900">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className={`${dashboardTheme.input} border-gray-300`}
                  placeholder="Enter new password (min 8 characters)"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="text-gray-900">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className={`${dashboardTheme.input} border-gray-300`}
                  placeholder="Confirm new password"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowChangePasswordDialog(false);
                    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  }}
                  className="border-gray-300 text-gray-900 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="bg-red-600 hover:bg-red-700 text-gray-900"
                >
                  {changingPassword ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 2FA Dialog */}
        <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
          <DialogContent className={`${dashboardTheme.card} border-gray-800 max-w-md`}>
            <DialogHeader>
              <DialogTitle className="text-gray-900 text-2xl">
                {profile.twoFactorEnabled ? 'Disable' : 'Enable'} Two-Factor Authentication
              </DialogTitle>
              <DialogDescription className="text-gray-900/60 text-sm mt-2">
                {profile.twoFactorEnabled 
                  ? 'Disabling 2FA will reduce your account security.'
                  : 'Enable 2FA to add an extra layer of security to your account.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-800 mt-4">
              <Button
                variant="outline"
                onClick={() => setShow2FADialog(false)}
                className="border-gray-300 text-gray-900 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleToggle2FA(!profile.twoFactorEnabled)}
                className={profile.twoFactorEnabled 
                  ? "bg-gray-600 hover:bg-gray-700 text-gray-900"
                  : "bg-red-600 hover:bg-red-700 text-gray-900"}
              >
                <Shield className="h-4 w-4 mr-2" />
                {profile.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Login History Dialog */}
        <Dialog open={showLoginHistoryDialog} onOpenChange={setShowLoginHistoryDialog}>
          <DialogContent className={`${dashboardTheme.card} border-gray-800 max-w-2xl max-h-[80vh] overflow-y-auto`}>
            <DialogHeader>
              <DialogTitle className="text-gray-900 text-2xl">Login History</DialogTitle>
              <DialogDescription className="text-gray-900/60 text-sm mt-2">
                View your recent login activity
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {loginHistoryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <img src="/loading.gif" alt="Loading" className="w-16 h-16" />
                </div>
              ) : loginHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No login history available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {loginHistory.map((entry: any) => (
                    <div key={entry.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(entry.timestamp).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-600">
                            {entry.ipAddress} • {entry.location || 'Unknown'}
                          </p>
                        </div>
                        <Badge className={entry.success ? 'bg-green-600' : 'bg-red-600'}>
                          {entry.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-800 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowLoginHistoryDialog(false)}
                className="border-gray-300 text-gray-900 hover:bg-gray-100"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
  };

  // Commission Management Page
  const renderCommission = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commission Management</h1>
          <p className="text-sm text-gray-600 mt-1">Track and manage commission rates and earnings</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={loadAdminStatistics}
            variant="outline"
            className="border-gray-300 text-gray-900 hover:bg-gray-100"
            disabled={statsLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-red-600 hover:bg-red-700">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {statsLoading && (
        <Card className={dashboardTheme.card}>
          <CardContent className="p-8 text-center">
            <img src="/loading.gif" alt="Loading" className="w-16 h-16 mx-auto" />
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {statsError && !statsLoading && (
        <Card className={`${dashboardTheme.card} border-l-4 border-l-red-500`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <p className="text-red-400">{statsError}</p>
              </div>
              <Button
                onClick={loadAdminStatistics}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-900 hover:bg-gray-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Policy Overview in Commission Page */}
      {policyOverview && !statsLoading && (
        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Policy Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-900/60 mb-1">Total Policies</p>
                <p className="text-2xl font-bold text-gray-900">
                  {policyOverview.totalPolicies || policyOverview.policies?.total || 0}
                </p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-900/60 mb-1">Active Policies</p>
                <p className="text-2xl font-bold text-gray-900">
                  {policyOverview.activePolicies || policyOverview.policies?.active || 0}
                </p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-900/60 mb-1">Total Premium</p>
                <p className="text-2xl font-bold text-gray-900">
                  RWF {policyOverview.totalPremium 
                    ? (policyOverview.totalPremium / 1000000).toFixed(1) 
                    : policyOverview.policies?.totalPremium 
                    ? (policyOverview.policies.totalPremium / 1000000).toFixed(1)
                    : 0}M
                </p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-900/60 mb-1">Pending Claims</p>
                <p className="text-2xl font-bold text-gray-900">
                  {policyOverview.pendingClaims || policyOverview.policies?.pendingClaims || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Claim Statistics in Commission Page */}
      {claimStats && !statsLoading && (
        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Claim Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-900/60 mb-1">Total Claims</p>
                <p className="text-2xl font-bold text-gray-900">
                  {claimStats.totalClaims || claimStats.claims?.total || 0}
                </p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-900/60 mb-1">Pending Claims</p>
                <p className="text-2xl font-bold text-gray-900">
                  {claimStats.pendingClaims || claimStats.claims?.pending || 0}
                </p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-900/60 mb-1">Approved Claims</p>
                <p className="text-2xl font-bold text-gray-900">
                  {claimStats.approvedClaims || claimStats.claims?.approved || 0}
                </p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-900/60 mb-1">Total Paid</p>
                <p className="text-2xl font-bold text-gray-900">
                  RWF {claimStats.totalPaid 
                    ? (claimStats.totalPaid / 1000000).toFixed(1) 
                    : claimStats.claims?.totalPaid 
                    ? (claimStats.claims.totalPaid / 1000000).toFixed(1)
                    : 0}M
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commission Rate Settings */}
      <Card className={dashboardTheme.card}>
        <CardHeader>
          <CardTitle className="text-gray-900">Commission Rate Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Rate</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Total Revenue</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Commission Earned</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {commissionRates.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-800 hover:bg-gray-100/50">
                    <td className="py-3 px-4 text-gray-900 font-medium">{item.type}</td>
                    <td className="py-3 px-4">
                      <Badge className="bg-purple-600">{item.rate}%</Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-900">RWF {(item.revenue / 1000000).toFixed(1)}M</td>
                    <td className="py-3 px-4 text-green-400 font-medium">
                      RWF {(item.commission / 1000000).toFixed(1)}M
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-green-600">{item.status}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm" className="text-gray-900/60 hover:text-gray-900">
                        <Edit className="h-4 w-4" />
                      </Button>
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

  // Load Policies
  const loadPolicies = async () => {
    setPoliciesLoading(true);
    setPoliciesError(null);
    try {
      const status = policyStatusFilter === "all" ? undefined : policyStatusFilter;
      const response: any = await getPolicies(1, 100, status);
      let policiesData: any[] = [];
      
      if (Array.isArray(response)) {
        policiesData = response;
      } else if (response && typeof response === 'object') {
        policiesData = response.data || response.policies || response.items || [];
      }
      
      setPolicies(policiesData);
    } catch (err: any) {
      console.error('Failed to load policies:', err);
      setPoliciesError(err.message || 'Failed to load policies');
      toast({
        title: "Error",
        description: err.message || 'Failed to load policies',
        variant: "destructive",
      });
    } finally {
      setPoliciesLoading(false);
    }
  };

  // Load Claims
  const loadClaims = async () => {
    setClaimsLoading(true);
    setClaimsError(null);
    try {
      const status = claimStatusFilter === "all" ? undefined : claimStatusFilter;
      const response: any = await getClaims(1, 100, status);
      let claimsData: any[] = [];
      
      if (Array.isArray(response)) {
        claimsData = response;
      } else if (response && typeof response === 'object') {
        claimsData = response.data || response.claims || response.items || [];
      }
      
      setClaims(claimsData);
    } catch (err: any) {
      console.error('Failed to load claims:', err);
      setClaimsError(err.message || 'Failed to load claims');
      toast({
        title: "Error",
        description: err.message || 'Failed to load claims',
        variant: "destructive",
      });
    } finally {
      setClaimsLoading(false);
    }
  };

  // Load policies and claims when their pages are active
  useEffect(() => {
    if (activePage === "policies") {
      loadPolicies();
    } else if (activePage === "claims") {
      loadClaims();
    }
  }, [activePage, policyStatusFilter, claimStatusFilter]);

  // Policy CRUD Functions
  const handleCreatePolicy = async () => {
    try {
      const policyData = {
        farmerId: policyFormData.farmerId,
        cropType: policyFormData.cropType,
        coverageAmount: parseFloat(policyFormData.coverageAmount),
        premium: parseFloat(policyFormData.premium),
        startDate: policyFormData.startDate,
        endDate: policyFormData.endDate,
        status: policyFormData.status,
        notes: policyFormData.notes,
      };
      
      await createPolicy(policyData);
      toast({
        title: "Success",
        description: "Policy created successfully",
      });
      setShowPolicyDialog(false);
      resetPolicyForm();
      loadPolicies();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to create policy',
        variant: "destructive",
      });
    }
  };

  const handleUpdatePolicy = async (policyId: string) => {
    try {
      const updateData: any = {};
      if (policyFormData.status) updateData.status = policyFormData.status;
      if (policyFormData.notes) updateData.notes = policyFormData.notes;
      if (policyFormData.coverageAmount) updateData.coverageAmount = parseFloat(policyFormData.coverageAmount);
      if (policyFormData.premium) updateData.premium = parseFloat(policyFormData.premium);
      if (policyFormData.endDate) updateData.endDate = policyFormData.endDate;
      
      await updatePolicy(policyId, updateData);
      toast({
        title: "Success",
        description: "Policy updated successfully",
      });
      setShowPolicyDialog(false);
      setEditingPolicy(null);
      resetPolicyForm();
      loadPolicies();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to update policy',
        variant: "destructive",
      });
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    try {
      await deletePolicy(policyId);
      toast({
        title: "Success",
        description: "Policy deleted successfully",
      });
      setDeletingPolicyId(null);
      loadPolicies();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to delete policy',
        variant: "destructive",
      });
    }
  };

  const resetPolicyForm = () => {
    setPolicyFormData({
      farmerId: "",
      cropType: "",
      coverageAmount: "",
      premium: "",
      startDate: "",
      endDate: "",
      status: "active",
      notes: "",
    });
    setEditingPolicy(null);
  };

  const openEditPolicy = async (policy: any) => {
    setEditingPolicy(policy);
    setPolicyFormData({
      farmerId: policy.farmerId || "",
      cropType: policy.cropType || "",
      coverageAmount: policy.coverageAmount?.toString() || "",
      premium: policy.premium?.toString() || "",
      startDate: policy.startDate || "",
      endDate: policy.endDate || "",
      status: policy.status || "active",
      notes: policy.notes || "",
    });
    // Ensure users are loaded before opening dialog
    if (systemUsers.length === 0) {
      await loadUsers(true); // Force load users even if not on users page
    }
    setShowPolicyDialog(true);
  };

  // Claim CRUD Functions
  const handleCreateClaim = async () => {
    try {
      // Validate required API fields
      if (!claimFormData.policyId) {
        toast({
          title: "Validation Error",
          description: "Policy ID is required",
          variant: "destructive",
        });
        return;
      }
      
      if (!claimFormData.lossEventType) {
        toast({
          title: "Validation Error",
          description: "Loss event type is required",
          variant: "destructive",
        });
        return;
      }
      
      if (!claimFormData.lossDescription) {
        toast({
          title: "Validation Error",
          description: "Loss description is required",
          variant: "destructive",
        });
        return;
      }

      // Format according to API spec: { policyId, lossEventType, lossDescription, damagePhotos }
      const claimData = {
        policyId: claimFormData.policyId,
        lossEventType: claimFormData.lossEventType.toUpperCase(), // Ensure uppercase
        lossDescription: claimFormData.lossDescription,
        damagePhotos: claimFormData.damagePhotos || [],
      };
      
      await createClaim(claimData);
      toast({
        title: "Success",
        description: "Claim created successfully",
      });
      setShowClaimDialog(false);
      resetClaimForm();
      loadClaims();
    } catch (err: any) {
      console.error('❌ Claim creation error:', err);
      
      // Provide more specific error messages
      let errorMessage = err.message || 'Failed to create claim';
      
      if (errorMessage.includes('Forbidden') || errorMessage.includes('403')) {
        errorMessage = 'You do not have permission to create claims. Claims can typically only be created by farmers. Please ensure you are logged in with the correct role.';
      } else if (errorMessage.includes('401') || errorMessage.includes('Authentication')) {
        errorMessage = 'Authentication failed. Please log in again.';
      }
      
      toast({
        title: "Error Creating Claim",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleUpdateClaim = async (claimId: string) => {
    try {
      const updateData: any = {};
      if (claimFormData.status) updateData.status = claimFormData.status;
      if (claimFormData.amount) updateData.amount = parseFloat(claimFormData.amount);
      if (claimFormData.description) updateData.description = claimFormData.description;
      
      await updateClaim(claimId, updateData);
      toast({
        title: "Success",
        description: "Claim updated successfully",
      });
      setShowClaimDialog(false);
      setEditingClaim(null);
      resetClaimForm();
      loadClaims();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to update claim',
        variant: "destructive",
      });
    }
  };

  const handleDeleteClaim = async (claimId: string) => {
    try {
      await deleteClaim(claimId);
      toast({
        title: "Success",
        description: "Claim deleted successfully",
      });
      setDeletingClaimId(null);
      loadClaims();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to delete claim',
        variant: "destructive",
      });
    }
  };

  const resetClaimForm = () => {
    setClaimFormData({
      policyId: "",
      lossEventType: "",
      lossDescription: "",
      damagePhotos: [],
      farmerId: "",
      cropType: "",
      damageType: "",
      amount: "",
      description: "",
      fieldId: "",
      status: "pending",
    });
    setEditingClaim(null);
  };

  const openEditClaim = (claim: any) => {
    setEditingClaim(claim);
    setClaimFormData({
      farmerId: claim.farmerId || "",
      policyId: claim.policyId || "",
      cropType: claim.cropType || "",
      damageType: claim.damageType || "",
      amount: claim.amount?.toString() || "",
      description: claim.description || "",
      fieldId: claim.fieldId || "",
      status: claim.status || "pending",
    });
    setShowClaimDialog(true);
  };

  // Policies Management Page
  const renderPoliciesManagement = () => {
    const filteredPolicies = policies.filter((policy) => {
      const matchesSearch = policySearchQuery === "" || 
        policy.cropType?.toLowerCase().includes(policySearchQuery.toLowerCase()) ||
        policy.farmerId?.toLowerCase().includes(policySearchQuery.toLowerCase()) ||
        policy._id?.toLowerCase().includes(policySearchQuery.toLowerCase());
      return matchesSearch;
    });

    const getStatusBadge = (status: string) => {
      const statusMap: Record<string, { label: string; className: string }> = {
        active: { label: "Active", className: "bg-green-600" },
        inactive: { label: "Inactive", className: "bg-gray-600" },
        expired: { label: "Expired", className: "bg-red-600" },
        pending: { label: "Pending", className: "bg-yellow-600" },
      };
      const statusInfo = statusMap[status?.toLowerCase()] || { label: status, className: "bg-gray-600" };
      return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
    };

    return (
      <div className="space-y-4 pt-6 pr-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Policies Management</h1>
            <p className="text-sm text-gray-600 mt-1">Manage all insurance policies</p>
          </div>
          <div className="flex gap-2">
          </div>
        </div>

        {/* Filters */}
        <Card className={dashboardTheme.card}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-900/60" />
                  <Input
                    placeholder="Search policies..."
                    value={policySearchQuery}
                    onChange={(e) => setPolicySearchQuery(e.target.value)}
                    className="pl-10 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
                  />
                </div>
              </div>
              <Select value={policyStatusFilter} onValueChange={setPolicyStatusFilter}>
                <SelectTrigger className="w-48 bg-gray-50 border-gray-300 text-gray-900">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {policiesLoading && (
          <Card className={dashboardTheme.card}>
            <CardContent className="p-0">
              <TableSkeleton rows={5} columns={6} />
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {policiesError && !policiesLoading && (
          <Card className={`${dashboardTheme.card} border-l-4 border-l-red-500`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <p className="text-red-400">{policiesError}</p>
                </div>
                <Button
                  onClick={loadPolicies}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-900 hover:bg-gray-100"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Policies Table */}
        {!policiesLoading && !policiesError && (
          <Card className={dashboardTheme.card}>
            <CardHeader>
              <CardTitle className="text-gray-900">
                Policies ({filteredPolicies.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ModernTable
                columns={[
                  {
                    key: "policyId",
                    label: "Policy ID",
                    render: (_, row) => (
                      <span className="font-medium text-gray-900">
                        {row?._id?.toString().substring(0, 8) || row?.id || "N/A"}
                      </span>
                    ),
                  },
                  {
                    key: "farmer",
                    label: "Farmer",
                    render: (_, row) => row.farmerId?.toString().substring(0, 8) || "N/A",
                  },
                  {
                    key: "cropType",
                    label: "Crop Type",
                    render: (value) => value || "N/A",
                  },
                  {
                    key: "coverage",
                    label: "Coverage",
                    render: (_, row) => (
                      <span className="text-gray-900">
                        RWF {row.coverageAmount?.toLocaleString() || "0"}
                      </span>
                    ),
                  },
                  {
                    key: "premium",
                    label: "Premium",
                    render: (_, row) => (
                      <span className="text-gray-900">
                        RWF {row.premium?.toLocaleString() || "0"}
                      </span>
                    ),
                  },
                  {
                    key: "status",
                    label: "Status",
                    render: (value) => <StatusBadge status={value || "Unknown"} />,
                  },
                  {
                    key: "actions",
                    label: "Actions",
                    render: (_, row) => (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditPolicy(row);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingPolicyId(row._id || row.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ),
                  },
                ]}
                data={filteredPolicies.filter((p) => p != null).map((policy) => ({
                  ...policy,
                  policyId: policy._id || policy.id,
                  farmer: policy.farmerId?.toString().substring(0, 8) || "N/A",
                  cropType: policy.cropType || "N/A",
                  coverage: policy.coverageAmount,
                  premium: policy.premium,
                  status: policy.status || "Unknown",
                }))}
                searchPlaceholder="Search by policy ID, farmer, or crop type..."
                searchKeys={["policyId", "farmer", "cropType", "status"]}
                emptyMessage="No policies found"
              />
            </CardContent>
          </Card>
        )}

        {/* Edit Policy Dialog - Only editing allowed, creation restricted to insurers */}
        <Dialog open={showPolicyDialog && !!editingPolicy} onOpenChange={(open) => {
          if (!open) {
            setShowPolicyDialog(false);
            setEditingPolicy(null);
            resetPolicyForm();
          }
        }}>
          <DialogContent className="max-w-2xl bg-white border-gray-300">
            <DialogHeader>
              <DialogTitle className="text-gray-900">
                Edit Policy
              </DialogTitle>
              <DialogDescription className="text-gray-900/60">
                Update policy information. Policy creation is only available to insurers.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-900/80">Select Farmer</Label>
                  <Select
                    value={policyFormData.farmerId || undefined}
                    onValueChange={(value) => {
                      const selectedFarmer = systemUsers.find((u: any) => {
                        const role = u.role?.toLowerCase() || '';
                        return role === 'farmer' && (u._id || u.id) === value;
                      });
                      
                      setPolicyFormData({ 
                        ...policyFormData, 
                        farmerId: value 
                      });
                    }}
                    disabled={systemUsers.filter((u: any) => {
                      const role = u.role?.toLowerCase() || '';
                      return role === 'farmer';
                    }).length === 0}
                  >
                    <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900">
                      <SelectValue placeholder={
                        systemUsers.filter((u: any) => {
                          const role = u.role?.toLowerCase() || '';
                          return role === 'farmer';
                        }).length === 0 
                          ? "No farmers available. Load users first." 
                          : "Select a farmer"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {systemUsers
                        .filter((u: any) => {
                          const role = u.role?.toLowerCase() || '';
                          return role === 'farmer';
                        })
                        .map((farmer: any, index: number) => {
                          const farmerId = farmer._id || farmer.id || `farmer-${index}`;
                          if (!farmerId || farmerId === 'undefined' || farmerId === 'null') return null; // Skip farmers without valid ID
                          
                          const farmerName = (() => {
                            const firstName = typeof farmer.firstName === 'string' ? farmer.firstName : '';
                            const lastName = typeof farmer.lastName === 'string' ? farmer.lastName : '';
                            if (firstName || lastName) {
                              return `${firstName} ${lastName}`.trim();
                            }
                            if (typeof farmer.name === 'string') return farmer.name;
                            if (typeof farmer.email === 'string') return farmer.email;
                            if (typeof farmer.phoneNumber === 'string') return farmer.phoneNumber;
                            return 'Unknown Farmer';
                          })();
                          
                          const farmerEmail = typeof farmer.email === 'string' ? farmer.email : '';
                          return (
                            <SelectItem key={farmerId} value={farmerId}>
                              {farmerName}{farmerEmail ? ` (${farmerEmail})` : ''}
                            </SelectItem>
                          );
                        })
                        .filter(Boolean) // Remove null entries
                      }
                      {systemUsers.filter((u: any) => {
                        const role = u.role?.toLowerCase() || '';
                        return role === 'farmer';
                      }).length === 0 && (
                        <div className="px-2 py-1.5 text-sm text-gray-500">No farmers available. Please load users first.</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-900/80">Crop Type</Label>
                  <Select
                    value={policyFormData.cropType}
                    onValueChange={(value) => setPolicyFormData({ ...policyFormData, cropType: value })}
                  >
                    <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900">
                      <SelectValue placeholder="Select crop type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAIZE">Maize</SelectItem>
                      <SelectItem value="BEANS">Beans</SelectItem>
                      <SelectItem value="RICE">Rice</SelectItem>
                      <SelectItem value="WHEAT">Wheat</SelectItem>
                      <SelectItem value="POTATOES">Potatoes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-900/80">Coverage Amount (RWF)</Label>
                  <Input
                    type="number"
                    value={policyFormData.coverageAmount}
                    onChange={(e) => setPolicyFormData({ ...policyFormData, coverageAmount: e.target.value })}
                    className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
                    placeholder="Enter coverage amount"
                  />
                </div>
                <div>
                  <Label className="text-gray-900/80">Premium (RWF)</Label>
                  <Input
                    type="number"
                    value={policyFormData.premium}
                    onChange={(e) => setPolicyFormData({ ...policyFormData, premium: e.target.value })}
                    className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
                    placeholder="Enter premium"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-900/80">Start Date</Label>
                  <Input
                    type="date"
                    value={policyFormData.startDate}
                    onChange={(e) => setPolicyFormData({ ...policyFormData, startDate: e.target.value })}
                    className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <Label className="text-gray-900/80">End Date</Label>
                  <Input
                    type="date"
                    value={policyFormData.endDate}
                    onChange={(e) => setPolicyFormData({ ...policyFormData, endDate: e.target.value })}
                    className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-900/80">Status</Label>
                <Select
                  value={policyFormData.status}
                  onValueChange={(value) => setPolicyFormData({ ...policyFormData, status: value })}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-900/80">Notes</Label>
                <Textarea
                  value={policyFormData.notes}
                  onChange={(e) => setPolicyFormData({ ...policyFormData, notes: e.target.value })}
                  className="bg-gray-800 border-gray-300 text-gray-900"
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPolicyDialog(false);
                    resetPolicyForm();
                  }}
                  className="border-gray-300 text-gray-900 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => editingPolicy && handleUpdatePolicy(editingPolicy._id || editingPolicy.id)}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={!editingPolicy}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Update Policy
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deletingPolicyId} onOpenChange={(open) => !open && setDeletingPolicyId(null)}>
          <DialogContent className="bg-white border-gray-300">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Delete Policy</DialogTitle>
              <DialogDescription className="text-gray-900/60">
                Are you sure you want to delete this policy? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setDeletingPolicyId(null)}
                className="border-gray-300 text-gray-900 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={() => deletingPolicyId && handleDeletePolicy(deletingPolicyId)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // Claims Management Page
  const renderClaimsManagement = () => {
    const filteredClaims = claims.filter((claim) => {
      const matchesSearch = claimSearchQuery === "" || 
        claim.cropType?.toLowerCase().includes(claimSearchQuery.toLowerCase()) ||
        claim.damageType?.toLowerCase().includes(claimSearchQuery.toLowerCase()) ||
        claim.farmerId?.toLowerCase().includes(claimSearchQuery.toLowerCase()) ||
        claim._id?.toLowerCase().includes(claimSearchQuery.toLowerCase());
      return matchesSearch;
    });

    const getStatusBadge = (status: string) => {
      const statusMap: Record<string, { label: string; className: string }> = {
        pending: { label: "Pending", className: "bg-yellow-600" },
        approved: { label: "Approved", className: "bg-green-600" },
        rejected: { label: "Rejected", className: "bg-red-600" },
        processing: { label: "Processing", className: "bg-blue-600" },
      };
      const statusInfo = statusMap[status?.toLowerCase()] || { label: status, className: "bg-gray-600" };
      return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
    };

    return (
      <div className="space-y-4 pt-6 pr-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Claims Management</h1>
            <p className="text-sm text-gray-600 mt-1">Manage all insurance claims</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                resetClaimForm();
                setShowClaimDialog(true);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Claim
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className={dashboardTheme.card}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-900/60" />
                  <Input
                    placeholder="Search claims..."
                    value={claimSearchQuery}
                    onChange={(e) => setClaimSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
                  />
                </div>
              </div>
              <Select value={claimStatusFilter} onValueChange={setClaimStatusFilter}>
                <SelectTrigger className="w-48 bg-gray-50 border-gray-300 text-gray-900">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {claimsLoading && (
          <Card className={dashboardTheme.card}>
            <CardContent className="p-8 text-center">
              <img src="/loading.gif" alt="Loading" className="w-16 h-16 mx-auto" />
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {claimsError && !claimsLoading && (
          <Card className={`${dashboardTheme.card} border-l-4 border-l-red-500`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <p className="text-red-400">{claimsError}</p>
                </div>
                <Button
                  onClick={loadClaims}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-900 hover:bg-gray-100"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Claims Table */}
        {!claimsLoading && !claimsError && (
          <Card className={dashboardTheme.card}>
            <CardHeader>
              <CardTitle className="text-gray-900">
                Claims ({filteredClaims.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ModernTable
                columns={[
                  {
                    key: "claimId",
                    label: "Claim ID",
                    render: (_, row) => (
                      <span className="font-medium text-gray-900">
                        {row?._id?.toString().substring(0, 8) || row?.id || "N/A"}
                      </span>
                    ),
                  },
                  {
                    key: "farmer",
                    label: "Farmer",
                    render: (_, row) => row.farmerId?.toString().substring(0, 8) || "N/A",
                  },
                  {
                    key: "cropType",
                    label: "Crop Type",
                    render: (value) => value || "N/A",
                  },
                  {
                    key: "damageType",
                    label: "Damage Type",
                    render: (value) => value || "N/A",
                  },
                  {
                    key: "amount",
                    label: "Amount",
                    render: (_, row) => (
                      <span className="text-gray-900">
                        RWF {row.amount?.toLocaleString() || "0"}
                      </span>
                    ),
                  },
                  {
                    key: "status",
                    label: "Status",
                    render: (value) => <StatusBadge status={value || "Unknown"} />,
                  },
                  {
                    key: "actions",
                    label: "Actions",
                    render: (_, row) => (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditClaim(row);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingClaimId(row._id || row.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ),
                  },
                ]}
                data={filteredClaims.filter((c) => c != null).map((claim) => ({
                  ...claim,
                  claimId: claim._id || claim.id,
                  farmer: claim.farmerId?.toString().substring(0, 8) || "N/A",
                  cropType: claim.cropType || "N/A",
                  damageType: claim.damageType || "N/A",
                  amount: claim.amount,
                  status: claim.status || "Unknown",
                }))}
                searchPlaceholder="Search by claim ID, farmer, crop type, or damage type..."
                searchKeys={["claimId", "farmer", "cropType", "damageType", "status"]}
                emptyMessage="No claims found"
              />
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Claim Dialog */}
        <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
          <DialogContent className="max-w-2xl bg-white border-gray-300">
            <DialogHeader>
              <DialogTitle className="text-gray-900">
                {editingClaim ? "Edit Claim" : "Create New Claim"}
              </DialogTitle>
              <DialogDescription className="text-gray-900/60">
                {editingClaim ? "Update claim information" : "Fill in the details to create a new claim"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* API Required Fields */}
              <div>
                <Label className="text-gray-900/80">Policy ID *</Label>
                <Input
                  value={claimFormData.policyId}
                  onChange={(e) => setClaimFormData({ ...claimFormData, policyId: e.target.value })}
                  className="bg-gray-800 border-gray-300 text-gray-900"
                  placeholder="Enter policy ID (required)"
                  required
                />
                <p className="text-xs text-gray-900/60 mt-1">The policy ID for this claim</p>
              </div>

              <div>
                <Label className="text-gray-900/80">Loss Event Type *</Label>
                <Select
                  value={claimFormData.lossEventType}
                  onValueChange={(value) => setClaimFormData({ ...claimFormData, lossEventType: value })}
                  required
                >
                  <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select loss event type (required)" />
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
                <p className="text-xs text-gray-900/60 mt-1">Type of event that caused the loss</p>
              </div>

              <div>
                <Label className="text-gray-900/80">Loss Description *</Label>
                <Textarea
                  value={claimFormData.lossDescription}
                  onChange={(e) => setClaimFormData({ ...claimFormData, lossDescription: e.target.value })}
                  className="bg-gray-800 border-gray-300 text-gray-900"
                  placeholder="Describe the loss event and damage to your crops..."
                  rows={4}
                  required
                />
                <p className="text-xs text-gray-900/60 mt-1">Detailed description of the loss event</p>
              </div>

              <div>
                <Label className="text-gray-900/80">Damage Photos (Optional)</Label>
                <Input
                  value={claimFormData.damagePhotos?.join(', ') || ''}
                  onChange={(e) => {
                    const urls = e.target.value.split(',').map(url => url.trim()).filter(url => url);
                    setClaimFormData({ ...claimFormData, damagePhotos: urls });
                  }}
                  className="bg-gray-800 border-gray-300 text-gray-900"
                  placeholder="Enter photo URLs separated by commas (e.g., https://example.com/photo1.jpg, https://example.com/photo2.jpg)"
                />
                <p className="text-xs text-gray-900/60 mt-1">URLs of photos showing the damage (comma-separated)</p>
              </div>

              {/* Legacy/Display Fields (not sent to API) */}
              {editingClaim && (
                <>
                  <div className="pt-4 border-t border-gray-300">
                    <p className="text-sm text-gray-900/60 mb-4">Additional Information (Display Only)</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-900/80">Farmer ID</Label>
                        <Input
                          value={claimFormData.farmerId}
                          onChange={(e) => setClaimFormData({ ...claimFormData, farmerId: e.target.value })}
                          className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
                          placeholder="Enter farmer ID"
                          disabled
                        />
                      </div>
                      <div>
                        <Label className="text-gray-900/80">Status</Label>
                        <Select
                          value={claimFormData.status}
                          onValueChange={(value) => setClaimFormData({ ...claimFormData, status: value })}
                        >
                          <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowClaimDialog(false);
                    resetClaimForm();
                  }}
                  className="border-gray-300 text-gray-900 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => editingClaim ? handleUpdateClaim(editingClaim._id || editingClaim.id) : handleCreateClaim()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingClaim ? "Update" : "Create"} Claim
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deletingClaimId} onOpenChange={(open) => !open && setDeletingClaimId(null)}>
          <DialogContent className="bg-white border-gray-300">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Delete Claim</DialogTitle>
              <DialogDescription className="text-gray-900/60">
                Are you sure you want to delete this claim? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setDeletingClaimId(null)}
                className="border-gray-300 text-gray-900 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={() => deletingClaimId && handleDeleteClaim(deletingClaimId)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // Load assessments
  const loadAssessments = async () => {
    setAssessmentsLoading(true);
    setAssessmentsError(null);
    try {
      const response: any = await assessmentsApiService.getAllAssessments();
      console.log('✅ Assessments API response:', response);
      
      let assessmentsData: any[] = [];
      
      // Handle new API structure: { message, data: [], success }
      if (Array.isArray(response)) {
        assessmentsData = response;
      } else if (response && typeof response === 'object') {
        assessmentsData = response.data || response.assessments || [];
      }
      
      console.log(`📊 Loaded ${assessmentsData.length} assessments`);
      setAssessments(assessmentsData);
    } catch (err: any) {
      console.error('Failed to load assessments:', err);
      setAssessmentsError(err.message || 'Failed to load assessments');
      toast({
        title: "Error",
        description: err.message || 'Failed to load assessments',
        variant: "destructive",
      });
    } finally {
      setAssessmentsLoading(false);
    }
  };

  // Load farms for assessment creation
  const loadFarmsForAssessment = async () => {
    setFarmsLoading(true);
    try {
      console.log('🔄 Loading farms for assessment creation...');
      const response: any = await getFarms(0, 100);
      console.log('✅ Farms API response:', response);
      console.log('✅ Farms API response type:', typeof response);
      console.log('✅ Farms API response isArray:', Array.isArray(response));
      
      let farmsData: any[] = [];
      
      // Handle different response structures
      if (Array.isArray(response)) {
        farmsData = response;
        console.log('✅ Response is array, using directly');
      } else if (response && typeof response === 'object') {
        // Handle paginated response: { data: [], items: [], totalItems, etc. }
        farmsData = response.data || response.items || response.farms || [];
        console.log('✅ Response is object, extracted data:', {
          hasData: !!response.data,
          hasItems: !!response.items,
          hasFarms: !!response.farms,
          extractedLength: farmsData.length
        });
      }
      
      // Ensure farmsData is always an array
      if (!Array.isArray(farmsData)) {
        console.warn('⚠️ farmsData is not an array, converting:', farmsData);
        farmsData = [];
      }
      
      console.log(`📊 Loaded ${farmsData.length} farms for assessment creation`);
      console.log('📊 Sample farm:', farmsData[0]);
      setFarms(farmsData);
    } catch (err: any) {
      console.error('❌ Failed to load farms:', err);
      setFarms([]); // Set to empty array on error
      toast({
        title: "Warning",
        description: "Could not load farms. You may not be able to create assessments.",
        variant: "default",
      });
    } finally {
      setFarmsLoading(false);
    }
  };

  // Load assessors for assessment creation and assignment
  const loadAssessors = async () => {
    try {
      console.log('🔄 Loading assessors...');
      // Fetch all users and filter for assessors
      const response: any = await getAllUsers();
      console.log('✅ All users API response:', response);
      
      let allUsers: any[] = [];
      
      // Handle different response structures
      if (Array.isArray(response)) {
        allUsers = response;
      } else if (response && typeof response === 'object') {
        // Try multiple possible response structures
        if (Array.isArray(response.users)) {
          allUsers = response.users;
        } else if (Array.isArray(response.data)) {
          allUsers = response.data;
        } else if (Array.isArray(response.results)) {
          allUsers = response.results;
        } else if (Array.isArray(response.items)) {
          allUsers = response.items;
        } else if (Array.isArray(response.list)) {
          allUsers = response.list;
        } else if (response.data) {
          if (Array.isArray(response.data)) {
            allUsers = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            allUsers = response.data.data;
          } else if (response.data.users && Array.isArray(response.data.users)) {
            allUsers = response.data.users;
          } else if (response.data.results && Array.isArray(response.data.results)) {
            allUsers = response.data.results;
          } else if (response.data.items && Array.isArray(response.data.items)) {
            allUsers = response.data.items;
          } else if (response.data.list && Array.isArray(response.data.list)) {
            allUsers = response.data.list;
          }
        } else {
          // Try to find any array property
          const keys = Object.keys(response);
          for (const key of keys) {
            if (Array.isArray(response[key])) {
              allUsers = response[key];
              break;
            }
          }
        }
      }
      
      // Ensure allUsers is an array
      if (!Array.isArray(allUsers)) {
        console.warn('⚠️ allUsers is not an array, converting:', allUsers);
        allUsers = [];
      }
      
      // Filter users by role to get only assessors
      const assessorUsers = allUsers.filter((user: any) => {
        const role = user.role || '';
        return role.toUpperCase() === 'ASSESSOR' || role === 'Assessor';
      });
      
      setAssessors(assessorUsers);
      console.log(`✅ Filtered ${assessorUsers.length} assessors from ${allUsers.length} total users`);
      if (assessorUsers.length > 0) {
        console.log('📊 Sample assessor:', assessorUsers[0]);
      }
    } catch (err: any) {
      console.error('❌ Failed to load assessors:', err);
      setAssessors([]);
      toast({
        title: "Warning",
        description: "Could not load assessors. Please try refreshing the page.",
        variant: "default",
      });
    }
  };

  // Load insurers for assignment
  const loadInsurers = async () => {
    try {
      console.log('🔄 Loading insurers...');
      // Use dedicated insurers endpoint with pagination
      // Endpoint: GET /users/insurers?page=0&size=100
      const insurersResponse = await getInsurers(0, 100);
      console.log('✅ Insurers API response:', insurersResponse);
      
      let insurerUsers: any[] = [];
      
      // Handle paginated response structure: { items: [], totalItems: number, totalPages: number, currentPage: number }
      if (insurersResponse && typeof insurersResponse === 'object') {
        // Check for paginated response structure
        if (Array.isArray(insurersResponse.items)) {
          insurerUsers = insurersResponse.items;
          console.log(`✅ Loaded ${insurerUsers.length} insurers from paginated response (total: ${insurersResponse.totalItems || 'unknown'})`);
        } else if (Array.isArray(insurersResponse)) {
          // Fallback: response is directly an array
          insurerUsers = insurersResponse;
          console.log('✅ Response is array, using directly');
        } else {
          // Try other possible response structures
          insurerUsers = insurersResponse.data || insurersResponse.insurers || [];
          console.log('✅ Extracted insurers from alternative structure');
        }
      } else if (Array.isArray(insurersResponse)) {
        insurerUsers = insurersResponse;
        console.log('✅ Response is array, using directly');
      }
      
      // Ensure insurerUsers is always an array
      if (!Array.isArray(insurerUsers)) {
        console.warn('⚠️ insurerUsers is not an array, converting:', insurerUsers);
        insurerUsers = [];
      }
      
      setInsurers(insurerUsers);
      console.log(`✅ Set ${insurerUsers.length} insurers`);
      if (insurerUsers.length > 0) {
        console.log('📊 Sample insurer:', insurerUsers[0]);
      }
    } catch (err: any) {
      console.error('❌ Failed to load insurers:', err);
      setInsurers([]);
      toast({
        title: "Warning",
        description: "Could not load insurers. Please try refreshing the page.",
        variant: "default",
      });
    }
  };

  // Handler for assign dialog open/close
  const handleAssignDialogChange = (open: boolean) => {
    setShowAssignDialog(open);
    if (open) {
      // Load assessors and insurers when dialog opens
      loadAssessors();
      loadInsurers();
    }
  };

  // Handler for assessment dialog open/close
  const handleAssessmentDialogChange = (open: boolean) => {
    setShowAssessmentDialog(open);
    if (open) {
      // Load assessors and insurers when dialog opens
      loadAssessors();
      loadInsurers();
      loadFarmsForAssessment();
    }
  };

  // Load pending farms
  const loadPendingFarms = async () => {
    setPendingFarmsLoading(true);
    setPendingFarmsError(null);
    try {
      // Check if user is authenticated before making request
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You are not logged in. Please log in again.');
      }

      console.log('🔄 Loading pending farms...');
      const response: any = await assessmentsApiService.getPendingFarms();
      console.log('✅ Pending farms response:', response);
      
      let pendingFarmsData: any[] = [];

      if (Array.isArray(response)) {
        pendingFarmsData = response;
      } else if (response && typeof response === 'object') {
        pendingFarmsData = response.data || response.farms || response.pendingFarms || [];
      }

      console.log('📊 Processed pending farms data:', pendingFarmsData.length, 'farms');
      setPendingFarms(pendingFarmsData);
    } catch (err: any) {
      console.error('❌ Failed to load pending farms:', err);
      const errorMessage = err.message || 'Failed to load pending farms';
      
      // If it's an auth error, suggest logging in again
      if (errorMessage.includes('Authentication') || errorMessage.includes('Unauthorized') || errorMessage.includes('session')) {
        setPendingFarmsError('Your session has expired. Please log out and log in again.');
        toast({
          title: "Authentication Required",
          description: "Your session has expired. Please log out and log in again.",
          variant: "destructive",
        });
      } else {
        // Handle 500 errors with more specific messaging
        let finalErrorMessage = errorMessage;
        if (errorMessage.includes('Cannot read properties of null') || 
            errorMessage.includes('Missing data in database') ||
            errorMessage.includes('Server error')) {
          // Check if it's a backend database issue
          if (errorMessage.includes('Cannot read properties of null')) {
            finalErrorMessage = 'Backend error: Some farm data may be incomplete. The pending farms list cannot be loaded. You can still create assessments manually.';
          } else {
            finalErrorMessage = 'Server error: There may be incomplete data in the database. Please contact support or try again later.';
          }
        }
        setPendingFarmsError(finalErrorMessage);
        toast({
          title: "Error Loading Pending Farms",
          description: finalErrorMessage,
          variant: "destructive",
          duration: 5000,
        });
      }
    } finally {
      setPendingFarmsLoading(false);
    }
  };

  // Handle assign assessor to pending farm
  const handleAssignAssessor = async () => {
    if (!selectedFarmForAssignment || !assignFormData.assessorId) {
      toast({
        title: "Validation Error",
        description: "Please select an assessor.",
        variant: "destructive",
      });
      return;
    }

    setAssigningAssessor(true);
    try {
      if (!selectedFarmForAssignment) {
        throw new Error("No farm selected for assignment");
      }
      // Use id from the new API response structure
      const farmId = selectedFarmForAssignment?.id || selectedFarmForAssignment?._id;
      const insurerId = assignFormData.insurerId && assignFormData.insurerId !== '' && assignFormData.insurerId !== 'none-insurer' ? assignFormData.insurerId : null;
      await assessmentsApiService.assignAssessor(
        farmId,
        assignFormData.assessorId,
        insurerId
      );
      
      toast({
        title: "Success",
        description: "Assessor assigned successfully. Assessor has been notified.",
        variant: "default",
      });
      
      setShowAssignDialog(false);
      setSelectedFarmForAssignment(null);
      setAssignFormData({ assessorId: "", insurerId: "" });
      // Reload pending farms and assessments
      loadPendingFarms();
      loadAssessments();
    } catch (err: any) {
      console.error('Failed to assign assessor:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to assign assessor',
        variant: "destructive",
      });
    } finally {
      setAssigningAssessor(false);
    }
  };

  // Handle create assessment
  const handleCreateAssessment = async () => {
    if (!assessmentFormData.farmId || !assessmentFormData.assessorId) {
      toast({
        title: "Validation Error",
        description: "Please select both a farm and an assessor.",
        variant: "destructive",
      });
      return;
    }

    setCreatingAssessment(true);
    try {
      await assessmentsApiService.createAssessment({
        farmId: assessmentFormData.farmId,
        assessorId: assessmentFormData.assessorId,
      });
      
      toast({
        title: "Success",
        description: "Assessment created successfully!",
        variant: "default",
      });
      
      setShowAssessmentDialog(false);
      setAssessmentFormData({ farmId: "", assessorId: "" });
      loadAssessments();
    } catch (err: any) {
      console.error('Failed to create assessment:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to create assessment',
        variant: "destructive",
      });
    } finally {
      setCreatingAssessment(false);
    }
  };

  // Helper function to safely extract string from user/farmer/assessor objects
  const safeExtractUserName = (user: any): string => {
    if (!user) return 'N/A';
    if (typeof user === 'string') return user;
    if (typeof user !== 'object') return String(user);
    
    // Try to get name from various properties
    if (typeof user.name === 'string') return user.name;
    const firstName = typeof user.firstName === 'string' ? user.firstName : '';
    const lastName = typeof user.lastName === 'string' ? user.lastName : '';
    if (firstName || lastName) return `${firstName} ${lastName}`.trim();
    if (typeof user.email === 'string') return user.email;
    if (typeof user.phoneNumber === 'string') return user.phoneNumber;
    
    return 'N/A';
  };

  // Render Assessments Management Page
  const renderAssessmentsManagement = () => {
    const filteredAssessments = assessments.filter(assessment => {
      // Handle new API structure: farmId is an object
      const farmIdObj = assessment.farmId || assessment.farm;
      const farmName = typeof farmIdObj?.name === 'string' ? farmIdObj.name : '';
      const cropType = farmIdObj?.cropType || '';
      const assessorName = typeof assessment.assessor?.name === 'string' ? assessment.assessor.name : '';
      const farmerName = typeof assessment.farmer?.name === 'string' ? assessment.farmer.name : '';
      
      const matchesSearch = assessmentSearchQuery === "" ||
        farmName.toLowerCase().includes(assessmentSearchQuery.toLowerCase()) ||
        cropType.toLowerCase().includes(assessmentSearchQuery.toLowerCase()) ||
        assessorName.toLowerCase().includes(assessmentSearchQuery.toLowerCase()) ||
        farmerName.toLowerCase().includes(assessmentSearchQuery.toLowerCase());
      
      const matchesStatus = assessmentStatusFilter === "all" || 
        (assessment.status || '').toLowerCase() === assessmentStatusFilter.toLowerCase();
      
      return matchesSearch && matchesStatus;
    });

    return (
      <div className="space-y-4 pt-6 pr-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-end">
          <Button
            onClick={() => setShowAssessmentDialog(true)}
            className="bg-red-600 hover:bg-red-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Assessment
          </Button>
        </div>

        {/* Pending Farms Section */}
        <Card className="bg-white border-gray-300">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Pending Farms</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Farms awaiting assessment assignment</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {pendingFarmsLoading ? (
              <div className="flex items-center justify-center py-12">
                <img src="/loading.gif" alt="Loading" className="w-16 h-16" />
              </div>
            ) : pendingFarmsError ? (
              <div className="flex items-center justify-center py-8 px-4">
                <div className="text-center max-w-md">
                  <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                  <p className="text-red-400 text-sm mb-1 font-medium">Error Loading Pending Farms</p>
                  <p className="text-gray-600 text-xs mb-4">{pendingFarmsError}</p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={() => {
                        console.log('🔄 Retrying to load pending farms...');
                        loadPendingFarms();
                      }}
                      variant="outline"
                      size="sm"
                      className="border-gray-300 text-gray-900 hover:bg-gray-100"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                    <Button
                      onClick={() => {
                        setPendingFarmsError(null);
                        setPendingFarms([]);
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:bg-gray-100"
                    >
                      Dismiss
                    </Button>
                  </div>
                  <p className="text-gray-500 text-xs mt-3">
                    You can still create assessments manually using the "Create Assessment" button above.
                  </p>
                </div>
              </div>
            ) : pendingFarms.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">No pending farms found</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-6 font-medium text-gray-900">Farmer Name</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-900">Crop Type</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-900">Sowing Date</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-900">Farm Location</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingFarms
                      .filter(farm => farm != null && farm.farmer != null && (farm.id || farm._id))
                      .map((farm, index) => {
                      // Extract farmer name from the new response structure with null checks
                      const farmer = farm?.farmer;
                      const farmerName = farmer && (farmer.firstName || farmer.lastName)
                        ? `${farmer.firstName || ''} ${farmer.lastName || ''}`.trim() || 'Unknown'
                        : 'Unknown';
                      
                      // Extract crop type
                      const cropType = farm?.cropType || 'N/A';
                      
                      // Extract sowing date
                      const sowingDate = farm?.sowingDate 
                        ? new Date(farm.sowingDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })
                        : 'N/A';
                      
                      // Extract farm location from farmerProfile or farmer location
                      const farmerProfile = farm?.farmer?.farmerProfile;
                      const farmLocation = farmerProfile
                        ? `${farmerProfile.farmProvince || ''}, ${farmerProfile.farmDistrict || ''}`.trim().replace(/^,\s*|,\s*$/g, '') || 
                          `${farm.farmer?.province || ''}, ${farm.farmer?.district || ''}`.trim().replace(/^,\s*|,\s*$/g, '')
                        : farm?.farmer
                        ? `${farm.farmer.province || ''}, ${farm.farmer.district || ''}`.trim().replace(/^,\s*|,\s*$/g, '')
                        : 'N/A';
                      
                      // Extract farm ID with null check
                      const farmId = farm?.id || farm?._id;
                      if (!farmId) {
                        console.warn('Farm missing ID at index', index, farm);
                        return null; // Skip rendering if no ID
                      }
                      
                      return (
                        <tr
                          key={farmId}
                          className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-6 text-gray-900">
                            <div className="font-medium">{farmerName}</div>
                            {farm?.farmer?.email && (
                              <div className="text-xs text-gray-500 mt-0.5">{farm.farmer.email}</div>
                            )}
                          </td>
                          <td className="py-3 px-6 text-gray-900">
                            <Badge className="bg-green-100 text-green-700 border-green-300">
                              {cropType}
                            </Badge>
                          </td>
                          <td className="py-3 px-6 text-gray-900">
                            {sowingDate}
                          </td>
                          <td className="py-3 px-6 text-gray-900">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-gray-400" />
                              <span className="text-sm">{farmLocation || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-6">
                            <Button
                              onClick={() => {
                                if (farm && farmId) {
                                  setSelectedFarmForAssignment(farm);
                                  setAssignFormData({ assessorId: "", insurerId: "" });
                                  setShowAssignDialog(true);
                                } else {
                                  toast({
                                    title: "Error",
                                    description: "Invalid farm data. Please refresh the page.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              disabled={!farmId}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Assign Assessor
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

        {/* Error Message */}
        {assessmentsError && (
          <Card className="bg-white border-gray-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <p className="text-red-400">{assessmentsError}</p>
                </div>
                <Button
                  onClick={loadAssessments}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-900 hover:bg-gray-100"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-900/60" />
            <Input
              placeholder="Search assessments..."
              value={assessmentSearchQuery}
              onChange={(e) => setAssessmentSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
            />
          </div>
          <Select value={assessmentStatusFilter} onValueChange={setAssessmentStatusFilter}>
            <SelectTrigger className="w-48 bg-gray-50 border-gray-300 text-gray-900">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-300">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Assessments Table */}
        <Card className="bg-white border-gray-300">
          <CardContent className="p-0">
            {assessmentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <img src="/loading.gif" alt="Loading" className="w-16 h-16" />
              </div>
            ) : filteredAssessments.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-900/40" />
                  <p className="text-gray-900/60">No assessments found</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Farm</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Farmer</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Assessor</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Status</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Created</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssessments.filter(assessment => assessment != null).map((assessment, index) => (
                      <tr
                        key={assessment?._id || assessment?.id || index}
                        className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                        }`}
                      >
                        <td className="py-4 px-6 text-gray-900">
                          {(() => {
                            // Handle new API structure: farmId is an object
                            const farmIdObj = assessment.farmId || assessment.farm;
                            if (farmIdObj?.name && typeof farmIdObj.name === 'string') {
                              return farmIdObj.name;
                            }
                            // Show crop type if name not available
                            if (farmIdObj?.cropType) {
                              return `${farmIdObj.cropType} Farm`;
                            }
                            return 'N/A';
                          })()}
                        </td>
                        <td className="py-4 px-6 text-gray-900">
                          {(() => {
                            // Handle new API structure: farmId has farmerId
                            const farmIdObj = assessment.farmId || assessment.farm;
                            if (farmIdObj?.farmerName && typeof farmIdObj.farmerName === 'string') {
                              return farmIdObj.farmerName;
                            }
                            const farmerName = safeExtractUserName(assessment.farmer);
                            if (farmerName !== 'N/A') return farmerName;
                            return safeExtractUserName(farmIdObj?.farmer) || 'N/A';
                          })()}
                        </td>
                        <td className="py-4 px-6 text-gray-900">
                          {(() => {
                            // Safely extract assessor name from various possible structures
                            const assessorName = safeExtractUserName(assessment.assessor);
                            if (assessorName !== 'N/A') return assessorName;
                            // Check if assessorId is an object with name
                            if (assessment.assessorId && typeof assessment.assessorId === 'object') {
                              return safeExtractUserName(assessment.assessorId) || 'N/A';
                            }
                            // Only return assessorId as last resort if it's a string
                            if (assessment.assessorId && typeof assessment.assessorId === 'string') {
                              return assessment.assessorId;
                            }
                            return 'Not Assigned';
                          })()}
                        </td>
                        <td className="py-4 px-6">
                          <Badge
                            variant={
                              assessment.status === 'COMPLETED' || assessment.status === 'SUBMITTED' || assessment.status === 'completed' || assessment.status === 'submitted'
                                ? 'default'
                                : assessment.status === 'IN_PROGRESS' || assessment.status === 'ASSIGNED' || assessment.status === 'in-progress' || assessment.status === 'assigned'
                                ? 'secondary'
                                : 'outline'
                            }
                            className={
                              assessment.status === 'COMPLETED' || assessment.status === 'SUBMITTED' || assessment.status === 'completed' || assessment.status === 'submitted'
                                ? 'bg-green-100 text-green-700 border-green-300'
                                : assessment.status === 'IN_PROGRESS' || assessment.status === 'ASSIGNED' || assessment.status === 'in-progress' || assessment.status === 'assigned'
                                ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                : 'bg-gray-100 text-gray-700 border-gray-300'
                            }
                          >
                            {assessment.status ? String(assessment.status).replace('_', ' ') : 'PENDING'}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-gray-900/80">
                          {assessment.createdAt
                            ? new Date(assessment.createdAt).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // View assessment details
                                toast({
                                  title: "Assessment Details",
                                  description: `Assessment ID: ${assessment._id || assessment.id}`,
                                  variant: "default",
                                });
                              }}
                              className="text-gray-900 hover:bg-gray-100"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(assessment.status === 'SUBMITTED' || assessment.status === 'submitted' || assessment.status === 'completed') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPolicyIssuanceDialog({
                                    open: true,
                                    assessmentId: assessment._id || assessment.id,
                                    assessment: assessment
                                  });
                                }}
                                className="border-green-600 text-green-600 hover:bg-green-50"
                              >
                                <Shield className="h-4 w-4 mr-1" />
                                Issue Policy
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Policy Issuance Dialog */}
        <Dialog open={policyIssuanceDialog.open} onOpenChange={(open) => 
          setPolicyIssuanceDialog({ ...policyIssuanceDialog, open })
        }>
          <DialogContent className="bg-white border-gray-300 sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Issue Policy from Assessment</DialogTitle>
              <DialogDescription className="text-gray-600">
                Create a new policy based on this assessment. Premium will be calculated automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {policyIssuanceDialog.assessment && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Assessment Details:</p>
                  <p className="text-sm font-medium text-gray-900">
                    Farm: {typeof policyIssuanceDialog.assessment.farm?.name === 'string' ? policyIssuanceDialog.assessment.farm.name : 'N/A'}
                  </p>
                  {policyIssuanceDialog.assessment.riskScore && (
                    <p className="text-sm text-gray-700">
                      Risk Score: {policyIssuanceDialog.assessment.riskScore}
                    </p>
                  )}
                </div>
              )}
              <div>
                <Label className="text-gray-700">Coverage Level *</Label>
                <Select
                  value={policyIssuanceData.coverageLevel}
                  onValueChange={(value: 'BASIC' | 'STANDARD' | 'PREMIUM') => 
                    setPolicyIssuanceData({ ...policyIssuanceData, coverageLevel: value })
                  }
                >
                  <SelectTrigger className="mt-2 bg-gray-50 border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="BASIC">Basic</SelectItem>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700">Start Date *</Label>
                  <Input
                    type="date"
                    value={policyIssuanceData.startDate}
                    onChange={(e) => setPolicyIssuanceData({ ...policyIssuanceData, startDate: e.target.value })}
                    className="mt-2 bg-gray-50 border-gray-300 text-gray-900"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">End Date *</Label>
                  <Input
                    type="date"
                    value={policyIssuanceData.endDate}
                    onChange={(e) => setPolicyIssuanceData({ ...policyIssuanceData, endDate: e.target.value })}
                    className="mt-2 bg-gray-50 border-gray-300 text-gray-900"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPolicyIssuanceDialog({ open: false, assessmentId: null, assessment: null });
                    setPolicyIssuanceData({
                      coverageLevel: 'STANDARD',
                      startDate: new Date().toISOString().split('T')[0],
                      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    });
                  }}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!policyIssuanceDialog.assessmentId) return;
                    
                    setIssuingPolicy(true);
                    try {
                      await createPolicyFromAssessment(
                        policyIssuanceDialog.assessmentId,
                        policyIssuanceData.coverageLevel,
                        new Date(policyIssuanceData.startDate).toISOString(),
                        new Date(policyIssuanceData.endDate).toISOString()
                      );
                      
                      toast({
                        title: "Success",
                        description: "Policy issued successfully!",
                      });
                      
                      setPolicyIssuanceDialog({ open: false, assessmentId: null, assessment: null });
                      setPolicyIssuanceData({
                        coverageLevel: 'STANDARD',
                        startDate: new Date().toISOString().split('T')[0],
                        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      });
                      
                      // Reload assessments and policies
                      await loadAssessments();
                      await loadPolicies();
                    } catch (err: any) {
                      console.error('Failed to issue policy:', err);
                      toast({
                        title: "Error",
                        description: err.message || 'Failed to issue policy',
                        variant: "destructive",
                      });
                    } finally {
                      setIssuingPolicy(false);
                    }
                  }}
                  disabled={issuingPolicy}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {issuingPolicy ? (
                    <>
                      <img src="/loading.gif" alt="Loading" className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Issue Policy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Assign Assessor Dialog */}
        <Dialog open={showAssignDialog} onOpenChange={handleAssignDialogChange}>
          <DialogContent className="bg-white border-gray-300">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Assign Assessor to Farm</DialogTitle>
              <DialogDescription className="text-gray-900/60">
                Assign an assessor to evaluate {selectedFarmForAssignment?.name || selectedFarmForAssignment?.fieldName || 'this farm'}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {selectedFarmForAssignment && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-2">Farm Details:</p>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Crop:</span> {selectedFarmForAssignment.cropType || selectedFarmForAssignment.crop || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Farmer:</span> {
                        selectedFarmForAssignment.farmer
                          ? `${selectedFarmForAssignment.farmer.firstName || ''} ${selectedFarmForAssignment.farmer.lastName || ''}`.trim() || 'Unknown'
                          : safeExtractUserName(selectedFarmForAssignment.farmerName || selectedFarmForAssignment.farmer) || 'Unknown'
                      }
                    </p>
                    {selectedFarmForAssignment.sowingDate && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Sowing Date:</span> {new Date(selectedFarmForAssignment.sowingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="assignAssessorId" className="text-gray-900">Assessor *</Label>
                <Select
                  value={assignFormData.assessorId}
                  onValueChange={(value) => setAssignFormData({ ...assignFormData, assessorId: value })}
                >
                  <SelectTrigger id="assignAssessorId" className="bg-gray-50 border-gray-300 text-gray-900 mt-1">
                    <SelectValue placeholder="Select an assessor" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    {!Array.isArray(assessors) || assessors.length === 0 ? (
                      <SelectItem value="none" disabled>No assessors available</SelectItem>
                    ) : (
                      assessors.map((assessor, index) => {
                        // Use id from the new API response structure
                        const assessorValue = assessor.id || assessor._id || `assessor-${index}`;
                        // Extract name from firstName and lastName
                        const assessorName = assessor.firstName && assessor.lastName
                          ? `${assessor.firstName} ${assessor.lastName}`
                          : assessor.firstName || assessor.lastName || assessor.name || 'Unknown Assessor';
                        const contactInfo = assessor.email || assessor.phoneNumber || '';
                        const specialization = assessor.assessorProfile?.specialization || '';
                        return (
                          <SelectItem key={assessorValue} value={assessorValue}>
                            {assessorName}{contactInfo ? ` (${contactInfo})` : ''}{specialization ? ` - ${specialization}` : ''}
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assignInsurerId" className="text-gray-900">Insurer (Optional)</Label>
                <Select
                  value={assignFormData.insurerId || 'none-insurer'}
                  onValueChange={(value) => setAssignFormData({ ...assignFormData, insurerId: value === 'none-insurer' ? '' : value })}
                >
                  <SelectTrigger id="assignInsurerId" className="bg-gray-50 border-gray-300 text-gray-900 mt-1">
                    <SelectValue placeholder="Select an insurer (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="none-insurer">None</SelectItem>
                    {!Array.isArray(insurers) || insurers.length === 0 ? (
                      <SelectItem value="none" disabled>No insurers available</SelectItem>
                    ) : (
                      insurers.map((insurer, insurerIndex) => {
                        const insurerValue = insurer._id || insurer.id || `insurer-${insurerIndex}`;
                        const insurerName = (() => {
                          if (insurer.firstName && insurer.lastName) {
                            return `${insurer.firstName} ${insurer.lastName}`;
                          }
                          if (insurer.firstName) return insurer.firstName;
                          if (insurer.lastName) return insurer.lastName;
                          if (typeof insurer.name === 'string') return insurer.name;
                          if (insurer.email) return insurer.email;
                          if (insurer.phoneNumber) return insurer.phoneNumber;
                          return 'Unknown Insurer';
                        })();
                        const contactInfo = insurer.email || insurer.phoneNumber || '';
                        return (
                          <SelectItem key={insurerValue} value={insurerValue}>
                            {insurerName}{contactInfo ? ` (${contactInfo})` : ''}
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAssignDialog(false);
                    setSelectedFarmForAssignment(null);
                    setAssignFormData({ assessorId: "", insurerId: "" });
                  }}
                  className="border-gray-300 text-gray-900 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignAssessor}
                  disabled={assigningAssessor || !assignFormData.assessorId}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {assigningAssessor ? (
                    <>
                      <img src="/loading.gif" alt="Loading" className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Assign Assessor
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Assessment Dialog */}
        <Dialog open={showAssessmentDialog} onOpenChange={handleAssessmentDialogChange}>
          <DialogContent className="bg-white border-gray-300">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Create Assessment</DialogTitle>
              <DialogDescription className="text-gray-900/60">
                Create a new assessment by selecting a farm and an assessor.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="farmId" className="text-gray-900">Farm</Label>
                <Select
                  value={assessmentFormData.farmId}
                  onValueChange={(value) => setAssessmentFormData({ ...assessmentFormData, farmId: value })}
                >
                  <SelectTrigger id="farmId" className="bg-gray-50 border-gray-300 text-gray-900 mt-1">
                    <SelectValue placeholder="Select a farm" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    {farmsLoading ? (
                      <SelectItem value="loading" disabled>Loading farms...</SelectItem>
                    ) : !Array.isArray(farms) || farms.length === 0 ? (
                      <SelectItem value="none" disabled>
                        {!Array.isArray(farms) ? 'Farms data error' : `No farms available (loaded: ${farms.length})`}
                      </SelectItem>
                    ) : (
                      farms.filter(farm => {
                        const hasId = farm != null && (farm._id || farm.id);
                        if (!hasId) {
                          console.warn('⚠️ Farm filtered out (no ID):', farm);
                        }
                        return hasId;
                      }).map((farm, index) => {
                        const farmValue = farm.id || farm._id;
                        const farmName = farm.name || `Farm ${index + 1}`;
                        const cropType = farm.cropType || '';
                        const farmerName = farm.farmerName || 
                          (farm.farmer?.firstName && farm.farmer?.lastName 
                            ? `${farm.farmer.firstName} ${farm.farmer.lastName}` 
                            : farm.farmer?.name || 'Unknown Farmer');
                        
                        return (
                          <SelectItem key={farmValue} value={farmValue}>
                            {farmName}{cropType ? ` (${cropType})` : ''} - {farmerName}
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assessorId" className="text-gray-900">Assessor</Label>
                <Select
                  value={assessmentFormData.assessorId}
                  onValueChange={(value) => setAssessmentFormData({ ...assessmentFormData, assessorId: value })}
                >
                  <SelectTrigger id="assessorId" className="bg-gray-50 border-gray-300 text-gray-900 mt-1">
                    <SelectValue placeholder="Select an assessor" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    {!Array.isArray(assessors) || assessors.length === 0 ? (
                      <SelectItem value="none" disabled>
                        {!Array.isArray(assessors) ? 'Assessors data error' : `No assessors available (loaded: ${assessors.length})`}
                      </SelectItem>
                    ) : (
                      assessors.filter(assessor => {
                        const hasId = assessor != null && (assessor.id || assessor._id);
                        if (!hasId) {
                          console.warn('⚠️ Assessor filtered out (no ID):', assessor);
                        }
                        return hasId;
                      }).map((assessor, index) => {
                        // Use id from the new API response structure
                        const assessorValue = assessor.id || assessor._id;
                        // Extract name from firstName and lastName
                        const assessorName = assessor.firstName && assessor.lastName
                          ? `${assessor.firstName} ${assessor.lastName}`
                          : assessor.firstName || assessor.lastName || assessor.name || 'Unknown Assessor';
                        const contactInfo = assessor.email || assessor.phoneNumber || '';
                        const specialization = assessor.assessorProfile?.specialization || '';
                        return (
                          <SelectItem key={assessorValue} value={assessorValue}>
                            {assessorName}{contactInfo ? ` (${contactInfo})` : ''}{specialization ? ` - ${specialization}` : ''}
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAssessmentDialog(false);
                    setAssessmentFormData({ farmId: "", assessorId: "" });
                  }}
                  className="border-gray-300 text-gray-900 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAssessment}
                  disabled={creatingAssessment || !assessmentFormData.farmId || !assessmentFormData.assessorId}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {creatingAssessment ? (
                    <>
                      <img src="/loading.gif" alt="Loading" className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Assessment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // Render page based on active selection
  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return renderDashboard();
      case "users": return renderUserManagement();
      case "policies": return renderPoliciesManagement();
      case "claims": return renderClaimsManagement();
      case "assessments": return renderAssessmentsManagement();
      case "settings": return renderSettings();
      default: return renderDashboard();
    }
  };

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "users", label: "User Management", icon: Users },
    { id: "policies", label: "Policies", icon: FileCheck },
    { id: "claims", label: "Claims", icon: AlertCircle },
    { id: "assessments", label: "Assessments", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  // Get display name from profile if available
  const displayName = adminProfile 
    ? (adminProfile.firstName && adminProfile.lastName 
        ? `${adminProfile.firstName} ${adminProfile.lastName}`.trim()
        : adminProfile.name || adminProfile.firstName || adminProfile.lastName || adminName)
    : adminName;

  return (
    <DashboardLayout
      userType="admin"
      userId={adminId}
      userName={displayName}
      navigationItems={navigationItems}
      activePage={activePage}
      onPageChange={setActivePage}
      onLogout={handleLogout}
    >
      {renderPage()}
    </DashboardLayout>
  );
};
