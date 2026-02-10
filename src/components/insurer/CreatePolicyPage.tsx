import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPolicyFromAssessment } from "@/services/policiesApi";
import assessmentsApiService from "@/services/assessmentsApi";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  Save,
  FileText,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CreatePolicyPageProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export default function CreatePolicyPage({ onBack, onSuccess }: CreatePolicyPageProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);

  const [formData, setFormData] = useState({
    assessmentId: "",
    coverageLevel: "STANDARD" as "BASIC" | "STANDARD" | "PREMIUM",
    startDate: "",
    endDate: "",
  });

  // Load submitted assessments on component mount
  useEffect(() => {
    loadSubmittedAssessments();
    
    // Set default dates
    const today = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(today.getFullYear() + 1);
    setFormData(prev => ({
      ...prev,
      startDate: today.toISOString().split('T')[0],
      endDate: nextYear.toISOString().split('T')[0]
    }));
  }, []);

  const loadSubmittedAssessments = async () => {
    setAssessmentsLoading(true);
    try {
      // Try different pagination strategies to handle API inconsistencies
      let response: any = null;
      let assessmentsArray: any[] = [];
      
      // Strategy 1: Try page 1 first
      console.log('Loading submitted assessments for policy creation...');
      response = await assessmentsApiService.getAssessments(1, 100);
      console.log('Assessments API Response:', response);
      
      // Extract assessments from response
      if (response?.success && response?.data?.items) {
        assessmentsArray = Array.isArray(response.data.items) ? response.data.items : [];
      } else if (Array.isArray(response)) {
        assessmentsArray = response;
      } else if (Array.isArray(response?.data)) {
        assessmentsArray = response.data;
      } else if (Array.isArray(response?.items)) {
        assessmentsArray = response.items;
      } else if (Array.isArray(response?.results)) {
        assessmentsArray = response.results;
      }
      
      // Filter to only SUBMITTED assessments
      const submittedAssessments = assessmentsArray.filter((assessment: any) => {
        const status = (assessment.status || '').toUpperCase();
        return status === 'SUBMITTED';
      });
      
      setAssessments(submittedAssessments);
      console.log('Loaded submitted assessments:', submittedAssessments);
      
      if (submittedAssessments.length === 0) {
        toast({
          title: 'No Submitted Assessments',
          description: 'There are no submitted assessments available. Please wait for an assessor to submit an assessment first.',
          variant: 'default'
        });
      }
    } catch (err: any) {
      console.error('Failed to load assessments:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to load submitted assessments',
        variant: 'destructive'
      });
    } finally {
      setAssessmentsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.assessmentId || !formData.startDate || !formData.endDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Format dates to ISO format (YYYY-MM-DDTHH:mm:ssZ)
      const startDateISO = new Date(formData.startDate + 'T00:00:00Z').toISOString();
      const endDateISO = new Date(formData.endDate + 'T23:59:59Z').toISOString();
      
      console.log('Creating policy from assessment:', {
        assessmentId: formData.assessmentId,
        coverageLevel: formData.coverageLevel,
        startDate: startDateISO,
        endDate: endDateISO
      });
      
      await createPolicyFromAssessment(
        formData.assessmentId,
        formData.coverageLevel,
        startDateISO,
        endDateISO
      );
      
      toast({
        title: "Success",
        description: "Policy created successfully from assessment",
        variant: "default",
      });
      
      if (onSuccess) {
        onSuccess();
      }
      onBack();
    } catch (err: any) {
      console.error('Failed to create policy:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to create policy',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAssessment = assessments.find((a: any) => 
    (a._id || a.id) === formData.assessmentId
  );

  const getRiskLevelBadge = (riskScore: number | undefined) => {
    if (!riskScore && riskScore !== 0) return null;
    if (riskScore <= 30) {
      return <Badge className="bg-green-100 text-green-700">Low Risk</Badge>;
    } else if (riskScore <= 70) {
      return <Badge className="bg-yellow-100 text-yellow-700">Medium Risk</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-700">High Risk</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Policy</h1>
          <p className="text-sm text-gray-600 mt-1">Create a policy from a submitted assessment</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Policies
        </Button>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Policy Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="assessmentId">Select Assessment *</Label>
              {assessmentsLoading ? (
                <div className="text-sm text-gray-500">Loading submitted assessments...</div>
              ) : assessments.length === 0 ? (
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2 text-gray-600">
                    <AlertCircle className="h-5 w-5" />
                    <p>No submitted assessments available. Please wait for an assessor to submit an assessment first.</p>
                  </div>
                </div>
              ) : (
                <>
                  <Select 
                    value={formData.assessmentId || undefined} 
                    onValueChange={(value) => setFormData({...formData, assessmentId: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a submitted assessment" />
                    </SelectTrigger>
                    <SelectContent>
                      {assessments.map((assessment: any) => {
                        const assessmentId = assessment._id || assessment.id;
                        if (!assessmentId) return null;
                        
                        const farmerName = assessment.farmerId?.firstName && assessment.farmerId?.lastName
                          ? `${assessment.farmerId.firstName} ${assessment.farmerId.lastName}`
                          : assessment.farmerId?.name || assessment.farmerName || 'Unknown Farmer';
                        
                        const farmName = assessment.farmId?.name || assessment.farmName || 'Unknown Farm';
                        const cropType = assessment.cropType || assessment.farmId?.cropType || 'Unknown';
                        const riskScore = assessment.riskScore;
                        
                        return (
                          <SelectItem key={assessmentId} value={assessmentId}>
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">{farmerName} - {farmName}</span>
                              {getRiskLevelBadge(riskScore)}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  
                  {selectedAssessment && (
                    <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Assessment Details
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                        <div>
                          <span className="font-medium">Farmer:</span>{' '}
                          {selectedAssessment.farmerId?.firstName && selectedAssessment.farmerId?.lastName
                            ? `${selectedAssessment.farmerId.firstName} ${selectedAssessment.farmerId.lastName}`
                            : selectedAssessment.farmerId?.name || selectedAssessment.farmerName || 'Unknown'}
                        </div>
                        <div>
                          <span className="font-medium">Farm:</span>{' '}
                          {selectedAssessment.farmId?.name || selectedAssessment.farmName || 'Unknown'}
                        </div>
                        <div>
                          <span className="font-medium">Crop Type:</span>{' '}
                          {selectedAssessment.cropType || selectedAssessment.farmId?.cropType || 'Unknown'}
                        </div>
                        <div>
                          <span className="font-medium">Risk Score:</span>{' '}
                          {selectedAssessment.riskScore !== undefined ? selectedAssessment.riskScore : 'N/A'}
                          {getRiskLevelBadge(selectedAssessment.riskScore)}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverageLevel">Coverage Level *</Label>
              <Select 
                value={formData.coverageLevel} 
                onValueChange={(value: "BASIC" | "STANDARD" | "PREMIUM") => 
                  setFormData({...formData, coverageLevel: value})
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select coverage level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASIC">Basic Coverage</SelectItem>
                  <SelectItem value="STANDARD">Standard Coverage</SelectItem>
                  <SelectItem value="PREMIUM">Premium Coverage</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Coverage level determines the extent of protection and premium rates
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || assessments.length === 0} 
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Creating..." : "Create Policy"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
