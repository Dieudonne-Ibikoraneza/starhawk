import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { approveClaim as approveClaimApi, rejectClaim as rejectClaimApi, getClaimById, getClaims } from "@/services/claimsApi";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  FileText, 
  User, 
  MapPin, 
  Calendar,
  DollarSign,
  Camera,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  MessageSquare,
  Phone,
  Mail,
  Building2,
  Crop,
  TrendingUp,
  Shield
} from "lucide-react";

export default function ClaimReviewPage() {
  const { toast } = useToast();
  const [selectedClaimId, setSelectedClaimId] = useState<string>("");
  const [claims, setClaims] = useState<any[]>([]);
  const [currentClaim, setCurrentClaim] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingClaim, setLoadingClaim] = useState(false);
  const [reviewDecision, setReviewDecision] = useState("");
  const [reviewComments, setReviewComments] = useState("");
  const [approvedAmount, setApprovedAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load claims list
  useEffect(() => {
    loadClaims();
  }, []);

  // Load specific claim when selected
  useEffect(() => {
    if (selectedClaimId) {
      loadClaimDetails(selectedClaimId);
    }
  }, [selectedClaimId]);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const response: any = await getClaims(1, 100);
      let claimsData: any[] = [];
      
      if (Array.isArray(response)) {
        claimsData = response;
      } else if (response && typeof response === 'object') {
        claimsData = response.data || response.claims || [];
      }
      
      setClaims(claimsData);
      // Auto-select first pending claim if available
      const firstPending = claimsData.find((c: any) => c.status === 'pending_review' || c.status === 'pending');
      if (firstPending && !selectedClaimId) {
        setSelectedClaimId(firstPending._id || firstPending.id);
      }
    } catch (err: any) {
      console.error('Failed to load claims:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to load claims',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClaimDetails = async (claimId: string) => {
    setLoadingClaim(true);
    try {
      const response: any = await getClaimById(claimId);
      const claimData = response.data || response;
      setCurrentClaim(claimData);
    } catch (err: any) {
      console.error('Failed to load claim details:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to load claim details',
        variant: "destructive",
      });
    } finally {
      setLoadingClaim(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_review": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "under_investigation": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending_review": return <Clock className="h-4 w-4" />;
      case "approved": return <CheckCircle className="h-4 w-4" />;
      case "rejected": return <XCircle className="h-4 w-4" />;
      case "under_investigation": return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewDecision || !reviewComments) {
      toast({
        title: "Error",
        description: "Please provide both decision and comments",
        variant: "destructive",
      });
      return;
    }

    if (!selectedClaimId) {
      toast({
        title: "Error",
        description: "No claim selected",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (reviewDecision === "approve") {
        const amount = approvedAmount ? parseFloat(approvedAmount) : undefined;
        await approveClaimApi(selectedClaimId, amount, reviewComments);
        toast({
          title: "Success",
          description: "Claim approved successfully",
          variant: "default",
        });
        // Reload claims
        loadClaims();
        if (selectedClaimId) {
          loadClaimDetails(selectedClaimId);
        }
      } else if (reviewDecision === "reject") {
        await rejectClaimApi(selectedClaimId, reviewComments);
        toast({
          title: "Success",
          description: "Claim rejected successfully",
          variant: "default",
        });
        // Reload claims
        loadClaims();
        if (selectedClaimId) {
          loadClaimDetails(selectedClaimId);
        }
      }
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to submit review',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
    
    // Reset form
    setReviewDecision("");
    setReviewComments("");
    setApprovedAmount("");
  };

  const renderClaimSummary = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Claim Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-sm font-medium text-gray-700">Claim ID</Label>
            <p className="text-lg font-semibold">{currentClaim?._id || currentClaim?.id || 'N/A'}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-400">Status</Label>
            <div className="mt-1">
              <Badge className={getStatusColor(currentClaim?.status || "")}>
                {getStatusIcon(currentClaim?.status || "")}
                <span className="ml-1 capitalize">{currentClaim?.status?.replace('_', ' ')}</span>
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-400">Claim Amount</Label>
            <p className="text-lg font-semibold text-green-600">
              {(currentClaim?.amount || currentClaim?.claimAmount || 0).toLocaleString()} RWF
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-400">Filed Date</Label>
            <p className="text-lg">{currentClaim?.filedDate || currentClaim?.createdAt || 'N/A'}</p>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-400">Description</Label>
          <p className="text-gray-900 mt-1">{currentClaim?.description || currentClaim?.lossDescription || 'No description available'}</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderFarmerInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="h-5 w-5 mr-2" />
          Farmer Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-sm font-medium text-gray-700">Farmer Name</Label>
            <p className="text-lg font-semibold">
              {currentClaim?.farmer?.firstName && currentClaim?.farmer?.lastName
                ? `${currentClaim.farmer.firstName} ${currentClaim.farmer.lastName}`
                : currentClaim?.farmer?.name || currentClaim?.farmerName || 'Unknown Farmer'}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Farmer ID</Label>
            <p className="text-lg">{currentClaim?.farmerId || currentClaim?.farmer?._id || currentClaim?.farmer?.id || 'N/A'}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-sm font-medium text-gray-700">Location</Label>
            <p className="text-gray-900">{currentClaim?.location || currentClaim?.farm?.location || 'N/A'}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Farm Size</Label>
            <p className="text-gray-900">{currentClaim?.farmSize || currentClaim?.farm?.size || 'N/A'} {currentClaim?.farmSize ? 'hectares' : ''}</p>
          </div>
        </div>

        <div className="flex space-x-4">
          <Button variant="outline" size="sm">
            <Phone className="h-4 w-4 mr-2" />
            Call Farmer
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderPolicyInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Policy Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-sm font-medium text-gray-700">Policy ID</Label>
            <p className="text-lg font-semibold">{currentClaim?.policyId}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Crop Type</Label>
            <p className="text-lg">{currentClaim?.cropType}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label className="text-sm font-medium text-gray-700">Coverage</Label>
            <p className="text-lg font-semibold text-blue-600">
              {(currentClaim?.policy?.coverageAmount || currentClaim?.policy?.coverage || currentClaim?.policyDetails?.coverage || 0).toLocaleString()} RWF
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Premium</Label>
            <p className="text-lg">{(currentClaim?.policy?.premiumAmount || currentClaim?.policy?.premium || currentClaim?.policyDetails?.premium || 0).toLocaleString()} RWF</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Deductible</Label>
            <p className="text-lg">{(currentClaim?.policy?.deductible || currentClaim?.policyDetails?.deductible || 0).toLocaleString()} RWF</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-sm font-medium text-gray-700">Policy Start</Label>
            <p className="text-gray-900">{currentClaim?.policy?.startDate || currentClaim?.policy?.validityPeriod?.start || currentClaim?.policyDetails?.startDate || 'N/A'}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Policy End</Label>
            <p className="text-gray-900">{currentClaim?.policy?.endDate || currentClaim?.policy?.validityPeriod?.end || currentClaim?.policy?.validityPeriod || currentClaim?.policyDetails?.endDate || 'N/A'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderAssessmentInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Assessment Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-sm font-medium text-gray-700">Assessor</Label>
            <p className="text-lg font-semibold">
              {currentClaim?.assessor?.firstName && currentClaim?.assessor?.lastName
                ? `${currentClaim.assessor.firstName} ${currentClaim.assessor.lastName}`
                : currentClaim?.assessor?.name || currentClaim?.assessorName || 'Unassigned'}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Assessment Date</Label>
            <p className="text-lg">{currentClaim?.assessmentDate || currentClaim?.assessment?.date || currentClaim?.createdAt || 'N/A'}</p>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700">Assessment Notes</Label>
          <p className="text-gray-900 mt-1">{currentClaim?.assessmentNotes || currentClaim?.assessment?.notes || currentClaim?.notes || 'No assessment notes available'}</p>
        </div>

        <div className="flex space-x-4">
          <Button variant="outline" size="sm">
            <Phone className="h-4 w-4 mr-2" />
            Call Assessor
          </Button>
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Message Assessor
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderPhotos = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Camera className="h-5 w-5 mr-2" />
          Field Photos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {currentClaim?.photos && Array.isArray(currentClaim.photos) && currentClaim.photos.length > 0 ? (
            currentClaim.photos.map((photo: any, index: number) => (
              <div key={photo.id || photo._id || index} className="space-y-2">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={photo.url || photo.photoUrl || photo.src || '/api/placeholder/400/300'} 
                    alt={photo.description || photo.alt || 'Claim photo'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                  />
                </div>
                <p className="text-sm text-gray-700 text-center">{photo.description || 'Claim photo'}</p>
              </div>
            ))
          ) : currentClaim?.damagePhotos && Array.isArray(currentClaim.damagePhotos) && currentClaim.damagePhotos.length > 0 ? (
            currentClaim.damagePhotos.map((photoUrl: string, index: number) => (
              <div key={index} className="space-y-2">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={photoUrl || '/api/placeholder/400/300'} 
                    alt="Claim photo"
                    className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                  />
                </div>
                <p className="text-sm text-gray-700 text-center">Damage photo {index + 1}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 col-span-full text-center py-8">No photos available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderDocuments = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Supporting Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {currentClaim?.documents && Array.isArray(currentClaim.documents) && currentClaim.documents.length > 0 ? (
            currentClaim.documents.map((doc: any, index: number) => (
              <div key={doc.id || doc._id || index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-white">{doc.name || doc.fileName || 'Document'}</p>
                    <p className="text-sm text-gray-500">{doc.type || 'File'} • {doc.size || 'N/A'}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No documents available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderReviewForm = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          Claim Review Decision
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reviewDecision">Decision</Label>
          <Select value={reviewDecision} onValueChange={setReviewDecision}>
            <SelectTrigger>
              <SelectValue placeholder="Select decision" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="approved">Approve Claim</SelectItem>
              <SelectItem value="rejected">Reject Claim</SelectItem>
              <SelectItem value="partial_approval">Partial Approval</SelectItem>
              <SelectItem value="requires_more_info">Requires More Information</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {reviewDecision === "partial_approval" && (
          <div className="space-y-2">
            <Label htmlFor="approvedAmount">Approved Amount (RWF)</Label>
            <Input
              id="approvedAmount"
              type="number"
              value={approvedAmount}
              onChange={(e) => setApprovedAmount(e.target.value)}
              placeholder="Enter approved amount"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="reviewComments">Review Comments</Label>
          <Textarea
            id="reviewComments"
            value={reviewComments}
            onChange={(e) => setReviewComments(e.target.value)}
            placeholder="Provide detailed comments about your decision..."
            rows={4}
          />
        </div>

        <div className="flex space-x-4">
          <Button 
            onClick={handleSubmitReview}
            disabled={isSubmitting || !reviewDecision || !reviewComments}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
          <Button variant="outline">
            Save as Draft
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4">
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
          className="text-gray-600 hover:text-gray-700 mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Claims
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Claim Review</h1>
        <p className="text-sm text-gray-600 mt-1">Review and make decisions on insurance claims</p>
      </div>
        
      <div className="flex items-center space-x-2">
          {loading ? (
            <div className="text-gray-500">Loading claims...</div>
          ) : (
            <Select value={selectedClaimId} onValueChange={setSelectedClaimId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select a claim" />
              </SelectTrigger>
              <SelectContent>
                {claims.length === 0 ? (
                  <SelectItem value="none" disabled>No claims available</SelectItem>
                ) : (
                  claims.map((claim: any) => (
                    <SelectItem key={claim._id || claim.id} value={claim._id || claim.id}>
                      {claim._id || claim.id} - {claim.farmer?.firstName && claim.farmer?.lastName
                        ? `${claim.farmer.firstName} ${claim.farmer.lastName}`
                        : claim.farmer?.name || claim.farmerName || 'Unknown Farmer'}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
      </div>

      {/* Loading State */}
      {loadingClaim ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Clock className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-500">Loading claim details...</p>
          </div>
        </div>
      ) : !currentClaim ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-white/40" />
            <p className="text-gray-500">Please select a claim to review</p>
          </div>
        </div>
      ) : (
        <>
          {/* Alert for pending review */}
          {(currentClaim?.status === "pending_review" || currentClaim?.status === "pending") && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This claim is pending review. Please review all information and make a decision.
              </AlertDescription>
            </Alert>
          )}

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Claim Details */}
            <div className="lg:col-span-2 space-y-6">
              {renderClaimSummary()}
              {renderFarmerInfo()}
              {renderPolicyInfo()}
              {renderAssessmentInfo()}
              {renderPhotos()}
              {renderDocuments()}
            </div>

            {/* Right Column - Review Form */}
            <div className="space-y-6">
              {renderReviewForm()}
              
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Eye className="h-4 w-4 mr-2" />
                    View Full Assessment Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MapPin className="h-4 w-4 mr-2" />
                    View Field Location
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Follow-up Visit
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact All Parties
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
