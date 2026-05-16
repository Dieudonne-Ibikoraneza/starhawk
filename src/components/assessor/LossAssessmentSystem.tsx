import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardTheme } from "@/utils/dashboardTheme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search,
  Filter,
  Calendar,
  Paperclip,
  CheckCircle,
  AlertTriangle,
  FileText,
  Save,
  FileDown,
  MapPin,
  Plus,
  RefreshCw,
  X,
  Send,
  ArrowLeft
} from "lucide-react";
import { getClaims, getClaimById, updateClaimAssessment, submitAssessment } from "@/services/claimsApi";
import { getUserId } from "@/services/authAPI";
import { getFarmById } from "@/services/farmsApi";
import { useToast } from "@/hooks/use-toast";
import LeafletMap from "@/components/common/LeafletMap";
import { LossBasicInfoTab } from "./tabs/loss/LossBasicInfoTab";
import { LossEvidenceTab } from "./tabs/loss/LossEvidenceTab";
import { LossDetailsTab } from "./tabs/loss/LossDetailsTab";
import { LossOverviewTab } from "./tabs/loss/LossOverviewTab";

interface LossAssessment {
  id: string;
  farmerName: string;
  fieldId: string;
  farmId?: string;
  crop: string;
  area: string;
  location?: string;
  cause: string;
  date: string;
  severity: string;
  affectedArea: string;
  affectedPercentage: number;
  status: string;
}

export default function LossAssessmentSystem() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState<LossAssessment | null>(null);
  const [assessmentNotes, setAssessmentNotes] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [assessments, setAssessments] = useState<LossAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [currentClaim, setCurrentClaim] = useState<any | null>(null);
  const [currentFarm, setCurrentFarm] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("basic-info");
  const [claimAssessmentForm, setClaimAssessmentForm] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    observations: [] as string[],
    observationInput: "",
    reportText: "",
    damageArea: "",
    ndviBefore: "",
    ndviAfter: "",
  });
  const [isUpdatingAssessment, setIsUpdatingAssessment] = useState(false);
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);

  const assessorId = getUserId() || "";

  useEffect(() => {
    loadLossAssessments();
  }, []);

  useEffect(() => {
    if (selectedAssessment && viewMode === "detail") {
      loadAssessmentDetail(selectedAssessment.id);
    }
  }, [selectedAssessment, viewMode]);

  const normalizeId = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (typeof value === "object") {
      return value._id || value.id || value.farmId || "";
    }
    return "";
  };

  const getFarmerDisplayName = (claim: any): string => {
    const farmer = claim.farmer || claim.farmerId;
    if (farmer && typeof farmer === "object") {
      const name = [farmer.firstName, farmer.lastName].filter(Boolean).join(" ").trim();
      return name || farmer.name || farmer.email || farmer.phoneNumber || "Unknown Farmer";
    }
    const farmerId = normalizeId(farmer);
    return farmerId ? `Farmer ${farmerId.slice(-6)}` : "Unknown Farmer";
  };

  const loadLossAssessments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await getClaims();
      const claimsData = response.data || response || [];
      const claimsArray = Array.isArray(claimsData) ? claimsData : (claimsData.items || claimsData.results || []);

      // Filter claims assigned to this assessor
      const assignedClaims = claimsArray.filter((claim: any) => {
        if (!assessorId) return false;
        const claimAssessorId = normalizeId(claim.assessorId) || normalizeId(claim.assessor);
        return claimAssessorId === assessorId || claimAssessorId === assessorId.toString();
      });

      // Map claims to LossAssessment interface
      const mappedAssessments: LossAssessment[] = await Promise.all(
        assignedClaims.map(async (claim: any) => {
          const claimId = claim._id || claim.id || "";
          const claimDate = claim.createdAt || claim.submittedAt || claim.date || new Date().toISOString();
          const farmerName = getFarmerDisplayName(claim);
          const farmId = normalizeId(claim.fieldId) || normalizeId(claim.farmId) || normalizeId(claim.farm);
          const fieldId = String(farmId || claim.claimNumber || claimId);
          let crop = claim.cropType || claim.crop || "Unknown";
          let area = "0 ha";
          let actualFarmHectares = 0;
          let location = "";

          const claimFarm = claim.farm || claim.farmId;
          if (claimFarm && typeof claimFarm === "object") {
            crop = claimFarm.cropType || claimFarm.crop || crop;
            if (claimFarm.area || claimFarm.size) {
              actualFarmHectares = parseFloat(String(claimFarm.area || claimFarm.size)) || 0;
              area = `${actualFarmHectares} ha`;
            }
            if (claimFarm.locationName && typeof claimFarm.locationName === "string") {
              location = claimFarm.locationName;
            } else if (typeof claimFarm.location === "string") {
              location = claimFarm.location;
            } else if (claimFarm.location?.coordinates && Array.isArray(claimFarm.location.coordinates)) {
              location = `${claimFarm.location.coordinates[1]?.toFixed(4)}, ${claimFarm.location.coordinates[0]?.toFixed(4)}`;
            }
          }

          // Get farm/field info if available
          if (farmId) {
            try {
              const farmData = await getFarmById(farmId);
              const farm = farmData.data || farmData;
              if (farm) {
                crop = farm.cropType || farm.crop || crop;
                if (farm.area || farm.size) {
                  actualFarmHectares = parseFloat(String(farm.area || farm.size)) || 0;
                  area = `${actualFarmHectares} ha`;
                }
                if (farm.location) {
                  if (typeof farm.location === 'string') {
                    location = farm.location;
                  } else if (farm.location.coordinates && Array.isArray(farm.location.coordinates)) {
                    location = `${farm.location.coordinates[1]?.toFixed(4)}, ${farm.location.coordinates[0]?.toFixed(4)}`;
                  }
                }
              }
            } catch (err) {
              console.error('Failed to load farm data:', err);
            }
          }

          // Determine severity based on claim amount or damage description
          const lossEventType = String(claim.lossEventType || claim.damageType || claim.cause || "Unknown");
          const claimAmount = claim.amount || claim.claimAmount || 0;
          let severity = "Mild";
          if (claimAmount > 1000000 || lossEventType.toLowerCase().includes("severe") || lossEventType.toLowerCase().includes("drought")) {
            severity = "Severe";
          } else if (claimAmount > 500000 || lossEventType.toLowerCase().includes("moderate") || lossEventType.toLowerCase().includes("flood")) {
            severity = "Moderate";
          }

          // Calculate affected area and percentage (if available in claim or assessment data)
          const assessmentReport = claim.assessmentReport || claim.assessmentReportId;
          const reportDamageArea = (assessmentReport && typeof assessmentReport === "object")
            ? assessmentReport.damageArea
            : null;
          const reportYieldImpact = (assessmentReport && typeof assessmentReport === "object")
            ? assessmentReport.yieldImpact
            : null;

          let affectedHectares = 0;
          let affectedAreaStr = "N/A";
          if (reportDamageArea != null && reportDamageArea > 0) {
            affectedHectares = parseFloat(String(reportDamageArea)) || 0;
            affectedAreaStr = `${affectedHectares} ha`;
          } else if (reportDamageArea === 0) {
            affectedHectares = 0;
            affectedAreaStr = "0 ha";
          } else if (claim.affectedArea != null && parseFloat(String(claim.affectedArea)) > 0) {
            affectedHectares = parseFloat(String(claim.affectedArea)) || 0;
            affectedAreaStr = `${affectedHectares} ha`;
          } else if (claim.damagedArea != null && parseFloat(String(claim.damagedArea)) > 0) {
            affectedHectares = parseFloat(String(claim.damagedArea)) || 0;
            affectedAreaStr = `${affectedHectares} ha`;
          } else if (claim.affectedArea === 0 || claim.damagedArea === 0 || claim.affectedArea === "0 ha" || claim.damagedArea === "0 ha") {
            affectedHectares = 0;
            affectedAreaStr = "0 ha";
          }

          let affectedPercentage = 0;
          if (actualFarmHectares > 0 && affectedHectares > 0) {
            affectedPercentage = Math.round((affectedHectares / actualFarmHectares) * 100);
            if (affectedPercentage > 100) affectedPercentage = 100;
          } else {
            affectedPercentage = reportYieldImpact != null
              ? Number(reportYieldImpact)
              : Number(claim.affectedPercentage || claim.damagePercentage || 0);
          }

          return {
            id: claimId,
            farmerName,
            fieldId,
            farmId,
            location,
            crop,
            area,
            cause: lossEventType,
            date: new Date(claimDate).toLocaleDateString(),
            severity,
            affectedArea: affectedAreaStr,
            affectedPercentage,
            status: claim.status || "Pending"
          };
        })
      );

      setAssessments(mappedAssessments);
    } catch (err: any) {
      console.error('Failed to load loss assessments:', err);
      setError(err.message || 'Failed to load loss assessments');
      toast({
        title: 'Error loading loss assessments',
        description: err.message || 'Failed to load loss assessments',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAssessmentDetail = async (assessmentId: string) => {
    setLoadingDetail(true);
    try {
      const claimData: any = await getClaimById(assessmentId);
      const claim = claimData.data || claimData;
      setCurrentClaim(claim);
      
      if (claim && selectedAssessment) {
        const farmObj = claim.farmId || claim.fieldId || claim.farm;
        
        // If it's already a populated object, seed it directly to avoid fallback placeholders!
        if (farmObj && typeof farmObj === 'object') {
          setCurrentFarm(farmObj);
        }

        const normFarmId = normalizeId(farmObj);
        if (normFarmId) {
          try {
            const farmData = await getFarmById(normFarmId);
            setCurrentFarm(farmData.data || farmData);
          } catch (err) {
            console.error('Failed to load farm for claim:', err);
          }
        }

        // Update assessment notes if available
        if (claim.notes || claim.assessmentNotes) {
          setAssessmentNotes(claim.notes || claim.assessmentNotes || "");
        }

        // Load existing assessment data if available
        if (claim.assessmentReport) {
          const report = claim.assessmentReport;
          setClaimAssessmentForm({
            visitDate: report.visitDate ? new Date(report.visitDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            observations: report.observations || [],
            observationInput: "",
            reportText: report.reportText || "",
            damageArea: report.damageArea?.toString() || "",
            ndviBefore: report.ndviBefore?.toString() || "",
            ndviAfter: report.ndviAfter?.toString() || "",
          });
        }
      }
    } catch (err: any) {
      console.error('Failed to load assessment detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleUpdateAssessment = async () => {
    if (!selectedAssessment) return;

    setIsUpdatingAssessment(true);
    try {
      const assessmentData: any = {
        visitDate: new Date(claimAssessmentForm.visitDate).toISOString(),
        observations: claimAssessmentForm.observations,
        reportText: claimAssessmentForm.reportText,
      };

      // Add optional fields if provided
      if (claimAssessmentForm.damageArea) {
        assessmentData.damageArea = parseFloat(claimAssessmentForm.damageArea);
      }
      if (claimAssessmentForm.ndviBefore) {
        assessmentData.ndviBefore = parseFloat(claimAssessmentForm.ndviBefore);
      }
      if (claimAssessmentForm.ndviAfter) {
        assessmentData.ndviAfter = parseFloat(claimAssessmentForm.ndviAfter);
      }

      await updateClaimAssessment(selectedAssessment.id, assessmentData);
      
      toast({
        title: "Success",
        description: "Assessment updated successfully",
      });

      // Reload claim details
      await loadAssessmentDetail(selectedAssessment.id);
      await loadLossAssessments();
    } catch (err: any) {
      console.error('Failed to update assessment:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to update assessment',
        variant: 'destructive'
      });
    } finally {
      setIsUpdatingAssessment(false);
    }
  };

  const handleSubmitAssessment = async () => {
    if (!selectedAssessment) return;

    setIsSubmittingAssessment(true);
    try {
      // Prepare assessment data
      const assessmentData: any = {
        visitDate: new Date(claimAssessmentForm.visitDate).toISOString(),
        observations: claimAssessmentForm.observations,
        reportText: claimAssessmentForm.reportText,
      };

      // Add optional fields if provided
      if (claimAssessmentForm.damageArea) {
        assessmentData.damageArea = parseFloat(claimAssessmentForm.damageArea);
      }
      if (claimAssessmentForm.ndviBefore) {
        assessmentData.ndviBefore = parseFloat(claimAssessmentForm.ndviBefore);
      }
      if (claimAssessmentForm.ndviAfter) {
        assessmentData.ndviAfter = parseFloat(claimAssessmentForm.ndviAfter);
      }

      // Submit assessment (this will update and submit)
      await submitAssessment(selectedAssessment.id, assessmentData);
      
      toast({
        title: "Success",
        description: "Assessment submitted successfully",
      });

      // Reload data
      await loadAssessmentDetail(selectedAssessment.id);
      await loadLossAssessments();
    } catch (err: any) {
      console.error('Failed to submit assessment:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to submit assessment',
        variant: 'destructive'
      });
    } finally {
      setIsSubmittingAssessment(false);
    }
  };

  const addObservation = () => {
    if (claimAssessmentForm.observationInput.trim()) {
      setClaimAssessmentForm({
        ...claimAssessmentForm,
        observations: [...claimAssessmentForm.observations, claimAssessmentForm.observationInput.trim()],
        observationInput: "",
      });
    }
  };

  const removeObservation = (index: number) => {
    setClaimAssessmentForm({
      ...claimAssessmentForm,
      observations: claimAssessmentForm.observations.filter((_, i) => i !== index),
    });
  };

  const filteredAssessments = assessments.filter(assessment => {
    return searchQuery === "" ||
      assessment.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.fieldId.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAssessmentClick = (assessment: LossAssessment) => {
    navigate(`/assessor/loss-assessments/${assessment.id}`);
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedAssessment(null);
  };

  const renderList = () => (
    <div className="min-h-screen bg-gray-50 pt-6 pb-8">
      {/* Clean Header */}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6">
        {/* Search and Filter Bar */}
        <div className="flex items-center justify-end gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search fields..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 text-sm w-64"
            />
          </div>
          <Button 
            onClick={loadLossAssessments}
            variant="outline"
            size="sm"
            className="border-gray-200 hover:bg-gray-50 text-xs"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-12">
              <div className="flex items-center justify-center">
                <img src="/loading.gif" alt="Loading" className="w-16 h-16" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="text-center text-red-600">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                <p className="text-sm">{error}</p>
                <Button 
                  onClick={loadLossAssessments} 
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Table */}
        {!loading && !error && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900">Loss Assessments</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-gray-200 hover:bg-gray-50"
                >
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredAssessments.length === 0 ? (
                <div className="p-12 text-center">
                  <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm font-medium text-gray-900 mb-1">No loss assessments found</p>
                  <p className="text-xs text-gray-500">
                    {assessments.length === 0 && !assessorId 
                      ? "Please log in to view loss assessments."
                      : "Try adjusting your search criteria"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left py-3 px-6 font-medium text-gray-700 text-xs">Assessment ID</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-700 text-xs">Farmer</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-700 text-xs">Field ID</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-700 text-xs">Crop</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-700 text-xs">Cause</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-700 text-xs">Severity</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-700 text-xs">Affected Area</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-700 text-xs">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredAssessments.map((assessment) => (
                        <tr
                          key={assessment.id}
                          onClick={() => handleAssessmentClick(assessment)}
                          className="hover:bg-green-50/30 transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-6 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{assessment.id}</div>
                          </td>
                          <td className="py-3.5 px-6 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{assessment.farmerName}</div>
                          </td>
                          <td className="py-3.5 px-6 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{assessment.fieldId}</div>
                          </td>
                          <td className="py-3.5 px-6 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{assessment.crop}</div>
                          </td>
                          <td className="py-3.5 px-6 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{assessment.cause}</div>
                          </td>
                          <td className="py-3.5 px-6 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${
                              assessment.severity === "Severe"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : assessment.severity === "Moderate"
                                ? "bg-orange-50 text-orange-700 border border-orange-200"
                                : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                            }`}>
                              {assessment.severity}
                            </span>
                          </td>
                           <td className="py-3.5 px-6 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {assessment.affectedArea === "N/A" ? "N/A" : `${assessment.affectedArea} (${assessment.affectedPercentage}%)`}
                            </div>
                          </td>
                          <td className="py-3.5 px-6 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${
                              assessment.status?.toLowerCase() === "approved"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : assessment.status?.toLowerCase() === "under review" || assessment.status?.toLowerCase() === "review" || assessment.status?.toLowerCase() === "in_progress"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                            }`}>
                              {assessment.status?.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
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

  const renderDetail = () => {
    if (loadingDetail) {
      return (
        <div className="min-h-screen bg-gray-50 pt-6 pb-8">
          <div className="max-w-7xl mx-auto px-6">
            <Card className="bg-white border border-gray-200 shadow-sm">
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
    
    if (!selectedAssessment || !currentClaim) return null;

    // Pass currentFarm and currentClaim to tab components
    return (
      <div className="min-h-screen bg-gray-50 pt-6 pb-8">
        <div className="max-w-7xl mx-auto px-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Button
                variant="ghost"
                onClick={handleBackToList}
                className="mb-2 -ml-2 text-gray-600 hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Loss Assessment</h1>
              <p className="text-muted-foreground">
                Evaluating loss for <strong>{currentFarm?.name || selectedAssessment.fieldId}</strong> • {selectedAssessment.farmerName}
              </p>
            </div>
            <div className="flex items-center gap-2">
               <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                 currentClaim.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                 currentClaim.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                 currentClaim.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                 'bg-amber-100 text-amber-700'
               }`}>
                 {currentClaim.status?.replace('_', ' ') || 'PENDING'}
               </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:w-[600px] border border-gray-200">
              <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
              <TabsTrigger value="details">Loss Details</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="basic-info">
                 <LossBasicInfoTab 
                   field={currentFarm} 
                   claim={currentClaim} 
                   farmerName={selectedAssessment.farmerName}
                 />
              </TabsContent>

              <TabsContent value="evidence">
                <LossEvidenceTab claim={currentClaim} />
              </TabsContent>

              <TabsContent value="details">
                <LossDetailsTab claim={currentClaim} />
              </TabsContent>

              <TabsContent value="overview">
                <LossOverviewTab 
                  claim={currentClaim} 
                  fieldName={currentFarm?.name || selectedAssessment.fieldId} 
                  onSubmitSuccess={() => {
                    loadAssessmentDetail(selectedAssessment.id);
                    loadLossAssessments();
                  }}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    );
  };

  // Old tabs structure removed - using new single-page layout matching the UI design

  if (viewMode === "detail") {
    return renderDetail();
  }

  return renderList();
}
