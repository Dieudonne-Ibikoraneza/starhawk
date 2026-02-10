import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Edit,
  Download,
  Share,
  CheckCircle,
  X,
  Clock,
  User,
  MapPin,
  Calendar,
  DollarSign,
  Shield,
  Crop,
  AlertTriangle,
  FileText,
  TrendingUp,
  BarChart3,
  Phone,
  Mail,
  Building2,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare
} from "lucide-react";

interface RiskAssessment {
  id: string;
  farmerId: string;
  farmerName: string;
  cropType: string;
  farmSize: number;
  location: string;
  assessorId: string;
  assessorName: string;
  riskLevel: "low" | "medium" | "high";
  status: "pending_review" | "approved" | "rejected" | "under_review";
  submittedDate: string;
  reviewDate?: string;
  coverageRecommendation?: number;
  premiumRecommendation?: number;
  riskFactors: string[];
  mitigationMeasures: string[];
  weatherRisk: number;
  soilQuality: number;
  marketRisk: number;
  pestRisk: number;
  overallScore: number;
  notes?: string;
  reviewerNotes?: string;
  decision?: "approve" | "reject" | "request_more_info";
}

interface RiskReviewDetailsViewProps {
  assessment: RiskAssessment;
  onBack: () => void;
  onApprove: (assessmentId: string) => void;
  onReject: (assessmentId: string) => void;
  onRequestMoreInfo: (assessmentId: string) => void;
}

export default function RiskReviewDetailsView({ 
  assessment, 
  onBack, 
  onApprove, 
  onReject, 
  onRequestMoreInfo 
}: RiskReviewDetailsViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAssessment, setEditedAssessment] = useState<RiskAssessment>(assessment);
  const [reviewerNotes, setReviewerNotes] = useState(assessment.reviewerNotes || "");
  const [decision, setDecision] = useState<"approve" | "reject" | "request_more_info" | "">("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_review": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "under_review": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-white/90";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending_review": return <Clock className="h-4 w-4" />;
      case "approved": return <CheckCircle className="h-4 w-4" />;
      case "rejected": return <X className="h-4 w-4" />;
      case "under_review": return <Eye className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "low": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-white/90";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const handleSave = () => {
    // Here you would typically save the changes to your backend
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedAssessment(assessment);
    setIsEditing(false);
  };

  const handleSubmitDecision = () => {
    if (decision === "approve") {
      onApprove(assessment.id);
    } else if (decision === "reject") {
      onReject(assessment.id);
    } else if (decision === "request_more_info") {
      onRequestMoreInfo(assessment.id);
    }
  };

  const mockRiskHistory = [
    {
      id: "RISK-001",
      date: "2024-09-15",
      riskLevel: "medium",
      score: 75,
      assessor: "Richard Nkurunziza"
    },
    {
      id: "RISK-002",
      date: "2024-08-20",
      riskLevel: "low",
      score: 85,
      assessor: "Grace Mukamana"
    }
  ];

  const mockWeatherData = [
    { month: "Jan", rainfall: 120, temperature: 22 },
    { month: "Feb", rainfall: 95, temperature: 24 },
    { month: "Mar", rainfall: 150, temperature: 23 },
    { month: "Apr", rainfall: 180, temperature: 21 },
    { month: "May", rainfall: 200, temperature: 20 },
    { month: "Jun", rainfall: 160, temperature: 19 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Risk Reviews
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Risk Assessment Review</h1>
            <p className="text-white/70 mt-1">Assessment ID: {assessment.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className={getStatusColor(assessment.status)}>
            {getStatusIcon(assessment.status)}
            <span className="ml-1 capitalize">{assessment.status.replace('_', ' ')}</span>
          </Badge>
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Assessment
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Risk Assessment Overview Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/70">Risk Level</p>
                <p className="text-2xl font-bold text-white capitalize">
                  {assessment.riskLevel}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/70">Overall Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(assessment.overallScore)}`}>
                  {assessment.overallScore}/100
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/70">Farm Size</p>
                <p className="text-2xl font-bold text-white">
                  {assessment.farmSize} ha
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Crop className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/70">Assessor</p>
                <p className="text-lg font-bold text-white">
                  {assessment.assessorName}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <User className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="risk-factors">Risk Factors</TabsTrigger>
          <TabsTrigger value="history">Assessment History</TabsTrigger>
          <TabsTrigger value="decision">Review Decision</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Assessment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Assessment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Assessment ID</Label>
                    <Input value={assessment.id} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Farmer ID</Label>
                    <Input value={assessment.farmerId} disabled />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Farmer Name</Label>
                    <Input value={assessment.farmerName} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Crop Type</Label>
                    <Input value={assessment.cropType} disabled />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Farm Size (hectares)</Label>
                    <Input type="number" 
                           value={isEditing ? editedAssessment.farmSize : assessment.farmSize}
                           onChange={(e) => isEditing && setEditedAssessment({...editedAssessment, farmSize: parseFloat(e.target.value)})}
                           disabled={!isEditing} />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input value={isEditing ? editedAssessment.location : assessment.location}
                           onChange={(e) => isEditing && setEditedAssessment({...editedAssessment, location: e.target.value})}
                           disabled={!isEditing} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Assessor</Label>
                    <Input value={assessment.assessorName} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Submitted Date</Label>
                    <Input value={assessment.submittedDate} disabled />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Scores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Risk Scores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Weather Risk</span>
                    <span className={`font-bold ${getScoreColor(assessment.weatherRisk)}`}>
                      {assessment.weatherRisk}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${assessment.weatherRisk >= 70 ? 'bg-red-500' : assessment.weatherRisk >= 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${assessment.weatherRisk}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Soil Quality</span>
                    <span className={`font-bold ${getScoreColor(assessment.soilQuality)}`}>
                      {assessment.soilQuality}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${assessment.soilQuality >= 70 ? 'bg-green-500' : assessment.soilQuality >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${assessment.soilQuality}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Market Risk</span>
                    <span className={`font-bold ${getScoreColor(assessment.marketRisk)}`}>
                      {assessment.marketRisk}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${assessment.marketRisk >= 70 ? 'bg-red-500' : assessment.marketRisk >= 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${assessment.marketRisk}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pest Risk</span>
                    <span className={`font-bold ${getScoreColor(assessment.pestRisk)}`}>
                      {assessment.pestRisk}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${assessment.pestRisk >= 70 ? 'bg-red-500' : assessment.pestRisk >= 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${assessment.pestRisk}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">Overall Score</span>
                    <span className={`text-2xl font-bold ${getScoreColor(assessment.overallScore)}`}>
                      {assessment.overallScore}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                    <div 
                      className={`h-3 rounded-full ${assessment.overallScore >= 70 ? 'bg-green-500' : assessment.overallScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${assessment.overallScore}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk-factors" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Risk Factors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Identified Risk Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assessment.riskFactors.map((factor, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <span className="text-sm text-red-800">{factor}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Mitigation Measures */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Recommended Mitigation Measures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assessment.mitigationMeasures.map((measure, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                      <span className="text-sm text-green-800">{measure}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assessment Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Assessment Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={isEditing ? editedAssessment.notes || "" : assessment.notes || ""}
                onChange={(e) => isEditing && setEditedAssessment({...editedAssessment, notes: e.target.value})}
                disabled={!isEditing}
                rows={4}
                placeholder="Assessment notes and observations..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Assessment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRiskHistory.map((history) => (
                  <div key={history.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{history.id}</p>
                        <p className="text-sm text-gray-500">Assessed by {history.assessor}</p>
                        <p className="text-xs text-gray-400">{history.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getRiskLevelColor(history.riskLevel)}>
                        {history.riskLevel} risk
                      </Badge>
                      <p className="text-sm font-medium mt-1">Score: {history.score}/100</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decision" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Review Decision
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Decision</Label>
                <Select value={decision} onValueChange={setDecision}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a decision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approve Assessment</SelectItem>
                    <SelectItem value="reject">Reject Assessment</SelectItem>
                    <SelectItem value="request_more_info">Request More Information</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label>Reviewer Notes</Label>
                <Textarea 
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  rows={4}
                  placeholder="Add your review notes and comments..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={onBack}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitDecision}
                  disabled={!decision}
                  className={decision === "approve" ? "bg-green-600 hover:bg-green-700" : 
                           decision === "reject" ? "bg-red-600 hover:bg-red-700" : 
                           "bg-blue-600 hover:bg-blue-700"}
                >
                  {decision === "approve" && <ThumbsUp className="h-4 w-4 mr-2" />}
                  {decision === "reject" && <ThumbsDown className="h-4 w-4 mr-2" />}
                  {decision === "request_more_info" && <MessageSquare className="h-4 w-4 mr-2" />}
                  Submit Decision
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
