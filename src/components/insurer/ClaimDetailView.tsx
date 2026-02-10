import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  FileText,
  Camera,
  Download,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Shield,
  Crop,
  Building2,
  Eye,
  ExternalLink
} from "lucide-react";

interface Claim {
  id: string;
  farmerId: string;
  farmerName: string;
  policyId: string;
  cropType: string;
  claimAmount: number;
  status: string;
  filedDate: string;
  incidentDate: string;
  description: string;
  location: string;
  assessorId: string;
  assessorName: string;
  priority: string;
  damageType: string;
  estimatedLoss: number;
  photos: string[];
  documents: string[];
  assessmentReport: string;
  weatherData: any;
  previousClaims: any[];
}

interface ClaimDetailViewProps {
  claim: Claim;
  onBack: () => void;
  onApprove: (claimId: string, notes: string) => void;
  onReject: (claimId: string, reason: string) => void;
}

export default function ClaimDetailView({ claim, onBack, onApprove, onReject }: ClaimDetailViewProps) {
  const navigate = useNavigate();
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-white/90 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "approved": return "bg-green-100 text-green-800 border-green-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      case "in_review": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-white/90 border-gray-200";
    }
  };

  const handleApprove = () => {
    onApprove(claim.id, approvalNotes);
    setShowApprovalForm(false);
    setApprovalNotes("");
  };

  const handleReject = () => {
    onReject(claim.id, rejectionReason);
    setShowRejectionForm(false);
    setRejectionReason("");
  };

  const handleViewPolicy = () => {
    navigate(`/policy-details/${claim.policyId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="hover:bg-green-50/60 backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Claims
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white/90">Claim Review</h1>
            <p className="text-gray-500">Claim ID: {claim.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={`${getPriorityColor(claim.priority)} border`}>
            {claim.priority.toUpperCase()} PRIORITY
          </Badge>
          <Badge className={`${getStatusColor(claim.status)} border`}>
            {claim.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Claim Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Claim Overview */}
          <Card className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg shadow-green-100/20">
            <CardHeader>
              <CardTitle className="flex items-center text-white/90">
                <FileText className="h-5 w-5 mr-2" />
                Claim Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">Claim Amount</p>
                    <p className="text-lg font-semibold text-white/90">{claim.claimAmount.toLocaleString()} RWF</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
                  <Crop className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">Crop Type</p>
                    <p className="text-lg font-semibold text-white/90">{claim.cropType}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">Incident Date</p>
                    <p className="text-lg font-semibold text-white/90">{claim.incidentDate}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="text-lg font-semibold text-white/90">{claim.location}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Claim Description */}
          <Card className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg shadow-blue-100/20">
            <CardHeader>
              <CardTitle className="flex items-center text-white/90">
                <MessageSquare className="h-5 w-5 mr-2" />
                Claim Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80 leading-relaxed">{claim.description}</p>
            </CardContent>
          </Card>

          {/* Assessment Report */}
          <Card className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg shadow-orange-100/20">
            <CardHeader>
              <CardTitle className="flex items-center text-white/90">
                <Shield className="h-5 w-5 mr-2" />
                Assessment Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
                  <span className="text-sm text-gray-500">Assessor</span>
                  <span className="font-semibold text-white/90">{claim.assessorName}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
                  <span className="text-sm text-gray-500">Assessment Date</span>
                  <span className="font-semibold text-white/90">{claim.filedDate}</span>
                </div>
                <div className="p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
                  <p className="text-sm text-gray-500 mb-2">Assessment Details</p>
                  <p className="text-white/80">{claim.assessmentReport || "Assessment report will be available after field visit."}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evidence & Documents */}
          <Card className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg shadow-purple-100/20">
            <CardHeader>
              <CardTitle className="flex items-center text-white/90">
                <Camera className="h-5 w-5 mr-2" />
                Evidence & Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-3">Photos</p>
                  <div className="grid gap-3 md:grid-cols-3">
                    {claim.photos?.map((photo, index) => (
                      <div key={index} className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                        <img 
                          src={photo} 
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-3">Documents</p>
                  <div className="space-y-2">
                    {claim.documents?.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-gray-500" />
                          <span className="text-white/80">Document {index + 1}</span>
                        </div>
                        <Button size="sm" variant="outline" className="hover:bg-green-50/60">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Farmer Information */}
          <Card className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg shadow-green-100/20">
            <CardHeader>
              <CardTitle className="flex items-center text-white/90">
                <User className="h-5 w-5 mr-2" />
                Farmer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-semibold text-white/90">{claim.farmerName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
                <Building2 className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Farmer ID</p>
                  <p className="font-semibold text-white/90">{claim.farmerId}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
                <MapPin className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-semibold text-white/90">{claim.location}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Policy Information */}
          <Card className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg shadow-blue-100/20">
            <CardHeader>
              <CardTitle className="flex items-center text-white/90">
                <Shield className="h-5 w-5 mr-2" />
                Policy Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
                <FileText className="h-5 w-5 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Policy ID</p>
                  <button
                    onClick={handleViewPolicy}
                    className="font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 flex items-center space-x-1"
                  >
                    <span>{claim.policyId}</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
                <Crop className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Coverage</p>
                  <p className="font-semibold text-white/90">{claim.cropType}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg shadow-orange-100/20">
            <CardHeader>
              <CardTitle className="text-white/90">Review Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showApprovalForm && !showRejectionForm && (
                <>
                  <Button 
                    onClick={() => setShowApprovalForm(true)}
                    className="w-full bg-gradient-to-r from-green-500/80 to-emerald-600/80 hover:from-green-600/90 hover:to-emerald-700/90 text-white backdrop-blur-sm shadow-md shadow-green-200/30"
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Approve Claim
                  </Button>
                  <Button 
                    onClick={() => setShowRejectionForm(true)}
                    variant="outline"
                    className="w-full hover:bg-red-50/60 hover:border-red-200/60 hover:text-red-600 backdrop-blur-sm border-white/40"
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Reject Claim
                  </Button>
                </>
              )}

              {showApprovalForm && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="approval-notes">Approval Notes</Label>
                    <Textarea
                      id="approval-notes"
                      placeholder="Add any notes for approval..."
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleApprove}
                      className="flex-1 bg-gradient-to-r from-green-500/80 to-emerald-600/80 hover:from-green-600/90 hover:to-emerald-700/90 text-white backdrop-blur-sm shadow-md shadow-green-200/30"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Approval
                    </Button>
                    <Button 
                      onClick={() => setShowApprovalForm(false)}
                      variant="outline"
                      className="hover:bg-gray-50/60 backdrop-blur-sm border-white/40"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {showRejectionForm && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="rejection-reason">Rejection Reason</Label>
                    <Textarea
                      id="rejection-reason"
                      placeholder="Provide reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleReject}
                      variant="outline"
                      className="flex-1 hover:bg-red-50/60 hover:border-red-200/60 hover:text-red-600 backdrop-blur-sm border-white/40"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Confirm Rejection
                    </Button>
                    <Button 
                      onClick={() => setShowRejectionForm(false)}
                      variant="outline"
                      className="hover:bg-gray-50/60 backdrop-blur-sm border-white/40"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
