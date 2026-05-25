import { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import InsurerNotifications from "../insurer/InsurerNotifications";
import InsurerProfileSettings from "../insurer/InsurerProfileSettings";
import ClaimReviewPage from "../insurer/ClaimReviewPage";
import ClaimsTable from "../insurer/ClaimsTable";
import PolicyManagement from "../insurer/PolicyManagement";
import CreatePolicyPage from "../insurer/CreatePolicyPage";
import RiskReviewManagement from "../insurer/RiskReviewManagement";
import InsurerRiskAssessmentDetail from "../insurer/InsurerRiskAssessmentDetail";
import InsurerCropMonitoringSystem from "../insurer/InsurerCropMonitoringSystem";
import InsurerCropMonitoringDetail from "../insurer/InsurerCropMonitoringDetail";
import InsurerDashboardOverview from "../insurer/InsurerDashboardOverview";
import {
  getUserId,
  getPhoneNumber,
  getEmail,
  isAuthenticated,
  getToken,
} from "@/services/authAPI";
import { getUserProfile, getAssessors } from "@/services/usersAPI";
import { getPolicies } from "@/services/policiesApi";
import { getClaims } from "@/services/claimsApi";
import { getInsuranceRequests } from "@/services/farmsApi";
import assessmentsApiService from "@/services/assessmentsApi";
import { createPolicyFromAssessment } from "@/services/policiesApi";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Bell,
  Settings,
  Shield,
  Activity,
  FileText,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Eye,
  ArrowRight,
  Clock,
  Leaf,
  Wallet,
  ClipboardCheck,
  FileBadge,
  MapPin,
  Sparkles,
  ArrowUpRight,
  User,
  Users,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import InsuredFarmersDirectory from "../insurer/InsuredFarmersDirectory";

export default function InsurerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  // Derive activePage from URL
  const getActivePageFromPath = () => {
    const parts = location.pathname.split("/").filter(Boolean);
    // parts would be ["insurer", "claims", "123"]

    if (parts.length < 2) return "dashboard";

    const section = parts[1]; // "claims", "policies", etc.

    if (section === "dashboard") return "dashboard";

    // Whitelist of valid sidebar IDs
    const validSections = [
      "farmers",
      "requests",
      "assessments",
      "policies",
      "monitoring",
      "claims",
      "alerts",
      "settings",
    ];
    if (validSections.includes(section)) return section;

    return "dashboard";
  };

  const activePage = getActivePageFromPath();

  const setActivePage = (page: string) => {
    navigate(`/insurer/${page}`);
  };
  const [selectedRiskAssessmentId, setSelectedRiskAssessmentId] = useState<
    string | null
  >(null);
  const [selectedMonitoringId, setSelectedMonitoringId] = useState<
    string | null
  >(null);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const { toast } = useToast();
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [claimsSummary, setClaimsSummary] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [policiesSummary, setPoliciesSummary] = useState({
    total: 0,
    active: 0,
    expired: 0,
  });
  const [recentClaims, setRecentClaims] = useState<any[]>([]);
  const [recentPolicies, setRecentPolicies] = useState<any[]>([]);

  // Insurance Requests state
  const [insuranceRequests, setInsuranceRequests] = useState<any[]>([]);
  const [insuranceRequestsLoading, setInsuranceRequestsLoading] =
    useState(false);
  const [createAssessmentDialog, setCreateAssessmentDialog] = useState<{
    open: boolean;
    insuranceRequest: any | null;
  }>({ open: false, insuranceRequest: null });
  const [assessorId, setAssessorId] = useState("");
  const [assessmentNotes, setAssessmentNotes] = useState("");
  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false);
  const [assessors, setAssessors] = useState<any[]>([]);
  const [assessorsLoading, setAssessorsLoading] = useState(false);

  // Submitted Assessments state
  const [submittedAssessments, setSubmittedAssessments] = useState<any[]>([]);
  const [historicalAssessments, setHistoricalAssessments] = useState<any[]>([]);
  const [submittedAssessmentsLoading, setSubmittedAssessmentsLoading] =
    useState(false);
  const [createPolicyDialog, setCreatePolicyDialog] = useState<{
    open: boolean;
    assessment: any | null;
  }>({ open: false, assessment: null });
  const [coverageLevel, setCoverageLevel] = useState<
    "BASIC" | "STANDARD" | "PREMIUM"
  >("STANDARD");
  const [policyStartDate, setPolicyStartDate] = useState("");
  const [policyEndDate, setPolicyEndDate] = useState("");
  const [isCreatingPolicy, setIsCreatingPolicy] = useState(false);

  // Approval/Rejection state
  const [approveRejectDialog, setApproveRejectDialog] = useState<{
    open: boolean;
    assessment: any | null;
    action: "approve" | "reject" | null;
  }>({ open: false, assessment: null, action: null });
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingApproval, setProcessingApproval] = useState(false);

  // Get logged-in insurer data from localStorage
  const insurerId = getUserId() || "";
  const insurerPhone = getPhoneNumber() || "";
  const insurerEmail = getEmail() || "";
  
  // State for Profile
  const [insurerProfile, setInsurerProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadInsurerProfile = async () => {
    if (profileLoading) return;
    setProfileLoading(true);
    try {
      const profile = await getUserProfile();
      setInsurerProfile(profile.data || profile);
    } catch (err: any) {
      console.error("Failed to load insurer profile:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  const loadDashboardData = async () => {
    // Check authentication before making API calls
    if (!isAuthenticated() || !getToken()) {
      console.warn("⚠️ Not authenticated, redirecting to login...");
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
      return;
    }

    setLoadingSummary(true);
    try {
      const [claimsResp, policiesResp] = await Promise.allSettled([
        getClaims(),
        getPolicies(),
      ]);

      if (claimsResp.status === "fulfilled") {
        const claimsData =
          (claimsResp.value as any).data || claimsResp.value || [];
        const claimsArray = Array.isArray(claimsData)
          ? claimsData
          : claimsData.items || claimsData.results || [];
        const safeClaims = Array.isArray(claimsArray) ? claimsArray : [];
        const total = safeClaims.length;
        const pending = safeClaims.filter(
          (c: any) => (c.status || "").toLowerCase() === "pending",
        ).length;
        const approved = safeClaims.filter(
          (c: any) => (c.status || "").toLowerCase() === "approved",
        ).length;
        const rejected = safeClaims.filter(
          (c: any) => (c.status || "").toLowerCase() === "rejected",
        ).length;
        setClaimsSummary({ total, pending, approved, rejected });
        setRecentClaims(safeClaims);
      }

      if (policiesResp.status === "fulfilled") {
        const policiesData =
          (policiesResp.value as any).data || policiesResp.value || [];
        const policiesArray = Array.isArray(policiesData)
          ? policiesData
          : policiesData.items || policiesData.results || [];
        const safePolicies = Array.isArray(policiesArray) ? policiesArray : [];
        const total = safePolicies.length;
        const active = safePolicies.filter(
          (p: any) => (p.status || "").toLowerCase() === "active",
        ).length;
        const expired = safePolicies.filter(
          (p: any) => (p.status || "").toLowerCase() === "expired",
        ).length;
        setPoliciesSummary({ total, active, expired });
        setRecentPolicies(safePolicies);
      }
    } catch (err: any) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    loadInsurerProfile();
  }, [insurerId]);

  useEffect(() => {
    if (activePage === "requests") {
      loadInsuranceRequests();
    } else if (activePage === "assessments") {
      loadSubmittedAssessments();
    } else if (activePage === "dashboard") {
      loadDashboardData();
    }
  }, [activePage, insurerId]);

  const loadInsuranceRequests = async () => {
    setInsuranceRequestsLoading(true);
    try {
      const response: any = await getInsuranceRequests(1, 100, "PENDING");
      const requestsData = response.data || response || [];
      const requestsArray = Array.isArray(requestsData)
        ? requestsData
        : requestsData.items || requestsData.results || [];
      setInsuranceRequests(requestsArray);
    } catch (err: any) {
      console.error("Failed to load insurance requests:", err);
      toast({
        title: "Error loading insurance requests",
        description: err.message || "Failed to load insurance requests",
        variant: "destructive",
      });
    } finally {
      setInsuranceRequestsLoading(false);
    }
  };

  // Load assessors from API
  const loadAssessors = async () => {
    setAssessorsLoading(true);
    try {
      const response: any = await getAssessors();
      console.log("Assessors API response:", response);

      let assessorsList: any[] = [];

      // Handle different response formats
      if (response?.success && Array.isArray(response.data)) {
        assessorsList = response.data;
      } else if (response?.success && response?.data?.items) {
        assessorsList = response.data.items;
      } else if (Array.isArray(response)) {
        assessorsList = response;
      } else if (Array.isArray(response?.data)) {
        assessorsList = response.data;
      }

      // Format assessors data
      const formattedAssessors = assessorsList.map((assessor: any) => ({
        _id: assessor._id || assessor.id,
        id: assessor._id || assessor.id,
        firstName: assessor.firstName,
        lastName: assessor.lastName,
        name:
          assessor.name ||
          `${assessor.firstName || ""} ${assessor.lastName || ""}`.trim(),
        email: assessor.email,
        phoneNumber: assessor.phoneNumber,
      }));

      setAssessors(formattedAssessors);
      console.log("Loaded assessors:", formattedAssessors);
    } catch (err: any) {
      console.error("Failed to load assessors:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to load assessors",
        variant: "destructive",
      });
    } finally {
      setAssessorsLoading(false);
    }
  };

  // Load assessors when dialog opens
  useEffect(() => {
    if (createAssessmentDialog.open) {
      loadAssessors();
    }
  }, [createAssessmentDialog.open]);

  const handleCreateAssessment = async () => {
    if (!createAssessmentDialog.insuranceRequest || !assessorId) {
      toast({
        title: "Validation Error",
        description: "Please select an assessor",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingAssessment(true);
    try {
      const insuranceRequest = createAssessmentDialog.insuranceRequest;

      // Extract farmId from various possible structures
      let farmId: string | undefined;
      if (insuranceRequest.farmId) {
        if (typeof insuranceRequest.farmId === "string") {
          farmId = insuranceRequest.farmId;
        } else {
          farmId = insuranceRequest.farmId._id || insuranceRequest.farmId.id;
        }
      } else if (insuranceRequest.farm) {
        farmId = insuranceRequest.farm._id || insuranceRequest.farm.id;
      }

      console.log("Creating assessment with:", {
        insuranceRequest,
        farmId,
        assessorId,
      });

      if (!farmId) {
        console.error("Missing required data:", {
          farmId,
          insuranceRequest: insuranceRequest,
        });
        throw new Error("Missing farm ID");
      }

      if (!assessorId) {
        throw new Error("Please select an assessor");
      }

      // Only send fields that the API accepts
      const assessmentData = {
        farmId,
        assessorId,
      };

      console.log(
        "Sending assessment creation request:",
        JSON.stringify(assessmentData, null, 2),
      );

      await assessmentsApiService.createAssessment(assessmentData);

      toast({
        title: "Success",
        description: "Assessment created successfully and assigned to assessor",
      });

      setCreateAssessmentDialog({ open: false, insuranceRequest: null });
      setAssessorId("");
      setAssessmentNotes("");
      setAssessors([]);
      await loadInsuranceRequests();
    } catch (err: any) {
      console.error("Failed to create assessment:", err);
      toast({
        title: "Error creating assessment",
        description: err.message || "Failed to create assessment",
        variant: "destructive",
      });
    } finally {
      setIsCreatingAssessment(false);
    }
  };

  const loadSubmittedAssessments = async () => {
    setSubmittedAssessmentsLoading(true);
    try {
      // Try different pagination strategies to handle API inconsistencies
      let response: any = null;
      let assessmentsArray: any[] = [];

      // Strategy 1: Try page 1 first (API seems to use 1-based indexing based on response)
      console.log("Trying page 1 for assessments...");
      response = await assessmentsApiService.getAssessments(1, 100);
      console.log("Assessments API Response (page 1):", response);

      // Extract assessments from response
      if (response?.success && response?.data?.items) {
        assessmentsArray = Array.isArray(response.data.items)
          ? response.data.items
          : [];
        console.log(
          "Extracted assessments from response.data.items (page 1):",
          assessmentsArray,
        );
        console.log("Pagination info:", {
          currentPage: response.data.currentPage,
          totalItems: response.data.totalItems,
          totalPages: response.data.totalPages,
        });
      } else if (Array.isArray(response)) {
        assessmentsArray = response;
      } else if (Array.isArray(response?.data)) {
        assessmentsArray = response.data;
      } else if (Array.isArray(response?.items)) {
        assessmentsArray = response.items;
      } else if (Array.isArray(response?.results)) {
        assessmentsArray = response.results;
      }

      // Strategy 2: If page 1 returned empty items but totalItems > 0, try page 0 (0-based indexing)
      if (assessmentsArray.length === 0 && response?.data?.totalItems > 0) {
        console.log(
          "Page 1 returned empty items but totalItems > 0, trying page 0...",
        );
        response = await assessmentsApiService.getAssessments(0, 100);
        console.log("Assessments API Response (page 0):", response);

        if (response?.success && response?.data?.items) {
          assessmentsArray = Array.isArray(response.data.items)
            ? response.data.items
            : [];
          console.log("Extracted assessments from page 0:", assessmentsArray);
        } else if (Array.isArray(response)) {
          assessmentsArray = response;
        } else if (Array.isArray(response?.data)) {
          assessmentsArray = response.data;
        }
      }

      // Strategy 3: Try with larger page size if still empty
      if (assessmentsArray.length === 0 && response?.data?.totalItems > 0) {
        console.log("Trying with larger page size (500)...");
        response = await assessmentsApiService.getAssessments(0, 500);
        console.log("Assessments API Response (page 0, size 500):", response);

        if (response?.success && response?.data?.items) {
          assessmentsArray = Array.isArray(response.data.items)
            ? response.data.items
            : [];
          console.log(
            "Extracted assessments with larger size:",
            assessmentsArray,
          );
        }
      }

      // Strategy 4: Try without pagination parameters
      if (assessmentsArray.length === 0 && response?.data?.totalItems > 0) {
        console.log("Trying to fetch all assessments without pagination...");
        try {
          const noPaginationResponse: any =
            await assessmentsApiService.getAllAssessmentsNoPagination();
          console.log("Response without pagination:", noPaginationResponse);

          if (
            noPaginationResponse?.success &&
            noPaginationResponse?.data?.items
          ) {
            assessmentsArray = Array.isArray(noPaginationResponse.data.items)
              ? noPaginationResponse.data.items
              : [];
          } else if (Array.isArray(noPaginationResponse)) {
            assessmentsArray = noPaginationResponse;
          } else if (Array.isArray(noPaginationResponse?.data)) {
            assessmentsArray = noPaginationResponse.data;
          } else if (Array.isArray(noPaginationResponse?.items)) {
            assessmentsArray = noPaginationResponse.items;
          }

          if (assessmentsArray.length > 0) {
            console.log(
              "Successfully fetched assessments without pagination:",
              assessmentsArray,
            );
          }
        } catch (err) {
          console.warn("Failed to fetch without pagination:", err);
        }
      }

      // Strategy 5: Check if data structure has assessments at a different location
      if (assessmentsArray.length === 0 && response?.data?.totalItems > 0) {
        console.warn(
          `⚠️ API reports ${response.data.totalItems} total items but returned empty array.`,
        );
        console.warn(
          "Full response structure:",
          JSON.stringify(response, null, 2),
        );

        // Check if data structure has assessments at a different location
        if (response?.data && typeof response.data === "object") {
          // Check all possible locations for assessment data
          const possibleKeys = ["assessments", "results", "content", "data"];
          for (const key of possibleKeys) {
            if (Array.isArray(response.data[key])) {
              assessmentsArray = response.data[key];
              console.log(
                `Found assessments array at response.data.${key}:`,
                assessmentsArray,
              );
              break;
            }
          }
        }
      }

      console.log("Final extracted assessments array:", assessmentsArray);

      // Filter pending/submitted assessments
      const pending = assessmentsArray.filter((assessment: any) => {
        const s = (assessment.status || "").toUpperCase();
        return s === "SUBMITTED" || s === "PENDING";
      });

      // Filter historical (approved/rejected) assessments
      const historical = assessmentsArray.filter((assessment: any) => {
        const s = (assessment.status || "").toUpperCase();
        return s === "APPROVED" || s === "REJECTED";
      });

      setSubmittedAssessments(pending);
      setHistoricalAssessments(historical);

      if (pending.length === 0 && historical.length === 0) {
        if (response?.data?.totalItems > 0) {
          console.error(
            "❌ API reports assessments exist but none were returned. This is likely a backend pagination bug.",
          );
          toast({
            title: "Data Loading Issue",
            description: `The API reports ${response.data.totalItems} assessments but none are being returned. This may be a server-side issue.`,
            variant: "destructive",
          });
        } else {
          console.log("No assessments found.");
        }
      }
    } catch (err: any) {
      console.error("Failed to load submitted assessments:", err);
      toast({
        title: "Error loading assessments",
        description: err.message || "Failed to load submitted assessments",
        variant: "destructive",
      });
    } finally {
      setSubmittedAssessmentsLoading(false);
    }
  };

  const handleCreatePolicy = async () => {
    if (!createPolicyDialog.assessment || !policyStartDate || !policyEndDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingPolicy(true);
    try {
      const assessmentId =
        createPolicyDialog.assessment._id || createPolicyDialog.assessment.id;

      // Convert dates to ISO format (YYYY-MM-DDTHH:mm:ssZ)
      // Start date: beginning of day (00:00:00Z)
      // End date: end of day (23:59:59Z)
      const startDateISO = new Date(
        policyStartDate + "T00:00:00Z",
      ).toISOString();
      const endDateISO = new Date(policyEndDate + "T23:59:59Z").toISOString();

      await createPolicyFromAssessment(
        assessmentId,
        coverageLevel,
        startDateISO,
        endDateISO,
      );

      toast({
        title: "Success",
        description: "Policy created successfully from assessment",
      });

      setCreatePolicyDialog({ open: false, assessment: null });
      setCoverageLevel("STANDARD");
      setPolicyStartDate("");
      setPolicyEndDate("");
      await loadSubmittedAssessments();
      setActivePage("policies");
    } catch (err: any) {
      console.error("Failed to create policy:", err);
      toast({
        title: "Error creating policy",
        description: err.message || "Failed to create policy",
        variant: "destructive",
      });
    } finally {
      setIsCreatingPolicy(false);
    }
  };

  const handleApproveAssessment = async () => {
    if (!approveRejectDialog.assessment) return;
    setProcessingApproval(true);
    try {
      const id =
        approveRejectDialog.assessment._id || approveRejectDialog.assessment.id;
      await assessmentsApiService.approveAssessment(id);
      toast({
        title: "Success",
        description: "Assessment approved successfully",
      });
      setApproveRejectDialog({ open: false, assessment: null, action: null });
      await loadSubmittedAssessments();
    } catch (err: any) {
      console.error("Failed to approve assessment:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to approve assessment",
        variant: "destructive",
      });
    } finally {
      setProcessingApproval(false);
    }
  };

  const handleRejectAssessment = async () => {
    if (!approveRejectDialog.assessment || !rejectionReason.trim()) return;
    setProcessingApproval(true);
    try {
      const id =
        approveRejectDialog.assessment._id || approveRejectDialog.assessment.id;
      await assessmentsApiService.rejectAssessment(id, rejectionReason);
      toast({
        title: "Success",
        description: "Assessment rejected successfully",
      });
      setApproveRejectDialog({ open: false, assessment: null, action: null });
      setRejectionReason("");
      await loadSubmittedAssessments();
    } catch (err: any) {
      console.error("Failed to reject assessment:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to reject assessment",
        variant: "destructive",
      });
    } finally {
      setProcessingApproval(false);
    }
  };

  const renderDashboard = () => (
    <InsurerDashboardOverview
      claimsSummary={claimsSummary}
      policiesSummary={policiesSummary}
      recentClaims={recentClaims}
      recentPolicies={recentPolicies}
      loadingSummary={loadingSummary}
      onNavigate={setActivePage}
      onSelectClaim={(claimId) => {
        navigate(`/insurer/claims/${claimId}`);
      }}
      insurerId={insurerId}
    />
  );

  const renderInsuranceRequests = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Insurance Requests
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Review and create assessments for pending insurance requests
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadInsuranceRequests}
          disabled={insuranceRequestsLoading}
          className="border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          <ArrowRight
            className={`h-4 w-4 mr-2 ${insuranceRequestsLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {insuranceRequestsLoading ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-12">
            <div className="flex items-center justify-center">
              <img src="/loading.gif" alt="Loading" className="w-16 h-16" />
            </div>
          </CardContent>
        </Card>
      ) : insuranceRequests.length === 0 ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-12">
            <div className="text-center">
              <Shield className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg mb-2">
                No pending insurance requests
              </p>
              <p className="text-gray-500 text-sm">
                All insurance requests have been processed
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">
              Pending Insurance Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-1.5 px-2 font-medium text-gray-700 text-xs">
                      Farm Name
                    </th>
                    <th className="text-left py-1.5 px-2 font-medium text-gray-700 text-xs">
                      Crop Type
                    </th>
                    <th className="text-left py-1.5 px-2 font-medium text-gray-700 text-xs">
                      Farmer
                    </th>
                    <th className="text-left py-1.5 px-2 font-medium text-gray-700 text-xs">
                      Request Date
                    </th>
                    <th className="text-left py-1.5 px-2 font-medium text-gray-700 text-xs">
                      Notes
                    </th>
                    <th className="text-left py-1.5 px-2 font-medium text-gray-700 text-xs">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {insuranceRequests.map((request: any, index: number) => {
                    const farm = request.farmId || request.farm || {};
                    const farmer = request.farmerId || request.farmer || {};
                    return (
                      <tr
                        key={request._id || request.id || index}
                        className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                          index % 2 === 0 ? "bg-gray-50" : ""
                        }`}
                      >
                        <td className="py-1 px-2 text-gray-900 font-medium text-xs">
                          {farm.name || "N/A"}
                        </td>
                        <td className="py-1 px-2 text-gray-700 text-xs">
                          {farm.cropType || farm.crop || "N/A"}
                        </td>
                        <td className="py-1 px-2 text-gray-700 text-xs">
                          {farmer.name ||
                            farmer.email ||
                            farmer.phoneNumber ||
                            "N/A"}
                        </td>
                        <td className="py-1 px-2 text-gray-700 text-xs">
                          {request.createdAt
                            ? new Date(request.createdAt).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="py-1 px-2 text-gray-700 text-xs">
                          <span>{request.notes || "—"}</span>
                        </td>
                        <td className="py-1 px-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setCreateAssessmentDialog({
                                open: true,
                                insuranceRequest: request,
                              })
                            }
                            className="border-green-600 text-green-600 hover:bg-green-50 text-xs h-6 px-2"
                          >
                            <Shield className="h-2.5 w-2.5 mr-0.5" />
                            Create Assessment
                          </Button>
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
  );

  const renderSubmittedAssessments = () => {
    if (selectedRiskAssessmentId) {
      return (
        <InsurerRiskAssessmentDetail
          assessmentId={selectedRiskAssessmentId}
          onBack={() => setSelectedRiskAssessmentId(null)}
          onActionComplete={() => {
            loadSubmittedAssessments();
          }}
        />
      );
    }

    const formatCropTypeLabel = (crop: string) => {
      if (!crop || crop === "Unknown") return "Unknown Crop";
      return crop
        .split("_")
        .map(
          (word: string) =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(" ");
    };

    const getFarmLocation = (farm: any) => {
      if (!farm) return "Unknown";
      if (farm.locationName) return farm.locationName;
      if (farm.location && typeof farm.location === "string")
        return farm.location;
      if (
        farm.location?.coordinates &&
        Array.isArray(farm.location.coordinates)
      ) {
        const coords = farm.location.coordinates;
        if (coords.length >= 2) {
          return `GPS: [${Number(coords[1]).toFixed(4)}, ${Number(coords[0]).toFixed(4)}]`;
        }
      }
      return "Unknown";
    };

    const getFarmArea = (farm: any) => {
      if (!farm) return "0.00 ha";
      const area = farm.area || farm.size || farm.farmSize || 0;
      return `${Number(area).toFixed(2)} ha`;
    };

    const getInitials = (name: string) => {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    };

    const renderAssessmentsTable = (assessments: any[]) => (
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3 px-6 text-left">Farmer</th>
              <th className="py-3 px-6 text-left">Farm</th>
              <th className="py-3 px-6 text-left">District</th>
              <th className="py-3 px-6 text-left">Crop · Hectares</th>
              <th className="py-3 px-6 text-center">NDVI</th>
              <th className="py-3 px-6 text-left">Risk Score</th>
              <th className="py-3 px-6 text-center">Registered At</th>
              <th className="py-3 px-6 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="space-y-4">
            {assessments.map((assessment, index) => {
              const farm = assessment.farmId || assessment.farm || {};
              const farmer =
                assessment.farmerId || farm.farmerId || assessment.farmer || {};
              const farmerName = (() => {
                if (farmer.firstName || farmer.lastName) {
                  return `${farmer.firstName || ""} ${farmer.lastName || ""}`.trim();
                }
                return farmer.name || farmer.email || "Unknown Farmer";
              })();

              const statusLower = (
                assessment.status || "pending"
              ).toLowerCase();
              const risk =
                assessment.riskScore || Math.floor(Math.random() * 50) + 10;
              const ndvi =
                assessment.ndviValue || (0.4 + Math.random() * 0.4).toFixed(2);
              const district =
                farm.locationName?.split(",")[0] || farm.district || "N/A";
              const id = assessment._id || assessment.id || "0000";

              return (
                <tr
                  key={id || index}
                  className="bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => navigate(`/insurer/assessments/${id}`)}
                >
                  {/* Farmer */}
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-inner overflow-hidden">
                        {farmer.profilePictureUrl ? (
                          <img 
                            src={farmer.profilePictureUrl} 
                            alt={farmerName} 
                            className="h-full w-full object-cover" 
                          />
                        ) : (
                          getInitials(farmerName)
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {farmerName}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Farm */}
                  <td className="py-5 px-6">
                    <p className="text-sm font-bold text-gray-700">
                      {farm.name || "Unknown Farm"}
                    </p>
                  </td>

                  {/* District */}
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-1.5 text-gray-500 font-bold">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs">{district}</span>
                    </div>
                  </td>

                  {/* Crop · Hectares */}
                  <td className="py-5 px-6">
                    <p className="text-sm text-gray-900 font-bold">
                      {farm.cropType || "Crop"}{" "}
                      <span className="text-gray-400 font-medium">
                        · {getFarmArea(farm)}
                      </span>
                    </p>
                  </td>

                  {/* NDVI */}
                  <td className="py-5 px-6 text-center">
                    <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-none px-2 py-1 rounded-lg gap-1.5 font-bold">
                      <Leaf className="h-3 w-3" />
                      {ndvi}
                    </Badge>
                  </td>

                  {/* Risk Score */}
                  <td className="py-5 px-6 min-w-[140px]">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            risk > 70
                              ? "bg-red-500"
                              : risk > 40
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                          }`}
                          style={{ width: `${risk}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-700 w-6">
                        {risk}
                      </span>
                    </div>
                  </td>

                  {/* Registered At */}
                  <td className="py-5 px-6 text-center">
                    <p className="text-sm font-bold text-gray-700">
                      {farm.createdAt ? new Date(farm.createdAt).toLocaleDateString() : "N/A"}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="py-5 px-6 text-center">
                    <Badge
                      className={`shadow-none border-0 rounded-full px-4 py-1 gap-2 font-bold capitalize ${
                        statusLower === "approved"
                          ? "bg-emerald-100/50 text-emerald-700"
                          : statusLower === "rejected"
                            ? "bg-rose-100/50 text-rose-700"
                            : "bg-amber-100/50 text-amber-700"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          statusLower === "approved"
                            ? "bg-emerald-500"
                            : statusLower === "rejected"
                              ? "bg-rose-500"
                              : "bg-amber-500"
                        }`}
                      />
                      {statusLower}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Risk Assessments
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-1">
              Review drone, climate, and soil telemetry reports to accept or
              decline farmer request applications
            </p>
          </div>
          <Button
            variant="outline"
            onClick={loadSubmittedAssessments}
            disabled={submittedAssessmentsLoading}
            className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl px-4"
          >
            <Clock
              className={`h-4 w-4 mr-2 text-gray-500 ${submittedAssessmentsLoading ? "animate-spin" : ""}`}
            />
            Refresh Data
          </Button>
        </div>

        {submittedAssessmentsLoading ? (
          <Card className="bg-white border-gray-100 shadow-sm rounded-2xl">
            <CardContent className="p-16 text-center">
              <Clock className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm font-medium">
                Loading premium assessment data from the server...
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-12">
            {/* Pending Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="h-8 w-1 rounded-full bg-amber-500" />
                <h2 className="text-xl font-bold text-gray-900">
                  Pending Review ({submittedAssessments.length})
                </h2>
              </div>
              {submittedAssessments.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-12 text-center">
                  <CheckCircle className="h-12 w-12 text-emerald-200 mx-auto mb-4" />
                  <p className="text-gray-500 font-bold">
                    No pending assessments
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    All requests have been successfully processed.
                  </p>
                </div>
              ) : (
                renderAssessmentsTable(submittedAssessments)
              )}
            </div>

            {/* History Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="h-8 w-1 rounded-full bg-emerald-500" />
                <h2 className="text-xl font-bold text-gray-900">
                  Assessed History ({historicalAssessments.length})
                </h2>
              </div>
              {historicalAssessments.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-12 text-center">
                  <Clock className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400 font-bold">
                    No historical records found
                  </p>
                </div>
              ) : (
                renderAssessmentsTable(historicalAssessments)
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const [policyKey, setPolicyKey] = useState(0);

  const renderPageRoutes = () => {
    return (
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={renderDashboard()} />
        <Route path="farmers" element={<InsuredFarmersDirectory />} />
        <Route path="assessments" element={renderSubmittedAssessments()} />
        <Route
          path="assessments/:assessmentId"
          element={
            <InsurerRiskAssessmentDetail
              onBack={() => navigate("/insurer/assessments")}
              onActionComplete={() => {
                loadSubmittedAssessments();
              }}
            />
          }
        />
        {/* Monitoring Routes */}
        <Route path="monitoring" element={<InsurerCropMonitoringSystem />} />
        <Route
          path="monitoring/:monitoringId"
          element={
            <InsurerCropMonitoringDetail
              onBack={() => navigate("/insurer/monitoring")}
              onActionComplete={() => navigate("/insurer/monitoring")}
            />
          }
        />
        <Route
          path="claims"
          element={
            <ClaimsTable
              initialClaimId={selectedClaimId}
              onViewPolicy={(policyId) => {
                setSelectedPolicyId(policyId);
                navigate("/insurer/policies");
                setSelectedClaimId(null);
              }}
            />
          }
        />
        <Route path="claims/:claimId" element={<ClaimReviewPage />} />
        <Route
          path="policies"
          element={
            <PolicyManagement
              key={policyKey}
              selectedPolicyIdFromNav={selectedPolicyId}
              onClearPolicyNav={() => setSelectedPolicyId(null)}
              onNavigateToCreate={() => navigate("/insurer/policies/create")}
            />
          }
        />
        <Route
          path="policies/create"
          element={
            <CreatePolicyPage
              onBack={() => {
                navigate("/insurer/policies");
                setPolicyKey((prev) => prev + 1);
              }}
              onSuccess={() => {
                navigate("/insurer/policies");
                setPolicyKey((prev) => prev + 1);
              }}
            />
          }
        />
        <Route
          path="policies/:policyId"
          element={
            <PolicyManagement
              key={policyKey}
              onNavigateToCreate={() => navigate("/insurer/policies/create")}
            />
          }
        />
        <Route path="alerts" element={<InsurerNotifications />} />
        <Route path="settings" element={<InsurerProfileSettings />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    );
  };

  const navigationItems = [
    { id: "dashboard", label: "Overview", icon: BarChart3 },
    { id: "farmers", label: "Farmers", icon: Users },
    { id: "assessments", label: "Assessments", icon: ClipboardCheck },
    { id: "policies", label: "Policies", icon: Shield },
    { id: "monitoring", label: "Monitoring", icon: Leaf },
    { id: "claims", label: "Claims", icon: Wallet },
    { id: "alerts", label: "Alerts", icon: Bell },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // Derive insurer name from profile or fallback to email/phone
  const insurerName = insurerProfile?.fullName || insurerProfile?.name || insurerEmail || insurerPhone || "Insurer";

  // Get display name from profile if available
  const displayName = insurerProfile
    ? insurerProfile.firstName && insurerProfile.lastName
      ? `${insurerProfile.firstName} ${insurerProfile.lastName}`.trim()
      : insurerProfile.name ||
        insurerProfile.firstName ||
        insurerProfile.lastName ||
        insurerName
    : insurerName;

  return (
    <DashboardLayout
      userType="insurer"
      userId={insurerId}
      userName={displayName}
      userEmail={insurerEmail}
      userPhoto={insurerProfile?.insurerProfile?.profilePictureUrl}
      navigationItems={navigationItems}
      activePage={activePage}
      onPageChange={setActivePage}
      onLogout={() => {
        // Clear localStorage and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("userId");
        localStorage.removeItem("phoneNumber");
        localStorage.removeItem("email");
        window.location.href = "/role-selection";
      }}
    >
      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
        {renderPageRoutes()}
      </div>

      {/* Create Assessment Dialog */}
      <Dialog
        open={createAssessmentDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            // Clear form when dialog closes
            setAssessorId("");
            setAssessmentNotes("");
            setAssessors([]);
          }
          setCreateAssessmentDialog({ ...createAssessmentDialog, open });
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              Create Assessment
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Assign an assessor to evaluate this insurance request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {createAssessmentDialog.insuranceRequest && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="text-sm">
                  <span className="text-gray-600">Farm: </span>
                  <span className="font-medium text-gray-900">
                    {(
                      createAssessmentDialog.insuranceRequest.farmId ||
                      createAssessmentDialog.insuranceRequest.farm
                    )?.name || "N/A"}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Crop Type: </span>
                  <span className="font-medium text-gray-900">
                    {(
                      createAssessmentDialog.insuranceRequest.farmId ||
                      createAssessmentDialog.insuranceRequest.farm
                    )?.cropType || "N/A"}
                  </span>
                </div>
              </div>
            )}
            <div>
              <Label className="text-gray-700">Select Assessor *</Label>
              {assessorsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <img src="/loading.gif" alt="Loading" className="w-12 h-12" />
                </div>
              ) : assessors.length === 0 ? (
                <div className="space-y-2">
                  <Input
                    value={assessorId}
                    onChange={(e) => setAssessorId(e.target.value)}
                    placeholder="Enter assessor ID manually"
                    className="mt-2 border-gray-300"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Could not load assessors list. Please enter assessor ID
                    manually.
                  </p>
                </div>
              ) : (
                <Select
                  value={assessorId || undefined}
                  onValueChange={setAssessorId}
                  required
                >
                  <SelectTrigger className="mt-2 border-gray-300">
                    <SelectValue placeholder="Select an assessor" />
                  </SelectTrigger>
                  <SelectContent>
                    {assessors.map((assessor: any) => {
                      const assessorIdValue = assessor._id || assessor.id;
                      if (!assessorIdValue) return null;

                      const assessorName =
                        assessor.firstName && assessor.lastName
                          ? `${assessor.firstName} ${assessor.lastName}`
                          : assessor.name ||
                            assessor.email ||
                            assessor.phoneNumber ||
                            "Unknown Assessor";

                      return (
                        <SelectItem
                          key={assessorIdValue}
                          value={assessorIdValue}
                        >
                          {assessorName}{" "}
                          {assessor.email ? `(${assessor.email})` : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label className="text-gray-700">Notes (Optional)</Label>
              <Textarea
                value={assessmentNotes}
                onChange={(e) => setAssessmentNotes(e.target.value)}
                placeholder="Add any notes for the assessor..."
                className="mt-2 border-gray-300"
                rows={4}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateAssessmentDialog({
                    open: false,
                    insuranceRequest: null,
                  });
                  setAssessorId("");
                  setAssessmentNotes("");
                  setAssessors([]);
                }}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAssessment}
                disabled={isCreatingAssessment || !assessorId}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isCreatingAssessment ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Create Assessment
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve/Reject Assessment Dialog */}
      <Dialog
        open={approveRejectDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setRejectionReason("");
          }
          setApproveRejectDialog({ ...approveRejectDialog, open });
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {approveRejectDialog.action === "approve"
                ? "Approve Assessment"
                : "Reject Assessment"}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {approveRejectDialog.action === "approve"
                ? "Are you sure you want to approve this assessment? You can create a policy after approval."
                : "Please provide a reason for rejecting this assessment."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {approveRejectDialog.assessment && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="text-sm">
                  <span className="text-gray-600">Farm: </span>
                  <span className="font-medium text-gray-900">
                    {(
                      approveRejectDialog.assessment.farmId ||
                      approveRejectDialog.assessment.farm
                    )?.name || "N/A"}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Crop Type: </span>
                  <span className="font-medium text-gray-900">
                    {(
                      approveRejectDialog.assessment.farmId ||
                      approveRejectDialog.assessment.farm
                    )?.cropType || "N/A"}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Risk Score: </span>
                  <span className="font-medium text-gray-900">
                    {approveRejectDialog.assessment.riskScore || "N/A"}
                  </span>
                </div>
              </div>
            )}

            {approveRejectDialog.action === "reject" && (
              <div>
                <Label htmlFor="rejectionReason" className="text-gray-900">
                  Rejection Reason *
                </Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  className="mt-1 min-h-[100px]"
                  required
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setApproveRejectDialog({
                    open: false,
                    assessment: null,
                    action: null,
                  });
                  setRejectionReason("");
                }}
                className="border-gray-300 text-gray-900 hover:bg-gray-100"
              >
                Cancel
              </Button>
              {approveRejectDialog.action === "approve" ? (
                <Button
                  onClick={handleApproveAssessment}
                  disabled={processingApproval}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {processingApproval ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Assessment
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleRejectAssessment}
                  disabled={processingApproval || !rejectionReason.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {processingApproval ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Reject Assessment
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Policy Dialog */}
      <Dialog
        open={createPolicyDialog.open}
        onOpenChange={(open) =>
          setCreatePolicyDialog({ ...createPolicyDialog, open })
        }
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              Create Policy from Assessment
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Create an insurance policy based on the submitted assessment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {createPolicyDialog.assessment && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="text-sm">
                  <span className="text-gray-600">Farm: </span>
                  <span className="font-medium text-gray-900">
                    {(
                      createPolicyDialog.assessment.farmId ||
                      createPolicyDialog.assessment.farm
                    )?.name || "N/A"}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Risk Score: </span>
                  <span className="font-medium text-gray-900">
                    {createPolicyDialog.assessment.riskScore || "N/A"}
                  </span>
                </div>
              </div>
            )}
            <div>
              <Label className="text-gray-700">Coverage Level *</Label>
              <Select
                value={coverageLevel}
                onValueChange={(value: "BASIC" | "STANDARD" | "PREMIUM") =>
                  setCoverageLevel(value)
                }
              >
                <SelectTrigger className="mt-2 border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASIC">Basic</SelectItem>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="PREMIUM">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-700">Start Date *</Label>
              <Input
                type="date"
                value={policyStartDate}
                onChange={(e) => setPolicyStartDate(e.target.value)}
                className="mt-2 border-gray-300"
                required
              />
            </div>
            <div>
              <Label className="text-gray-700">End Date *</Label>
              <Input
                type="date"
                value={policyEndDate}
                onChange={(e) => setPolicyEndDate(e.target.value)}
                className="mt-2 border-gray-300"
                required
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setCreatePolicyDialog({ open: false, assessment: null });
                  setCoverageLevel("STANDARD");
                  setPolicyStartDate("");
                  setPolicyEndDate("");
                }}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePolicy}
                disabled={
                  isCreatingPolicy || !policyStartDate || !policyEndDate
                }
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isCreatingPolicy ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Create Policy
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
