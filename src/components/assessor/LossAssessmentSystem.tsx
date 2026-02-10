import { useState, useEffect } from "react";
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
import { getUserById } from "@/services/usersAPI";
import { getFarmById } from "@/services/farmsApi";
import { useToast } from "@/hooks/use-toast";

interface LossAssessment {
  id: string;
  farmerName: string;
  fieldId: string;
  crop: string;
  area: string;
  cause: string;
  date: string;
  severity: string;
  affectedArea: string;
  affectedPercentage: number;
  status: string;
}

export default function LossAssessmentSystem() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState<LossAssessment | null>(null);
  const [assessmentNotes, setAssessmentNotes] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [assessments, setAssessments] = useState<LossAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [currentClaim, setCurrentClaim] = useState<any | null>(null);
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
        const claimAssessorId = claim.assessorId || claim.assessor?._id || claim.assessor?.id;
        return claimAssessorId === assessorId || claimAssessorId === assessorId.toString();
      });

      // Map claims to LossAssessment interface
      const mappedAssessments: LossAssessment[] = await Promise.all(
        assignedClaims.map(async (claim: any) => {
          const claimId = claim._id || claim.id || "";
          const claimDate = claim.createdAt || claim.submittedAt || claim.date || new Date().toISOString();
          const farmerId = claim.farmerId?._id || claim.farmerId || claim.farmer?.id || "";
          let farmerName = "Unknown Farmer";
          let fieldId = claim.fieldId || claim.farmId || "";
          let crop = claim.cropType || claim.crop || "Unknown";
          let area = "0 ha";
          let location = "";

          // Get farmer info
          if (claim.farmer || claim.farmerId) {
            const farmer = claim.farmer || claim.farmerId;
            if (typeof farmer === 'object') {
              farmerName = farmer.firstName && farmer.lastName
                ? `${farmer.firstName} ${farmer.lastName}`
                : farmer.email || farmer.phoneNumber || "Unknown Farmer";
            }
          }

          // Try to get farmer info from API if needed
          if (farmerName === "Unknown Farmer" && farmerId) {
            try {
              const farmerData: any = await getUserById(farmerId);
              const farmer = farmerData.data || farmerData;
              farmerName = farmer.firstName && farmer.lastName
                ? `${farmer.firstName} ${farmer.lastName}`
                : farmer.email || farmer.phoneNumber || "Unknown Farmer";
            } catch (err) {
              console.error('Failed to load farmer data:', err);
            }
          }

          // Get farm/field info if available
          if (fieldId) {
            try {
              const farmData = await getFarmById(fieldId);
              const farm = farmData.data || farmData;
              if (farm) {
                crop = farm.cropType || farm.crop || crop;
                if (farm.area || farm.size) {
                  area = `${farm.area || farm.size} ha`;
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
          const lossEventType = claim.lossEventType || claim.damageType || claim.cause || "Unknown";
          const claimAmount = claim.amount || claim.claimAmount || 0;
          let severity = "Mild";
          if (claimAmount > 1000000 || lossEventType.toLowerCase().includes("severe") || lossEventType.toLowerCase().includes("drought")) {
            severity = "Severe";
          } else if (claimAmount > 500000 || lossEventType.toLowerCase().includes("moderate") || lossEventType.toLowerCase().includes("flood")) {
            severity = "Moderate";
          }

          // Calculate affected area and percentage (if available in claim data)
          const affectedArea = claim.affectedArea || claim.damagedArea || "0 ha";
          const affectedPercentage = claim.affectedPercentage || claim.damagePercentage || 0;

          return {
            id: claimId,
            farmerName,
            fieldId: fieldId || claim.claimNumber || claimId,
            crop,
            area,
            cause: lossEventType,
            date: new Date(claimDate).toLocaleDateString(),
            severity,
            affectedArea: typeof affectedArea === 'number' ? `${affectedArea} ha` : affectedArea,
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
    setSelectedAssessment(assessment);
    setViewMode("detail");
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
                              {assessment.affectedArea} ({assessment.affectedPercentage}%)
                            </div>
                          </td>
                          <td className="py-3.5 px-6 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${
                              assessment.status?.toLowerCase() === "approved"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : assessment.status?.toLowerCase() === "under review" || assessment.status?.toLowerCase() === "review"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                            }`}>
                              {assessment.status}
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
        <div className="min-h-screen bg-gray-900 pt-6 pb-8">
          <div className="max-w-7xl mx-auto px-6">
            <Card className="bg-gray-800 border border-gray-700 shadow-sm">
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
    
    if (!selectedAssessment) return null;

    const lossData = {
      cause: selectedAssessment.cause,
      date: selectedAssessment.date,
      description: `${selectedAssessment.cause} affected ${selectedAssessment.affectedPercentage}% of the field.`,
      evidenceFiles: 3,
      affectedArea: selectedAssessment.affectedArea,
      affectedPercentage: selectedAssessment.affectedPercentage,
      severity: selectedAssessment.severity,
      yieldImpact: selectedAssessment.severity === "Severe" ? 75 : selectedAssessment.severity === "Moderate" ? 40 : 20
    };

    const decisionSupport = {
      policyThreshold: 30,
      meetsCondition: selectedAssessment.affectedPercentage >= 30,
      thresholdExcess: Math.max(0, selectedAssessment.affectedPercentage - 30),
      recommendation: selectedAssessment.affectedPercentage >= 30 
        ? "Proceed to claim validation" 
        : "Does not meet minimum threshold"
    };

    return (
      <div className="min-h-screen bg-gray-900 pt-6 pb-8">
        <div className="max-w-7xl mx-auto px-6 space-y-6">
          {/* Header */}
          <div className="mb-6">
              <Button
                variant="ghost"
                onClick={handleBackToList}
              className="mb-4 text-gray-400 hover:text-gray-300 hover:bg-gray-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            <h1 className="text-3xl font-bold text-white">Loss Assessment</h1>
            <p className="text-gray-400 mt-1">Document and evaluate crop loss events</p>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            <Button 
              variant="outline" 
              className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Field Summary */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white font-bold">Field Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 text-white">
                <div className="border-r border-gray-700 pr-6">
                  <p className="text-sm text-gray-400 mb-1">Farmer</p>
                  <p className="text-white font-bold">{selectedAssessment.farmerName}</p>
                </div>
                <div className="border-r border-gray-700 pr-6">
                  <p className="text-sm text-gray-400 mb-1">Field ID</p>
                  <p className="text-white font-bold">{selectedAssessment.fieldId}</p>
                </div>
                <div className="border-r border-gray-700 pr-6">
                  <p className="text-sm text-gray-400 mb-1">Crop</p>
                  <p className="text-white font-bold">{selectedAssessment.crop}</p>
                </div>
              <div>
                  <p className="text-sm text-gray-400 mb-1">Area</p>
                  <p className="text-white font-bold">{selectedAssessment.area}</p>
              </div>
            </div>
            </CardContent>
          </Card>

          {/* Loss Details */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white font-bold">Loss Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cause" className="text-gray-300 mb-2 block">Cause</Label>
                  <Input
                    id="cause"
                    value={lossData.cause}
                    readOnly
                    className="bg-gray-900 border-gray-700 text-white"
                  />
          </div>
                <div>
                  <Label htmlFor="date" className="text-gray-300 mb-2 block">Date</Label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="date"
                      value={lossData.date}
                      readOnly
                      className="bg-gray-900 border-gray-700 text-white pr-10"
                    />
        </div>
                </div>
              </div>
              <div>
                <Label htmlFor="description" className="text-gray-300 mb-2 block">Description</Label>
                <Textarea
                  id="description"
                  value={lossData.description}
                  readOnly
                  className="bg-gray-900 border-gray-700 text-white min-h-[100px]"
                />
              </div>
              <div>
                <Label className="text-gray-300 mb-2 block">Evidence</Label>
                <Button 
                  variant="outline" 
                  className="bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  View Attachments ({lossData.evidenceFiles} files)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loss Quantification */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white font-bold">Loss Quantification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-red-900/30 border border-red-800/50 rounded-lg p-6">
                  <p className="text-sm text-gray-300 mb-1">Affected Area</p>
                  <p className="text-3xl font-bold text-orange-400 mb-1">
                    {lossData.affectedArea}
                  </p>
                  <p className="text-sm text-orange-400">({lossData.affectedPercentage}%)</p>
                </div>
                <div className="bg-yellow-900/30 border border-yellow-800/50 rounded-lg p-6">
                  <p className="text-sm text-gray-300 mb-1">Severity</p>
                  <p className="text-3xl font-bold text-orange-400 mb-1">
                    {lossData.severity}
                  </p>
                </div>
                <div className="bg-red-900/30 border border-red-800/50 rounded-lg p-6">
                  <p className="text-sm text-gray-300 mb-1">Yield Impact</p>
                  <p className="text-3xl font-bold text-orange-400 mb-1">
                    {lossData.yieldImpact}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map Visualization */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white font-bold">Map Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative border border-gray-700 rounded-lg overflow-hidden bg-gray-900" style={{ height: "500px" }}>
                <LeafletMap
                  center={(() => {
                    const location = selectedAssessment.location || "";
                    if (location.includes(',')) {
                      const parts = location.split(',');
                      const lat = parseFloat(parts[0]?.trim() || "-1.9441");
                      const lng = parseFloat(parts[1]?.trim() || "30.0619");
                      return [lat, lng];
                    }
                    return [-1.9441, 30.0619];
                  })()}
                  zoom={15}
                  height="500px"
                  tileLayer="satellite"
                  showControls={true}
                  className="w-full"
                />
                {/* Legend */}
                <div className="absolute bottom-4 right-4 bg-gray-800/90 border border-gray-700 rounded-lg p-3 z-[1000]">
                  <p className="text-white font-medium mb-2 text-sm">Legend</p>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <span className="text-gray-300 text-xs">Affected Area</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-gray-300 text-xs">Normal Area</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Decision Support */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white font-bold">Decision Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-700 border border-gray-600 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <p className="text-white font-medium">Policy Threshold</p>
                  </div>
                  <p className="text-4xl font-bold text-white mb-1">
                    {decisionSupport.policyThreshold}%
                  </p>
                  <p className="text-sm text-gray-400">Minimum affected area</p>
                </div>

                <div className={`${decisionSupport.meetsCondition ? 'bg-green-900/30 border-green-800/50' : 'bg-red-900/30 border-red-800/50'} rounded-lg p-6`}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className={`h-5 w-5 ${decisionSupport.meetsCondition ? 'text-green-500' : 'text-red-500'}`} />
                    <p className="text-white font-medium">Meets Condition</p>
                  </div>
                  <p className={`text-4xl font-bold mb-1 ${decisionSupport.meetsCondition ? 'text-green-500' : 'text-red-500'}`}>
                    {decisionSupport.meetsCondition ? 'YES' : 'NO'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {decisionSupport.meetsCondition 
                      ? `Exceeds threshold by ${decisionSupport.thresholdExcess}%`
                      : `Below threshold by ${Math.abs(decisionSupport.thresholdExcess)}%`
                    }
                  </p>
                </div>
              </div>

              <div className="bg-blue-900/30 border border-blue-800/50 rounded-lg p-6">
                <p className="text-white font-medium mb-2">Recommendation</p>
                <p className="text-white/80">{decisionSupport.recommendation}</p>
              </div>
            </CardContent>
          </Card>

          {/* Assessor Notes */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white font-bold">Assessor Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={assessmentNotes}
                onChange={(e) => setAssessmentNotes(e.target.value)}
                placeholder="Add your assessment notes here..."
                className="bg-gray-900 border-gray-700 text-white min-h-[120px] placeholder:text-gray-500"
              />
              <div className="flex gap-3">
                <Button 
                  onClick={handleUpdateAssessment}
                  disabled={isUpdatingAssessment || !claimAssessmentForm.visitDate || !claimAssessmentForm.reportText}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {isUpdatingAssessment ? (
                    <img src="/loading.gif" alt="Loading" className="w-4 h-4" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Assessment
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleSubmitAssessment}
                  disabled={isSubmittingAssessment || isUpdatingAssessment}
                  className="bg-gray-700 hover:bg-gray-600 text-white"
                >
                  {isSubmittingAssessment ? (
                    <img src="/loading.gif" alt="Loading" className="w-4 h-4" />
                  ) : (
                    <>
                      <FileDown className="h-4 w-4 mr-2" />
                      Generate Report PDF
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
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
